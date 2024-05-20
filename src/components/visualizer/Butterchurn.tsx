import React, { useEffect, useRef } from 'react';
import { butterchurnInstance, initializeButterChurn } from './butterchurn.logic';

const ButterchurnVisualizer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (canvasRef.current) initializeButterChurn(canvasRef.current);

        const resizeCanvas = () => {
            if (canvasRef.current) {
                const width = window.innerWidth;
                const height = window.innerHeight;
                canvasRef.current.width = width;
                canvasRef.current.height = height;
                butterchurnInstance.visualizer.setRendererSize(width, height);
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            butterchurnInstance.destroy();
        };
    }, []);

    return <canvas id='butterchurn' ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight} />;
};

export default ButterchurnVisualizer;
