import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client/models/media-stream-type';
import { VideoType } from '@jellyfin/sdk/lib/generated-client/models/video-type';
import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models/media-stream';
import itemHelper from 'components/itemHelper';
import datetime from 'scripts/datetime';
import globalize from 'lib/globalize';

import type { ItemDto } from 'types/base/models/item-dto';
import type { MiscInfo } from 'types/mediaInfoItem';
import type { NullableString } from 'types/base/common/shared/types';
import type { MediaInfoStatsOpts } from './type';

const getResolution = (label: string, isInterlaced?: boolean) =>
    isInterlaced ? `${label}i` : label;

const getResolutionText = (
    showResolutionInfo: boolean,
    stream: MediaStream
) => {
    const { Width, Height, IsInterlaced } = stream;

    if (showResolutionInfo && Width && Height) {
        switch (true) {
            case Width >= 3800 || Height >= 2000:
                return '4K';
            case Width >= 2500 || Height >= 1400:
                return getResolution('1440p', IsInterlaced);
            case Width >= 1800 || Height >= 1000:
                return getResolution('1080p', IsInterlaced);
            case Width >= 1200 || Height >= 700:
                return getResolution('720p', IsInterlaced);
            case Width >= 700 || Height >= 400:
                return getResolution('480p', IsInterlaced);
            default:
                return null;
        }
    }

    return null;
};

const getAudoChannelText = (
    showAudoChannelInfo: boolean,
    stream: MediaStream
) => {
    const { Channels } = stream;

    if (showAudoChannelInfo && Channels) {
        switch (true) {
            case Channels === 8:
                return '7.1';
            case Channels === 7:
                return '6.1';
            case Channels === 6:
                return '5.1';
            case Channels === 2:
                return '2.0';
            default:
                return null;
        }
    }

    return null;
};

function getAudioStreamForDisplay(item: ItemDto) {
    const mediaSource = (item.MediaSources || [])[0] || {};

    return (
        (mediaSource.MediaStreams || []).filter((i) => {
            return (
                i.Type === MediaStreamType.Audio &&
                (i.Index === mediaSource.DefaultAudioStreamIndex ||
                    mediaSource.DefaultAudioStreamIndex == null)
            );
        })[0] || {}
    );
}

function getVideoStreamForDisplay(item: ItemDto) {
    const mediaSource = (item.MediaSources || [])[0] || {};

    return (
        (mediaSource.MediaStreams || []).filter((i) => {
            return i.Type === MediaStreamType.Video;
        })[0] || {}
    );
}

function addVideoType(
    showVideoTypeInfo: boolean,
    itemVideoType: VideoType | undefined,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (showVideoTypeInfo) {
        if (itemVideoType === VideoType.Dvd) {
            addMiscInfo({ type: 'mediainfo', text: 'Dvd' });
        }

        if (itemVideoType === VideoType.BluRay) {
            addMiscInfo({ type: 'mediainfo', text: 'BluRay' });
        }
    }
}

function addResolution(
    showResolutionInfo: boolean,
    videoStream: MediaStream,
    addMiscInfo: (val: MiscInfo) => void
): void {
    const resolutionText = getResolutionText(showResolutionInfo, videoStream);

    if (resolutionText) {
        addMiscInfo({ type: 'mediainfo', text: resolutionText });
    }
}

function addVideoStreamCodec(
    showVideoCodecInfo: boolean,
    videoStreamCodec: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (showVideoCodecInfo && videoStreamCodec) {
        addMiscInfo({ type: 'mediainfo', text: videoStreamCodec });
    }
}

function addAudoChannel(
    showAudoChannelInfo: boolean,
    audioStream: MediaStream,
    addMiscInfo: (val: MiscInfo) => void
): void {
    const audioChannelText = getAudoChannelText(
        showAudoChannelInfo,
        audioStream
    );

    if (audioChannelText) {
        addMiscInfo({ type: 'mediainfo', text: audioChannelText });
    }
}

function addAudioStreamCodec(
    showAudioStreamCodecInfo: boolean,
    audioStream: MediaStream,
    addMiscInfo: (val: MiscInfo) => void
): void {
    const audioCodec = (audioStream.Codec || '').toLowerCase();

    if (showAudioStreamCodecInfo) {
        if (
            (audioCodec === 'dca' || audioCodec === 'dts') &&
            audioStream?.Profile
        ) {
            addMiscInfo({ type: 'mediainfo', text: audioStream.Profile });
        } else if (audioStream?.Codec) {
            addMiscInfo({ type: 'mediainfo', text: audioStream.Codec });
        }
    }
}

function addDateAdded(
    showDateAddedInfo: boolean,
    item: ItemDto,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (
        showDateAddedInfo &&
        item.DateCreated &&
        itemHelper.enableDateAddedDisplay(item)
    ) {
        const dateCreated = datetime.parseISO8601Date(item.DateCreated);
        addMiscInfo({
            type: 'added',
            text: globalize.translate(
                'AddedOnValue',
                `${datetime.toLocaleDateString(
                    dateCreated
                )} ${datetime.getDisplayTime(dateCreated)}`
            )
        });
    }
}

interface UseMediaInfoStatsProps extends MediaInfoStatsOpts {
    item: ItemDto;
}

function useMediaInfoStats({
    item,
    showVideoTypeInfo = false,
    showResolutionInfo = false,
    showVideoStreamCodecInfo = false,
    showAudoChannelInfo = false,
    showAudioStreamCodecInfo = false,
    showDateAddedInfo = false
}: UseMediaInfoStatsProps) {
    const miscInfo: MiscInfo[] = [];

    const addMiscInfo = (val: MiscInfo) => {
        if (val) {
            miscInfo.push(val);
        }
    };

    const videoStream = getVideoStreamForDisplay(item);

    const audioStream = getAudioStreamForDisplay(item);

    addVideoType(showVideoTypeInfo, item.VideoType, addMiscInfo);

    addResolution(showResolutionInfo, videoStream, addMiscInfo);

    addVideoStreamCodec(
        showVideoStreamCodecInfo,
        videoStream.Codec,
        addMiscInfo
    );

    addAudoChannel(showAudoChannelInfo, audioStream, addMiscInfo);

    addAudioStreamCodec(showAudioStreamCodecInfo, audioStream, addMiscInfo);

    addDateAdded(showDateAddedInfo, item, addMiscInfo);

    return miscInfo;
}

export default useMediaInfoStats;
