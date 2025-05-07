import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client/models/media-stream-type';
import React, { useMemo } from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { useTrackSelections } from './hooks';
import globalize from 'lib/globalize';

interface TrackSelectorProps {
    type: MediaStreamType;
    label: string;
}

export const TrackSelector: React.FC<TrackSelectorProps> = ({ type, label }) => {
    const {
        audioStreams,
        videoStreams,
        subtitleStreams,
        selectedAudioIndex,
        selectedVideoIndex,
        selectedSubtitleIndex,
        setSelectedAudioIndex,
        setSelectedVideoIndex,
        setSelectedSubtitleIndex
    } = useTrackSelections();

    const [streams, selectedIndex, setSelectedIndex] = useMemo(() => {
        switch (type) {
            case MediaStreamType.Audio:
                return [
                    audioStreams,
                    selectedAudioIndex,
                    setSelectedAudioIndex
                ];
            case MediaStreamType.Video:
                return [
                    videoStreams,
                    selectedVideoIndex,
                    setSelectedVideoIndex
                ];
            case MediaStreamType.Subtitle:
                return [
                    subtitleStreams,
                    selectedSubtitleIndex,
                    setSelectedSubtitleIndex
                ];
            default:
                return [[], null, () => { /* no-op */ }];
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        type,
        audioStreams,
        videoStreams,
        subtitleStreams,
        selectedAudioIndex,
        selectedVideoIndex,
        selectedSubtitleIndex
    ]);

    if (streams.length <= (type === MediaStreamType.Subtitle ? 0 : 1)) {
        return null;
    }

    return (
        <TextField
            className='selectContainer flex-shrink-zero'
            size='small'
            fullWidth
            select
            label={globalize.translate(label)}
            value={selectedIndex}
            // eslint-disable-next-line react/jsx-no-bind
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
        >
            {type === MediaStreamType.Subtitle && (
                <MenuItem key={-1} value={-1}>
                    <Typography component='span'>
                        {globalize.translate('Off')}
                    </Typography>
                </MenuItem>
            )}
            {streams.map((stream) => (
                <MenuItem key={stream.Index} value={stream.Index}>
                    <Typography component='span'>
                        {stream.DisplayTitle}
                    </Typography>
                </MenuItem>
            ))}
        </TextField>
    );
};
