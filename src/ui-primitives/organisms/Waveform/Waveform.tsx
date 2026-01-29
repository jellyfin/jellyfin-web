import WavesurferPlayer from '@wavesurfer/react';
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import type WaveSurfer from 'wavesurfer.js';
import { useVisualizerStore } from '../../../store/visualizerStore';
import { logger } from '../../../utils/logger';
import { waveformContainerStyle, waveformOverlayStyle } from './Waveform.css.ts';

export interface WaveformTrackState {
    readonly id: string;
    readonly url: string;
    readonly peaks?: readonly number[][];
    readonly color?: string;
}

export interface WaveformProps {
    readonly currentTrack: WaveformTrackState;
    readonly nextTrack?: WaveformTrackState | null;
    readonly duration: number;
    readonly currentTime: number;
    readonly buffered?: readonly { readonly start: number; readonly end: number }[];
    readonly isCrossfading: boolean;
    readonly onSeek: (time: number) => void;
    readonly height?: number;
    readonly hoverHeight?: number;
    readonly barWidth?: number | string;
    readonly barGap?: number | string;
    readonly className?: string;
}

export function Waveform({
    currentTrack,
    nextTrack,
    duration,
    currentTime,
    buffered = [],
    isCrossfading,
    onSeek,
    height = 60,
    hoverHeight = 80,
    barWidth = 2,
    barGap = 1,
    className
}: WaveformProps): ReactElement {
    const wsRef = useRef<WaveSurfer>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const { crossfadeZoomLevel, userZoomLevel, showCrossfadeOverlap } = useVisualizerStore();

    const effectiveZoom =
        isCrossfading && showCrossfadeOverlap ? crossfadeZoomLevel : userZoomLevel;

    useEffect((): void => {
        const wavesurfer = wsRef.current;
        if (wavesurfer === null) return;
        wavesurfer.setOptions({
            minPxPerSec: effectiveZoom
        });
    }, [effectiveZoom]);

    useEffect((): void => {
        const wavesurfer = wsRef.current;
        if (wavesurfer === null) return;

        const loadTrack = async (): Promise<void> => {
            try {
                if (currentTrack.peaks !== undefined && currentTrack.peaks.length > 0) {
                    await wavesurfer.load(currentTrack.url, currentTrack.peaks as number[][]);
                } else {
                    await wavesurfer.load(currentTrack.url);
                }
            } catch (error) {
                logger.error('Failed to load waveform:', { component: 'Waveform' }, error as Error);
            }
        };

        void loadTrack();
    }, [currentTrack]);

    useEffect((): void => {
        const wavesurfer = wsRef.current;
        if (wavesurfer === null || nextTrack === null || nextTrack === undefined) return;

        const loadNextTrack = async (): Promise<void> => {
            try {
                if (nextTrack.peaks !== undefined && nextTrack.peaks.length > 0) {
                    await wavesurfer.load(nextTrack.url, nextTrack.peaks as number[][]);
                } else {
                    await wavesurfer.load(nextTrack.url);
                }
            } catch (error) {
                logger.error(
                    'Failed to load next track waveform:',
                    { component: 'Waveform' },
                    error as Error
                );
            }
        };

        if (isCrossfading) {
            void loadNextTrack();
        }
    }, [isCrossfading, nextTrack]);

    const onReady = useCallback((): void => {
        const wavesurfer = wsRef.current;
        if (wavesurfer === null || duration === 0) return;

        const seekPosition = duration > 0 ? Math.min(1, currentTime / duration) : 0;
        wavesurfer.seekTo(seekPosition);

        if (isCrossfading && nextTrack !== null && nextTrack !== undefined) {
            wavesurfer.setOptions({
                height: isHovered ? hoverHeight : height
            });
        }
    }, [duration, currentTime, isCrossfading, nextTrack, isHovered, height, hoverHeight]);

    const onClick = useCallback(
        (waveform: WaveSurfer): void => {
            const waveDuration = waveform.getDuration();
            const relativeSeekPosition =
                waveDuration > 0 ? waveform.getCurrentTime() / waveDuration : 0;
            const seekTime = Math.min(duration, relativeSeekPosition * duration);
            onSeek(seekTime);
        },
        [duration, onSeek]
    );

    const handleMouseEnter = useCallback((): void => {
        setIsHovered(true);
        const wavesurfer = wsRef.current;
        if (wavesurfer !== null) {
            wavesurfer.setOptions({
                height: hoverHeight
            });
        }
    }, [hoverHeight]);

    const handleMouseLeave = useCallback((): void => {
        setIsHovered(false);
        const wavesurfer = wsRef.current;
        if (wavesurfer !== null) {
            wavesurfer.setOptions({
                height: height
            });
        }
    }, [height]);

    return (
        <div
            ref={containerRef}
            className={`${waveformContainerStyle} ${className ?? ''}`}
            role="presentation"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ height: isHovered ? hoverHeight : height }}
        >
            <WavesurferPlayer
                {...({
                    ref: wsRef,
                    container: containerRef.current as HTMLElement,
                    waveColor: vars.colors.primary,
                    progressColor: vars.colors.textSecondary,
                    cursorColor: 'transparent',
                    barWidth: barWidth,
                    barGap: barGap,
                    barRadius: vars.borderRadius.full,
                    height: isHovered ? hoverHeight : height,
                    normalize: true,
                    interact: true,
                    hideScrollbar: true,
                    onReady: onReady,
                    onClick: onClick,
                    options: {
                        minPxPerSec: effectiveZoom,
                        autoScroll: true,
                        autoCenter: true
                    }
                } as any)}
            />

            {buffered.length > 0 && (
                <div className={waveformOverlayStyle}>
                    {buffered.map((range) => {
                        const startPercent = (range.start / duration) * 100;
                        const widthPercent = ((range.end - range.start) / duration) * 100;
                        return (
                            <div
                                key={`buffered-${range.start.toFixed(3)}-${range.end.toFixed(3)}`}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: `${startPercent}%`,
                                    width: `${widthPercent}%`,
                                    bottom: 0,
                                    backgroundColor: vars.colors.textSecondary,
                                    opacity: 0.3,
                                    borderRadius: vars.borderRadius.md,
                                    overflow: 'hidden'
                                }}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
