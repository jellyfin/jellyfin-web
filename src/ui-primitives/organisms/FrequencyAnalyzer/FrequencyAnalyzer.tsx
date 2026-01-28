/**
 * FrequencyAnalyzer - Real-time frequency visualization
 */

import { useEffect, useRef, useCallback, type ReactElement } from 'react';
import { logger } from 'utils/logger';
import { canvas } from './FrequencyAnalyzer.css.ts';

export interface FrequencyAnalyzerProps {
    readonly fftSize?: number;
    readonly smoothingTimeConstant?: number;
    readonly minDecibels?: number;
    readonly maxDecibels?: number;
    readonly barCount?: number;
    readonly colorScheme?: 'spectrum' | 'gradient' | 'solid';
    readonly solidColor?: string;
    readonly gradientLow?: string;
    readonly gradientMid?: string;
    readonly gradientHigh?: string;
}

function interpolateColor(color1: string, color2: string, ratio: number): string {
    const hex2rgb = (hex: string): [number, number, number] => {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return [r, g, b];
    };

    const [r1, g1, b1] = hex2rgb(color1);
    const [r2, g2, b2] = hex2rgb(color2);

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
}

export function FrequencyAnalyzer({
    fftSize = 4096,
    smoothingTimeConstant = 0.3,
    minDecibels = -132,
    maxDecibels = 180,
    barCount = 64,
    colorScheme = 'spectrum',
    solidColor = '#aa5eaa',
    gradientLow = '#00ff00',
    gradientMid = '#ffff00',
    gradientHigh = '#ff0000'
}: FrequencyAnalyzerProps): ReactElement {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const previousBarHeightsRef = useRef<Float32Array>(new Float32Array(barCount));

    const renderBars = useCallback((): void => {
        const canvasElement = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvasElement === null || ctx === null || analyserRef.current === null) return;

        const canvasWidth = canvasElement.clientWidth;
        const canvasHeight = canvasElement.clientHeight;
        const dpr = window.devicePixelRatio ?? 1;

        if (canvasElement.width !== canvasWidth * dpr || canvasElement.height !== canvasHeight * dpr) {
            canvasElement.width = canvasWidth * dpr;
            canvasElement.height = canvasHeight * dpr;
            ctx.scale(dpr, dpr);
        }

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        const frequencyData = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(frequencyData);

        const minBarWidth = Math.max(2, canvasWidth / (barCount * 2));
        const barGap = Math.max(1, canvasWidth / (barCount * 4));
        const barWidth = minBarWidth;

        const nyquist = 44100 / 2;
        const MIN_FREQUENCY = 60;

        const previousBarHeights = previousBarHeightsRef.current;

        for (let i = 0; i < barCount; i++) {
            const normalizedPos = i / (barCount - 1);
            const frequency = MIN_FREQUENCY * Math.pow(nyquist / MIN_FREQUENCY, normalizedPos);
            const bin = Math.floor((frequency / nyquist) * (fftSize / 2));
            const safeBin = Math.max(0, Math.min(bin, fftSize / 2 - 1));

            const value = frequencyData[safeBin];
            const targetHeight = (value / 255) * canvasHeight;

            const currentHeight = previousBarHeights[i] ?? 0;
            const barHeight = currentHeight + (targetHeight - currentHeight) * 0.3;
            previousBarHeights[i] = barHeight;

            const x = i * (barWidth + barGap) + barGap / 2;

            let fillColor: string;
            if (colorScheme === 'spectrum') {
                const hue = 120 - (value / 255) * 120;
                fillColor = `hsl(${hue}, 100%, 50%)`;
            } else if (colorScheme === 'gradient') {
                const ratio = value / 255;
                if (ratio < 0.5) {
                    const t = ratio * 2;
                    fillColor = interpolateColor(gradientLow, gradientMid, t);
                } else {
                    const t = (ratio - 0.5) * 2;
                    fillColor = interpolateColor(gradientMid, gradientHigh, t);
                }
            } else {
                fillColor = solidColor;
            }

            ctx.fillStyle = fillColor;
            ctx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight);
        }

        animationFrameId.current = requestAnimationFrame(renderBars);
    }, [fftSize, barCount, colorScheme, solidColor, gradientLow, gradientMid, gradientHigh]);

    useEffect((): (() => void) | void => {
        const getAudioContext = async (): Promise<AudioContext | null> => {
            try {
                const { useAudioStore } = await import('store/audioStore');
                const state = useAudioStore.getState();
                return state.audioContext ?? null;
            } catch {
                return null;
            }
        };

        const init = async (): Promise<void> => {
            const audioCtx = await getAudioContext();
            if (audioCtx === null) return;

            try {
                analyserRef.current = audioCtx.createAnalyser();
                analyserRef.current.fftSize = fftSize;
                analyserRef.current.smoothingTimeConstant = smoothingTimeConstant;
                analyserRef.current.minDecibels = minDecibels;
                analyserRef.current.maxDecibels = maxDecibels;

                ctxRef.current = canvasRef.current?.getContext('2d') ?? null;

                renderBars();
            } catch (error) {
                logger.error(
                    'Failed to initialize audio visualizer',
                    {
                        component: 'FrequencyAnalyzer',
                        fftSize,
                        barCount,
                        colorScheme
                    },
                    error as Error
                );
            }
        };

        void init();

        return (): void => {
            if (animationFrameId.current !== 0) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if (analyserRef.current !== null) {
                analyserRef.current.disconnect();
            }
        };
    }, [fftSize, smoothingTimeConstant, minDecibels, maxDecibels, renderBars]);

    return <canvas ref={canvasRef} className={canvas} />;
}
