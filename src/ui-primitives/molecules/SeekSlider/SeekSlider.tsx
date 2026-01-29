import { Range, Root, Thumb, Track } from '@radix-ui/react-slider';
import React, {
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    type ReactElement,
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react';
import { Waveform, type WaveformTrackState } from '../../organisms/Waveform/Waveform';
import {
    seekSliderBuffered,
    seekSliderContainer,
    seekSliderProgress,
    seekSliderThumb,
    seekSliderThumbSpinning,
    seekSliderThumbVisible,
    seekSliderTimeDisplay,
    seekSliderTrack,
    seekSliderTrackInner
} from './SeekSlider.css.ts';

export interface BufferedRange {
    readonly start: number;
    readonly end: number;
}

export interface SeekSliderProps {
    readonly value?: number;
    readonly currentTime?: number;
    readonly duration: number;
    readonly max?: number;

    readonly onSeek: (time: number) => void;
    readonly onSeekStart?: () => void;
    readonly onSeekEnd?: (time: number) => void;

    readonly bufferedRanges?: readonly BufferedRange[];
    readonly showTime?: boolean;
    readonly showThumb?: boolean;
    readonly showBuffer?: boolean;
    readonly height?: number;
    readonly thumbSize?: number;

    readonly enableWheel?: boolean;
    readonly enableKeyboard?: boolean;
    readonly spinOnSeek?: boolean;
    readonly wheelStep?: number;
    readonly keyboardStep?: number;

    readonly waveSurferCompatible?: boolean;
    readonly showWaveform?: boolean;
    readonly currentTrack?: WaveformTrackState;
    readonly nextTrack?: WaveformTrackState | null;
    readonly isCrossfading?: boolean;
    readonly _crossfadeProgress?: number;
    readonly barWidth?: number;
    readonly barGap?: number;
    readonly waveformHeight?: number;
    readonly waveformHoverHeight?: number;

    readonly style?: CSSProperties;
    readonly className?: string;
}

export function SeekSlider({
    value,
    currentTime,
    duration,
    max = 100,

    onSeek,
    onSeekStart,
    onSeekEnd,

    bufferedRanges = [],
    showTime = true,
    showThumb = true,
    showBuffer = true,
    height = 4,
    thumbSize = 12,

    enableWheel = true,
    enableKeyboard = true,
    spinOnSeek = true,
    wheelStep = 5,
    keyboardStep = 1,

    waveSurferCompatible = true,
    showWaveform = false,
    currentTrack,
    nextTrack,
    isCrossfading = false,
    _crossfadeProgress: _unusedProgress,
    barWidth = 2,
    barGap = 1,
    waveformHeight = 60,
    waveformHoverHeight = 80,

    style: styleProp,
    className
}: SeekSliderProps): ReactElement {
    const [isDragging, setIsDragging] = useState(false);
    const [localProgress, setLocalProgress] = useState(0);
    const [showThumbState, setShowThumbState] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const sliderRef = useRef<HTMLSpanElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const lastCommittedRef = useRef(0);

    const progress = duration > 0 ? (currentTime ?? value ?? 0) / duration : 0;

    useEffect((): void => {
        if (!isDragging) {
            setLocalProgress(progress);
            lastCommittedRef.current = progress;
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

    const handleValueChange = useCallback(
        (newValue: number[]): void => {
            const vol = newValue[0];
            const volProgress = max > 0 ? vol / max : 0;
            setLocalProgress(volProgress);
        },
        [max]
    );

    const handlePointerUp = useCallback((): void => {
        if (isDragging) {
            setIsDragging(false);

            if (localProgress !== lastCommittedRef.current) {
                const seekTime = localProgress * duration;
                onSeekEnd?.(seekTime);
                triggerSeek(localProgress);
                lastCommittedRef.current = localProgress;
            } else {
                onSeekEnd?.(currentTime ?? value ?? 0);
            }
        }
    }, [isDragging, localProgress, duration, currentTime, value, onSeekEnd, triggerSeek]);

    useEffect((): (() => void) => {
        const handleGlobalPointerUp = (): void => {
            handlePointerUp();
        };

        document.addEventListener('pointerup', handleGlobalPointerUp);
        return (): void => {
            document.removeEventListener('pointerup', handleGlobalPointerUp);
        };
    }, [handlePointerUp]);

    const handleClick = useCallback(
        (event: MouseEvent<HTMLDivElement>): void => {
            if (trackRef.current === null) return;
            const rect = trackRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const seekProgress = x / rect.width;
            triggerSeek(seekProgress);
        },
        [triggerSeek]
    );

    const handleMouseDown = useCallback(
        (event: MouseEvent<HTMLDivElement>): void => {
            event.preventDefault();
            setIsDragging(true);
            onSeekStart?.();
            setShowThumbState(true);

            const handleMouseMove = (moveEvent: globalThis.MouseEvent): void => {
                if (trackRef.current === null) return;
                const rect = trackRef.current.getBoundingClientRect();
                const x = moveEvent.clientX - rect.left;
                const seekProgress = Math.max(0, Math.min(1, x / rect.width));
                setLocalProgress(seekProgress);
            };

            const onMouseUp = (): void => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        },
        [onSeekStart]
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
        (event: globalThis.WheelEvent): void => {
            if (enableWheel === false) return;
            event.preventDefault();

            const isFineTune = event.ctrlKey || event.metaKey;
            const step = isFineTune ? wheelStep * 2 : wheelStep;
            const direction = event.deltaY > 0 ? -1 : 1;
            const newProgress = Math.max(0, Math.min(1, localProgress + (step / 100) * direction));
            setLocalProgress(newProgress);
            triggerSeek(newProgress);
        },
        [enableWheel, wheelStep, localProgress, triggerSeek]
    );

    useEffect((): (() => void) | void => {
        const sliderElement = sliderRef.current;
        if (sliderElement === null || enableWheel === false) return;

        sliderElement.addEventListener('wheel', handleWheel, { passive: false });

        return (): void => {
            sliderElement.removeEventListener('wheel', handleWheel);
        };
    }, [handleWheel, enableWheel]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent): void => {
            if (enableKeyboard === false) return;

            const step = keyboardStep / 100;
            const current = progress;

            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    onSeek(Math.max(0, current - step) * duration);
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    onSeek(Math.min(1, current + step) * duration);
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
        [enableKeyboard, keyboardStep, progress, duration, onSeek]
    );

    const renderBuffered = (): ReactElement[] => {
        if (duration === 0) return [];
        return bufferedRanges.map((range): ReactElement => {
            const startPercent = (range.start / duration) * 100;
            const widthPercent = ((range.end - range.start) / duration) * 100;
            return (
                <div
                    key={`buffered-${range.start.toFixed(3)}-${range.end.toFixed(3)}`}
                    className={seekSliderBuffered}
                    style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`
                    }}
                />
            );
        });
    };

    const currentDisplayTime = currentTime ?? value ?? 0;
    const sliderValue = localProgress * max;

    return (
        <div className={`${seekSliderContainer} ${className ?? ''}`} style={styleProp}>
            {showTime && (
                <div className={seekSliderTimeDisplay}>
                    <span>{formatTime(currentDisplayTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            )}

            {showWaveform && currentTrack !== undefined && (
                <Waveform
                    currentTrack={currentTrack}
                    nextTrack={nextTrack}
                    duration={duration}
                    currentTime={currentDisplayTime}
                    buffered={bufferedRanges}
                    isCrossfading={isCrossfading}
                    onSeek={onSeek}
                    height={waveformHeight}
                    hoverHeight={waveformHoverHeight}
                    barWidth={barWidth}
                    barGap={barGap}
                    className={waveSurferCompatible ? 'barSurfer' : undefined}
                />
            )}

            <div
                ref={trackRef}
                className={seekSliderTrack}
                role="slider"
                tabIndex={0}
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={currentDisplayTime}
                onClick={handleClick}
                onMouseDown={handleMouseDown}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onKeyDown={handleKeyDown}
            >
                <Root
                    ref={sliderRef}
                    className={seekSliderTrackInner}
                    value={[sliderValue]}
                    max={max}
                    step={0.1}
                    onValueChange={handleValueChange}
                    style={{ height }}
                >
                    <Track>
                        <Range
                            className={seekSliderProgress}
                            style={{ width: `${localProgress * 100}%` }}
                        />
                    </Track>

                    {showBuffer && renderBuffered()}

                    {showThumb && (
                        <Thumb
                            className={`${seekSliderThumb} ${showThumbState || isDragging ? seekSliderThumbVisible : ''} ${isSpinning ? seekSliderThumbSpinning : ''}`}
                            style={{
                                width: thumbSize,
                                height: thumbSize,
                                transform: 'translate(-50%, -50%)'
                            }}
                        />
                    )}
                </Root>
            </div>
        </div>
    );
}

export default SeekSlider;

export {
    seekSliderContainer,
    seekSliderTimeDisplay,
    seekSliderTrack,
    seekSliderTrackInner,
    seekSliderProgress,
    seekSliderBuffered,
    seekSliderThumb,
    seekSliderThumbVisible,
    seekSliderThumbSpinning
};
