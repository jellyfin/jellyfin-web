import globalize from '../lib/globalize';

export function getVideoQualityOptions(options) {
    const maxStreamingBitrate = options.currentMaxBitrate;
    const videoBitRate = options.videoBitRate ?? -1;
    const videoCodec = options.videoCodec;
    let referenceBitRate = videoBitRate;

    // Quality options are indexed by bitrate. If you must duplicate them, make sure each of them are unique (by making the last digit a 1)
    // Question: the maxHeight field seems not be used anywhere, is it safe to remove those?
    const bitrateConfigurations = [
        { name: '120 Mbps', maxHeight: 2160, bitrate: 120000000 },
        { name: '80 Mbps', maxHeight: 2160, bitrate: 80000000 },
        { name: '60 Mbps', maxHeight: 2160, bitrate: 60000000 },
        { name: '40 Mbps', maxHeight: 2160, bitrate: 40000000 },
        { name: '20 Mbps', maxHeight: 2160, bitrate: 20000000 },
        { name: '15 Mbps', maxHeight: 1440, bitrate: 15000000 },
        { name: '10 Mbps', maxHeight: 1440, bitrate: 10000000 },
        { name: '8 Mbps', maxHeight: 1080, bitrate: 8000000 },
        { name: '6 Mbps', maxHeight: 1080, bitrate: 6000000 },
        { name: '4 Mbps', maxHeight: 720, bitrate: 4000000 },
        { name: '3 Mbps', maxHeight: 720, bitrate: 3000000 },
        { name: '1.5 Mbps', maxHeight: 720, bitrate: 1500000 },
        { name: '720 kbps', maxHeight: 480, bitrate: 720000 },
        { name: '420 kbps', maxHeight: 360, bitrate: 420000 }
    ];

    const qualityOptions = [];

    const autoQualityOption = {
        name: globalize.translate('Auto'),
        bitrate: 0,
        selected: options.isAutomaticBitrateEnabled
    };

    if (options.enableAuto) {
        qualityOptions.push(autoQualityOption);
    }

    if (videoBitRate > 0 && videoBitRate < bitrateConfigurations[0].bitrate) {
        // Slightly increase reference bitrate for high efficiency codecs when it is not too high
        // Ideally we only need to do this for transcoding to h264, but we need extra api request to get that info which is not ideal for this
        if (
            videoCodec &&
            ['hevc', 'av1', 'vp9'].includes(videoCodec) &&
            referenceBitRate <= 20000000
        ) {
            referenceBitRate *= 1.5;
        }
        // Push one entry that has higher limit than video bitrate to allow using source bitrate when Auto is also limited
        const sourceOptions = bitrateConfigurations
            .filter((c) => c.bitrate > referenceBitRate)
            .pop();
        qualityOptions.push(sourceOptions);
    }

    bitrateConfigurations.forEach((c) => {
        if (videoBitRate <= 0 || c.bitrate <= referenceBitRate) {
            qualityOptions.push(c);
        }
    });

    if (maxStreamingBitrate) {
        let selectedIndex = qualityOptions.length - 1;
        for (let i = 0, length = qualityOptions.length; i < length; i++) {
            const option = qualityOptions[i];

            if (option.bitrate > 0 && option.bitrate <= maxStreamingBitrate) {
                selectedIndex = i;
                break;
            }
        }

        const currentQualityOption = qualityOptions[selectedIndex];

        if (!options.isAutomaticBitrateEnabled) {
            currentQualityOption.selected = true;
        } else {
            autoQualityOption.autoText = currentQualityOption.name;
        }
    }

    return qualityOptions;
}

export function getAudioQualityOptions(options) {
    const maxStreamingBitrate = options.currentMaxBitrate;

    const qualityOptions = [];

    const autoQualityOption = {
        name: globalize.translate('Auto'),
        bitrate: 0,
        selected: options.isAutomaticBitrateEnabled
    };

    if (options.enableAuto) {
        qualityOptions.push(autoQualityOption);
    }

    qualityOptions.push({ name: '2 Mbps', bitrate: 2000000 });
    qualityOptions.push({ name: '1.5 Mbps', bitrate: 1500000 });
    qualityOptions.push({ name: '1 Mbps', bitrate: 1000000 });
    qualityOptions.push({ name: '320 kbps', bitrate: 320000 });
    qualityOptions.push({ name: '256 kbps', bitrate: 256000 });
    qualityOptions.push({ name: '192 kbps', bitrate: 192000 });
    qualityOptions.push({ name: '128 kbps', bitrate: 128000 });
    qualityOptions.push({ name: '96 kbps', bitrate: 96000 });
    qualityOptions.push({ name: '64 kbps', bitrate: 64000 });

    if (maxStreamingBitrate) {
        let selectedIndex = qualityOptions.length - 1;
        for (let i = 0, length = qualityOptions.length; i < length; i++) {
            const option = qualityOptions[i];

            if (option.bitrate > 0 && option.bitrate <= maxStreamingBitrate) {
                selectedIndex = i;
                break;
            }
        }

        const currentQualityOption = qualityOptions[selectedIndex];

        if (!options.isAutomaticBitrateEnabled) {
            currentQualityOption.selected = true;
        } else {
            autoQualityOption.autoText = currentQualityOption.name;
        }
    }

    return qualityOptions;
}

export default {
    getVideoQualityOptions,
    getAudioQualityOptions
};
