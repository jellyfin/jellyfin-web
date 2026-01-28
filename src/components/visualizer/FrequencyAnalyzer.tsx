import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { masterAudioOutput } from 'components/audioEngine/master.logic';
import { usePreferencesStore } from '../../store/preferencesStore';
import { isVisible, onVisibilityChange } from '../../utils/visibility';
import { logger } from '../../utils/logger';

type FrequencyAnalyzersProps = {
    audioContext?: AudioContext;
    mixerNode?: AudioNode;
    fftSize?: number;
    smoothingTimeConstant?: number;
    minDecibels?: number;
    maxDecibels?: number;
    alpha?: number; // Parameter for mapping adjustment
};

// Module-level singleton to preserve AnalyserNode across mounts
let sharedAnalyser: AnalyserNode | null = null;
let sharedAnalyserContext: AudioContext | null = null;
let isAnalyserConnected = false; // Track connection state

/**
 * Interpolates between two colors based on ratio
 */
function interpolateColor(color1: string, color2: string, ratio: number): string {
    const hex2rgb = (hex: string) => {
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

/**
 * Calculates frequency and position data for bars
 */
function calculateBarPositions(
    alpha: number,
    canvasWidth: number,
    numberOfBars: number
): { frequencies: number[]; xPositions: number[] } {
    const frequencies: number[] = [];
    const xPositions: number[] = [];

    const sampleRate = 44100;
    const nyquist = sampleRate / 2;
    const MIN_FREQUENCY = 60;
    const MAX_FREQUENCY = nyquist;

    const logMinFreq = Math.log(MIN_FREQUENCY);
    const logMaxFreq = Math.log(MAX_FREQUENCY);

    for (let i = 0; i <= numberOfBars; i++) {
        const normPosition = i / numberOfBars;
        const scaledPosition = (Math.exp(alpha * normPosition) - 1) / (Math.exp(alpha) - 1);
        const frequency = MIN_FREQUENCY + scaledPosition * (MAX_FREQUENCY - MIN_FREQUENCY);
        frequencies.push(frequency);

        const freqForLog = Math.max(frequency, MIN_FREQUENCY);
        const x = ((Math.log(freqForLog) - logMinFreq) / (logMaxFreq - logMinFreq)) * canvasWidth;
        xPositions.push(x);
    }

    return { frequencies, xPositions };
}

/**
 * Color settings for frequency bars
 */
interface ColorSettings {
    scheme: string;
    solid: string;
    low: string;
    mid: string;
    high: string;
}

/**
 * Determines the color for a frequency bar based on the scheme and decibel level
 */
function getBarColor(
    actualDecibel: number,
    minDecibels: number,
    maxDecibels: number,
    pinkNoiseLevel: number,
    colors: ColorSettings
): string {
    const clippingDecibel = 12;
    const nearClippingDecibel = -64;
    const clippingLevel = pinkNoiseLevel + clippingDecibel;
    const nearClippingLevel = pinkNoiseLevel + nearClippingDecibel;

    if (colors.scheme === 'spectrum') {
        // Dynamic spectrum: Green → Yellow → Red based on intensity
        if (actualDecibel <= nearClippingLevel) {
            const ratio = (actualDecibel - minDecibels) / (nearClippingLevel - minDecibels);
            const saturation = 30 + ratio * 70;
            return `hsl(120, ${saturation}%, 50%)`;
        } else if (actualDecibel > nearClippingLevel && actualDecibel < clippingLevel) {
            const ratio = (actualDecibel - nearClippingLevel) / (clippingLevel - nearClippingLevel);
            const hue = 120 - 120 * Math.min(ratio, 1);
            return `hsl(${hue}, 100%, 50%)`;
        } else {
            return 'hsl(0, 100%, 50%)';
        }
    } else if (colors.scheme === 'gradient') {
        // Custom gradient: interpolate between low/mid/high colors
        const ratio = (actualDecibel - minDecibels) / (maxDecibels - minDecibels);
        const clamped = Math.min(Math.max(ratio, 0), 1);
        if (clamped < 0.5) {
            // Low to Mid (0-50%)
            return interpolateColor(colors.low, colors.mid, clamped * 2);
        } else {
            // Mid to High (50-100%)
            return interpolateColor(colors.mid, colors.high, (clamped - 0.5) * 2);
        }
    } else {
        // Solid or album art fallback
        return colors.solid;
    }
}

/**
 * Draws amplitude reference lines and labels
 */
function drawAmplitudeLabels(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    minDecibels: number,
    maxDecibels: number
): void {
    const fontSize = Math.max(10, canvasHeight / 80);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = `${fontSize}px Noto Sans`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const amplitudeDecibels = [-90, -80, -70, -60, -50, -40, -30];
    amplitudeDecibels.forEach(decibel => {
        const value = ((decibel - minDecibels) / (maxDecibels - minDecibels)) * 255;
        let y = canvasHeight - (value / 255) * canvasHeight;
        y = Math.min(Math.max(y, fontSize / 2), canvasHeight - fontSize / 2);
        const textX = Math.min(30, canvasWidth - fontSize * 2);

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(8, y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const label = `${decibel} dB`;
        ctx.fillText(label, textX, y);
    });
}

/**
 * Draws frequency reference lines and labels
 */
function drawFrequencyLabels(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    logMinFreq: number,
    logMaxFreq: number
): void {
    const fontSize = Math.max(10, ctx.canvas.height / 80);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = `${fontSize}px Noto Sans`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const commonFrequencies = [100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    commonFrequencies.forEach(freq => {
        const percent = (Math.log(freq) - logMinFreq) / (logMaxFreq - logMinFreq);
        let x = percent * canvasWidth;
        x = Math.min(Math.max(x, fontSize / 2), canvasWidth - fontSize / 2);

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 8);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const label = freq >= 1000 ? `${freq / 1000}k Hz` : `${freq} Hz`;
        ctx.fillText(label, x, 17);
    });
}

const FrequencyAnalyzer: React.FC<FrequencyAnalyzersProps> = ({
    audioContext = masterAudioOutput.audioContext,
    mixerNode = masterAudioOutput.mixerNode,
    alpha = 4.5 // Adjust this value to control frequency distribution
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameId = useRef<number | undefined>(undefined);
    const isRunningRef = useRef(false);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const previousBarHeightsRef = useRef<Float32Array | null>(null);
    const pinkNoiseReferenceRef = useRef<Float32Array | null>(null);

    const { visualizer } = usePreferencesStore(state => state);
    const { advanced, frequencyAnalyzer, smoothing } = visualizer as any;
    const { fftSize, limiterThreshold: maxDecibels } = advanced;
    const smoothingTimeConstant = smoothing;
    const minDecibels = -132; // Standard floor

    // Memoize frequency analyzer settings to prevent unnecessary callback recreation
    const frequencyAnalyzerSettings = useMemo(
        () => ({
            opacity: frequencyAnalyzer.opacity,
            colorScheme: frequencyAnalyzer.colorScheme,
            colors: frequencyAnalyzer.colors
        }),
        [frequencyAnalyzer.opacity, frequencyAnalyzer.colorScheme, frequencyAnalyzer.colors]
    );

    const stopLoop = useCallback((reason?: string) => {
        if (reason) {
            logger.debug(`Stopping visualizer loop: ${reason}`, { component: 'FrequencyAnalyzer' });
        }
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = undefined;
        }
        isRunningRef.current = false;
    }, []);

    const renderFrequencyBars = useCallback(
        (frequencyData: Uint8Array) => {
            if (!ctxRef.current || !canvasRef.current) return;

            const ctx = ctxRef.current;
            const canvas = canvasRef.current;
            const canvasWidth = canvas.clientWidth;
            const canvasHeight = canvas.clientHeight;
            const dpr = window.devicePixelRatio || 1;

            // Set actual canvas size for high DPI
            canvas.width = canvasWidth * dpr;
            canvas.height = canvasHeight * dpr;
            ctx.scale(dpr, dpr);

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.globalAlpha = frequencyAnalyzerSettings.opacity;

            const minBarWidth = Math.max(2, canvasWidth / 200);
            const barGap = Math.max(1, canvasWidth / 400);

            const maxBars = 96;
            const minBars = 16;
            const numberOfBars = Math.max(minBars, Math.min(maxBars, Math.floor(canvasWidth / (minBarWidth + barGap))));

            // Calculate bar positions
            const { frequencies, xPositions } = calculateBarPositions(alpha, canvasWidth, numberOfBars);

            // Initialize arrays if needed
            if (!previousBarHeightsRef.current || previousBarHeightsRef.current.length !== numberOfBars) {
                previousBarHeightsRef.current = new Float32Array(numberOfBars);
            }

            if (!pinkNoiseReferenceRef.current || pinkNoiseReferenceRef.current.length !== fftSize / 2) {
                pinkNoiseReferenceRef.current = new Float32Array(fftSize / 2);
                const nyquist = 44100 / 2; // Default sample rate
                for (let i = 0; i < fftSize / 2; i++) {
                    const frequency = (i * nyquist) / (fftSize / 2);
                    const pinkNoiseLevel = -10 * Math.log10(frequency || 1);
                    pinkNoiseReferenceRef.current[i] = pinkNoiseLevel;
                }
            }

            const previousBarHeights = previousBarHeightsRef.current!;
            const pinkNoiseReference = pinkNoiseReferenceRef.current!;

            const { colorScheme, colors } = frequencyAnalyzerSettings;
            const { solid: colorSolid } = colors;
            const { low: colorLow, mid: colorMid, high: colorHigh } = colors.gradient;

            const nyquist = 44100 / 2;
            const MIN_FREQUENCY = 60;

            // Draw frequency bars
            for (let i = 0; i < numberOfBars; i++) {
                const xLeft = xPositions[i];
                const xRight = xPositions[i + 1];
                let barWidth = xRight - xLeft - barGap;
                barWidth = Math.max(0, barWidth);
                const x = xLeft + barGap / 2;

                const bin = Math.floor(((frequencies[i] - MIN_FREQUENCY) / (nyquist - MIN_FREQUENCY)) * (fftSize / 2));
                const safeBin = Math.max(0, Math.min(bin, fftSize / 2 - 1));

                const value = frequencyData[safeBin];
                const targetHeight = (value / 255) * canvasHeight;

                const currentHeight = previousBarHeights[i] || 0;
                const barHeight = currentHeight + (targetHeight - currentHeight) * 0.3;
                previousBarHeights[i] = barHeight;

                const actualDecibel = minDecibels + (value / 255) * (maxDecibels - minDecibels);
                const fillColor = getBarColor(actualDecibel, minDecibels, maxDecibels, pinkNoiseReference[safeBin], {
                    scheme: colorScheme,
                    solid: colorSolid,
                    low: colorLow,
                    mid: colorMid,
                    high: colorHigh
                });

                ctx.fillStyle = fillColor;
                ctx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight);
            }

            // Draw reference labels
            const logMinFreq = Math.log(60); // MIN_FREQUENCY
            const logMaxFreq = Math.log(44100 / 2); // MAX_FREQUENCY

            drawAmplitudeLabels(ctx, canvasWidth, canvasHeight, minDecibels, maxDecibels);
            drawFrequencyLabels(ctx, canvasWidth, logMinFreq, logMaxFreq);
        },
        [fftSize, minDecibels, maxDecibels, alpha, frequencyAnalyzerSettings]
    );

    const startLoop = useCallback(
        (analyser: AnalyserNode) => {
            if (isRunningRef.current) return;
            isRunningRef.current = true;

            const frequencyData = new Uint8Array(analyser.frequencyBinCount);

            const renderFrame = () => {
                if (!isRunningRef.current || !isVisible()) {
                    isRunningRef.current = false;
                    return;
                }
                analyser.getByteFrequencyData(frequencyData);
                renderFrequencyBars(frequencyData);
                animationFrameId.current = requestAnimationFrame(renderFrame);
            };

            renderFrame();
        },
        [renderFrequencyBars]
    );

    useEffect(() => {
        if (!audioContext) {
            console.error('AudioContext not available');
            return;
        }

        // Reuse or create AnalyserNode
        if (sharedAnalyserContext !== audioContext || !sharedAnalyser) {
            if (sharedAnalyser && isAnalyserConnected) {
                try {
                    sharedAnalyser.disconnect();
                    isAnalyserConnected = false;
                } catch {
                    /* already disconnected */
                }
            }
            sharedAnalyser = audioContext.createAnalyser();
            sharedAnalyserContext = audioContext;
            isAnalyserConnected = false;
        }

        const analyser = sharedAnalyser;
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;
        analyser.minDecibels = minDecibels;
        analyser.maxDecibels = maxDecibels;

        // Only connect if not already connected
        if (mixerNode && !isAnalyserConnected) {
            try {
                mixerNode.connect(analyser);
                isAnalyserConnected = true;
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                logger.error('[FrequencyAnalyzer] Failed to connect analyser to mixer', { component: 'FrequencyAnalyzer' }, err);
            }
        }

        // Initialize canvas context
        if (canvasRef.current && !ctxRef.current) {
            ctxRef.current = canvasRef.current.getContext('2d');
        }

        // Start loop if visible
        if (isVisible()) {
            startLoop(analyser);
        }

        // Subscribe to visibility changes
        const unsubscribe = onVisibilityChange(visible => {
            if (visible) {
                startLoop(analyser);
            } else {
                stopLoop();
            }
        });

        return () => {
            stopLoop();
            unsubscribe();
            // Properly disconnect analyser on cleanup to prevent dangling connections
            if (sharedAnalyser && isAnalyserConnected) {
                try {
                    sharedAnalyser.disconnect();
                    isAnalyserConnected = false;
                } catch {
                    /* already disconnected */
                }
            }
        };
    }, [audioContext, mixerNode, fftSize, smoothingTimeConstant, minDecibels, maxDecibels, startLoop, stopLoop]);

    useEffect(() => {
        const resizeCanvas = () => {
            if (canvasRef.current && ctxRef.current) {
                const canvas = canvasRef.current;
                const ctx = ctxRef.current;
                const dpr = window.devicePixelRatio || 1;

                // Update canvas size for high DPI
                canvas.width = canvas.clientWidth * dpr;
                canvas.height = canvas.clientHeight * dpr;
                ctx.scale(dpr, dpr);
            }
        };

        const observer = new ResizeObserver(() => {
            resizeCanvas();
        });
        if (canvasRef.current) {
            observer.observe(canvasRef.current);
        }

        // Call resizeCanvas initially
        resizeCanvas();

        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            const currentCanvas = canvasRef.current;
            if (currentCanvas) {
                observer.unobserve(currentCanvas);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            id="frequency-analyzer"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh'
            }}
        />
    );
};

export default FrequencyAnalyzer;
