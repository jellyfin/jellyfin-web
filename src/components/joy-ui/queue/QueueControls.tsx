import React, { useEffect, useState } from 'react';
import { Box, Flex } from 'ui-primitives/Box';
import { IconButton } from 'ui-primitives/IconButton';
import { Text } from 'ui-primitives/Text';
import { Tooltip } from 'ui-primitives/Tooltip';
import { vars } from 'styles/tokens.css';

import {
    DoubleArrowLeftIcon,
    DoubleArrowRightIcon,
    LoopIcon,
    PauseIcon,
    PlayIcon,
    ShuffleIcon,
    StopIcon,
    TrackNextIcon,
    TrackPreviousIcon
} from '@radix-ui/react-icons';

import { VolumeSlider } from 'ui-primitives/VolumeSlider';
import { SeekSlider } from 'ui-primitives/SeekSlider';

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
            return <LoopIcon />;
        case 'RepeatAll':
            return <LoopIcon />;
        default:
            return <LoopIcon />;
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
    onRepeatToggle
}) => {
    const [localSeekValue, setLocalSeekValue] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);

    useEffect(() => {
        if (!isSeeking && duration > 0) {
            setLocalSeekValue((currentTime / duration) * 100);
        }
    }, [currentTime, duration, isSeeking]);

    const progress = duration > 0 ? (localSeekValue / 100) * duration : 0;

    return (
        <Box
            className="nowPlayingButtonsContainer"
            data-testid="queue-controls"
            style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing.md }}
        >
            <Flex style={{ alignItems: 'center', gap: vars.spacing.sm, marginBottom: vars.spacing.sm }}>
                <Box className="positionTime" style={{ minWidth: 45, textAlign: 'right' }}>
                    <Text size="xs" color="secondary">
                        {formatTime(progress)}
                    </Text>
                </Box>
                <Box
                    className="nowPlayingPositionSliderContainer"
                    style={{ flex: 1, margin: `0 ${vars.spacing.sm}`, position: 'relative' }}
                >
                    <Box
                        className="sliderBufferOverlay"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: bufferedRanges.length > 0 ? `${(bufferedRanges[0].start / duration) * 100}%` : '0%',
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
                    <SeekSlider
                        currentTime={progress}
                        duration={duration}
                        onSeek={onSeek}
                        onSeekStart={() => setIsSeeking(true)}
                        onSeekEnd={time => {
                            setIsSeeking(false);
                            onSeekEnd?.(time);
                        }}
                        bufferedRanges={bufferedRanges}
                        height={4}
                        showTime={false}
                        style={{ width: '100%' }}
                    />
                </Box>
                <Box className="runtime" style={{ minWidth: 45 }}>
                    <Text size="xs" color="secondary">
                        {formatTime(duration)}
                    </Text>
                </Box>
            </Flex>

            <Flex
                style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: vars.spacing.sm
                }}
            >
                <Flex style={{ alignItems: 'center', gap: vars.spacing.xs }}>
                    <Tooltip title={getRepeatAriaLabel(repeatMode)}>
                        <IconButton
                            className="btnRepeat repeatToggleButton"
                            size="md"
                            onClick={onRepeatToggle}
                            variant="plain"
                            color={repeatMode !== 'RepeatNone' ? 'primary' : 'neutral'}
                        >
                            {getRepeatIcon(repeatMode)}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Rewind (J)">
                        <IconButton
                            className="btnRewind btnNowPlayingRewind"
                            size="md"
                            variant="plain"
                            onClick={onRewind}
                            color="neutral"
                        >
                            <DoubleArrowLeftIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Previous Track">
                        <IconButton
                            className="btnPreviousTrack"
                            size="md"
                            variant="plain"
                            onClick={onPreviousTrack}
                            color="neutral"
                        >
                            <TrackPreviousIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
                        <IconButton
                            className="btnPlayPause"
                            size="lg"
                            variant="solid"
                            onClick={onPlayPause}
                            style={{
                                margin: `0 ${vars.spacing.sm}`,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Stop">
                        <IconButton className="btnStop" size="md" variant="plain" onClick={onStop} color="neutral">
                            <StopIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Next Track">
                        <IconButton
                            className="btnNextTrack"
                            size="md"
                            variant="plain"
                            onClick={onNextTrack}
                            color="neutral"
                        >
                            <TrackNextIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Fast Forward (L)">
                        <IconButton
                            className="btnFastForward btnNowPlayingFastForward"
                            size="md"
                            variant="plain"
                            onClick={onFastForward}
                            color="neutral"
                        >
                            <DoubleArrowRightIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={isShuffled ? 'Shuffle On' : 'Shuffle'}>
                        <IconButton
                            className="btnShuffleQueue"
                            size="md"
                            variant="plain"
                            onClick={onShuffleToggle}
                            color={isShuffled ? 'primary' : 'neutral'}
                        >
                            <ShuffleIcon />
                        </IconButton>
                    </Tooltip>
                </Flex>

                <Flex style={{ alignItems: 'center', gap: vars.spacing.xs }}>
                    <VolumeSlider
                        volume={isMuted ? 0 : volume}
                        muted={isMuted}
                        onVolumeChange={onVolumeChange}
                        onMuteToggle={onMuteToggle}
                        size="sm"
                        style={{ width: 100 }}
                    />
                </Flex>
            </Flex>
        </Box>
    );
};

export default QueueControls;
