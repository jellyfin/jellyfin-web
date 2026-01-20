import React, { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box/Box';
import Slider from '@mui/joy/Slider';
import IconButton from '@mui/joy/IconButton';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography/Typography';
import Tooltip from '@mui/joy/Tooltip';
import LinearProgress from '@mui/material/LinearProgress/LinearProgress';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import FastForwardIcon from '@mui/icons-material/FastForward';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';
import Replay10Icon from '@mui/icons-material/Replay10';
import Forward30Icon from '@mui/icons-material/Forward30';

import { PlaybackIconButton } from '../playback/PlaybackIconButton';
import { PlaybackSlider } from '../playback/PlaybackSlider';
import { VolumeSlider } from '../playback/VolumeSlider';

import type { RepeatMode, ShuffleMode } from 'store/types';

export interface QueueControlsProps {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    repeatMode: RepeatMode;
    shuffleMode: ShuffleMode;
    isShuffled: boolean;
    bufferedRanges?: { start: number; end: number }[];
    onPlayPause: () => void;
    onStop: () => void;
    onSeek: (time: number) => void;
    onSeekEnd: (time: number) => void;
    onVolumeChange: (volume: number) => void;
    onMuteToggle: () => void;
    onRewind: () => void;
    onFastForward: () => void;
    onPreviousTrack: () => void;
    onNextTrack: () => void;
    onShuffleToggle: () => void;
    onRepeatToggle: () => void;
    onVolumeUp: () => void;
    onVolumeDown: () => void;
}

const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const getRepeatIcon = (mode: RepeatMode): React.ReactNode => {
    switch (mode) {
        case 'RepeatOne':
            return <RepeatOneIcon />;
        case 'RepeatAll':
            return <RepeatIcon />;
        default:
            return <RepeatIcon />;
    }
};

const getRepeatAriaLabel = (mode: RepeatMode): string => {
    switch (mode) {
        case 'RepeatOne':
            return 'Repeat One';
        case 'RepeatAll':
            return 'Repeat All';
        default:
            return 'Repeat Off';
    }
};

export const QueueControls: React.FC<QueueControlsProps> = ({
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    shuffleMode,
    isShuffled,
    bufferedRanges = [],
    onPlayPause,
    onStop,
    onSeek,
    onSeekEnd,
    onVolumeChange,
    onMuteToggle,
    onRewind,
    onFastForward,
    onPreviousTrack,
    onNextTrack,
    onShuffleToggle,
    onRepeatToggle,
    onVolumeUp,
    onVolumeDown
}) => {
    const [localSeekValue, setLocalSeekValue] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);

    useEffect(() => {
        if (!isSeeking && duration > 0) {
            setLocalSeekValue((currentTime / duration) * 100);
        }
    }, [currentTime, duration, isSeeking]);

    const handleSeekChange = useCallback((_event: Event, value: number | number[]) => {
        setIsSeeking(true);
        setLocalSeekValue(value as number);
    }, []);

    const handleSeekEnd = useCallback((_event: Event | React.SyntheticEvent, value: number | number[]) => {
        setIsSeeking(false);
        const seekTime = ((value as number) / 100) * duration;
        onSeekEnd(seekTime);
        onSeek(seekTime);
    }, [duration, onSeek, onSeekEnd]);

    const progress = duration > 0 ? (localSeekValue / 100) * duration : 0;

    return (
        <Box className='nowPlayingButtonsContainer' data-testid='queue-controls' sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box className='positionTime' sx={{ minWidth: 45, textAlign: 'right' }}>
                    <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                        {formatTime(progress)}
                    </Typography>
                </Box>
                <Box className='nowPlayingPositionSliderContainer' sx={{ flex: 1, mx: 1, position: 'relative' }}>
                    <Box
                        className='sliderBufferOverlay'
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: (bufferedRanges.length > 0) ? `${(bufferedRanges[0].start / duration) * 100}%` : '0%',
                            right: (bufferedRanges.length > 0) ? `${100 - (bufferedRanges[0].end / duration) * 100}%` : '100%',
                            height: 4,
                            background: 'rgba(255,255,255,0.3)',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            zIndex: 1,
                            borderRadius: 1
                        }}
                    />
                    <PlaybackSlider
                        value={localSeekValue}
                        onChange={handleSeekChange}
                        onChangeCommitted={handleSeekEnd}
                        min={0}
                        max={100}
                        size='sm'
                        sx={{ width: '100%' }}
                    />
                </Box>
                <Box className='runtime' sx={{ minWidth: 45 }}>
                    <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                        {formatTime(duration)}
                    </Typography>
                </Box>
            </Box>

            <Stack
                direction='row'
                spacing={1}
                alignItems='center'
                justifyContent='space-between'
                sx={{ flexWrap: 'wrap', gap: 1 }}
            >
                <Stack direction='row' spacing={0.5} alignItems='center'>
                    <Tooltip title={getRepeatAriaLabel(repeatMode)} arrow>
                        <IconButton
                            className='btnRepeat repeatToggleButton'
                            size='md'
                            variant='plain'
                            onClick={onRepeatToggle}
                            sx={{
                                color: repeatMode !== 'RepeatNone' ? 'primary.main' : 'text.secondary',
                                '&:hover': { color: 'primary.light' }
                            }}
                        >
                            {getRepeatIcon(repeatMode)}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title='Rewind (J)' arrow>
                        <IconButton
                            className='btnRewind btnNowPlayingRewind'
                            size='md'
                            variant='plain'
                            onClick={onRewind}
                            sx={{ color: 'text.secondary' }}
                        >
                            <Replay10Icon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title='Previous Track' arrow>
                        <IconButton
                            className='btnPreviousTrack'
                            size='md'
                            variant='plain'
                            onClick={onPreviousTrack}
                            sx={{ color: 'text.secondary' }}
                        >
                            <SkipPreviousIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={isPlaying ? 'Pause' : 'Play'} arrow>
                        <IconButton
                            className='btnPlayPause'
                            size='lg'
                            variant='solid'
                            color='primary'
                            onClick={onPlayPause}
                            sx={{
                                mx: 1,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                            }}
                        >
                            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title='Stop' arrow>
                        <IconButton
                            className='btnStop'
                            size='md'
                            variant='plain'
                            onClick={onStop}
                            sx={{ color: 'text.secondary' }}
                        >
                            <StopIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title='Next Track' arrow>
                        <IconButton
                            className='btnNextTrack'
                            size='md'
                            variant='plain'
                            onClick={onNextTrack}
                            sx={{ color: 'text.secondary' }}
                        >
                            <SkipNextIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title='Fast Forward (L)' arrow>
                        <IconButton
                            className='btnFastForward btnNowPlayingFastForward'
                            size='md'
                            variant='plain'
                            onClick={onFastForward}
                            sx={{ color: 'text.secondary' }}
                        >
                            <Forward30Icon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={isShuffled ? 'Shuffle On' : 'Shuffle'} arrow>
                        <IconButton
                            className='btnShuffleQueue'
                            size='md'
                            variant='plain'
                            onClick={onShuffleToggle}
                            sx={{
                                color: isShuffled ? 'primary.main' : 'text.secondary',
                                '&:hover': { color: 'primary.light' }
                            }}
                        >
                            <ShuffleIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>

                <Stack direction='row' spacing={0.5} alignItems='center'>
                    <VolumeSlider
                        volume={isMuted ? 0 : volume}
                        muted={isMuted}
                        onVolumeChange={onVolumeChange}
                        onMuteToggle={onMuteToggle}
                        size='sm'
                        sx={{ width: 100 }}
                    />
                </Stack>
            </Stack>
        </Box>
    );
};

export default QueueControls;
