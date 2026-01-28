/**
 * WaveformCell - Waveform visualization for track progress
 */

import { useEffect, useRef, useCallback, useMemo, type ReactElement } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { container, emptyState, timeText, canvas } from './WaveformCell.css.ts';

export interface WaveformCellProps {
    readonly peaks?: readonly number[][];
    readonly duration?: number;
    readonly currentTime?: number;
    readonly height?: number;
    readonly barWidth?: number;
    readonly barGap?: number;
    readonly waveColor?: string;
    readonly progressColor?: string;
}

function formatDuration(ticks?: number): string {
    if (ticks === undefined || ticks <= 0) return '--:--';
    const seconds = ticks / 10000000;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function WaveformCell({
    peaks,
    duration,
    currentTime = 0,
    height = 40,
    barWidth = 2,
    barGap = 1,
    waveColor = vars.colors.waveformWave,
    progressColor = vars.colors.waveformProgress
}: WaveformCellProps): ReactElement {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasSizeRef = useRef<{ width: number; height: number } | null>(null);
    const lastProgressRef = useRef<number>(0);
    const lastDrawTimeRef = useRef<number>(0);

    const shouldShowWaveform = peaks !== undefined && peaks.length > 0 && peaks[0].length > 0;

    // Memoize bar configuration to prevent unnecessary calculations
    const barConfig = useMemo(
        () => ({ barWidth, barGap, waveColor, progressColor }),
        [barWidth, barGap, waveColor, progressColor]
    );

    const drawWaveform = useCallback(
        (currentTimeValue: number = 0): void => {
            const canvasElement = canvasRef.current;
            if (canvasElement === null || peaks === undefined || peaks.length === 0) return;

            const ctx = canvasElement.getContext('2d');
            if (ctx === null) return;

            const dpr = window.devicePixelRatio ?? 1;
            const width = canvasElement.offsetWidth * dpr;
            const heightPx = canvasElement.offsetHeight * dpr;

            // Only resize canvas if dimensions changed (avoid expensive DOM operation)
            if (
                canvasSizeRef.current === null ||
                canvasSizeRef.current.width !== width ||
                canvasSizeRef.current.height !== heightPx
            ) {
                canvasElement.width = width;
                canvasElement.height = heightPx;
                canvasSizeRef.current = { width, height: heightPx };
            }

            ctx.clearRect(0, 0, width, heightPx);

            const totalBars = Math.floor(width / (barConfig.barWidth + barConfig.barGap));
            const samplesPerBar = Math.floor(peaks[0].length / totalBars);

            const progress = duration !== undefined && duration > 0 ? currentTimeValue / duration : 0;

            for (let i = 0; i < totalBars; i++) {
                const sampleStart = i * samplesPerBar;
                const sampleEnd = Math.min(sampleStart + samplesPerBar, peaks[0].length);
                let max = 0;

                for (let j = sampleStart; j < sampleEnd; j++) {
                    const abs = Math.abs(peaks[0][j] ?? 0);
                    if (abs > max) max = abs;
                }

                const barHeight = Math.max(2, max * heightPx * 0.8);
                const x = i * (barConfig.barWidth + barConfig.barGap);
                const y = (heightPx - barHeight) / 2;

                const progressX = width * progress;

                if (x < progressX) {
                    ctx.fillStyle = barConfig.progressColor;
                } else {
                    ctx.fillStyle = barConfig.waveColor;
                }

                ctx.beginPath();
                ctx.roundRect(x, y, barConfig.barWidth, barHeight, 1);
                ctx.fill();
            }
        },
        [peaks, duration, barConfig]
    );

    // Throttle drawing to avoid excessive redraws on rapid currentTime updates
    // Only redraw when progress moves visually (every 50ms ~= 5% progress change on 1s duration)
    useEffect((): void => {
        const now = Date.now();
        const progress = duration !== undefined && duration > 0 ? currentTime / duration : 0;

        // Only redraw if enough time has passed or progress changed significantly
        const timeSinceLastDraw = now - lastDrawTimeRef.current;
        const progressDelta = Math.abs(progress - lastProgressRef.current);

        if (timeSinceLastDraw > 50 || progressDelta > 0.01) {
            drawWaveform(currentTime);
            lastDrawTimeRef.current = now;
            lastProgressRef.current = progress;
        }
    }, [currentTime, duration, drawWaveform]);

    if (!shouldShowWaveform) {
        return (
            <div className={emptyState} style={{ height }}>
                {duration !== undefined && duration > 0 && <span className={timeText}>{formatDuration(duration)}</span>}
            </div>
        );
    }

    return (
        <div className={container} style={{ height }}>
            <canvas ref={canvasRef} className={canvas} />
        </div>
    );
}
