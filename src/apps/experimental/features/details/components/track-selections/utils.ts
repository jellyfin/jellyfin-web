import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models/media-source-info';
import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models/media-stream';
import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client/models/media-stream-type';
import { MediaSourceType } from '@jellyfin/sdk/lib/generated-client/models/media-source-type';
import itemHelper from 'components/itemHelper';
import { playbackManager } from 'components/playback/playbackmanager';
import type { ItemDto } from 'types/base/models/item-dto';

export const shouldAllowTrackSelection = (item: ItemDto): boolean => {
    return (
        Boolean(item.MediaSources)
        && itemHelper.supportsMediaSourceSelection(item)
        && Boolean(
            playbackManager.getSupportedCommands().includes('PlayMediaSource')
        )
        && playbackManager.canPlay(item)
    );
};

export const getMediaStreams = (mediaSource?: MediaSourceInfo) => {
    const mediaStreams = mediaSource?.MediaStreams ?? [];
    return {
        //mediaStreams,
        videoStreams: getStreamsByType(mediaStreams, MediaStreamType.Video),
        audioStreams: getStreamsByType(
            mediaStreams,
            MediaStreamType.Audio,
            true
        ),
        subtitleStreams: getStreamsByType(
            mediaStreams,
            MediaStreamType.Subtitle,
            true
        )
    };
};

export const getMediaSource = (
    mediaSources: MediaSourceInfo[] | null | undefined,
    selectedIndex: number
) => {
    const mediaSource = mediaSources?.[selectedIndex];
    const mediaStreams = getMediaStreams(mediaSource);

    const defaultVideoIndex = mediaStreams.videoStreams[0]?.Index ?? -1;
    const defaultAudioIndex = mediaSource?.DefaultAudioStreamIndex ?? -1;
    const defaultSubtitleIndex = mediaSource?.DefaultSubtitleStreamIndex ?? -1;

    return {
        mediaSource,
        ...mediaStreams,
        defaultVideoIndex,
        defaultAudioIndex,
        defaultSubtitleIndex
    };
};

export const getCurrentMediaSource = (
    mediaSources: MediaSourceInfo[] | null | undefined,
    selectedIndex: number
): MediaSourceInfo | undefined => mediaSources?.[selectedIndex];

export const getCurrentMediaStream = (
    mediaStreams: MediaStream[],
    selectedIndex: number
): MediaStream | undefined =>
    mediaStreams.find((stream) => stream.Index === selectedIndex);

export const getMediaSourcesByType = (
    mediaSources: MediaSourceInfo[] | null | undefined,
    type: MediaSourceType
): MediaSourceInfo[] | undefined => mediaSources?.filter((source) => source.Type === type);

export const getStreamsByType = (
    mediaStreams: MediaStream[],
    type: MediaStreamType,
    sort = false
): MediaStream[] => {
    const filteredTracks = mediaStreams.filter(
        (stream) => stream.Type === type
    );
    return sort ? [...filteredTracks].sort(itemHelper.sortTracks) : filteredTracks;
};
