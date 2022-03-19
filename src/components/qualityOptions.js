import globalize from '../scripts/globalize';

export function getVideoQualityOptions(options) {
    const maxStreamingBitrate = options.currentMaxBitrate;
    let videoWidth = options.videoWidth;
    const videoHeight = options.videoHeight;
    const videoBitRate = options.videoBitRate;

    // If the aspect ratio is less than 16/9 (1.77), set the width as if it were pillarboxed.
    // 4:3 1440x1080 -> 1920x1080
    if (videoWidth / videoHeight < 16 / 9) {
        videoWidth = videoHeight * (16 / 9);
    }

    const maxAllowedWidth = videoWidth || 4096;

    //When the streaming bitrate exceeds the source streaming bitrate multiplied by a multiplier, filter out
    const maxStreamingBitrateMultiplier = 3;

    //2160p quality options
    const qualityOptions2160p = [];
    qualityOptions2160p.push({ name: '4K - 120 Mbps', maxHeight: 2160, bitrate: 120000004 });
    qualityOptions2160p.push({ name: '4K - 100 Mbps', maxHeight: 2160, bitrate: 100000004 });
    qualityOptions2160p.push({ name: '4K - 80 Mbps', maxHeight: 2160, bitrate: 80000004 });
    qualityOptions2160p.push({ name: '4K - 60 Mbps', maxHeight: 2160, bitrate: 60000004 });
    qualityOptions2160p.push({ name: '4K - 40 Mbps', maxHeight: 2160, bitrate: 40000004 });
    qualityOptions2160p.push({ name: '4K - 30 Mbps', maxHeight: 2160, bitrate: 30000004 });
    qualityOptions2160p.push({ name: '4K - 20 Mbps', maxHeight: 2160, bitrate: 20000004 });
    qualityOptions2160p.push({ name: '4K - 10 Mbps', maxHeight: 2160, bitrate: 10000004 });

    //1080p quality options
    const qualityOptions1080p = [];
    qualityOptions1080p.push({ name: '1080p - 40 Mbps', maxHeight: 1080, bitrate: 40000003 });
    qualityOptions1080p.push({ name: '1080p - 20 Mbps', maxHeight: 1080, bitrate: 20000003 });
    qualityOptions1080p.push({ name: '1080p - 10 Mbps', maxHeight: 1080, bitrate: 10000003 });
    qualityOptions1080p.push({ name: '1080p - 8 Mbps', maxHeight: 1080, bitrate: 8000003 });
    qualityOptions1080p.push({ name: '1080p - 6 Mbps', maxHeight: 1080, bitrate: 6000003 });
    qualityOptions1080p.push({ name: '1080p - 5 Mbps', maxHeight: 1080, bitrate: 5000003 });
    qualityOptions1080p.push({ name: '1080p - 4 Mbps', maxHeight: 1080, bitrate: 4000003 });

    //720p quality options
    const qualityOptions720p = [];
    qualityOptions720p.push({ name: '720p - 10 Mbps', maxHeight: 720, bitrate: 10000002 });
    qualityOptions720p.push({ name: '720p - 6 Mbps', maxHeight: 720, bitrate: 6000002 });
    qualityOptions720p.push({ name: '720p - 3 Mbps', maxHeight: 720, bitrate: 3000002 });
    qualityOptions720p.push({ name: '720p - 2 Mbps', maxHeight: 720, bitrate: 2000002 });

    //480p quality options
    const qualityOptions480p = [];
    qualityOptions480p.push({ name: '480p - 3 Mbps', maxHeight: 480, bitrate: 3000001 });
    qualityOptions480p.push({ name: '480p - 1.5 Mbps', maxHeight: 480, bitrate: 1500001 });
    qualityOptions480p.push({ name: '480p - 720 kbps', maxHeight: 480, bitrate: 720001 });

    //360p quality options
    const qualityOptions360p = [];
    qualityOptions360p.push({ name: '360p - 1 Mbps', maxHeight: 360, bitrate: 1000000 });
    qualityOptions360p.push({ name: '360p - 512 kbps', maxHeight: 360, bitrate: 512000 });

    const qualityOptions = [];

    const autoQualityOption = {
        name: globalize.translate('Auto'),
        bitrate: 0,
        selected: options.isAutomaticBitrateEnabled
    };

    if (options.enableAuto) {
        qualityOptions.push(autoQualityOption);
    }

    console.log("videoBitRate=" + videoBitRate);

    // Quality options are indexed by bitrate. If you must duplicate them, make sure each of them are unique (by making the last digit a 1)
    if (maxAllowedWidth >= 3800) {
        qualityOptions2160p.forEach(function(qualityOption) {
            if (videoBitRate) {
                if (qualityOption.bitrate < videoBitRate * maxStreamingBitrateMultiplier) {
                    qualityOptions.push(qualityOption);
                }
            } else {
                qualityOptions.push(qualityOption);
            }
        });
    }

    // Some 1080- videos are reported as 1912?
    if (maxAllowedWidth >= 1900) {
        qualityOptions1080p.forEach(function(qualityOption) {
            if (videoBitRate) {
                if (qualityOption.bitrate < videoBitRate * maxStreamingBitrateMultiplier) {
                    qualityOptions.push(qualityOption);
                }
            } else {
                qualityOptions.push(qualityOption);
            }
        });
    }

    if (maxAllowedWidth >= 1260) {
        qualityOptions720p.forEach(function(qualityOption) {
            if (videoBitRate) {
                if (qualityOption.bitrate < videoBitRate * maxStreamingBitrateMultiplier) {
                    qualityOptions.push(qualityOption);
                }
            } else {
                qualityOptions.push(qualityOption);
            }
        });
    }

    if (maxAllowedWidth >= 620) {
        qualityOptions480p.forEach(function(qualityOption) {
            if (videoBitRate) {
                if (qualityOption.bitrate < videoBitRate * maxStreamingBitrateMultiplier) {
                    qualityOptions.push(qualityOption);
                }
            } else {
                qualityOptions.push(qualityOption);
            }
        });
    }

    qualityOptions360p.forEach(function(qualityOption) {
        qualityOptions.push(qualityOption);
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
