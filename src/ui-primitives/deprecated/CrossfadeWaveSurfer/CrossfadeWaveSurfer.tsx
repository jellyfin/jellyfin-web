/**
 * CrossfadeWaveSurfer - WaveSurfer Component with Crossfade Visualization
 *
 * @deprecated Use Waveform from 'ui-primitives/seek/Waveform' instead.
 * This component will be removed in a future version.
 */

import WavesurferPlayer from '@wavesurfer/react';
import { type ReactElement, useCallback, useEffect, useRef } from 'react';
import { useVisualizerStore } from 'store/visualizerStore';
import { vars } from 'styles/tokens.css.ts';
import type WaveSurfer from 'wavesurfer.js';
import {
    bufferedOverlay,
    bufferedSegment,
    container,
    crossfadingOverlay,
    crossfadingText
} from './CrossfadeWaveSurfer.css.ts';

export interface TrackState {
    readonly id: string;
    readonly url: string;
    readonly peaks?: readonly number[][];
    readonly color?: string;
}

export interface CrossfadeWaveSurferProps {
    readonly currentTrack: TrackState;
    readonly nextTrack?: TrackState | null;
    readonly duration: number;
    readonly buffered?: { readonly start: number; readonly end: number }[];
    readonly isCrossfading: boolean;
    readonly onSeek: (time: number) => void;
    readonly height?: number;
    readonly barWidth?: number;
    readonly barGap?: number;
    readonly className?: string;
}

export function CrossfadeWaveSurfer({
    currentTrack,
    nextTrack,
    duration,
    buffered = [],
    isCrossfading,
    onSeek,
    height = 60,
    barWidth = 2,
    barGap = 1,
    className
}: CrossfadeWaveSurferProps): ReactElement {
    const wsRef = useRef<WaveSurfer>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { crossfadeZoomLevel, userZoomLevel, showCrossfadeOverlap } = useVisualizerStore();

    const effectiveZoom =
        isCrossfading && showCrossfadeOverlap ? crossfadeZoomLevel : userZoomLevel;

    useEffect(() => {
        if (wsRef.current === null) return;
        wsRef.current.setOptions({
            minPxPerSec: effectiveZoom,
            autoScroll: !isCrossfading,
            autoCenter: !isCrossfading
        });
    }, [effectiveZoom, isCrossfading]);

    useEffect(() => {
        if (
            wsRef.current === null ||
            nextTrack === null ||
            nextTrack === undefined ||
            !isCrossfading ||
            !showCrossfadeOverlap
        )
            return;
        const overlay = document.getElementById('ws-crossfade-overlay');
        if (overlay !== null && document.getElementById(`ws-track-${nextTrack.id}`) === null) {
            const audio = document.createElement('audio');
            audio.id = `ws-track-${nextTrack.id}`;
            audio.src = nextTrack.url;
            audio.preload = 'metadata';
            overlay.appendChild(audio);
        }
    }, [isCrossfading, nextTrack, showCrossfadeOverlap]);

    const handleReady = useCallback((ws: WaveSurfer): void => {
        wsRef.current = ws;
    }, []);

    const handleSeek = useCallback(
        (ws: WaveSurfer): void => {
            onSeek(ws.getCurrentTime());
        },
        [onSeek]
    );

    const renderBuffered = (): ReactElement[] => {
        return buffered.map((range) => {
            const startPercent = (range.start / duration) * 100;
            const widthPercent = ((range.end - range.start) / duration) * 100;
            return (
                <div
                    key={`buffered-${range.start.toFixed(3)}-${range.end.toFixed(3)}`}
                    className={bufferedSegment}
                    style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`
                    }}
                />
            );
        });
    };

    return (
        <div className={`${container} ${className ?? ''}`} style={{ height }}>
            <div className={bufferedOverlay}>{renderBuffered()}</div>
            <div
                id="ws-crossfade-overlay"
                ref={containerRef}
                style={{ position: 'relative', zIndex: 1 }}
            >
                <WavesurferPlayer
                    url={currentTrack.url}
                    height={height}
                    waveColor={vars.colors.waveformWave}
                    progressColor={vars.colors.waveformProgress}
                    cursorColor={vars.colors.text}
                    cursorWidth={2}
                    barWidth={barWidth}
                    barGap={barGap}
                    barRadius={2}
                    fillParent={true}
                    minPxPerSec={effectiveZoom}
                    autoScroll={!isCrossfading}
                    autoCenter={!isCrossfading}
                    normalize={true}
                    interact={true}
                    hideScrollbar={true}
                    onReady={handleReady}
                    onClick={handleSeek}
                />
            </div>
            {isCrossfading && showCrossfadeOverlap && (
                <div className={crossfadingOverlay}>
                    <span className={crossfadingText}>Crossfading...</span>
                </div>
            )}
        </div>
    );
}
