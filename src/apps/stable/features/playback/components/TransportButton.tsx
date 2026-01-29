import { PauseIcon, PlayIcon } from '@radix-ui/react-icons';
import { motion, Variants } from 'motion/react';
import { forwardRef } from 'react';

interface TransportButtonProps {
    state: 'playing' | 'paused' | 'braking' | 'spinning' | 'idle';
    onPause?: () => void;
    onPlay?: () => void;
    onStop?: () => void;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
}

const buttonVariants: Variants = {
    idle: { scale: 1 },
    playing: {
        scale: [1, 0.9, 1],
        rotate: [0, -3, 3, -2, 2, 0],
        transition: { duration: 0.3 }
    },
    paused: { scale: 0.95 },
    braking: {
        rotate: [0, 10, -8, 5, -3, 0],
        transition: { duration: 0.18 }
    },
    spinning: {
        rotate: [0, 360],
        transition: { duration: 0.45, ease: 'easeOut' as const }
    }
};

export const TransportButton = forwardRef<HTMLButtonElement, TransportButtonProps>(
    (
        { state, onPause, onPlay, onStop, size = 'md', disabled = false, className, ...props },
        ref
    ) => {
        const sizeMap = {
            sm: 36,
            md: 48,
            lg: 64
        };

        const iconSize = {
            sm: 18,
            md: 24,
            lg: 32
        };

        const handleClick = () => {
            if (disabled) return;

            switch (state) {
                case 'playing':
                    onPause?.();
                    break;
                case 'paused':
                case 'idle':
                    onPlay?.();
                    break;
                default:
                    onPlay?.();
            }
        };

        const isPlaying = state === 'playing' || state === 'spinning';
        const IconComponent = isPlaying ? PauseIcon : PlayIcon;

        return (
            <motion.button
                ref={ref}
                className={className}
                whileHover={{ scale: disabled ? 1 : 1.05 }}
                whileTap={{ scale: disabled ? 1 : 0.9 }}
                animate={state}
                variants={buttonVariants}
                onClick={handleClick}
                disabled={disabled}
                style={{
                    width: sizeMap[size],
                    height: sizeMap[size],
                    borderRadius: '50%',
                    border: 'none',
                    background: disabled ? '#444' : '#aa5eaa',
                    color: '#fff',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4)'
                }}
                {...props}
            >
                <IconComponent width={iconSize[size]} height={iconSize[size]} />
            </motion.button>
        );
    }
);

TransportButton.displayName = 'TransportButton';
