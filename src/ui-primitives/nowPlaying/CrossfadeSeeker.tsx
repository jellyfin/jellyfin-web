/**
 * CrossfadeSeeker - Seek Bar with Waveform Visualization
 *
 * @deprecated Use SeekSlider from 'ui-primitives/SeekSlider' with showWaveform=true instead.
 * This component will be removed in a future version.
 */

import { useRef, useState, useCallback, useEffect, type ReactElement } from 'react';
import { CrossfadeWaveSurfer, type TrackState } from './CrossfadeWaveSurfer';
import {
    seekerContainer,
    timeDisplay,
    progressBar,
    progressFill,
    buffered as bufferedStyle,
    handle,
    waveformContainer
} from './CrossfadeSeeker.css';

export interface CrossfadeSeekerProps {
    readonly currentTrack: TrackState;
    readonly nextTrack?: TrackState | null;
    readonly currentTime: number;
    readonly duration: number;
    readonly buffered?: { readonly start: number; readonly end: number }[];
    readonly isPlaying?: boolean;
    readonly isCrossfading: boolean;
    readonly crossfadeProgress?: number;
    readonly onSeek: (time: number) => void;
    readonly onSeekStart?: () => void;
    readonly onSeekEnd?: () => void;
    readonly height?: number;
    readonly barWidth?: number;
    readonly barGap?: number;
    readonly showWaveform?: boolean;
}

export function CrossfadeSeeker({
    currentTrack,
    nextTrack,
    currentTime,
    duration,
    buffered = [],
    isPlaying: _isPlaying,
    isCrossfading,
    crossfadeProgress: _crossfadeProgress,
    onSeek,
    onSeekStart,
    onSeekEnd,
    height = 60,
    barWidth = 2,
    barGap = 1,
    showWaveform = true
}: CrossfadeSeekerProps): ReactElement {
    const progressBarRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localProgress, setLocalProgress] = useState(0);
    const [showHandle, setShowHandle] = useState(false);

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

    const handleClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement>): void => {
            if (progressBarRef.current === null) return;
            const rect = progressBarRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const seekProgress = Math.max(0, Math.min(1, x / rect.width));
            const seekTime = seekProgress * duration;
            onSeek(seekTime);
        },
        [duration, onSeek]
    );

    const handleMouseDown = useCallback(
        (event: React.MouseEvent<HTMLDivElement>): void => {
            event.preventDefault();
            setIsDragging(true);
            onSeekStart?.();
            setShowHandle(true);

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
                const seekProgress = Math.max(0, Math.min(1, x / rect.width));
                const seekTime = seekProgress * duration;
                onSeek(seekTime);

                setIsDragging(false);
                onSeekEnd?.();
                setShowHandle(false);

                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        },
        [duration, onSeek, onSeekStart, onSeekEnd]
    );

    const handleMouseEnter = useCallback((): void => {
        setShowHandle(true);
    }, []);

    const handleMouseLeave = useCallback((): void => {
        if (!isDragging) {
            setShowHandle(false);
        }
    }, [isDragging]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>): void => {
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

    return (
        <div className={seekerContainer}>
            <div className={timeDisplay}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>

            <div
                ref={progressBarRef}
                className={progressBar}
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
                style={{ height: showWaveform ? height : '4px' }}
            >
                {showWaveform && (
                    <div className={waveformContainer}>
                        <CrossfadeWaveSurfer
                            currentTrack={currentTrack}
                            nextTrack={nextTrack}
                            duration={duration}
                            buffered={buffered}
                            isCrossfading={isCrossfading}
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
                        opacity: showHandle || isDragging ? 1 : 0
                    }}
                />
            </div>
        </div>
    );
}
