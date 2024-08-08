import React, { useCallback, type FC } from 'react';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useTrackSelections } from '../hooks/useTrackSelections';
import globalize from 'scripts/globalize';
import mediainfo from 'components/mediainfo/mediainfo';
import Stack from '@mui/material/Stack';

const TrackSelections: FC = () => {
    const {
        mediaSources,
        selectedMediaSourceId,
        handleSelectMediaSourceId,
        videoTracks,
        audioTracks,
        subtitleTracks,
        selectedVideoTrack,
        setSelectedVideoTrack,
        selectedAudioTrack,
        setSelectedAudioTrack,
        selectedSubtitleTrack,
        setSelectedSubtitleTrack
    } = useTrackSelections();

    console.log('videoTracks', { videoTracks, selectedVideoTrack });
    console.log('subtitleTracks', { subtitleTracks, selectedSubtitleTrack });

    const handleMediaSourceChange = useCallback(
        (event: SelectChangeEvent) => {
            handleSelectMediaSourceId(event.target.value);
        },
        [handleSelectMediaSourceId]
    );

    const handleVideoTrackChange = useCallback(
        (event: SelectChangeEvent<number>) => {
            setSelectedVideoTrack(event.target.value as number);
        },
        [setSelectedVideoTrack]
    );

    const handleAudioTrackChange = useCallback(
        (event: SelectChangeEvent<number>) => {
            setSelectedAudioTrack(event.target.value as number);
        },
        [setSelectedAudioTrack]
    );

    const handleSubtitleTrackChange = useCallback(
        (event: SelectChangeEvent<number>) => {
            setSelectedSubtitleTrack(event.target.value as number);
        },
        [setSelectedSubtitleTrack]
    );

    return (
        <Stack
            component='form'
            className='trackSelections'
            spacing={2}
            direction='column'
            sx={{ maxWidth: '22em' }}
        >
            {mediaSources.length > 1 && (
                <FormControl size='small'>
                    <InputLabel id='selectVersionLabel'>
                        <Typography component='span'>
                            {globalize.translate('LabelVersion')}
                        </Typography>
                    </InputLabel>
                    <Select
                        labelId='selectVersionLabel'
                        id='selectSource'
                        value={selectedMediaSourceId}
                        label={globalize.translate('LabelVersion')}
                        onChange={handleMediaSourceChange}
                    >
                        {mediaSources.map((option) => (
                            <MenuItem key={option.Id} value={option.Id || ''}>
                                <Typography component='span'>
                                    {option.Name}
                                </Typography>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {videoTracks && videoTracks.length > 0 && (
                <FormControl
                    size='small'
                    disabled={videoTracks.length <= 1}
                    fullWidth
                >
                    <InputLabel id='selectVideoLabel'>
                        <Typography component='span'>
                            {globalize.translate('Video')}
                        </Typography>
                    </InputLabel>
                    <Select
                        labelId='selectVideoLabel'
                        id='selectVideo'
                        value={selectedVideoTrack}
                        label={globalize.translate('Video')}
                        onChange={handleVideoTrackChange}
                    >
                        {videoTracks.map((videoTrack) => {
                            const titleParts = [];
                            const resolutionText =
                                mediainfo.getResolutionText(videoTrack);

                            if (resolutionText) {
                                titleParts.push(resolutionText);
                            }

                            if (videoTrack.Codec) {
                                titleParts.push(videoTrack.Codec.toUpperCase());
                            }
                            return (
                                <MenuItem
                                    key={videoTrack.Index}
                                    value={videoTrack.Index}
                                >
                                    <Typography component='span'>
                                        {videoTrack.DisplayTitle
                                            || titleParts.join(' ')}
                                    </Typography>
                                </MenuItem>
                            );
                        })}
                    </Select>
                </FormControl>
            )}

            {audioTracks && audioTracks.length > 0 && (
                <FormControl
                    size='small'
                    disabled={audioTracks.length <= 1}
                >
                    <InputLabel id='selectAudioLabel'>
                        <Typography component='span'>
                            {globalize.translate('Audio')}
                        </Typography>
                    </InputLabel>
                    <Select
                        labelId='selectAudioLabel'
                        id='selectAudio'
                        value={selectedAudioTrack}
                        label={globalize.translate('Audio')}
                        onChange={handleAudioTrackChange}
                    >
                        {audioTracks.map((audioTrack) => (
                            <MenuItem
                                key={audioTrack.Index}
                                value={audioTrack.Index}
                            >
                                <Typography component='span'>
                                    {audioTrack.DisplayTitle}
                                </Typography>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {subtitleTracks && subtitleTracks.length > 0 && (
                <FormControl
                    size='small'
                    disabled={subtitleTracks?.length <= 0}
                >
                    <InputLabel id='selectSubtitlesLabel'>
                        <Typography component='span'>
                            {globalize.translate('Subtitle')}
                        </Typography>
                    </InputLabel>
                    <Select
                        labelId='selectSubtitlesLabel'
                        id='selectSubtitles'
                        value={selectedSubtitleTrack}
                        label={globalize.translate('Subtitle')}
                        onChange={handleSubtitleTrackChange}
                    >
                        <MenuItem key={-1} value={-1}>
                            <Typography component='span'>
                                {globalize.translate('Off')}
                            </Typography>
                        </MenuItem>
                        {subtitleTracks.map((subtitleTrack) => (
                            <MenuItem
                                key={subtitleTrack.Index}
                                value={subtitleTrack.Index}
                            >
                                <Typography component='span'>
                                    {subtitleTrack.DisplayTitle}
                                </Typography>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </Stack>
    );
};

export default TrackSelections;
