import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client/models/media-stream-type';
import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models/media-source-info';
import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models/media-stream';

import React, {
    type FC,
    type PropsWithChildren,
    createContext,
    useContext,
    useMemo,
    useState,
    useCallback,
    ChangeEvent
} from 'react';
import { getFilteredMediaStreams } from '../utils/items';
import itemHelper from 'components/itemHelper';
import { playbackManager } from 'components/playback/playbackmanager';
import type { ItemDto } from 'types/base/models/item-dto';

interface MediaTrackIndices {
    videoStreamIndex: number;
    audioStreamIndex: number;
    subtitleStreamIndex: number;
}

interface MediaTracks {
    videoStreams: MediaStream[];
    audioStreams: MediaStream[];
    subtitleStreams: MediaStream[];
}

type MediaTrackIndexType = 'videoStreamIndex' | 'audioStreamIndex' | 'subtitleStreamIndex';

const shouldAllowTrackSelection = (item: ItemDto): boolean => {
    return (
        Boolean(item.MediaSources)
        && itemHelper.supportsMediaSourceSelection(item)
        && Boolean(
            playbackManager.getSupportedCommands().includes('PlayMediaSource')
        )
        && playbackManager.canPlay(item)
    );
};

const getMediaSource = (item: ItemDto, selectedMediaSourceId: string) => {
    const mediaSourceInfo =
        item.MediaSources?.find((m) => m.Id === selectedMediaSourceId)
        || item.MediaSources?.[0]
        || {};

    const mediaStreams = mediaSourceInfo.MediaStreams || [];

    const videoStreams = getFilteredMediaStreams(
        mediaStreams,
        MediaStreamType.Video
    );

    const audioStreams = getFilteredMediaStreams(
        mediaStreams,
        MediaStreamType.Audio,
        true
    );

    const subtitleStreams = getFilteredMediaStreams(
        mediaStreams,
        MediaStreamType.Subtitle,
        true
    );

    const defaultVideoIndex = videoStreams[0]?.Index ?? -1;
    const defaultAudioIndex = mediaSourceInfo.DefaultAudioStreamIndex ?? -1;
    const defaultSubtitleIndex = mediaSourceInfo.DefaultSubtitleStreamIndex ?? -1;

    return {
        mediaSourceInfo,
        mediaTracks: { videoStreams, audioStreams, subtitleStreams },
        defaultVideoIndex,
        defaultAudioIndex,
        defaultSubtitleIndex,
        mediaSourceInfos: item.MediaSources || []
    };
};

export interface TrackSelectionsContextProps {
    isTrackSelectionAllowed: boolean;
    selectedMediaSourceId: string;
    mediaSourceInfo: MediaSourceInfo;
    mediaTracks: MediaTracks;
    selectedMediaTrackIndices: MediaTrackIndices;
    mediaSourceInfos: MediaSourceInfo[];
    handleMediaSourceChange: (event: ChangeEvent<HTMLInputElement>) => void;
    handleTrackChange: (
        trackIndexType: MediaTrackIndexType
    ) => (event: ChangeEvent<HTMLInputElement>) => void;
}

export const TrackSelectionsContext =
    createContext<TrackSelectionsContextProps>(
        {} as TrackSelectionsContextProps
    );

export const useTrackSelections = () => useContext(TrackSelectionsContext);

interface TrackSelectionsProviderProps {
    item: ItemDto;
    paramId: string | null;
}

export const TrackSelectionsProvider: FC<
    PropsWithChildren<TrackSelectionsProviderProps>
> = ({ item, paramId, children }) => {
    const [selectedMediaSourceId, setSelectedMediaSourceId] = useState<string>(
        item.MediaSources?.[0].Id || paramId || ''
    );

    const currentSource = useMemo(
        () => getMediaSource(item, selectedMediaSourceId),
        [item, selectedMediaSourceId]
    );

    const [selectedMediaTrackIndices, setSelectedMediaTrackIndices] = useState<MediaTrackIndices>({
        videoStreamIndex: currentSource.defaultVideoIndex,
        audioStreamIndex: currentSource.defaultAudioIndex,
        subtitleStreamIndex: currentSource.defaultSubtitleIndex
    });

    const handleMediaSourceChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const newSource = getMediaSource(item, event.target.value);
            setSelectedMediaSourceId(event.target.value);
            setSelectedMediaTrackIndices({
                videoStreamIndex: newSource.defaultVideoIndex,
                audioStreamIndex: newSource.defaultAudioIndex,
                subtitleStreamIndex: newSource.defaultSubtitleIndex
            });
        },
        [item]
    );

    const handleTrackChange =
    (mediaTrackIndexType: MediaTrackIndexType) => (event: ChangeEvent<HTMLInputElement>) => {
        setSelectedMediaTrackIndices((prevState) => ({
            ...prevState,
            [mediaTrackIndexType]: Number(event.target.value)
        }));
    };

    const contextValue: TrackSelectionsContextProps = useMemo(
        () => ({
            isTrackSelectionAllowed: shouldAllowTrackSelection(item),
            selectedMediaSourceId,
            mediaSourceInfo: currentSource.mediaSourceInfo,
            mediaSourceInfos: currentSource.mediaSourceInfos,
            mediaTracks: currentSource.mediaTracks,
            selectedMediaTrackIndices,
            handleMediaSourceChange,
            handleTrackChange
        }),
        [
            currentSource.mediaSourceInfo,
            currentSource.mediaSourceInfos,
            currentSource.mediaTracks,
            handleMediaSourceChange,
            item,
            selectedMediaSourceId,
            selectedMediaTrackIndices
        ]
    );

    return (
        <TrackSelectionsContext.Provider value={contextValue}>
            {children}
        </TrackSelectionsContext.Provider>
    );
};
