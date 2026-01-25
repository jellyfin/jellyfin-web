import React from 'react';
import { Slider } from 'ui-primitives/Slider';
import { Box } from 'ui-primitives/Box';

interface BufferRange {
    start: number;
    end: number;
}

interface PlaybackSliderProps {
    value: number;
    max?: number;
    bufferedRanges?: BufferRange[];
    onChange?: (event: Event, value: number | number[]) => void;
    onChangeCommitted?: (event: Event | React.SyntheticEvent, value: number | number[]) => void;
    showBuffer?: boolean;
    waveSurferCompatible?: boolean;
    style?: React.CSSProperties;
}

export const PlaybackSlider: React.FC<PlaybackSliderProps> = ({
    value,
    max = 100,
    bufferedRanges = [],
    onChange,
    onChangeCommitted,
    showBuffer = true,
    waveSurferCompatible = true,
    style,
    ...props
}) => {
    return (
        <Box
            className={waveSurferCompatible ? 'barSurfer' : ''}
            style={{
                position: 'relative',
                width: '100%',
                ...style,
            }}
        >
            {showBuffer && bufferedRanges.length > 0 && bufferedRanges.map((range) => (
                <Box
                    key={`${range.start}-${range.end}`}
                    className="sliderBufferOverlay"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: `${range.start}%`,
                        width: `${Math.max(0, range.end - range.start)}%`,
                        height: '2px',
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                />
            ))}
            <Slider
                value={value}
                max={max}
                onChange={onChange}
                onChangeCommitted={onChangeCommitted}
                size="sm"
                style={{
                    '--Slider-thumb-size': '12px',
                    '--Slider-track-width': '100%',
                }}
                {...props}
            />
        </Box>
    );
};
