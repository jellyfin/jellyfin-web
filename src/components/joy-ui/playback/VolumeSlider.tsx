import React, { useState } from 'react';
import Box from '@mui/joy/Box';
import Slider from '@mui/joy/Slider';
import IconButton from '@mui/joy/IconButton';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

interface VolumeSliderProps {
    volume: number;
    muted: boolean;
    onVolumeChange: (volume: number) => void;
    onMuteToggle: () => void;
    size?: 'sm' | 'md' | 'lg';
    showSlider?: boolean;
    sx?: object;
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({
    volume,
    muted,
    onVolumeChange,
    onMuteToggle,
    size = 'sm',
    showSlider = true,
    sx,
}) => {
    const displayVolume = muted ? 0 : volume;

    const handleChange = (_event: Event, newValue: number | number[]) => {
        const vol = newValue as number;
        onVolumeChange(vol);
        if (muted && vol > 0) {
            onMuteToggle();
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                ...sx,
            }}
        >
            <IconButton
                size={size}
                variant="plain"
                onClick={onMuteToggle}
                sx={{
                    color: 'neutral.50',
                    '&:hover': {
                        color: 'neutral.300',
                    },
                }}
                aria-label={muted ? 'Unmute' : 'Mute'}
            >
                {muted || displayVolume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
            {showSlider && (
                <Box
                    className="nowPlayingBarVolumeSliderContainer"
                    sx={{
                        width: '80px',
                        '@media (min-width: 1200px)': {
                            width: '120px',
                        },
                    }}
                >
                    <Slider
                        min={0}
                        max={100}
                        value={displayVolume}
                        onChange={handleChange}
                        size="sm"
                        sx={{
                            '--Slider-thumb-size': '10px',
                        }}
                    />
                </Box>
            )}
        </Box>
    );
};
