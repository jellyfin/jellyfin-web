/**
 * @deprecated Use SeekSlider from 'ui-primitives/SeekSlider' instead.
 * This component will be removed in a future version.
 *
 * Seeker is now unified into SeekSlider which provides:
 * - Radix UI Slider base for consistent interaction
 * - Time display (enabled by default)
 * - Wheel scroll (enabled by default)
 * - Keyboard navigation (enabled by default)
 * - Spin animation (enabled by default)
 * - Buffered ranges visualization
 * - Optional waveform background
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    seekerContainer,
    seekerTimeDisplay,
    seekerTrack,
    seekerProgress,
    seekerBuffered,
    seekerThumb,
    seekerThumbVisible,
    seekerThumbSpinning
} from './Seeker.css';

export interface BufferedRange {
    readonly start: number;
    readonly end: number;
}

export interface SeekerProps {
    readonly currentTime: number;
    readonly duration: number;
    readonly buffered?: readonly BufferedRange[];
    readonly onSeek: (time: number) => void;
    readonly onSeekStart?: () => void;
    readonly onSeekEnd?: () => void;
    readonly showTime?: boolean;
    readonly height?: number;
    readonly showThumb?: boolean;
    readonly spinOnSeek?: boolean;
    readonly style?: React.CSSProperties;
}

export function Seeker({
    currentTime,
    duration,
    buffered = [],
    onSeek,
    onSeekStart,
    onSeekEnd,
    showTime = true,
    height = 4,
    showThumb = true,
    spinOnSeek = false,
    style: styleProp
}: SeekerProps): React.ReactElement {
    const [isDragging, setIsDragging] = useState(false);
    const [localProgress, setLocalProgress] = useState(0);
    const [showThumbState, setShowThumbState] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const progressBarRef = useRef<HTMLDivElement>(null);

    const progress = duration > 0 ? currentTime / duration : 0;

    useEffect((): void => {
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

    const triggerSeek = useCallback(
        (seekProgress: number): void => {
            const clampedProgress = Math.max(0, Math.min(1, seekProgress));
            const seekTime = clampedProgress * duration;
            onSeek(seekTime);

            if (spinOnSeek) {
                setIsSpinning(true);
                setTimeout((): void => setIsSpinning(false), 400);
            }
        },
        [duration, onSeek, spinOnSeek]
    );

    const handleClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement>): void => {
            if (progressBarRef.current === null) return;
            const rect = progressBarRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const seekProgress = x / rect.width;
            triggerSeek(seekProgress);
        },
        [triggerSeek]
    );

    const handleMouseDown = useCallback(
        (event: React.MouseEvent<HTMLDivElement>): void => {
            event.preventDefault();
            setIsDragging(true);
            onSeekStart?.();
            setShowThumbState(true);

            const handleMouseMove = (moveEvent: MouseEvent): void => {
                if (progressBarRef.current === null) return;
                const rect = progressBarRef.current.getBoundingClientRect();
                const x = moveEvent.clientX - rect.left;
                const seekProgress = Math.max(0, Math.min(1, x / rect.width));
                setLocalProgress(seekProgress);
            };

            const handleMouseUp = (upEvent: MouseEvent): void => {
                if (progressBarRef.current === null) return;
                const rect = progressBarRef.current.getBoundingClientRect();
                const x = upEvent.clientX - rect.left;
                const seekProgress = x / rect.width;
                triggerSeek(seekProgress);

                setIsDragging(false);
                onSeekEnd?.();
                setShowThumbState(false);

                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        },
        [onSeekStart, onSeekEnd, triggerSeek]
    );

    const handleMouseEnter = useCallback((): void => {
        setShowThumbState(true);
    }, []);

    const handleMouseLeave = useCallback((): void => {
        if (!isDragging) {
            setShowThumbState(false);
        }
    }, [isDragging]);

    const handleWheel = useCallback(
        (event: WheelEvent): void => {
            event.preventDefault();

            if (progressBarRef.current === null) return;

            const isFineTune = event.ctrlKey || event.metaKey;
            const step = isFineTune ? 0.1 : 0.05;
            const direction = event.deltaY > 0 ? -1 : 1;
            const newProgress = Math.max(0, Math.min(1, localProgress + step * direction));
            setLocalProgress(newProgress);
            triggerSeek(newProgress);
        },
        [localProgress, triggerSeek]
    );

    useEffect((): (() => void) | void => {
        const progressBarElement = progressBarRef.current;
        if (progressBarElement === null) return;

        progressBarElement.addEventListener('wheel', handleWheel, { passive: false });

        return (): void => {
            progressBarElement.removeEventListener('wheel', handleWheel);
        };
    }, [handleWheel]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent): void => {
            const step = duration > 0 ? duration * 0.01 : 1;
            const current = currentTime;

            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    onSeek(Math.max(0, current - step));
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    onSeek(Math.min(duration, current + step));
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

    const renderBuffered = (): React.ReactElement[] => {
        return buffered.map((range): React.ReactElement => {
            const startPercent = (range.start / duration) * 100;
            const widthPercent = ((range.end - range.start) / duration) * 100;
            return (
                <div
                    key={`buffered-${range.start.toFixed(3)}-${range.end.toFixed(3)}`}
                    className={seekerBuffered}
                    style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`
                    }}
                />
            );
        });
    };

    return (
        <div className={seekerContainer} style={styleProp}>
            {showTime && (
                <div className={seekerTimeDisplay}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            )}

            <div
                ref={progressBarRef}
                className={seekerTrack}
                role='slider'
                tabIndex={0}
                aria-label='Seek'
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={currentTime}
                onClick={handleClick}
                onMouseDown={handleMouseDown}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onKeyDown={handleKeyDown}
                style={{ height }}
            >
                <div className={seekerProgress} style={{ width: `${localProgress * 100}%` }} />

                {renderBuffered()}

                {showThumb && (
                    <div
                        className={`${seekerThumb} ${showThumbState || isDragging ? seekerThumbVisible : ''} ${isSpinning ? seekerThumbSpinning : ''}`}
                        style={{ left: `${localProgress * 100}%` }}
                    />
                )}
            </div>
        </div>
    );
}

export {
    seekerContainer,
    seekerTimeDisplay,
    seekerTrack,
    seekerProgress,
    seekerBuffered,
    seekerThumb,
    seekerThumbVisible,
    seekerThumbSpinning
};

export default Seeker;
