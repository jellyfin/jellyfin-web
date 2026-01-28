import { useCallback } from 'react';
import { motion } from 'motion/react';
import { DiscImage } from './DiscImage';
import { VinylSeekBar } from './VinylSeekBar';
import { useBackspinStore } from '../../../../../store/backspinStore';
import { backspinHandler } from '../../../../../components/audioEngine/backspinHandler';
import { HAPTIC_PATTERNS } from '../../../../../types/transport';
import { vars } from 'styles/tokens.css.ts';

export interface TransportControlsProps {
    artSrc?: string;
    progress: number;
    duration: number;
    onSeek: (time: number) => void;
    onPrevious?: () => void;
    onNext?: () => void;
    className?: string;
}

const buttonVariants = {
    idle: { scale: 1 },
    pressed: { scale: 0.92 },
    hover: { scale: 1.05 }
};

export function TransportControls({
    artSrc,
    progress,
    duration,
    onSeek,
    onPrevious,
    onNext,
    className
}: TransportControlsProps) {
    const store = useBackspinStore();
    const hapticEnabled = store.config.hapticEnabled;

    const state = store.state;
    const isPlaying = state === 'LOCKED_PLAYING' || state === 'RESUMING_SPINUP';
    const isScratching = store.isScratching;
    const rate = store.rate;

    const triggerHaptic = useCallback(
        (patternKey: string) => {
            if (!hapticEnabled || !navigator.vibrate) return;
            const pattern = HAPTIC_PATTERNS[patternKey];
            if (pattern) {
                navigator.vibrate(pattern.pattern);
            }
        },
        [hapticEnabled]
    );

    const handlePlayPause = useCallback(() => {
        if (isPlaying) {
            backspinHandler.pauseEngage();
            triggerHaptic('click');
        } else {
            backspinHandler.pauseDisengage();
            triggerHaptic('spin_up_complete');
        }
    }, [isPlaying, triggerHaptic]);

    const handlePrevious = useCallback(() => {
        onPrevious?.();
        if (store.mediaElement) {
            store.mediaElement.currentTime = 0;
            onSeek(0);
        }
        triggerHaptic('scratch_start');
    }, [onPrevious, onSeek, store, triggerHaptic]);

    const handleNext = useCallback(() => {
        onNext?.();
        if (store.mediaElement) {
            store.mediaElement.currentTime = 0;
            onSeek(0);
        }
        triggerHaptic('scratch_start');
    }, [onNext, onSeek, store, triggerHaptic]);

    const handleExpand = useCallback(() => {
        store.setExpanded(true);
    }, [store]);

    const handleCollapse = useCallback(() => {
        store.setExpanded(false);
    }, [store]);

    return (
        <div
            className={className}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: vars.spacing['4'],
                padding: '20px',
                background: 'linear-gradient(180deg, #1a1a1a 0%, #101010 100%)',
                borderRadius: '12px',
                minWidth: '280px'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '24px',
                    width: '100%'
                }}
            >
                <motion.button
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="pressed"
                    onClick={handlePrevious}
                    style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#333',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: vars.typography['3'].fontSize
                    }}
                    aria-label="Previous track"
                    title="Previous track"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                </motion.button>

                <DiscImage
                    artSrc={artSrc}
                    size="lg"
                    rate={rate}
                    isScratching={isScratching}
                    onExpand={handleExpand}
                    onCollapse={handleCollapse}
                />

                <motion.button
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="pressed"
                    onClick={handleNext}
                    style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#333',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: vars.typography['3'].fontSize
                    }}
                    aria-label="Next track"
                    title="Next track"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                    </svg>
                </motion.button>
            </div>

            <VinylSeekBar
                progress={progress}
                duration={duration}
                onSeek={onSeek}
                onExpand={handleExpand}
                onCollapse={handleCollapse}
            />

            <div
                style={{
                    display: 'flex',
                    gap: vars.spacing['2'],
                    alignItems: 'center'
                }}
            >
                <motion.button
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="pressed"
                    onClick={handlePlayPause}
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        border: '2px solid #aa5eaa',
                        background: 'transparent',
                        color: '#aa5eaa',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: vars.typography['6'].fontSize
                    }}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    title={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </motion.button>
            </div>
        </div>
    );
}
