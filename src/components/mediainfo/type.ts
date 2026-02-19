export interface PrimaryInfoOpts {
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
    showVideoTypeInfo?: boolean;
    showResolutionInfo?: boolean;
    showVideoStreamCodecInfo?: boolean;
    showAudoChannelInfo?: boolean;
    showAudioStreamCodecInfo?: boolean;
    showDateAddedInfo?: boolean;
}
