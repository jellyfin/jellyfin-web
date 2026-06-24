import { Api } from '@jellyfin/sdk';
import type { EndPointInfo } from '@jellyfin/sdk/lib/generated-client/models/end-point-info';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';

/** Maximum bitrate (Int32) */
const MAX_BITRATE = 2147483647;
/** Approximate LAN bitrate */
const LAN_BITRATE = 140000000;
/** Bitrate test timeout in milliseconds */
const BITRATETEST_TIMEOUT = 5000;
/** Bitrate cache time in milliseconds */
const BITRATE_CACHE_DURATION = 3600000;

let lastDetectedBitrate: number;
let lastDetectedBitrateTime: number;
let pendingBitrateDetection: Promise<number> | null = null;

interface BitrateTest {
    bytes: number;
    threshold: number;
}

/** Gets a normalized maximum downlink speed (only supported on certain browsers) */
const getMaxBandwidth = () => {
    const connection = (navigator as unknown as { connection: { downlinkMax: number } }).connection;
    if (connection) {
        let max = connection.downlinkMax;
        if (max && max > 0 && max < Number.POSITIVE_INFINITY) {
            max /= 8;
            max *= 1000000;
            max *= 0.7;
            return max;
        }
    }

    return null;
};

/**
 * Perform a download speed test
 * @param {Api} api The Api client
 * @param {number} bytes The bytes to download
 * @returns {number} Download speed in bits per second
 */
const getDownloadSpeed = (api: Api, bytes: number) => {
    return new Promise<number>((resolve, reject) => {
        const url = api.basePath + '/Playback/BitrateTest?' + new URLSearchParams({
            Size: bytes.toString()
        });

        const xhr = new XMLHttpRequest;

        xhr.open('GET', url, true);

        xhr.responseType = 'blob';
        xhr.timeout = BITRATETEST_TIMEOUT;

        const headers = {
            'Cache-Control': 'no-cache, no-store',
            'Authorization': api.authorizationHeader
        };

        for (const key in headers) {
            xhr.setRequestHeader(key, headers[key as keyof typeof headers]);
        }

        let startTime: number;

        xhr.onreadystatechange = () => {
            if (xhr.readyState == XMLHttpRequest.HEADERS_RECEIVED) {
                startTime = performance.now();
            }
        };

        xhr.onload = () => {
            if (xhr.status < 400) {
                const responseTimeSeconds = (performance.now() - startTime) * 1e-3;
                const bytesLoaded = xhr.response.size;
                const bytesPerSecond = bytesLoaded / responseTimeSeconds;
                const bitrate = Math.round(bytesPerSecond * 8);

                console.debug(`[bitratetest] ${bytesLoaded} bytes loaded (${bytes} requested) in ${responseTimeSeconds} seconds -> ${bitrate} bps`);

                resolve(bitrate);
            } else {
                reject(new Error(`[bitratetest] failed with ${xhr.status} status`));
            }
        };

        xhr.onabort = () => {
            reject(new Error('[bitratetest] abort'));
        };

        xhr.onerror = () => {
            reject(new Error('[bitratetest] error'));
        };

        xhr.ontimeout = () => {
            reject(new Error('[bitratetest] timeout'));
        };

        xhr.send(null);
    });
};

/**
 * Normalizes the bitrate value by reducing it by 30% (to account for network overhead)
 * and limits the value by MAX_BITRATE
 * @param bitrate The bitrate to normalize
 * @returns {number} Normalized bitrate
 */
const normalizeReturnBitrate = (bitrate: number) => {
    if (!bitrate) {
        if (lastDetectedBitrate) {
            return lastDetectedBitrate;
        }
    }

    let result = Math.min(Math.round(bitrate * 0.7), MAX_BITRATE);

    const maxRate = getMaxBandwidth();
    if (maxRate) {
        result = Math.min(result, maxRate);
    }

    lastDetectedBitrate = result;
    lastDetectedBitrateTime = Date.now();

    return result;
};

/**
 *
 * @param {Api} api The Api client
 * @param {BitrateTest[]} tests The tests to perform
 * @param {number} index Current test index
 * @param {number | undefined} currentBitrate Current bitrate
 * @returns {number} Normalized bitrate
 */
const detectBitrateInternal = (api: Api, tests: BitrateTest[], index: number, currentBitrate: number | undefined): Promise<number> => {
    if (index >= tests.length) {
        return Promise.resolve(normalizeReturnBitrate(currentBitrate || 0));
    }

    const test = tests[index];

    return getDownloadSpeed(api, test.bytes).then(
        // eslint-disable-next-line sonarjs/function-return-type
        (bitrate) => {
            if (bitrate < test.threshold) {
                return normalizeReturnBitrate(bitrate);
            } else {
                return detectBitrateInternal(api, tests, index + 1, bitrate);
            }
        },
        () => normalizeReturnBitrate(currentBitrate || 0)
    );
};

/**
 * Detects the bitrate using a series of tests
 * @param {Api} api The api client
 * @param {EndPointInfo} endpointInfo Endpoint info for special handling on local networks
 * @returns {number} Normalized bitrate
 */
const detectBitrateWithEndpointInfo = (api: Api, endpointInfo: EndPointInfo) => {
    return detectBitrateInternal(
        api,
        [
            {
                bytes: 500000,
                threshold: 500000
            },
            {
                bytes: 1000000,
                threshold: 20000000
            },
            {
                bytes: 3000000,
                threshold: 50000000
            }
        ],
        0,
        undefined
    ).then(result => {
        const bitrateInMbps = (result / 1048576).toFixed(2);
        console.debug(`[bitratetest] bitrate detected as ${bitrateInMbps} Mbps`);
        if (endpointInfo.IsInNetwork) {
            result = Math.max(result || 0, LAN_BITRATE);

            lastDetectedBitrate = result;
            lastDetectedBitrateTime = Date.now();
        }
        return result;
    });
};

/**
 * Detects the bitrate on the current device
 * @param {Api} api The Api client
 * @param {boolean} force Ignore the cached bitrate and force a re-detection
 * @returns {number} The detected bitrate
 */
export const detectBitrate = (api: Api, force: boolean) => {
    if (!force
        && lastDetectedBitrate
        && Date.now() - (lastDetectedBitrateTime || 0) <= BITRATE_CACHE_DURATION) {
        return Promise.resolve(lastDetectedBitrate);
    }

    if (pendingBitrateDetection) {
        return pendingBitrateDetection;
    }

    pendingBitrateDetection = getSystemApi(api)
        .getEndpointInfo()
        .then(
            (response) => detectBitrateWithEndpointInfo(api, response.data),
            () => detectBitrateWithEndpointInfo(api, {})
        ).finally(() => {
            pendingBitrateDetection = null;
        });

    return pendingBitrateDetection;
};
