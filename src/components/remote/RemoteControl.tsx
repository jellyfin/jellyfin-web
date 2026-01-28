import React, { useState, useCallback, useEffect } from 'react';
import { Box, Flex } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { IconButton } from 'ui-primitives';
import { Slider } from 'ui-primitives';
import { Avatar } from 'ui-primitives';
import { Tooltip } from 'ui-primitives';
import { Paper } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';

import {
    DesktopIcon,
    DiscIcon,
    EnterFullScreenIcon,
    HeartFilledIcon,
    HeartIcon,
    LoopIcon,
    PauseIcon,
    PlayIcon,
    ReaderIcon,
    ShuffleIcon,
    TrackNextIcon,
    TrackPreviousIcon,
    ViewGridIcon
} from '@radix-ui/react-icons';

import { VolumeSlider } from 'ui-primitives';
import { ActionMenu, type ActionMenuItem } from '../dialogs/ActionMenu';

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

    const handleSeekChange = useCallback((value: number[]) => {
        setLocalSeekValue(value[0] ?? 0);
    }, []);

    const handleSeekEnd = useCallback(
        (value: number[]) => {
            const seekTime = ((value[0] ?? 0) / 100) * duration;
            onSeek(seekTime);
        },
        [duration, onSeek]
    );

    const handleAudioMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAudioMenuAnchor(event.currentTarget);
    }, []);

    const handleAudioMenuClose = useCallback(() => {
        setAudioMenuAnchor(null);
    }, []);

    const handleAudioTrackSelect = useCallback(
        (id: string) => {
            const index = parseInt(id, 10);
            onAudioTrackSelect(index);
            handleAudioMenuClose();
        },
        [onAudioTrackSelect, handleAudioMenuClose]
    );

    const handleSubtitleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setSubtitleMenuAnchor(event.currentTarget);
    }, []);

    const handleSubtitleMenuClose = useCallback(() => {
        setSubtitleMenuAnchor(null);
    }, []);

    const handleSubtitleTrackSelect = useCallback(
        (id: string) => {
            const index = parseInt(id, 10);
            onSubtitleTrackSelect(index);
            handleSubtitleMenuClose();
        },
        [onSubtitleTrackSelect, handleSubtitleMenuClose]
    );

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
            className="remoteControlContent"
            style={{
                position: 'relative',
                width: '100%',
                maxWidth: 400,
                margin: '0 auto',
                padding: vars.spacing['6']
            }}
        >
            <Paper
                elevation="lg"
                style={{
                    borderRadius: vars.borderRadius.lg,
                    overflow: 'hidden',
                    backgroundColor: 'rgba(18, 18, 18, 0.95)',
                    backdropFilter: 'blur(20px)'
                }}
            >
                <Box style={{ padding: vars.spacing['6'] }}>
                    <Flex style={{ flexDirection: 'column', gap: vars.spacing['6'], alignItems: 'center' }}>
                        <Box className="nowPlayingPageImageContainer">
                            <Avatar
                                src={imageUrl || undefined}
                                style={{
                                    width: 200,
                                    height: 200,
                                    borderRadius: vars.borderRadius.md,
                                    boxShadow: vars.shadows.md,
                                    backgroundColor: imageUrl ? 'transparent' : vars.colors.surfaceHover
                                }}
                            >
                                {!imageUrl && <DiscIcon style={{ fontSize: 64, color: vars.colors.textSecondary }} />}
                            </Avatar>
                        </Box>

                        <Box className="nowPlayingInfoContainer" style={{ width: '100%', textAlign: 'center' }}>
                            <Text as="h4" size="lg" weight="bold" style={{ color: vars.colors.text }}>
                                {currentItem?.name || 'No track playing'}
                            </Text>
                            <Text size="md" color="secondary">
                                {currentItem?.artist || ''}
                            </Text>
                        </Box>

                        <Flex style={{ alignItems: 'center', gap: vars.spacing['4'], width: '100%' }}>
                            <Text size="xs" color="secondary" style={{ minWidth: 45 }}>
                                {formatTime(progress * 10000000)}
                            </Text>
                            <Slider
                                className="remotePositionSlider"
                                value={[localSeekValue]}
                                onValueChange={handleSeekChange}
                                onValueCommit={handleSeekEnd}
                                min={0}
                                max={100}
                                style={{ flex: 1 }}
                            />
                            <Text size="xs" color="secondary" style={{ minWidth: 45 }}>
                                {formatTime(duration * 10000000)}
                            </Text>
                        </Flex>

                        <Flex style={{ alignItems: 'center', justifyContent: 'center', gap: vars.spacing['5'] }}>
                            <IconButton
                                size="md"
                                variant="plain"
                                onClick={onShuffleToggle}
                                color={isShuffled ? 'primary' : 'neutral'}
                                aria-label="Shuffle"
                            >
                                <ShuffleIcon />
                            </IconButton>

                            <Tooltip title="Previous">
                                <IconButton size="md" variant="plain" onClick={onPreviousTrack} color="neutral">
                                    <TrackPreviousIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
                                <IconButton
                                    size="lg"
                                    variant="solid"
                                    onClick={onPlayPause}
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)'
                                    }}
                                    aria-label={isPlaying ? 'Pause' : 'Play'}
                                >
                                    {isPlaying ? (
                                        <PauseIcon style={{ fontSize: 28 }} />
                                    ) : (
                                        <PlayIcon style={{ fontSize: 28 }} />
                                    )}
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Next">
                                <IconButton size="md" variant="plain" onClick={onNextTrack} color="neutral">
                                    <TrackNextIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip
                                title={
                                    repeatMode === 'RepeatOne'
                                        ? 'Repeat One'
                                        : repeatMode === 'RepeatAll'
                                          ? 'Repeat All'
                                          : 'Repeat'
                                }
                            >
                                <IconButton
                                    size="md"
                                    variant="plain"
                                    onClick={onRepeatToggle}
                                    color={repeatMode !== 'RepeatNone' ? 'primary' : 'neutral'}
                                    aria-label="Repeat"
                                >
                                    <LoopIcon />
                                </IconButton>
                            </Tooltip>
                        </Flex>

                        <Flex
                            style={{
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: vars.spacing['4'],
                                width: '100%'
                            }}
                        >
                            <Flex style={{ alignItems: 'center', gap: vars.spacing['2'] }}>
                                <Tooltip title="Favorite">
                                    <IconButton
                                        size="sm"
                                        variant="plain"
                                        onClick={onFavoriteToggle}
                                        color={isFavorite ? 'danger' : 'neutral'}
                                    >
                                        {isFavorite ? <HeartFilledIcon /> : <HeartIcon />}
                                    </IconButton>
                                </Tooltip>

                                {hasMultipleAudioTracks && (
                                    <Tooltip title="Audio Tracks">
                                        <IconButton
                                            size="sm"
                                            variant="plain"
                                            onClick={handleAudioMenuOpen}
                                            color="neutral"
                                        >
                                            <DiscIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}

                                {hasSubtitles && (
                                    <Tooltip title="Subtitles">
                                        <IconButton
                                            size="sm"
                                            variant="plain"
                                            onClick={handleSubtitleMenuOpen}
                                            color="neutral"
                                        >
                                            <ReaderIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Flex>

                            <Flex style={{ alignItems: 'center' }}>
                                <VolumeSlider
                                    volume={isMuted ? 0 : volume}
                                    muted={isMuted}
                                    onVolumeChange={onVolumeChange}
                                    onMuteToggle={onMuteToggle}
                                    size="sm"
                                    showSlider
                                    style={{ width: 80 }}
                                />
                            </Flex>

                            <Flex style={{ alignItems: 'center', gap: vars.spacing['2'] }}>
                                {canAirPlay && (
                                    <Tooltip title="AirPlay">
                                        <IconButton size="sm" variant="plain" onClick={onAirPlay} color="neutral">
                                            <DesktopIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}

                                {canPiP && (
                                    <Tooltip title="Picture in Picture">
                                        <IconButton size="sm" variant="plain" onClick={onPiP} color="neutral">
                                            <ViewGridIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}

                                {canFullscreen && (
                                    <Tooltip title="Fullscreen">
                                        <IconButton size="sm" variant="plain" onClick={onFullscreen} color="neutral">
                                            <EnterFullScreenIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Flex>
                        </Flex>
                    </Flex>
                </Box>
            </Paper>

            <ActionMenu
                items={audioMenuItems}
                anchorEl={audioMenuAnchor}
                open={Boolean(audioMenuAnchor)}
                onClose={handleAudioMenuClose}
                onSelect={handleAudioTrackSelect}
                title="Audio Tracks"
            />

            <ActionMenu
                items={subtitleMenuItems}
                anchorEl={subtitleMenuAnchor}
                open={Boolean(subtitleMenuAnchor)}
                onClose={handleSubtitleMenuClose}
                onSelect={handleSubtitleTrackSelect}
                title="Subtitles"
            />
        </Box>
    );
};

export default RemoteControl;
