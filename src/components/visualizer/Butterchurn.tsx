import React, { useEffect, useRef } from 'react';
import { logger } from 'utils/logger';
import { butterchurnInstance, initializeButterChurn } from './butterchurn.logic';

const ButterchurnVisualizer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const initialize = async () => {
            if (canvasRef.current) {
                try {
                    await initializeButterChurn(canvasRef.current);
                } catch (error) {
                    logger.error(
                        'Failed to initialize',
                        { component: 'Butterchurn' },
                        error as Error
                    );
                }
            }
        };

        void initialize();

        const resizeCanvas = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Resize the HTMLCanvasElement
            if (canvasRef.current) {
                canvasRef.current.width = width;
                canvasRef.current.height = height;
            }

            // Resize the visualizer renderer
            if (butterchurnInstance.visualizer) {
                try {
                    butterchurnInstance.visualizer.setRendererSize(width, height);
                } catch (error) {
                    logger.warn(
                        'Failed to resize visualizer',
                        { component: 'Butterchurn' },
                        error as Error
                    );
                }
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            try {
                butterchurnInstance.destroy();
            } catch (error) {
                logger.warn(
                    'Failed to destroy visualizer',
                    { component: 'Butterchurn' },
                    error as Error
                );
            }
        };
    }, []);

    return (
        <canvas
            id="butterchurn"
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
        />
    );
};

export default ButterchurnVisualizer;
