import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models/media-source-info';
import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models/media-stream';

export interface PrimaryInfoOpts {
    mediaSource?: MediaSourceInfo;
    showYearInfo?: boolean;
    showAudioContainerInfo?: boolean;
    showEpisodeTitleInfo?: boolean;
    includeEpisodeTitleIndexNumber?: boolean;
    showOriginalAirDateInfo?: boolean;
    showFolderRuntimeInfo?: boolean;
    showRuntimeInfo?: boolean;
    showItemCountInfo?: boolean;
    showSeriesTimerInfo?: boolean;
    showStartDateInfo?: boolean;
    showProgramIndicatorInfo?: boolean;
    showOfficialRatingInfo?: boolean;
    showVideo3DFormatInfo?: boolean;
    showPhotoSizeInfo?: boolean;
}

export interface SecondaryInfoOpts {
    showProgramTimeInfo?: boolean;
    showStartDateInfo?: boolean;
    showEndDateInfo?: boolean;
    showChannelNumberInfo?: boolean;
    showChannelInfo?: boolean;
    channelInteractive?: boolean;
}

export interface MediaInfoStatsOpts {
    videoStream?: MediaStream;
    audioStream?: MediaStream;
    showVideoTypeInfo?: boolean;
    showResolutionInfo?: boolean;
    showVideoCodecInfo?: boolean;
    showAudioChannelInfo?: boolean;
    showAudioCodecInfo?: boolean;
    showDateAddedInfo?: boolean;
}
