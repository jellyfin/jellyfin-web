import React, { useEffect, useRef } from 'react';
import { butterchurnInstance, initializeButterChurn, setCanvasTransferred } from './butterchurn.logic';

const ButterchurnVisualizer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (canvasRef.current) {
            try {
                initializeButterChurn(canvasRef.current);
            } catch (error) {
                console.error('[Butterchurn] Failed to initialize:', error);
            }
        }

        const resizeCanvas = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Try to resize the HTMLCanvasElement - this may fail after OffscreenCanvas transfer
            if (canvasRef.current) {
                try {
                    canvasRef.current.width = width;
                    canvasRef.current.height = height;
                } catch (error) {
                    // This is expected after transferControlToOffscreen() - ignore the error
                    console.debug('[Butterchurn] Canvas resize failed (likely OffscreenCanvas transfer):', error instanceof Error ? error.message : String(error));
                }
            }

            // Always try to resize the visualizer renderer (works for both regular and OffscreenCanvas)
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
                    setCanvasTransferred(false); // Reset on unmount
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
