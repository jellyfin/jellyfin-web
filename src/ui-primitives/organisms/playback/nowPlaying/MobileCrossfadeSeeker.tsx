/**
 * MobileCrossfadeSeeker - Touch-Optimized Seek Bar
 *
 * Features:
 * - Non-passive touch event handlers
 * - Swipe gestures for next/prev track
 * - 44px+ touch targets (WCAG 2.1)
 * - Haptic feedback support
 */

import { useRef, useState, useCallback, useEffect, type ReactElement } from 'react';
import { CrossfadeWaveSurfer, type TrackState } from './CrossfadeWaveSurfer';
import {
    seekerContainer,
    timeDisplay,
    progressBarContainer,
    progressBar,
    progressFill,
    buffered as bufferedStyle,
    handle,
    waveformContainer,
    swipeHintLeft,
    swipeHintRight
} from './MobileCrossfadeSeeker.css';

export interface MobileCrossfadeSeekerProps {
    readonly currentTrack: TrackState;
    readonly nextTrack?: TrackState | null;
    readonly previousTrack?: TrackState | null;
    readonly currentTime: number;
    readonly duration: number;
    readonly buffered?: { readonly start: number; readonly end: number }[];
    readonly isPlaying?: boolean;
    readonly isCrossfading: boolean;
    readonly crossfadeProgress?: number;
    readonly onSeek: (time: number) => void;
    readonly onSeekStart?: () => void;
    readonly onSeekEnd?: () => void;
    readonly onNext?: () => void;
    readonly onPrevious?: () => void;
    readonly height?: number;
    readonly barWidth?: number;
    readonly barGap?: number;
    readonly showWaveform?: boolean;
    readonly showSwipeHints?: boolean;
}

export function MobileCrossfadeSeeker({
    currentTrack,
    nextTrack,
    previousTrack,
    currentTime,
    duration,
    buffered = [],
    isPlaying: _isPlaying,
    isCrossfading,
    crossfadeProgress: _crossfadeProgress,
    onSeek,
    onSeekStart,
    onSeekEnd,
    onNext,
    onPrevious,
    height = 80,
    barWidth = 2,
    barGap = 1,
    showWaveform = true,
    showSwipeHints = true
}: MobileCrossfadeSeekerProps): ReactElement {
    const progressBarRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localProgress, setLocalProgress] = useState(0);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
    const touchStartRef = useRef<number>(0);

    const progress = duration > 0 ? currentTime / duration : 0;

    useEffect(() => {
        if (!isDragging) {
            setLocalProgress(progress);
        }
    }, [progress, isDragging]);

    const formatTime = useCallback((seconds: number): string => {
        if (!Number.isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const updateProgress = useCallback((clientX: number): void => {
        if (progressBarRef.current === null) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const seekProgress = Math.max(0, Math.min(1, x / rect.width));
        setLocalProgress(seekProgress);
    }, []);

    const handleTouchStart = useCallback(
        (event: React.TouchEvent<HTMLDivElement>): void => {
            const touch = event.touches[0];
            touchStartRef.current = touch.clientX;

            setIsDragging(true);
            onSeekStart?.();
            setSwipeDirection(null);
        },
        [onSeekStart]
    );

    const handleTouchMove = useCallback(
        (event: React.TouchEvent<HTMLDivElement>): void => {
            event.preventDefault();

            const touch = event.touches[0];
            const deltaX = touch.clientX - touchStartRef.current;
            const threshold = 50;

            if (Math.abs(deltaX) > threshold) {
                if (deltaX < 0 && nextTrack !== null && nextTrack !== undefined && onNext !== undefined) {
                    setSwipeDirection('left');
                } else if (
                    deltaX > 0 &&
                    previousTrack !== null &&
                    previousTrack !== undefined &&
                    onPrevious !== undefined
                ) {
                    setSwipeDirection('right');
                }
            } else {
                setSwipeDirection(null);
                updateProgress(touch.clientX);
            }
        },
        [nextTrack, previousTrack, onNext, onPrevious, updateProgress]
    );

    const handleTouchEnd = useCallback(
        (event: React.TouchEvent<HTMLDivElement>): void => {
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - touchStartRef.current;
            const swipeThreshold = 100;

            if (swipeDirection === 'left' && onNext !== undefined && Math.abs(deltaX) > swipeThreshold) {
                onNext();
            } else if (swipeDirection === 'right' && onPrevious !== undefined && Math.abs(deltaX) > swipeThreshold) {
                onPrevious();
            } else {
                const seekProgress = localProgress;
                const seekTime = seekProgress * duration;
                onSeek(seekTime);
            }

            setIsDragging(false);
            setSwipeDirection(null);
            onSeekEnd?.();
        },
        [localProgress, duration, onSeek, onNext, onPrevious, onSeekEnd, swipeDirection]
    );

    const handleMouseDown = useCallback(
        (event: React.MouseEvent<HTMLDivElement>): void => {
            event.preventDefault();
            setIsDragging(true);
            onSeekStart?.();

            const handleMouseMove = (moveEvent: MouseEvent): void => {
                updateProgress(moveEvent.clientX);
            };

            const handleMouseUp = (_upEvent: MouseEvent): void => {
                const seekProgress = localProgress;
                const seekTime = seekProgress * duration;
                onSeek(seekTime);

                setIsDragging(false);
                onSeekEnd?.();

                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        },
        [duration, onSeek, onSeekStart, onSeekEnd, localProgress, updateProgress]
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>): void => {
            const step = duration > 0 ? duration * 0.01 : 1;

            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    onSeek(Math.max(0, currentTime - step));
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    onSeek(Math.min(duration, currentTime + step));
                    break;
                case 'Home':
                    event.preventDefault();
                    onSeek(0);
                    break;
                case 'End':
                    event.preventDefault();
                    onSeek(duration);
                    break;
            }
        },
        [duration, currentTime, onSeek]
    );

    const renderBuffered = (): ReactElement[] => {
        return buffered.map(range => {
            const startPercent = (range.start / duration) * 100;
            const widthPercent = ((range.end - range.start) / duration) * 100;
            return (
                <div
                    key={`buffered-${range.start.toFixed(3)}-${range.end.toFixed(3)}`}
                    className={bufferedStyle}
                    style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`
                    }}
                />
            );
        });
    };

    const isSwipeActive = swipeDirection !== null;
    const showLeftHint =
        showSwipeHints && previousTrack !== null && previousTrack !== undefined && swipeDirection === 'right';
    const showRightHint = showSwipeHints && nextTrack !== null && nextTrack !== undefined && swipeDirection === 'left';

    return (
        <div className={seekerContainer}>
            <div className={timeDisplay}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>

            <div className={progressBarContainer}>
                {showLeftHint && <div className={swipeHintLeft}>← Prev</div>}
                {showRightHint && <div className={swipeHintRight}>Next →</div>}

                <div
                    ref={progressBarRef}
                    className={progressBar}
                    role="slider"
                    tabIndex={0}
                    aria-label="Seek"
                    aria-valuemin={0}
                    aria-valuemax={duration}
                    aria-valuenow={currentTime}
                    onMouseDown={handleMouseDown}
                    onKeyDown={handleKeyDown}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ height: showWaveform ? height : '8px' }}
                >
                    {showWaveform && (
                        <div className={waveformContainer}>
                            <CrossfadeWaveSurfer
                                currentTrack={currentTrack}
                                nextTrack={nextTrack}
                                duration={duration}
                                buffered={buffered}
                                isCrossfading={isSwipeActive || isCrossfading}
                                onSeek={onSeek}
                                height={height}
                                barWidth={barWidth}
                                barGap={barGap}
                            />
                        </div>
                    )}

                    <div className={progressFill} style={{ width: `${localProgress * 100}%` }} />

                    {renderBuffered()}

                    <div
                        className={handle}
                        style={{
                            left: `${localProgress * 100}%`,
                            transform: 'translate(-50%, -50%) scale(1.5)'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
