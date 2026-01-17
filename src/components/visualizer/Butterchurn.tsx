import React, { useEffect, useRef } from 'react';
import { butterchurnInstance, initializeButterChurn } from './butterchurn.logic';

const ButterchurnVisualizer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const initialize = async () => {
            if (canvasRef.current) {
                try {
                    await initializeButterChurn(canvasRef.current);
                } catch (error) {
                    console.error('[Butterchurn] Failed to initialize:', error);
                }
            }
        };

        initialize();

        const resizeCanvas = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Resize the HTMLCanvasElement
            if (canvasRef.current) {
                canvasRef.current.width = width;
                canvasRef.current.height = height;
            }

            // Resize the visualizer renderer
            if (butterchurnInstance.visualizer && typeof butterchurnInstance.visualizer.setRendererSize === 'function') {
                try {
                    butterchurnInstance.visualizer.setRendererSize(width, height);
                } catch (error) {
                    console.warn('[Butterchurn] Failed to resize visualizer:', error);
                }
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (butterchurnInstance.destroy) {
                try {
                    butterchurnInstance.destroy();
                } catch (error) {
                    console.warn('[Butterchurn] Failed to destroy visualizer:', error);
                }
            }
        };
    }, []);

    return <canvas id='butterchurn' ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight} />;
};

export default ButterchurnVisualizer;
