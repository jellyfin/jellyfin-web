import React from 'react';
import { Slider } from 'ui-primitives/Slider';
import { IconButton } from 'ui-primitives/IconButton';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { vars } from 'styles/tokens.css';

interface VolumeSliderProps {
    volume: number;
    muted: boolean;
    onVolumeChange: (volume: number) => void;
    onMuteToggle: () => void;
    size?: 'sm' | 'md' | 'lg';
    showSlider?: boolean;
    style?: React.CSSProperties;
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({
    volume,
    muted,
    onVolumeChange,
    onMuteToggle,
    size = 'sm',
    showSlider = true,
    style,
}) => {
    const displayVolume = muted ? 0 : volume;

    const handleChange = (newValue: number[]) => {
        const vol = newValue[0];
        onVolumeChange(vol);
        if (muted && vol > 0) {
            onMuteToggle();
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: vars.spacing.xs,
                ...style,
            }}
        >
            <IconButton
                size={size}
                variant="plain"
                onClick={onMuteToggle}
                style={{
                    color: vars.colors.text,
                }}
                aria-label={muted ? 'Unmute' : 'Mute'}
            >
                {muted || displayVolume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
            {showSlider && (
                <div
                    style={{
                        width: '80px',
                    }}
                    className="nowPlayingBarVolumeSliderContainer"
                >
                    <Slider
                        min={0}
                        max={100}
                        value={[displayVolume]}
                        onValueChange={handleChange}
                    />
                </div>
            )}
        </div>
    );
};
