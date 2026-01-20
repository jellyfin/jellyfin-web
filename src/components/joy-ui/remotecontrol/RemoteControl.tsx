import React, { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box/Box';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import IconButton from '@mui/joy/IconButton';
import Slider from '@mui/joy/Slider';
import Avatar from '@mui/material/Avatar/Avatar';
import Tooltip from '@mui/joy/Tooltip';
import Divider from '@mui/material/Divider/Divider';
import Fade from '@mui/material/Fade/Fade';
import Paper from '@mui/material/Paper/Paper';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import AirplayIcon from '@mui/icons-material/Airplay';
import PictureInPictureAltIcon from '@mui/icons-material/PictureInPictureAlt';

import { PlaybackIconButton } from '../playback/PlaybackIconButton';
import { VolumeSlider } from '../playback/VolumeSlider';
import { ActionMenu, type ActionMenuItem } from '../action/ActionMenu';

import type { PlayableItem } from 'store/types';
import type { RepeatMode, ShuffleMode } from 'store/types';

export interface RemoteControlProps {
    currentItem: PlayableItem | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    repeatMode: RepeatMode;
    shuffleMode: ShuffleMode;
    isShuffled: boolean;
    isFavorite?: boolean;
    audioTracks?: { Index: number; DisplayTitle: string }[];
    subtitleTracks?: { Index: number; DisplayTitle: string }[];
    currentAudioIndex?: number | null;
    currentSubtitleIndex?: number | null;
    hasSubtitles?: boolean;
    hasMultipleAudioTracks?: boolean;
    canAirPlay?: boolean;
    canPiP?: boolean;
    canFullscreen?: boolean;
    onPlayPause: () => void;
    onStop: () => void;
    onSeek: (time: number) => void;
    onVolumeChange: (volume: number) => void;
    onMuteToggle: () => void;
    onPreviousTrack: () => void;
    onNextTrack: () => void;
    onShuffleToggle: () => void;
    onRepeatToggle: () => void;
    onAudioTrackSelect: (index: number) => void;
    onSubtitleTrackSelect: (index: number) => void;
    onFavoriteToggle: () => void;
    onFullscreen: () => void;
    onAirPlay: () => void;
    onPiP: () => void;
}

const formatTime = (ticks: number): string => {
    const seconds = Math.floor((ticks / 10000000) % 60);
    const minutes = Math.floor((ticks / 10000000 / 60) % 60);
    const hours = Math.floor(ticks / 10000000 / 60 / 60);
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const RemoteControl: React.FC<RemoteControlProps> = ({
    currentItem,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    shuffleMode,
    isShuffled,
    isFavorite = false,
    audioTracks = [],
    subtitleTracks = [],
    currentAudioIndex = null,
    currentSubtitleIndex = null,
    hasSubtitles = false,
    hasMultipleAudioTracks = false,
    canAirPlay = false,
    canPiP = false,
    canFullscreen = false,
    onPlayPause,
    onStop,
    onSeek,
    onVolumeChange,
    onMuteToggle,
    onPreviousTrack,
    onNextTrack,
    onShuffleToggle,
    onRepeatToggle,
    onAudioTrackSelect,
    onSubtitleTrackSelect,
    onFavoriteToggle,
    onFullscreen,
    onAirPlay,
    onPiP
}) => {
    const [localSeekValue, setLocalSeekValue] = useState(0);
    const [audioMenuAnchor, setAudioMenuAnchor] = useState<HTMLElement | null>(null);
    const [subtitleMenuAnchor, setSubtitleMenuAnchor] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (duration > 0) {
            setLocalSeekValue((currentTime / duration) * 100);
        }
    }, [currentTime, duration]);

    const handleSeekChange = useCallback((_event: Event, value: number | number[]) => {
        setLocalSeekValue(value as number);
    }, []);

    const handleSeekEnd = useCallback((_event: Event | React.SyntheticEvent, value: number | number[]) => {
        const seekTime = ((value as number) / 100) * duration;
        onSeek(seekTime);
    }, [duration, onSeek]);

    const handleAudioMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAudioMenuAnchor(event.currentTarget);
    }, []);

    const handleAudioMenuClose = useCallback(() => {
        setAudioMenuAnchor(null);
    }, []);

    const handleAudioTrackSelect = useCallback((id: string) => {
        const index = parseInt(id, 10);
        onAudioTrackSelect(index);
        handleAudioMenuClose();
    }, [onAudioTrackSelect, handleAudioMenuClose]);

    const handleSubtitleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setSubtitleMenuAnchor(event.currentTarget);
    }, []);

    const handleSubtitleMenuClose = useCallback(() => {
        setSubtitleMenuAnchor(null);
    }, []);

    const handleSubtitleTrackSelect = useCallback((id: string) => {
        const index = parseInt(id, 10);
        onSubtitleTrackSelect(index);
        handleSubtitleMenuClose();
    }, [onSubtitleTrackSelect, handleSubtitleMenuClose]);

    const audioMenuItems: ActionMenuItem[] = audioTracks.map(track => ({
        id: track.Index.toString(),
        name: track.DisplayTitle,
        selected: track.Index === currentAudioIndex
    }));

    const subtitleMenuItems: ActionMenuItem[] = [
        { id: '-1', name: 'Off', selected: currentSubtitleIndex === null || currentSubtitleIndex === -1 },
        ...subtitleTracks.map(track => ({
            id: track.Index.toString(),
            name: track.DisplayTitle,
            selected: track.Index === currentSubtitleIndex
        }))
    ];

    const progress = duration > 0 ? (localSeekValue / 100) * duration : 0;

    const imageUrl = currentItem?.imageUrl;

    return (
        <Box
            className='remoteControlContent'
            sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 400,
                mx: 'auto',
                p: 3
            }}
        >
            <Fade in={true} timeout={300}>
                <Paper
                    elevation={8}
                    sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        bgcolor: 'rgba(18, 18, 18, 0.95)',
                        backdropFilter: 'blur(20px)'
                    }}
                >
                    <Box sx={{ p: 3 }}>
                        <Stack spacing={3} alignItems='center'>
                            <Box className='nowPlayingPageImageContainer'>
                                <Avatar
                                    variant='rounded'
                                    src={imageUrl || undefined}
                                    sx={{
                                        width: 200,
                                        height: 200,
                                        borderRadius: 2,
                                        boxShadow: 3,
                                        bgcolor: imageUrl ? 'transparent' : 'action.hover'
                                    }}
                                >
                                    {!imageUrl && <AudiotrackIcon sx={{ fontSize: 64, color: 'text.secondary' }} />}
                                </Avatar>
                            </Box>

                            <Box className='nowPlayingInfoContainer' sx={{ width: '100%', textAlign: 'center' }}>
                                <Typography level='h4' sx={{ color: 'white', fontWeight: 'bold' }}>
                                    {currentItem?.name || 'No track playing'}
                                </Typography>
                                <Typography level='body-md' sx={{ color: 'text.secondary' }}>
                                    {currentItem?.artist || ''}
                                </Typography>
                            </Box>

                            <Stack direction='row' spacing={1} alignItems='center' sx={{ width: '100%' }}>
                                <Typography level='body-xs' sx={{ color: 'text.secondary', minWidth: 45 }}>
                                    {formatTime(progress * 10000000)}
                                </Typography>
                                <Slider
                                    className='remotePositionSlider'
                                    value={localSeekValue}
                                    onChange={handleSeekChange}
                                    onChangeCommitted={handleSeekEnd}
                                    min={0}
                                    max={100}
                                    size='sm'
                                    sx={{
                                        flex: 1,
                                        '--Slider-thumb-size': '14px',
                                        '--Slider-track-height': '4px',
                                        color: 'primary.main'
                                    }}
                                />
                                <Typography level='body-xs' sx={{ color: 'text.secondary', minWidth: 45 }}>
                                    {formatTime(duration * 10000000)}
                                </Typography>
                            </Stack>

                            <Stack direction='row' spacing={2} alignItems='center' justifyContent='center'>
                                <PlaybackIconButton
                                    icon={shuffleMode === 'Shuffle' ? 'shuffle' : undefined}
                                    active={isShuffled}
                                    size='md'
                                    variant='plain'
                                    onClick={onShuffleToggle}
                                    sx={{ color: isShuffled ? 'primary.main' : 'text.secondary' }}
                                />

                                <Tooltip title='Previous' arrow>
                                    <IconButton size='md' variant='plain' onClick={onPreviousTrack} sx={{ color: 'text.secondary' }}>
                                        <SkipPreviousIcon />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title={isPlaying ? 'Pause' : 'Play'} arrow>
                                    <IconButton
                                        size='lg'
                                        variant='solid'
                                        color='primary'
                                        onClick={onPlayPause}
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' }
                                        }}
                                    >
                                        {isPlaying ? <PauseIcon sx={{ fontSize: 28 }} /> : <PlayArrowIcon sx={{ fontSize: 28 }} />}
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title='Next' arrow>
                                    <IconButton size='md' variant='plain' onClick={onNextTrack} sx={{ color: 'text.secondary' }}>
                                        <SkipNextIcon />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title={repeatMode === 'RepeatOne' ? 'Repeat One' : repeatMode === 'RepeatAll' ? 'Repeat All' : 'Repeat'} arrow>
                                    <IconButton
                                        size='md'
                                        variant='plain'
                                        onClick={onRepeatToggle}
                                        sx={{ color: repeatMode !== 'RepeatNone' ? 'primary.main' : 'text.secondary' }}
                                    >
                                        {repeatMode === 'RepeatOne' ? <RepeatOneIcon /> : <RepeatIcon />}
                                    </IconButton>
                                </Tooltip>
                            </Stack>

                            <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between' sx={{ width: '100%' }}>
                                <Stack direction='row' spacing={0.5} alignItems='center'>
                                    <Tooltip title='Favorite' arrow>
                                        <IconButton size='sm' variant='plain' onClick={onFavoriteToggle} sx={{ color: isFavorite ? 'error.main' : 'text.secondary' }}>
                                            {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                        </IconButton>
                                    </Tooltip>

                                    {hasMultipleAudioTracks && (
                                        <Tooltip title='Audio Tracks' arrow>
                                            <IconButton size='sm' variant='plain' onClick={handleAudioMenuOpen} sx={{ color: 'text.secondary' }}>
                                                <AudiotrackIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}

                                    {hasSubtitles && (
                                        <Tooltip title='Subtitles' arrow>
                                            <IconButton size='sm' variant='plain' onClick={handleSubtitleMenuOpen} sx={{ color: 'text.secondary' }}>
                                                <ClosedCaptionIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Stack>

                                <Stack direction='row' spacing={0.5} alignItems='center'>
                                    <VolumeSlider
                                        volume={isMuted ? 0 : volume}
                                        muted={isMuted}
                                        onVolumeChange={onVolumeChange}
                                        onMuteToggle={onMuteToggle}
                                        size='sm'
                                        showSlider
                                        sx={{ width: 80 }}
                                    />
                                </Stack>

                                <Stack direction='row' spacing={0.5} alignItems='center'>
                                    {canAirPlay && (
                                        <Tooltip title='AirPlay' arrow>
                                            <IconButton size='sm' variant='plain' onClick={onAirPlay} sx={{ color: 'text.secondary' }}>
                                                <AirplayIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}

                                    {canPiP && (
                                        <Tooltip title='Picture in Picture' arrow>
                                            <IconButton size='sm' variant='plain' onClick={onPiP} sx={{ color: 'text.secondary' }}>
                                                <PictureInPictureAltIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}

                                    {canFullscreen && (
                                        <Tooltip title='Fullscreen' arrow>
                                            <IconButton size='sm' variant='plain' onClick={onFullscreen} sx={{ color: 'text.secondary' }}>
                                                <FullscreenIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Stack>
                            </Stack>
                        </Stack>
                    </Box>
                </Paper>
            </Fade>

            <ActionMenu
                items={audioMenuItems}
                anchorEl={audioMenuAnchor}
                open={Boolean(audioMenuAnchor)}
                onClose={handleAudioMenuClose}
                onSelect={handleAudioTrackSelect}
                title='Audio Tracks'
            />

            <ActionMenu
                items={subtitleMenuItems}
                anchorEl={subtitleMenuAnchor}
                open={Boolean(subtitleMenuAnchor)}
                onClose={handleSubtitleMenuClose}
                onSelect={handleSubtitleTrackSelect}
                title='Subtitles'
            />
        </Box>
    );
};

export default RemoteControl;
