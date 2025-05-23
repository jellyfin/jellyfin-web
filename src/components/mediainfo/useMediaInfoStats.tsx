import {
    getAudioCodecText,
    getAudioChannelText,
    getDateAddedText,
    getResolutionText,
    getVideoCodecText,
    getVideoTypeText
} from './utils';

import type { ItemDto } from 'types/base/models/item-dto';
import type { MiscInfo } from 'types/mediaInfoItem';
import type { MediaInfoStatsOpts } from './type';

interface UseMediaInfoStatsProps extends MediaInfoStatsOpts {
    item: ItemDto;
}

function useMediaInfoStats({
    item,
    videoStream,
    audioStream,
    showVideoTypeInfo = false,
    showResolutionInfo = false,
    showVideoCodecInfo = false,
    showAudioChannelInfo = false,
    showAudioCodecInfo = false,
    showDateAddedInfo = false
}: UseMediaInfoStatsProps) {
    const miscInfo: MiscInfo[] = [];

    const videoTypeText = getVideoTypeText(item.VideoType, showVideoTypeInfo);

    if (videoTypeText) {
        miscInfo.push({ type: 'mediainfo', text: videoTypeText });
    }

    const resolutionText = getResolutionText(videoStream, showResolutionInfo);

    if (resolutionText) {
        miscInfo.push({ type: 'mediainfo', text: resolutionText });
    }

    const videoCodecText = getVideoCodecText(
        videoStream?.Codec,
        showVideoCodecInfo
    );

    if (videoCodecText) {
        miscInfo.push({ type: 'mediainfo', text: videoCodecText });
    }

    const audioChannelText = getAudioChannelText(
        audioStream?.Channels,
        showAudioChannelInfo
    );

    if (audioChannelText) {
        miscInfo.push({ type: 'mediainfo', text: audioChannelText });
    }

    const audioCodecText = getAudioCodecText(audioStream, showAudioCodecInfo);

    if (audioCodecText) {
        miscInfo.push({ type: 'mediainfo', text: audioCodecText });
    }

    const dateAddedText = getDateAddedText(item, showDateAddedInfo);

    if (dateAddedText) {
        miscInfo.push({ type: 'added', text: dateAddedText });
    }

    return miscInfo;
}

export default useMediaInfoStats;
