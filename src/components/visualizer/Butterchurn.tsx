import React, { useEffect, useRef } from 'react';
import { butterchurnInstance, initializeButterChurn, isCanvasTransferred, setCanvasTransferred } from './butterchurn.logic';

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

            // Only resize the HTMLCanvasElement if it hasn't been transferred to OffscreenCanvas
            // After transferControlToOffscreen(), setting width/height throws an error
            if (canvasRef.current && !isCanvasTransferred()) {
                canvasRef.current.width = width;
                canvasRef.current.height = height;
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
