import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box } from 'ui-primitives/Box';
import { vars } from 'styles/tokens.css';

interface WaveformCellProps {
    itemId: string;
    streamUrl?: string;
    peaks?: number[][];
    duration?: number;
    currentTime?: number;
    isCurrentTrack: boolean;
    isNextTrack: boolean;
    height?: number;
}

const DEFAULT_HEIGHT = 40;

export const WaveformCell: React.FC<WaveformCellProps> = ({
    itemId,
    streamUrl,
    peaks,
    duration,
    currentTime = 0,
    isCurrentTrack,
    isNextTrack,
    height = DEFAULT_HEIGHT
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState(false);

    const shouldShowWaveform = peaks && peaks.length > 0;

    const drawWaveform = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !peaks || peaks.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const width = canvas.offsetWidth * dpr;
        const heightPx = canvas.offsetHeight * dpr;

        canvas.width = width;
        canvas.height = heightPx;

        ctx.clearRect(0, 0, width, heightPx);

        const barWidth = 2;
        const barGap = 1;
        const totalBars = Math.floor(width / (barWidth + barGap));
        const samplesPerBar = Math.floor(peaks[0].length / totalBars);

        const waveColor = vars.colors.waveformWave;
        const progressColor = vars.colors.waveformProgress;
        const progress = duration ? currentTime / duration : 0;

        for (let i = 0; i < totalBars; i++) {
            const sampleStart = i * samplesPerBar;
            const sampleEnd = Math.min(sampleStart + samplesPerBar, peaks[0].length);
            let max = 0;

            for (let j = sampleStart; j < sampleEnd; j++) {
                const abs = Math.abs(peaks[0][j] || 0);
                if (abs > max) max = abs;
            }

            const barHeight = Math.max(2, max * heightPx * 0.8);
            const x = i * (barWidth + barGap);
            const y = (heightPx - barHeight) / 2;

            const progressX = width * progress;

            if (x < progressX) {
                ctx.fillStyle = progressColor;
            } else {
                ctx.fillStyle = waveColor;
            }

            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 1);
            ctx.fill();
        }
    }, [peaks, duration, currentTime]);

    useEffect(() => {
        drawWaveform();
    }, [drawWaveform]);

    if (!shouldShowWaveform) {
        return (
            <Box
                style={{
                    height: height,
                    minWidth: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end'
                }}
            >
                {duration !== undefined && duration > 0 && (
                    <Box as="span" style={{ fontSize: vars.typography.fontSizeXs, color: vars.colors.textSecondary }}>
                        {formatDuration(duration)}
                    </Box>
                )}
            </Box>
        );
    }

    return (
        <Box
            style={{
                height: height,
                width: '100%',
                minWidth: 100,
                maxWidth: 200,
                position: 'relative'
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: height,
                    display: 'block'
                }}
            />
        </Box>
    );
};

function formatDuration(ticks?: number): string {
    if (!ticks || ticks <= 0) return '--:--';
    const seconds = ticks / 10000000;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default WaveformCell;
