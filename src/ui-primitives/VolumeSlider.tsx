import React, { useCallback, useEffect, useRef, useState, type ReactElement, type CSSProperties } from 'react';
import { Root, Track, Range, Thumb } from '@radix-ui/react-slider';
import { SpeakerLoudIcon, SpeakerOffIcon } from '@radix-ui/react-icons';
import { vars } from '../styles/tokens.css';
import {
    volumeSliderContainer,
    volumeSliderTrack,
    volumeSliderTrackInner,
    volumeSliderRange,
    volumeSliderThumb,
    volumeSliderMuteButton,
    volumeSliderMuteButtonSpinning
} from './VolumeSlider.css';

export interface VolumeSliderProps {
    readonly volume: number;
    readonly muted: boolean;
    readonly onVolumeChange: (volume: number) => void;
    readonly onMuteToggle: () => void;
    readonly size?: 'sm' | 'md' | 'lg';
    readonly showSlider?: boolean;
    readonly style?: CSSProperties;
    readonly sliderWidth?: string | number;
}

export function VolumeSlider({
    volume,
    muted,
    onVolumeChange,
    onMuteToggle,
    size = 'sm',
    showSlider = true,
    style: styleProp,
    sliderWidth = 80
}: VolumeSliderProps): ReactElement {
    const [isSpinning, setIsSpinning] = useState(false);
    const sliderRef = useRef<HTMLSpanElement>(null);
    const muteButtonRef = useRef<HTMLButtonElement>(null);

    const displayVolume = muted ? 0 : volume;

    const handleVolumeChange = useCallback(
        (newValue: number[]): void => {
            const vol = newValue[0];
            onVolumeChange(vol);
            if (muted && vol > 0) {
                onMuteToggle();
            }
        },
        [muted, onVolumeChange, onMuteToggle]
    );

    const triggerMuteToggle = useCallback((): void => {
        setIsSpinning(true);
        onMuteToggle();
        setTimeout((): void => setIsSpinning(false), 300);
    }, [onMuteToggle]);

    const handleWheel = useCallback(
        (event: globalThis.WheelEvent): void => {
            event.preventDefault();

            const isOverSlider = sliderRef.current?.contains(event.target as Node);
            const isOverMuteButton = muteButtonRef.current?.contains(event.target as Node);

            if (isOverMuteButton === true) {
                triggerMuteToggle();
                return;
            }

            if (isOverSlider === true) {
                const isFineTune = event.shiftKey;
                const delta = isFineTune ? 1 : 5;
                const direction = event.deltaY > 0 ? -1 : 1;
                const newVolume = Math.max(0, Math.min(100, volume + delta * direction));
                onVolumeChange(newVolume);
            }
        },
        [volume, onVolumeChange, triggerMuteToggle]
    );

    useEffect((): (() => void) | void => {
        const sliderElement = sliderRef.current;
        if (sliderElement === null) return;

        sliderElement.addEventListener('wheel', handleWheel, { passive: false });

        return (): void => {
            sliderElement.removeEventListener('wheel', handleWheel);
        };
    }, [handleWheel]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent): void => {
            if (event.key === 'm' || event.key === 'M') {
                event.preventDefault();
                triggerMuteToggle();
                return;
            }

            const isFineTune = event.shiftKey;
            const delta = isFineTune ? 1 : 5;

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                const newVolume = Math.min(100, volume + delta);
                onVolumeChange(newVolume);
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                const newVolume = Math.max(0, volume - delta);
                onVolumeChange(newVolume);
            }
        },
        [volume, onVolumeChange, triggerMuteToggle]
    );

    const sizeStyles: Record<'sm' | 'md' | 'lg', { readonly width: string; readonly height: string }> = {
        sm: { width: '28px', height: '28px' },
        md: { width: '36px', height: '36px' },
        lg: { width: '44px', height: '44px' }
    };

    return (
        <div className={volumeSliderContainer} style={styleProp}>
            <button
                ref={muteButtonRef}
                type='button'
                className={`${volumeSliderMuteButton} ${isSpinning ? volumeSliderMuteButtonSpinning : ''}`}
                onClick={triggerMuteToggle}
                aria-label={muted ? 'Unmute' : 'Mute'}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: sizeStyles[size].width,
                    height: sizeStyles[size].height
                }}
            >
                {muted || displayVolume === 0 ? (
                    <SpeakerOffIcon style={{ color: vars.colors.text }} />
                ) : (
                    <SpeakerLoudIcon style={{ color: vars.colors.text }} />
                )}
            </button>
            {showSlider && (
                <div
                    style={{
                        width: sliderWidth
                    }}
                >
                    <Root
                        ref={sliderRef}
                        className={volumeSliderTrack}
                        value={[displayVolume]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={handleVolumeChange}
                        onKeyDown={handleKeyDown}
                    >
                        <Track className={volumeSliderTrackInner}>
                            <Range className={volumeSliderRange} />
                        </Track>
                        <Thumb className={volumeSliderThumb} />
                    </Root>
                </div>
            )}
        </div>
    );
}

export default VolumeSlider;

export {
    volumeSliderContainer,
    volumeSliderTrack,
    volumeSliderTrackInner,
    volumeSliderRange,
    volumeSliderThumb,
    volumeSliderMuteButton,
    volumeSliderMuteButtonSpinning
};
