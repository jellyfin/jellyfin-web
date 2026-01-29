/**
 * ButterchurnViz - Liquid visualizer using butterchurn
 */

import { type ReactElement, useEffect, useRef } from 'react';
import { logger } from 'utils/logger';
import { canvas } from './ButterchurnViz.css.ts';

interface ButterchurnModule {
    createVisualizer: (
        canvas: HTMLCanvasElement,
        audioContext: AudioContext,
        options: { readonly width: number; readonly height: number; readonly textureRatio: number }
    ) => {
        readonly setPreset: (preset: unknown, blendTime: number) => void;
        readonly destroy: () => void;
    };
}

export interface ButterchurnVizProps {
    readonly preset?: string;
}

export function ButterchurnViz({ preset = 'default' }: ButterchurnVizProps): ReactElement {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const visualizerRef = useRef<ReturnType<ButterchurnModule['createVisualizer']> | null>(null);

    useEffect((): (() => void) | void => {
        const init = async (): Promise<void> => {
            if (canvasRef.current === null) return;

            try {
                const butterchurnModule = await import('butterchurn');
                const presetsModule = await import('butterchurn-presets');

                const audioContext = new AudioContext();
                const instance = (
                    butterchurnModule as unknown as ButterchurnModule
                ).createVisualizer(canvasRef.current, audioContext, {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    textureRatio: 1
                });

                visualizerRef.current = instance;

                const presets = (
                    presetsModule as unknown as {
                        readonly getPresets: () => Record<string, unknown>;
                    }
                ).getPresets();
                const selectedPreset = presets[preset] ?? presets['default'];
                instance.setPreset(selectedPreset, 2);
            } catch (error) {
                logger.error(
                    'Failed to initialize Butterchurn',
                    { component: 'ButterchurnViz' },
                    error as Error
                );
            }
        };

        void init();

        const handleResize = (): void => {
            if (canvasRef.current !== null) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', handleResize);

        return (): void => {
            window.removeEventListener('resize', handleResize);
            if (visualizerRef.current !== null) {
                try {
                    visualizerRef.current.destroy();
                } catch {
                    // Ignore cleanup errors
                }
            }
        };
    }, [preset]);

    return (
        <canvas
            ref={canvasRef}
            className={canvas}
            width={window.innerWidth}
            height={window.innerHeight}
        />
    );
}
