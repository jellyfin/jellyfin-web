import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useTrackSelections } from '../hooks/useTrackSelections';
import globalize from 'lib/globalize';
import mediainfo from 'components/mediainfo/mediainfo';

interface TrackSelectionsProps {
    className?: string;
}

const TrackSelections: FC<TrackSelectionsProps> = ({ className }) => {
    const {
        mediaSourceInfos,
        selectedMediaSourceId,
        handleMediaSourceChange,
        mediaTracks,
        selectedMediaTrackIndices,
        handleTrackChange
    } = useTrackSelections();

    const { videoStreams, audioStreams, subtitleStreams } = mediaTracks;
    const { videoStreamIndex, audioStreamIndex, subtitleStreamIndex } = selectedMediaTrackIndices;

    return (
        <Box
            component='form'
            className={className}
        >
            {mediaSourceInfos.length > 1 && (
                <TextField
                    className='selectContainer flex-shrink-zero'
                    size='small'
                    fullWidth
                    select
                    label={globalize.translate('LabelVersion')}
                    value={selectedMediaSourceId}
                    onChange={handleMediaSourceChange}
                >
                    {mediaSourceInfos.map((option) => (
                        <MenuItem key={option.Id} value={option.Id || ''}>
                            <Typography component='span'>
                                {option.Name}
                            </Typography>
                        </MenuItem>
                    ))}
                </TextField>
            )}

            {videoStreams.length > 0 && (
                <TextField
                    className='selectContainer flex-shrink-zero'
                    size='small'
                    fullWidth
                    select
                    label={globalize.translate('Video')}
                    disabled={videoStreams.length <= 1}
                    value={videoStreamIndex}
                    onChange={handleTrackChange('videoStreamIndex')}
                >
                    {videoStreams.map((stream) => {
                        const titleParts = [];
                        const resolutionText =
                            mediainfo.getResolutionText(stream);

                        if (resolutionText) {
                            titleParts.push(resolutionText);
                        }

                        if (stream.Codec) {
                            titleParts.push(stream.Codec.toUpperCase());
                        }
                        return (
                            <MenuItem key={stream.Index} value={stream.Index}>
                                <Typography component='span'>
                                    {stream.DisplayTitle || titleParts.join(' ')}
                                </Typography>
                            </MenuItem>
                        );
                    })}
                </TextField>
            )}

            {audioStreams.length > 0 && (
                <TextField
                    className='selectContainer flex-shrink-zero'
                    size='small'
                    fullWidth
                    select
                    label={globalize.translate('Audio')}
                    disabled={audioStreams.length <= 1}
                    value={audioStreamIndex}
                    onChange={handleTrackChange('audioStreamIndex')}
                >
                    {audioStreams.map((stream) => (
                        <MenuItem key={stream.Index} value={stream.Index}>
                            <Typography component='span'>
                                {stream.DisplayTitle}
                            </Typography>
                        </MenuItem>
                    ))}
                </TextField>
            )}

            {subtitleStreams.length > 0 && (
                <TextField
                    className='selectContainer flex-shrink-zero'
                    size='small'
                    fullWidth
                    select
                    label={globalize.translate('Subtitle')}
                    disabled={subtitleStreams.length <= 0}
                    value={subtitleStreamIndex}
                    onChange={handleTrackChange('subtitleStreamIndex')}
                >
                    <MenuItem key={-1} value={-1}>
                        <Typography component='span'>
                            {globalize.translate('Off')}
                        </Typography>
                    </MenuItem>
                    {subtitleStreams.map((stream) => (
                        <MenuItem key={stream.Index} value={stream.Index}>
                            <Typography component='span'>
                                {stream.DisplayTitle}
                            </Typography>
                        </MenuItem>
                    ))}
                </TextField>
            )}
        </Box>
    );
};

export default TrackSelections;
