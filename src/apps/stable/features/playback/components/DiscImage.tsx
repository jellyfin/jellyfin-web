import { useCallback, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useBackspinStore } from '../../../../../store/backspinStore';
import { backspinHandler } from '../../../../../components/audioEngine/backspinHandler';
import { HAPTIC_PATTERNS } from '../../../../../types/transport';

export interface DiscImageProps {
    artSrc?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    rate?: number;
    isScratching?: boolean;
    pitchBend?: number;
    className?: string;
    onExpand?: () => void;
    onCollapse?: () => void;
}

const rotationVariants = {
    idle: { rotate: 0 },
    playing: {
        rotate: 360,
        transition: { duration: 2, repeat: Infinity, ease: 'linear' as const }
    },
    paused: { rotate: 0 },
    braking: {
        rotate: [0, 15, -10, 5, 0],
        transition: { duration: 0.18 }
    },
    spinning: {
        rotate: 360,
        transition: { duration: 0.45, ease: 'easeOut' as const }
    }
};

export function DiscImage({
    artSrc,
    size = 'md',
    rate = 1,
    isScratching = false,
    pitchBend = 0,
    className,
    onExpand,
    onCollapse
}: DiscImageProps) {
    const store = useBackspinStore();
    const state = store.state;
    const hapticEnabled = store.config.hapticEnabled;

    const isPlaying = state === 'LOCKED_PLAYING' || state === 'RESUMING_SPINUP';
    const isBraking = state === 'PAUSING_SLOWDOWN' || state === 'STOPPING_BRAKE';
    const isSpinning = state === 'SEEK_END';

    const displayState = isPlaying ? 'playing' : isBraking ? 'braking' : isSpinning ? 'spinning' : 'paused';

    const sizeMap = {
        sm: 48,
        md: 80,
        lg: 120,
        xl: 160
    };

    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const lastPositionRef = useRef<{ x: number; y: number; time: number } | null>(null);

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

    const handlePointerDown = useCallback(
        (event: React.PointerEvent) => {
            event.preventDefault();
            const now = performance.now();
            dragStartRef.current = { x: event.clientX, y: event.clientY, time: now };
            lastPositionRef.current = { x: event.clientX, y: event.clientY, time: now };
            setIsDragging(true);
            triggerHaptic('scratch_start');
        },
        [triggerHaptic]
    );

    const handlePointerMove = useCallback(
        (event: React.PointerEvent) => {
            if (!isDragging || !lastPositionRef.current) return;

            const now = performance.now();
            const deltaX = event.clientX - lastPositionRef.current.x;
            const deltaY = event.clientY - lastPositionRef.current.y;
            const deltaTime = now - lastPositionRef.current.time;

            if (deltaTime > 0) {
                const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
                const clampedVelocity = Math.max(0, Math.min(3, velocity * 2));

                const position = Math.atan2(deltaY, deltaX) / (2 * Math.PI) + 0.5;

                backspinHandler.scratchDrag(clampedVelocity, position);
            }

            lastPositionRef.current = { x: event.clientX, y: event.clientY, time: now };
        },
        [isDragging]
    );

    const handlePointerUp = useCallback(
        (event: React.PointerEvent) => {
            if (!isDragging) return;

            setIsDragging(false);
            backspinHandler.scratchEnd();
            triggerHaptic('scratch_end');
            dragStartRef.current = null;
            lastPositionRef.current = null;
        },
        [isDragging, triggerHaptic]
    );

    const handleTap = useCallback(() => {
        if (isDragging) return;
        if (isPlaying) {
            backspinHandler.pauseEngage();
            triggerHaptic('click');
        } else {
            backspinHandler.pauseDisengage();
            triggerHaptic('spin_up_complete');
        }
    }, [isPlaying, isDragging, triggerHaptic]);

    const handleDoubleTap = useCallback(() => {
        if (store.isExpanded) {
            onCollapse?.();
        } else {
            onExpand?.();
        }
        store.setExpanded(!store.isExpanded);
        triggerHaptic('double_tap');
    }, [store.isExpanded, onExpand, onCollapse, triggerHaptic, store]);

    const effectiveRate = rate * (1 + pitchBend);
    const animationDuration = isPlaying ? 2 / Math.abs(effectiveRate) : 0;

    return (
        <motion.div
            className={className}
            style={{
                width: sizeMap[size],
                height: sizeMap[size],
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#1a1a1a',
                border: '3px solid #333',
                cursor: isDragging ? 'grabbing' : 'pointer',
                userSelect: 'none',
                touchAction: 'none'
            }}
            variants={rotationVariants}
            animate={displayState}
            onClick={handleTap}
            onDoubleClick={handleDoubleTap}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {artSrc ? (
                <motion.img
                    src={artSrc}
                    alt="Album art"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        pointerEvents: 'none'
                    }}
                    animate={{
                        rotate: isPlaying ? 360 : 0
                    }}
                    transition={{
                        rotate: {
                            duration: animationDuration,
                            repeat: isPlaying ? Infinity : 0,
                            ease: 'linear' as const
                        }
                    }}
                />
            ) : (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background:
                            'repeating-radial-gradient(circle at center, #2a2a2a 0px, #2a2a2a 1px, #1a1a1a 1px, #1a1a1a 2px)'
                    }}
                >
                    <div
                        style={{
                            width: '35%',
                            height: '35%',
                            borderRadius: '50%',
                            background: '#aa5eaa',
                            border: '3px solid #333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <div
                            style={{
                                width: '30%',
                                height: '30%',
                                borderRadius: '50%',
                                background: '#101010'
                            }}
                        />
                    </div>
                </div>
            )}

            {(isScratching || isDragging) && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        border: '2px solid rgba(170, 94, 170, 0.5)',
                        pointerEvents: 'none'
                    }}
                />
            )}
        </motion.div>
    );
}
