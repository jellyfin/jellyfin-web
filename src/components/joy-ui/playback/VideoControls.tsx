import React, { useState, useEffect, useCallback, useRef } from 'react';
import Box from '@mui/material/Box/Box';
import Slider from '@mui/joy/Slider';
import IconButton from '@mui/joy/IconButton';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography/Typography';
import Tooltip from '@mui/joy/Tooltip';
import Fade from '@mui/material/Fade/Fade';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import FastForwardIcon from '@mui/icons-material/FastForward';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import SettingsIcon from '@mui/icons-material/Settings';
import AirplayIcon from '@mui/icons-material/Airplay';
import PictureInPictureAltIcon from '@mui/icons-material/PictureInPictureAlt';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

import { VolumeSlider } from './VolumeSlider';

export interface VideoControlsProps {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    title?: string;
    isRecording?: boolean;
    hasSubtitles?: boolean;
    hasMultipleAudioTracks?: boolean;
    isFavorite?: boolean;
    canAirPlay?: boolean;
    canPiP?: boolean;
    canFullscreen?: boolean;
    bufferedRanges?: { start: number; end: number }[];
    onPlayPause: () => void;
    onSeek: (time: number) => void;
    onSeekEnd: (time: number) => void;
    onVolumeChange: (volume: number) => void;
    onMuteToggle: () => void;
    onRewind: () => void;
    onFastForward: () => void;
    onPreviousTrack?: () => void;
    onNextTrack?: () => void;
    onPreviousChapter?: () => void;
    onNextChapter?: () => void;
    onSubtitlesClick?: () => void;
    onAudioClick?: () => void;
    onSettingsClick?: () => void;
    onAirPlay?: () => void;
    onPiPClick?: () => void;
    onFullscreenClick?: () => void;
    onFavoriteClick?: () => void;
    onRecordClick?: () => void;
    isVisible?: boolean;
    showOsd?: boolean;
}

const formatTime = (seconds: number): string => {
    if (seconds === 0 || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const VideoControls: React.FC<VideoControlsProps> = ({
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    title,
    isRecording = false,
    hasSubtitles = false,
    hasMultipleAudioTracks = false,
    isFavorite = false,
    canAirPlay = false,
    canPiP = false,
    canFullscreen = true,
    bufferedRanges = [],
    onPlayPause,
    onSeek,
    onSeekEnd,
    onVolumeChange,
    onMuteToggle,
    onRewind,
    onFastForward,
    onPreviousTrack,
    onNextTrack,
    onPreviousChapter,
    onNextChapter,
    onSubtitlesClick,
    onAudioClick,
    onSettingsClick,
    onAirPlay,
    onPiPClick,
    onFullscreenClick,
    onFavoriteClick,
    onRecordClick,
    isVisible = true,
    showOsd = true
}) => {
    const [localSeekValue, setLocalSeekValue] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseLeave = useCallback(() => {
        if (isPlaying) {
            setShowControls(false);
        }
    }, [isPlaying]);

    useEffect(() => {
        if (isPlaying) {
            setShowControls(false);
            const timeout = setTimeout(() => {
                setShowControls(true);
            }, 3000);
            controlsTimeoutRef.current = timeout;
            return () => clearTimeout(timeout);
        }
        setShowControls(true);
    }, [isPlaying]);

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

    const handleMouseMove = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    }, [isPlaying]);

    const progress = duration > 0 ? (localSeekValue / 100) * duration : 0;

    return (
        <Box
            className='videoOsdBottom'
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                padding: '1rem',
                transition: 'opacity 0.3s ease-in-out',
                opacity: (showOsd && showControls) ? 1 : 0,
                pointerEvents: (showOsd && showControls) ? 'auto' : 'none',
                visibility: isVisible ? 'visible' : 'hidden'
            }}
        >
            <Fade in={showOsd && showControls} timeout={300}>
                <Box className='osdControls' sx={{ maxWidth: 1200, margin: '0 auto' }}>
                    {title != null && title !== '' && (
                        <Box className='osdTextContainer osdMainTextContainer' sx={{ mb: 1 }}>
                            <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem' }}>
                                {title}
                            </Typography>
                        </Box>
                    )}

                    <Box
                        className='sliderContainer'
                        sx={{ position: 'relative', mb: 2 }}
                    >
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
                        <Slider
                            className='osdPositionSlider'
                            value={localSeekValue}
                            onChange={handleSeekChange}
                            onChangeCommitted={handleSeekEnd}
                            min={0}
                            max={100}
                            size='sm'
                            sx={{
                                '--Slider-thumb-size': '14px',
                                '--Slider-track-height': '4px',
                                color: 'white',
                                '&:hover': {
                                    color: 'white'
                                }
                            }}
                        />
                    </Box>

                    <Stack
                        direction='row'
                        spacing={1}
                        alignItems='center'
                        justifyContent='space-between'
                        sx={{ flexWrap: 'wrap', gap: 1 }}
                    >
                        <Stack direction='row' spacing={0.5} alignItems='center'>
                            <Box className='osdTextContainer startTimeText' sx={{ color: 'white', fontSize: '0.875rem', minWidth: 50 }}>
                                {formatTime(progress)}
                            </Box>

                            {onRecordClick && (
                                <Tooltip title='Record' arrow>
                                    <IconButton
                                        className='btnRecord'
                                        size='sm'
                                        variant='plain'
                                        onClick={onRecordClick}
                                        sx={{
                                            color: isRecording ? 'error.main' : 'white',
                                            visibility: isRecording ? 'visible' : 'hidden'
                                        }}
                                    >
                                        <FiberManualRecordIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {onPreviousTrack && (
                                <Tooltip title='Previous Track (Shift+P)' arrow>
                                    <IconButton
                                        className='btnPreviousTrack'
                                        size='sm'
                                        variant='plain'
                                        onClick={onPreviousTrack}
                                        sx={{ color: 'white' }}
                                    >
                                        <SkipPreviousIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {onPreviousChapter && (
                                <Tooltip title='Previous Chapter (PageDown)' arrow>
                                    <IconButton
                                        className='btnPreviousChapter'
                                        size='sm'
                                        variant='plain'
                                        onClick={onPreviousChapter}
                                        sx={{ color: 'white' }}
                                    >
                                        <UndoIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            <Tooltip title='Rewind (J)' arrow>
                                <IconButton
                                    className='btnRewind'
                                    size='md'
                                    variant='plain'
                                    onClick={onRewind}
                                    sx={{ color: 'white' }}
                                >
                                    <FastRewindIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={isPlaying ? 'Pause' : 'Play'} arrow>
                                <IconButton
                                    className='btnPause'
                                    size='lg'
                                    variant='solid'
                                    color='primary'
                                    onClick={onPlayPause}
                                    sx={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.3)'
                                        }
                                    }}
                                >
                                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                                </IconButton>
                            </Tooltip>

                            <Tooltip title='Fast Forward (L)' arrow>
                                <IconButton
                                    className='btnFastForward'
                                    size='md'
                                    variant='plain'
                                    onClick={onFastForward}
                                    sx={{ color: 'white' }}
                                >
                                    <FastForwardIcon />
                                </IconButton>
                            </Tooltip>

                            {onNextChapter && (
                                <Tooltip title='Next Chapter (PageUp)' arrow>
                                    <IconButton
                                        className='btnNextChapter'
                                        size='sm'
                                        variant='plain'
                                        onClick={onNextChapter}
                                        sx={{ color: 'white' }}
                                    >
                                        <RedoIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {onNextTrack && (
                                <Tooltip title='Next Track (Shift+N)' arrow>
                                    <IconButton
                                        className='btnNextTrack'
                                        size='sm'
                                        variant='plain'
                                        onClick={onNextTrack}
                                        sx={{ color: 'white' }}
                                    >
                                        <SkipNextIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            <Box className='osdTextContainer endTimeText' sx={{ color: 'white', fontSize: '0.875rem', minWidth: 50 }}>
                                {formatTime(duration)}
                            </Box>
                        </Stack>

                        <Stack direction='row' spacing={0.5} alignItems='center'>
                            {onFavoriteClick && (
                                <Tooltip title='Rate' arrow>
                                    <IconButton
                                        className='btnUserRating'
                                        size='sm'
                                        variant='plain'
                                        onClick={onFavoriteClick}
                                        sx={{ color: 'white' }}
                                    >
                                        {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                    </IconButton>
                                </Tooltip>
                            )}

                            {onSubtitlesClick && (
                                <Tooltip title='Subtitles' arrow>
                                    <IconButton
                                        className='btnSubtitles'
                                        size='sm'
                                        variant='plain'
                                        onClick={onSubtitlesClick}
                                        sx={{
                                            color: 'white',
                                            visibility: hasSubtitles ? 'visible' : 'hidden'
                                        }}
                                    >
                                        <ClosedCaptionIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {onAudioClick && (
                                <Tooltip title='Audio' arrow>
                                    <IconButton
                                        className='btnAudio'
                                        size='sm'
                                        variant='plain'
                                        onClick={onAudioClick}
                                        sx={{
                                            color: 'white',
                                            visibility: hasMultipleAudioTracks ? 'visible' : 'hidden'
                                        }}
                                    >
                                        <AudiotrackIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            <Box className='volumeButtons' sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Tooltip title='Mute (M)' arrow>
                                    <IconButton
                                        className='buttonMute'
                                        size='sm'
                                        variant='plain'
                                        onClick={onMuteToggle}
                                        sx={{ color: 'white' }}
                                    >
                                        {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                                    </IconButton>
                                </Tooltip>
                                <Box className='sliderContainer osdVolumeSliderContainer' sx={{ width: 80, display: 'none' }}>
                                    <VolumeSlider
                                        volume={volume}
                                        muted={isMuted}
                                        onVolumeChange={onVolumeChange}
                                        onMuteToggle={onMuteToggle}
                                        size='sm'
                                        showSlider
                                        sx={{ color: 'white' }}
                                    />
                                </Box>
                            </Box>

                            {onSettingsClick && (
                                <Tooltip title='Settings' arrow>
                                    <IconButton
                                        className='btnVideoOsdSettings'
                                        size='sm'
                                        variant='plain'
                                        onClick={onSettingsClick}
                                        sx={{ color: 'white' }}
                                    >
                                        <SettingsIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {canAirPlay && onAirPlay && (
                                <Tooltip title='AirPlay' arrow>
                                    <IconButton
                                        className='btnAirPlay'
                                        size='sm'
                                        variant='plain'
                                        onClick={onAirPlay}
                                        sx={{ color: 'white' }}
                                    >
                                        <AirplayIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {canPiP && onPiPClick && (
                                <Tooltip title='Picture in Picture' arrow>
                                    <IconButton
                                        className='btnPip'
                                        size='sm'
                                        variant='plain'
                                        onClick={onPiPClick}
                                        sx={{ color: 'white' }}
                                    >
                                        <PictureInPictureAltIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {canFullscreen && onFullscreenClick && (
                                <Tooltip title='Fullscreen (F)' arrow>
                                    <IconButton
                                        className='btnFullscreen'
                                        size='sm'
                                        variant='plain'
                                        onClick={onFullscreenClick}
                                        sx={{ color: 'white' }}
                                    >
                                        <FullscreenIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Stack>
                    </Stack>
                </Box>
            </Fade>
        </Box>
    );
};

export default VideoControls;
