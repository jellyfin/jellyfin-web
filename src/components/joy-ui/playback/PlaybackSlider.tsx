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
    onChange?: (value: number) => void;
    onChangeCommitted?: (value: number) => void;
    showBuffer?: boolean;
    waveSurferCompatible?: boolean;
    style?: React.CSSProperties;
}

const PlaybackSlider: React.FC<PlaybackSliderProps> = props => {
    const {
        value,
        max = 100,
        bufferedRanges = [],
        onChange,
        onChangeCommitted,
        showBuffer = true,
        waveSurferCompatible = true,
        style
    } = props;

    const handleValueChange = React.useCallback(
        (newValue: number[]) => {
            if (onChange) {
                onChange(newValue[0]);
            }
        },
        [onChange]
    );

    const handleValueCommit = React.useCallback(
        (newValue: number[]) => {
            if (onChangeCommitted) {
                onChangeCommitted(newValue[0]);
            }
        },
        [onChangeCommitted]
    );

    return (
        <Box
            className={waveSurferCompatible ? 'barSurfer' : ''}
            style={{
                position: 'relative',
                width: '100%',
                ...style
            }}
        >
            {showBuffer &&
                bufferedRanges.length > 0 &&
                bufferedRanges.map(range => (
                    <Box
                        key={`${range.start}-${range.end}`}
                        className="bufferedRange"
                        style={{
                            position: 'absolute',
                            height: '3px',
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            left: `${range.start}%`,
                            width: `${range.end - range.start}%`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none'
                        }}
                    />
                ))}
            <Slider
                value={[value]}
                max={max}
                onValueChange={onChange ? handleValueChange : undefined}
                onValueCommit={onChangeCommitted ? handleValueCommit : undefined}
                style={{
                    '--Slider-thumb-size': '12px',
                    '--Slider-track-width': '100%'
                }}
            />
        </Box>
    );
};

export { PlaybackSlider };
