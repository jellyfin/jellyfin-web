import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models/media-source-info';
import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models/media-stream';
import React, {
    createContext,
    useContext,
    useState,
    useMemo,
    useCallback,
    ChangeEvent,
    type FC,
    type PropsWithChildren
} from 'react';
import { ItemDto } from 'types/base/models/item-dto';
import { getCurrentMediaStream, getMediaSource } from './utils';

interface TrackState {
    mediaSource: MediaSourceInfo | undefined;
    audioStreams: MediaStream[];
    videoStreams: MediaStream[];
    subtitleStreams: MediaStream[];
    selectedAudioIndex: number;
    selectedVideoIndex: number;
    selectedSubtitleIndex: number;
}

interface TrackSelectionsContextType extends TrackState {
    mediaSources: MediaSourceInfo[] | null | undefined;
    selectedMediaSourceIndex: number;
    handleMediaSourceChange: (
        event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
    ) => void;
    setSelectedAudioIndex: (index: number) => void;
    setSelectedVideoIndex: (index: number) => void;
    setSelectedSubtitleIndex: (index: number) => void;
    getCurrentVideoStream: () => MediaStream | undefined;
    getCurrentAudioStream: () => MediaStream | undefined;
    getCurrentSubtitleStream: () => MediaStream | undefined;
}

const TrackSelectionsContext = createContext<TrackSelectionsContextType | undefined>(undefined);

interface TrackSelectionsProviderProps {
    item: ItemDto
}

const TrackSelectionsProvider: FC<
    PropsWithChildren<TrackSelectionsProviderProps>
> = ({ item, children }) => {
    const mediaSources = useMemo(
        () => item.MediaSources,
        [item.MediaSources]
    );
    const [selectedMediaSourceIndex, setSelectedMediaSourceIndex] = useState(0);

    const {
        defaultVideoIndex,
        defaultAudioIndex,
        defaultSubtitleIndex,
        videoStreams,
        audioStreams,
        subtitleStreams,
        mediaSource
    } = useMemo(
        () => getMediaSource(mediaSources, selectedMediaSourceIndex),
        [mediaSources, selectedMediaSourceIndex]
    );

    const [trackState, setTrackState] = useState<TrackState>({
        mediaSource: mediaSource,
        videoStreams: videoStreams,
        audioStreams: audioStreams,
        subtitleStreams: subtitleStreams,
        selectedVideoIndex: defaultVideoIndex,
        selectedAudioIndex: defaultAudioIndex,
        selectedSubtitleIndex: defaultSubtitleIndex
    });

    const getCurrentVideoStream = useCallback(() => {
        return getCurrentMediaStream(
            trackState.videoStreams,
            trackState.selectedVideoIndex
        );
    }, [trackState]);

    const getCurrentAudioStream = useCallback(() => {
        return getCurrentMediaStream(
            trackState.audioStreams,
            trackState.selectedAudioIndex
        );
    }, [trackState]);

    const getCurrentSubtitleStream = useCallback(() => {
        return getCurrentMediaStream(
            trackState.subtitleStreams,
            trackState.selectedAudioIndex
        );
    }, [trackState]);

    const handleMediaSourceChange = useCallback((
        e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
    ) => {
        const newSource = getMediaSource(mediaSources, Number(e.target.value));
        setSelectedMediaSourceIndex(Number(e.target.value));
        setTrackState({
            mediaSource: newSource.mediaSource,
            videoStreams: newSource.videoStreams,
            audioStreams: newSource.audioStreams,
            subtitleStreams: newSource.subtitleStreams,
            selectedVideoIndex: newSource.defaultVideoIndex,
            selectedAudioIndex: newSource.defaultAudioIndex,
            selectedSubtitleIndex: newSource.defaultSubtitleIndex
        });
    }, [mediaSources]);

    const contextValue = useMemo(
        () => ({
            mediaSources,
            selectedMediaSourceIndex,
            ...trackState,
            handleMediaSourceChange,
            setSelectedAudioIndex: (index: number) =>
                setTrackState((prev) => ({
                    ...prev,
                    selectedAudioIndex: index
                })),
            setSelectedVideoIndex: (index: number) =>
                setTrackState((prev) => ({
                    ...prev,
                    selectedVideoIndex: index
                })),
            setSelectedSubtitleIndex: (index: number) =>
                setTrackState((prev) => ({
                    ...prev,
                    selectedSubtitleIndex: index
                })),
            getCurrentVideoStream,
            getCurrentAudioStream,
            getCurrentSubtitleStream
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            mediaSources,
            selectedMediaSourceIndex,
            trackState,
            getCurrentVideoStream,
            getCurrentAudioStream,
            getCurrentSubtitleStream
        ]
    );

    return (
        <TrackSelectionsContext.Provider value={contextValue}>
            {children}
        </TrackSelectionsContext.Provider>
    );
};

const useTrackSelections = () => {
    const context = useContext(TrackSelectionsContext);
    if (context === undefined) {
        throw new Error(
            'useTrackSelections must be used within a TrackSelectionsProvider'
        );
    }
    return context;
};

export { TrackSelectionsProvider, useTrackSelections };
