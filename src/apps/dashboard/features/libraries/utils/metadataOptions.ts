import { ImageResolution } from '@jellyfin/sdk/lib/generated-client/models/image-resolution';
import globalize from '@/lib/globalize';

export function getImageResolutionOptions() {
    return [
        {
            name: globalize.translate('ResolutionMatchSource'),
            value: ImageResolution.MatchSource
        },
        { name: '2160p', value: ImageResolution.P2160 },
        { name: '1440p', value: ImageResolution.P1440 },
        { name: '1080p', value: ImageResolution.P1080 },
        { name: '720p', value: ImageResolution.P720 },
        { name: '480p', value: ImageResolution.P480 },
        { name: '360p', value: ImageResolution.P360 },
        { name: '240p', value: ImageResolution.P240 },
        { name: '144p', value: ImageResolution.P144 }
    ];
};
