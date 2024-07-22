import { MediaSourceType } from '@jellyfin/sdk/lib/generated-client/models/media-source-type';
import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client/models/media-stream-type';
import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models/media-source-info';
import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models/media-stream';

import React, {
    type FC,
    type PropsWithChildren,
    createContext,
    useContext,
    useMemo,
    useCallback,
    useState,
    type Dispatch,
    type SetStateAction
} from 'react';
import { debounce } from 'lodash';
import { ItemDto } from 'types/base/models/item-dto';
import itemHelper from 'components/itemHelper';

export interface TrackSelectionsContextProps {
    mediaSourceInfo: MediaSourceInfo | undefined;
    mediaSources: MediaSourceInfo[];
    groupedVersions: MediaSourceInfo[] | undefined;
    videoTracks: MediaStream[] | undefined;
    audioTracks: MediaStream[] | undefined;
    subtitleTracks: MediaStream[] | undefined;
    selectedMediaSourceId: string;
    selectedVideoTrack: number;
    selectedAudioTrack: number;
    selectedSubtitleTrack: number;
    handleSelectMediaSourceId: (value: string) => void;
    setSelectedMediaSourceId: Dispatch<SetStateAction<string>>;
    setSelectedVideoTrack: Dispatch<SetStateAction<number>>;
    setSelectedAudioTrack: Dispatch<SetStateAction<number>>;
    setSelectedSubtitleTrack: Dispatch<SetStateAction<number>>;
}

export const TrackSelectionsContext =
    createContext<TrackSelectionsContextProps>(
        {} as TrackSelectionsContextProps
    );
export const useTrackSelections = () => useContext(TrackSelectionsContext);

interface TrackSelectionsProviderProps {
    item: ItemDto;
}

export const TrackSelectionsProvider: FC<
    PropsWithChildren<TrackSelectionsProviderProps>
> = ({ item, children }) => {
    const [selectedMediaSourceId, setSelectedMediaSourceId] = useState<string>(
        item.MediaSources?.[0].Id || ''
    );

    const mediaSourceInfo = useMemo(() => {
        const selectedSource = item.MediaSources?.find(
            (m) => m.Id === selectedMediaSourceId
        );
        return selectedSource || item.MediaSources?.[0];
    }, [item.MediaSources, selectedMediaSourceId]);

    const videoTracks = useMemo(
        () =>
            mediaSourceInfo?.MediaStreams?.filter(
                (m) => m.Type === MediaStreamType.Video
            ),
        [mediaSourceInfo]
    );
    const audioTracks = useMemo(
        () =>
            mediaSourceInfo?.MediaStreams?.filter(
                (m) => m.Type === MediaStreamType.Audio
            ).sort(itemHelper.sortTracks),
        [mediaSourceInfo]
    );
    const subtitleTracks = useMemo(
        () =>
            mediaSourceInfo?.MediaStreams?.filter(
                (m) => m.Type === MediaStreamType.Subtitle
            ).sort(itemHelper.sortTracks),
        [mediaSourceInfo]
    );

    const groupedVersions = useMemo(
        () =>
            item.MediaSources?.filter(function (g) {
                return g.Type == MediaSourceType.Grouping;
            }),
        [item.MediaSources]
    );

    const [selectedVideoTrack, setSelectedVideoTrack] = useState<number>(
        videoTracks?.length ? Number(videoTracks[0].Index) : -1
    );
    const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(
        mediaSourceInfo?.DefaultAudioStreamIndex || -1
    );
    const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<number>(
        mediaSourceInfo?.DefaultSubtitleStreamIndex == null ?
            -1 :
            mediaSourceInfo?.DefaultSubtitleStreamIndex
    );

    const debouncedSetSelectedMediaSourceId = useMemo(
        () => debounce((value: string) => setSelectedMediaSourceId(value), 300),
        []
    );

    const handleSelectMediaSourceId = useCallback(
        (value: string) => {
            debouncedSetSelectedMediaSourceId(value);
        },
        [debouncedSetSelectedMediaSourceId]
    );

    const contextValue: TrackSelectionsContextProps = useMemo(
        () => ({
            selectedMediaSourceId,
            mediaSourceInfo,
            mediaSources: item.MediaSources || [],
            groupedVersions,
            videoTracks,
            audioTracks,
            subtitleTracks,
            selectedVideoTrack,
            selectedAudioTrack,
            selectedSubtitleTrack,
            handleSelectMediaSourceId,
            setSelectedMediaSourceId,
            setSelectedVideoTrack,
            setSelectedAudioTrack,
            setSelectedSubtitleTrack
        }),
        [
            selectedMediaSourceId,
            mediaSourceInfo,
            item.MediaSources,
            groupedVersions,
            videoTracks,
            audioTracks,
            subtitleTracks,
            selectedVideoTrack,
            selectedAudioTrack,
            selectedSubtitleTrack,
            handleSelectMediaSourceId
        ]
    );

    return (
        <TrackSelectionsContext.Provider value={contextValue}>
            {children}
        </TrackSelectionsContext.Provider>
    );
};
