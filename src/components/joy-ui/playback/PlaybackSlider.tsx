import React from 'react';
import Box from '@mui/joy/Box';
import Slider from '@mui/joy/Slider';
import type { SliderProps } from '@mui/joy/Slider';

interface BufferRange {
    start: number;
    end: number;
}

interface PlaybackSliderProps extends Omit<SliderProps, 'value' | 'onChange' | 'max'> {
    value: number;
    max?: number;
    bufferedRanges?: BufferRange[];
    onChange?: (event: Event, value: number | number[]) => void;
    onChangeCommitted?: (event: Event | React.SyntheticEvent, value: number | number[]) => void;
    showBuffer?: boolean;
    waveSurferCompatible?: boolean;
}

export const PlaybackSlider: React.FC<PlaybackSliderProps> = ({
    value,
    max = 100,
    bufferedRanges = [],
    onChange,
    onChangeCommitted,
    showBuffer = true,
    waveSurferCompatible = true,
    sx,
    ...props
}) => {
    const bufferStart = bufferedRanges[0]?.start ?? 0;
    const bufferEnd = bufferedRanges[0]?.end ?? 0;

    return (
        <Box
            className={waveSurferCompatible ? 'barSurfer' : ''}
            sx={{
                position: 'relative',
                width: '100%',
                ...sx,
            }}
        >
            {showBuffer && bufferedRanges.length > 0 && (
                <Box
                    className="sliderBufferOverlay"
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: `${bufferStart}%`,
                        right: `calc(100% - ${bufferEnd}%)`,
                        height: '2px',
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                />
            )}
            <Slider
                value={value}
                max={max}
                onChange={onChange}
                onChangeCommitted={onChangeCommitted}
                size="sm"
                sx={{
                    '--Slider-thumb-size': '12px',
                    '--Slider-track-width': '100%',
                    '& .joy-slider-track': {
                        position: 'relative',
                    },
                    ...sx,
                }}
                {...props}
            />
        </Box>
    );
};
