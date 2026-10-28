import { ApiClient } from 'jellyfin-apiclient';

import { safeDecodeURIComponent } from 'utils/url';

/**
 * Encodes a value for use as a parameter when creating the ApiClient.
 * Ensuring that it is properly decoded before encoding to avoid double-encoding issues.
 * (In case a webview passes an already encoded value for example.)
 */
const encodeParam = (value: string) => encodeURIComponent(safeDecodeURIComponent(value));

/** Creates a new ApiClient instance with the provided parameters, encoding them as needed. */
export function createApiClient(
    serverUrl: string,
    appName: string,
    appVersion: string,
    deviceName: string,
    deviceId: string
) {
    return new ApiClient(
        serverUrl,
        encodeParam(appName),
        encodeParam(appVersion),
        encodeParam(deviceName),
        encodeParam(deviceId)
    );
}
