import React, { useEffect, useRef, useCallback } from 'react';
import { masterAudioOutput } from 'components/audioEngine/master.logic';
import { visualizerSettings } from './visualizers.logic';

type FrequencyAnalyzersProps = {
    audioContext?: AudioContext;
    mixerNode?: AudioNode;
    fftSize?: number;
    smoothingTimeConstant?: number;
    minDecibels?: number;
    maxDecibels?: number;
    alpha?: number; // Parameter for mapping adjustment
};

const FrequencyAnalyzer: React.FC<FrequencyAnalyzersProps> = ({
    audioContext = masterAudioOutput.audioContext,
    mixerNode = masterAudioOutput.mixerNode,
    fftSize = 4096,
    smoothingTimeConstant = 0.3,
    minDecibels = -132,
    maxDecibels = 180,
    alpha = 4.5 // Adjust this value to control frequency distribution
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameId = useRef<number>();
    const analyserRef = useRef<AnalyserNode>();
    const workerRef = useRef<Worker>();

    const draw = useCallback(
        (analyser: AnalyserNode) => {
            if (document.visibilityState === 'hidden') return;
            const frequencyData = new Uint8Array(analyser.frequencyBinCount);

            const renderFrame = () => {
                analyser.getByteFrequencyData(frequencyData);
                workerRef.current?.postMessage({ frequencyData });

                animationFrameId.current = requestAnimationFrame(renderFrame);
            };

            renderFrame();
        },
        []
    );

    useEffect(() => {
        if (!audioContext) {
            console.error('AudioContext not available');
            return;
        }

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;
        analyser.minDecibels = minDecibels;
        analyser.maxDecibels = maxDecibels;
        analyserRef.current = analyser;

        if (mixerNode) mixerNode.connect(analyser);

        const canvas = canvasRef.current;
        if (canvas) {
            const offscreenCanvas = canvas.transferControlToOffscreen();
            const worker = new Worker(new URL('./frequencyAnalyzerWorker.js', import.meta.url));
            workerRef.current = worker;

            worker.postMessage(
                {
                    canvas: offscreenCanvas,
                    fftSize,
                    smoothingTimeConstant,
                    minDecibels,
                    maxDecibels,
                    alpha,
                    width: canvas.clientWidth,
                    height: canvas.clientHeight,
                    dpr: window.devicePixelRatio || 1,
                    colorScheme: visualizerSettings.frequencyAnalyzer.colorScheme,
                    colors: {
                        low: visualizerSettings.frequencyAnalyzer.colors.gradient.low,
                        mid: visualizerSettings.frequencyAnalyzer.colors.gradient.mid,
                        high: visualizerSettings.frequencyAnalyzer.colors.gradient.high,
                        solid: visualizerSettings.frequencyAnalyzer.colors.solid
                    }
                },
                [offscreenCanvas]
            );

            draw(analyser);
        }

        return () => {
            if (mixerNode) mixerNode.disconnect(analyser);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            workerRef.current?.terminate();
        };
    }, [
        audioContext,
        mixerNode,
        fftSize,
        smoothingTimeConstant,
        minDecibels,
        maxDecibels,
        draw,
        alpha,
        visualizerSettings.frequencyAnalyzer.colorScheme,
        visualizerSettings.frequencyAnalyzer.colors
    ]);

    useEffect(() => {
        const resizeCanvas = () => {
            if (canvasRef.current) {
                workerRef.current?.postMessage({
                    type: 'resize',
                    width: canvasRef.current.clientWidth,
                    height: canvasRef.current.clientHeight,
                    dpr: window.devicePixelRatio || 1
                });
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
            id='frequency-analyzer'
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
