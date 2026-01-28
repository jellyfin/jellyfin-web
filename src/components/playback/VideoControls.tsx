import {
    DesktopIcon,
    DiscIcon,
    DotFilledIcon,
    DoubleArrowLeftIcon,
    DoubleArrowRightIcon,
    EnterFullScreenIcon,
    GearIcon,
    HeartFilledIcon,
    HeartIcon,
    PauseIcon,
    PlayIcon,
    ReaderIcon,
    ReloadIcon,
    RotateCounterClockwiseIcon,
    SpeakerLoudIcon,
    SpeakerOffIcon,
    TrackNextIcon,
    TrackPreviousIcon,
    ViewGridIcon
} from '@radix-ui/react-icons';
import { useKeyboard } from '@react-aria/interactions';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Box, Flex, IconButton, Slider, Text, Tooltip, VolumeSlider } from 'ui-primitives';
import {
    useEnhancedButtonFocus,
    useEnhancedFocus,
    useFocusTrap
} from '../../hooks/useEnhancedFocus';

// Enhanced Play/Pause Button with React ARIA focus
const EnhancedPlayPauseButton = React.forwardRef<
    HTMLButtonElement,
    {
        isPlaying: boolean;
        onClick: () => void;
    }
>(({ isPlaying, onClick }, ref) => {
    const { focusProps, focusRingStyles, buttonStyles } = useEnhancedButtonFocus({
        variant: 'primary',
        component: 'PlayPauseButton'
    });

    return (
        <button
            ref={ref}
            className="btnPause"
            onClick={onClick}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: vars.colors.text,
                position: 'relative',
                overflow: 'visible',
                ...focusRingStyles
            }}
            {...focusProps}
        >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
    );
});

EnhancedPlayPauseButton.displayName = 'EnhancedPlayPauseButton';

// Enhanced Seek Slider with React ARIA focus
const EnhancedSeekSlider: React.FC<{
    value: number;
    onChange: (value: number[]) => void;
    onCommit: (value: number[]) => void;
    duration: number;
    bufferedRanges: { start: number; end: number }[];
}> = ({ value, onChange, onCommit, duration, bufferedRanges }) => {
    const { focusProps, focusRingStyles } = useEnhancedFocus({
        focusColor: 'primary',
        component: 'SeekSlider'
    });

    return (
        <Box style={{ position: 'relative' }}>
            {/* Buffer overlay */}
            {bufferedRanges.length > 0 && (
                <Box
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: `${(bufferedRanges[0].start / duration) * 100}%`,
                        right: `${100 - (bufferedRanges[0].end / duration) * 100}%`,
                        height: 4,
                        background: 'rgba(255, 255, 255, 0.3)',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        zIndex: 1,
                        borderRadius: 1
                    }}
                />
            )}
            <Box style={focusRingStyles} onFocus={focusProps.onFocus} onBlur={focusProps.onBlur}>
                <Slider
                    className="osdPositionSlider"
                    value={[value]}
                    onValueChange={onChange}
                    onValueCommit={onCommit}
                    min={0}
                    max={100}
                />
            </Box>
        </Box>
    );
};

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
    hasChapters?: boolean;
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
    const controlsRef = useRef<HTMLDivElement>(null);
    const playPauseRef = useRef<HTMLButtonElement>(null);

    // Enhanced focus for the controls container
    const { focusProps: containerFocusProps, isFocusWithin } = useEnhancedFocus({
        trackFocusWithin: true,
        component: 'VideoControls'
    });

    // Focus trap for when controls are visible
    useEffect(() => {
        if (showControls && controlsRef.current) {
            const container = controlsRef.current;

            const focusableElements = container.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            const handleTabKey = (e: KeyboardEvent) => {
                if (e.key !== 'Tab') return;

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            };

            container.addEventListener('keydown', handleTabKey);
            return () => {
                container.removeEventListener('keydown', handleTabKey);
            };
        }
    }, [showControls]);

    // Global keyboard shortcuts for video controls
    useKeyboard({
        onKeyDown: (e) => {
            if (!showControls) return;

            switch (e.key) {
                case ' ':
                case 'Space':
                    e.preventDefault();
                    onPlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    onRewind();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    onFastForward();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    onVolumeChange(Math.min(volume + 0.1, 1));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    onVolumeChange(Math.max(volume - 0.1, 0));
                    break;
                case 'm':
                case 'M':
                    e.preventDefault();
                    onMuteToggle();
                    break;
                case 'f':
                case 'F':
                    if (canFullscreen && onFullscreenClick) {
                        e.preventDefault();
                        onFullscreenClick();
                    }
                    break;
                case 'j':
                case 'J':
                    e.preventDefault();
                    onRewind();
                    break;
                case 'l':
                case 'L':
                    e.preventDefault();
                    onFastForward();
                    break;
            }
        }
    });

    // Focus play/pause button when controls become visible
    useEffect(() => {
        if (showControls && playPauseRef.current && isFocusWithin) {
            playPauseRef.current.focus();
        }
    }, [showControls, isFocusWithin]);

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

    const handleSeekChange = useCallback((value: number[]) => {
        setIsSeeking(true);
        setLocalSeekValue(value[0] ?? 0);
    }, []);

    const handleSeekEnd = useCallback(
        (value: number[]) => {
            setIsSeeking(false);
            const seekTime = ((value[0] ?? 0) / 100) * duration;
            onSeekEnd(seekTime);
            onSeek(seekTime);
        },
        [duration, onSeek, onSeekEnd]
    );

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

    if (!showOsd) {
        return null;
    }

    return (
        <Box
            ref={controlsRef}
            className="videoOsdBottom"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                padding: '1rem',
                transition: 'opacity 0.3s ease-in-out',
                opacity: showOsd && showControls ? 1 : 0,
                pointerEvents: showOsd && showControls ? 'auto' : 'none',
                visibility: isVisible ? 'visible' : 'hidden'
            }}
            role="toolbar"
            aria-label="Video player controls"
            onFocus={containerFocusProps.onFocus}
            onBlur={containerFocusProps.onBlur}
        >
            <Box className="osdControls" style={{ maxWidth: 1200, margin: '0 auto' }}>
                {title != null && title !== '' && (
                    <Box
                        className="osdTextContainer osdMainTextContainer"
                        style={{ marginBottom: vars.spacing['4'] }}
                    >
                        <Text
                            weight="bold"
                            style={{
                                color: vars.colors.text,
                                fontSize: vars.typography['6'].fontSize
                            }}
                        >
                            {title}
                        </Text>
                    </Box>
                )}

                <Box
                    className="sliderContainer"
                    style={{ position: 'relative', marginBottom: vars.spacing['5'] }}
                >
                    <Box
                        className="sliderBufferOverlay"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left:
                                bufferedRanges.length > 0
                                    ? `${(bufferedRanges[0].start / duration) * 100}%`
                                    : '0%',
                            right:
                                bufferedRanges.length > 0
                                    ? `${100 - (bufferedRanges[0].end / duration) * 100}%`
                                    : '100%',
                            height: 4,
                            background: 'rgba(255, 255, 255, 0.3)',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            zIndex: 1,
                            borderRadius: 1
                        }}
                    />
                    <EnhancedSeekSlider
                        value={localSeekValue}
                        onChange={handleSeekChange}
                        onCommit={handleSeekEnd}
                        duration={duration}
                        bufferedRanges={bufferedRanges}
                    />
                </Box>

                <Flex
                    style={{
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: vars.spacing['4']
                    }}
                >
                    <Flex style={{ alignItems: 'center', gap: vars.spacing['2'] }}>
                        <Box
                            className="osdTextContainer startTimeText"
                            style={{
                                color: vars.colors.text,
                                fontSize: vars.typography['3'].fontSize,
                                minWidth: 50
                            }}
                        >
                            {formatTime(progress)}
                        </Box>

                        {onRecordClick && (
                            <Tooltip title="Record">
                                <IconButton
                                    className="btnRecord"
                                    size="sm"
                                    variant="plain"
                                    onClick={onRecordClick}
                                    style={{
                                        color: isRecording ? vars.colors.error : vars.colors.text,
                                        visibility: isRecording ? 'visible' : 'hidden'
                                    }}
                                >
                                    <DotFilledIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {onPreviousTrack && (
                            <Tooltip title="Previous Track (Shift+P)">
                                <IconButton
                                    className="btnPreviousTrack"
                                    size="sm"
                                    variant="plain"
                                    onClick={onPreviousTrack}
                                    style={{ color: vars.colors.text }}
                                >
                                    <TrackPreviousIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {onPreviousChapter && (
                            <Tooltip title="Previous Chapter (PageDown)">
                                <IconButton
                                    className="btnPreviousChapter"
                                    size="sm"
                                    variant="plain"
                                    onClick={onPreviousChapter}
                                    style={{ color: vars.colors.text }}
                                >
                                    <RotateCounterClockwiseIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title="Rewind (J)">
                            <IconButton
                                className="btnRewind"
                                size="md"
                                variant="plain"
                                onClick={onRewind}
                                style={{ color: vars.colors.text }}
                            >
                                <DoubleArrowLeftIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
                            <EnhancedPlayPauseButton
                                isPlaying={isPlaying}
                                onClick={onPlayPause}
                                ref={playPauseRef}
                            />
                        </Tooltip>

                        <Tooltip title="Fast Forward (L)">
                            <IconButton
                                className="btnFastForward"
                                size="md"
                                variant="plain"
                                onClick={onFastForward}
                                style={{ color: vars.colors.text }}
                            >
                                <DoubleArrowRightIcon />
                            </IconButton>
                        </Tooltip>

                        {onNextChapter && (
                            <Tooltip title="Next Chapter (PageUp)">
                                <IconButton
                                    className="btnNextChapter"
                                    size="sm"
                                    variant="plain"
                                    onClick={onNextChapter}
                                    style={{ color: vars.colors.text }}
                                >
                                    <ReloadIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {onNextTrack && (
                            <Tooltip title="Next Track (Shift+N)">
                                <IconButton
                                    className="btnNextTrack"
                                    size="sm"
                                    variant="plain"
                                    onClick={onNextTrack}
                                    style={{ color: vars.colors.text }}
                                >
                                    <TrackNextIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        <Box
                            className="osdTextContainer endTimeText"
                            style={{
                                color: vars.colors.text,
                                fontSize: vars.typography['3'].fontSize,
                                minWidth: 50
                            }}
                        >
                            {formatTime(duration)}
                        </Box>
                    </Flex>

                    <Flex style={{ alignItems: 'center', gap: vars.spacing['2'] }}>
                        {onFavoriteClick && (
                            <Tooltip title="Rate">
                                <IconButton
                                    className="btnUserRating"
                                    size="sm"
                                    variant="plain"
                                    onClick={onFavoriteClick}
                                    style={{ color: vars.colors.text }}
                                >
                                    {isFavorite ? <HeartFilledIcon /> : <HeartIcon />}
                                </IconButton>
                            </Tooltip>
                        )}

                        {onSubtitlesClick && (
                            <Tooltip title="Subtitles">
                                <IconButton
                                    className="btnSubtitles"
                                    size="sm"
                                    variant="plain"
                                    onClick={onSubtitlesClick}
                                    style={{
                                        color: vars.colors.text,
                                        visibility: hasSubtitles ? 'visible' : 'hidden'
                                    }}
                                >
                                    <ReaderIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {onAudioClick && (
                            <Tooltip title="Audio">
                                <IconButton
                                    className="btnAudio"
                                    size="sm"
                                    variant="plain"
                                    onClick={onAudioClick}
                                    style={{
                                        color: vars.colors.text,
                                        visibility: hasMultipleAudioTracks ? 'visible' : 'hidden'
                                    }}
                                >
                                    <DiscIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        <Box
                            className="volumeButtons"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: vars.spacing['2']
                            }}
                        >
                            <Tooltip title="Mute (M)">
                                <IconButton
                                    className="buttonMute"
                                    size="sm"
                                    variant="plain"
                                    onClick={onMuteToggle}
                                    style={{ color: vars.colors.text }}
                                >
                                    {isMuted ? <SpeakerOffIcon /> : <SpeakerLoudIcon />}
                                </IconButton>
                            </Tooltip>
                            <Box
                                className="sliderContainer osdVolumeSliderContainer"
                                style={{ width: 80, display: 'none' }}
                            >
                                <VolumeSlider
                                    volume={volume}
                                    muted={isMuted}
                                    onVolumeChange={onVolumeChange}
                                    onMuteToggle={onMuteToggle}
                                    size="sm"
                                    showSlider
                                />
                            </Box>
                        </Box>

                        {onSettingsClick && (
                            <Tooltip title="Settings">
                                <IconButton
                                    className="btnVideoOsdSettings"
                                    size="sm"
                                    variant="plain"
                                    onClick={onSettingsClick}
                                    style={{ color: vars.colors.text }}
                                >
                                    <GearIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {canAirPlay && onAirPlay && (
                            <Tooltip title="AirPlay">
                                <IconButton
                                    className="btnAirPlay"
                                    size="sm"
                                    variant="plain"
                                    onClick={onAirPlay}
                                    style={{ color: vars.colors.text }}
                                >
                                    <DesktopIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {canPiP && onPiPClick && (
                            <Tooltip title="Picture in Picture">
                                <IconButton
                                    className="btnPip"
                                    size="sm"
                                    variant="plain"
                                    onClick={onPiPClick}
                                    style={{ color: vars.colors.text }}
                                >
                                    <ViewGridIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {canFullscreen && onFullscreenClick && (
                            <Tooltip title="Fullscreen (F)">
                                <IconButton
                                    className="btnFullscreen"
                                    size="sm"
                                    variant="plain"
                                    onClick={onFullscreenClick}
                                    style={{ color: vars.colors.text }}
                                >
                                    <EnterFullScreenIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Flex>
                </Flex>
            </Box>
        </Box>
    );
};

export default VideoControls;
