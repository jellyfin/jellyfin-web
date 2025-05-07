import { VideoType } from '@jellyfin/sdk/lib/generated-client/models/video-type';
import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models/media-stream';
import itemHelper from 'components/itemHelper';
import datetime from 'scripts/datetime';
import globalize from 'lib/globalize';
import type { NullableNumber, NullableString } from 'types/base/common/shared/types';
import { ItemDto } from 'types/base/models/item-dto';
import { safeParseDate } from 'utils/safeParseDate';

export function getVideoTypeText(
    videoType: VideoType | undefined,
    showVideoTypeInfo: boolean
) {
    if (!showVideoTypeInfo) return null;
    if (!videoType) return null;

    switch (videoType) {
        case VideoType.Dvd:
        case VideoType.BluRay:
            return videoType;
        default:
            return null;
    }
}

export function getResolutionText(
    stream: MediaStream | undefined,
    showResolutionInfo: boolean
) {
    if (!showResolutionInfo) return null;
    if (!stream) return null;

    const { Width, Height, IsInterlaced } = stream;

    if (!Width || !Height) return null;

    const suffix = IsInterlaced ? 'i' : 'p';

    switch (true) {
        case Width >= 3800 || Height >= 2000:
            return '4K';
        case Width >= 2500 || Height >= 1400:
            return `1440${suffix}`;
        case Width >= 1800 || Height >= 1000:
            return `1080${suffix}`;
        case Width >= 1200 || Height >= 700:
            return `720${suffix}`;
        case Width >= 700 || Height >= 400:
            return `480${suffix}`;
        default:
            return null;
    }
}

export function getVideoCodecText(
    videoCodec: NullableString,
    showVideoCodecInfo: boolean
): string | null {
    if (!showVideoCodecInfo) return null;
    if (!videoCodec) return null;

    return videoCodec.toUpperCase();
}

export function getAudioChannelText(
    channels: NullableNumber,
    showAudioChannelInfo: boolean
) {
    if (!showAudioChannelInfo) return null;
    if (!channels) return null;
    switch (true) {
        case channels === 8:
            return '7.1';
        case channels === 7:
            return '6.1';
        case channels === 6:
            return '5.1';
        case channels === 2:
            return '2.0';
        default:
            return null;
    }
}

export function getAudioCodecText(
    audioStream: MediaStream | undefined,
    showAudioCodecInfo: boolean
): string | null {
    if (!showAudioCodecInfo) return null;
    if (!audioStream) return null;

    const { Codec, Profile } = audioStream;

    if (!Codec) return null;

    const audioCodec = Codec.toLowerCase();
    if ((audioCodec === 'dca' || audioCodec === 'dts') && Profile) {
        return Profile;
    } else {
        return Codec.toUpperCase();
    }
}

export function getDateAddedText(item: ItemDto, showDateAddedInfo: boolean): string | null {
    if (!showDateAddedInfo) return null;

    if (itemHelper.enableDateAddedDisplay(item)) {
        const dateCreated = safeParseDate(item.DateCreated);
        if (!dateCreated) return null;
        return globalize.translate(
            'AddedOnValue',
            `${datetime.toLocaleDateString(
                dateCreated
            )} ${datetime.getDisplayTime(dateCreated)}`
        );
    }

    return null;
}
