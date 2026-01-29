import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { backspinHandler } from '../../../../../components/audioEngine/backspinHandler';
import { useBackspinStore } from '../../../../../store/backspinStore';
import { HAPTIC_PATTERNS } from '../../../../../types/transport';

export interface VinylSeekBarProps {
    progress: number;
    duration: number;
    onSeek: (time: number) => void;
    onExpand?: () => void;
    onCollapse?: () => void;
    className?: string;
}

export function VinylSeekBar({
    progress,
    duration,
    onSeek,
    onExpand,
    onCollapse,
    className
}: VinylSeekBarProps) {
    const store = useBackspinStore();
    const hapticEnabled = store.config.hapticEnabled;
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setContainerWidth(rect.width);

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

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

    const handleClick = useCallback(
        (event: React.MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left - 16;
            const percent = Math.max(0, Math.min(1, x / (rect.width - 32)));
            const time = percent * duration;
            onSeek(time);
        },
        [duration, onSeek]
    );

    const handleDoubleClick = useCallback(() => {
        if (store.isExpanded) {
            onCollapse?.();
        } else {
            onExpand?.();
        }
        store.setExpanded(!store.isExpanded);
        triggerHaptic('double_tap');
    }, [store.isExpanded, onExpand, onCollapse, triggerHaptic, store]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins + ':' + secs.toString().padStart(2, '0');
    };

    const thumbPosition = containerWidth > 0 ? 16 + progress * (containerWidth - 32) : 0;
    const thumbLeft = containerWidth > 0 ? thumbPosition + 'px' : '50%';

    return (
        <div
            ref={containerRef}
            className={'seek-bar ' + (className || '')}
            style={{
                position: 'relative',
                width: '100%',
                height: '48px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                userSelect: 'none'
            }}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            role="slider"
            aria-valuenow={progress * duration}
            aria-valuemin={0}
            aria-valuemax={duration}
            tabIndex={0}
        >
            <div
                style={{
                    position: 'absolute',
                    left: 16,
                    right: 16,
                    height: '4px',
                    background: '#333',
                    borderRadius: '2px',
                    overflow: 'hidden'
                }}
            >
                <motion.div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        background: '#aa5eaa',
                        width: progress * 100 + '%'
                    }}
                    animate={{ width: progress * 100 + '%' }}
                    transition={{ duration: 0.1 }}
                />

                {store.isScratching && (
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            background: 'rgba(255, 255, 255, 0.2)',
                            width: '100%'
                        }}
                    />
                )}
            </div>

            <div
                style={{
                    position: 'absolute',
                    left: 16,
                    fontSize: vars.typography['1'].fontSize,
                    color: '#b0b0b0',
                    fontFamily: 'monospace',
                    pointerEvents: 'none'
                }}
            >
                {formatTime(progress * duration)}
            </div>

            <div
                style={{
                    position: 'absolute',
                    right: 16,
                    fontSize: vars.typography['1'].fontSize,
                    color: '#b0b0b0',
                    fontFamily: 'monospace',
                    pointerEvents: 'none'
                }}
            >
                {formatTime(duration)}
            </div>

            {store.isScratching && (
                <motion.div
                    style={{
                        position: 'absolute',
                        left: thumbLeft,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#fff',
                        boxShadow: '0 0 8px rgba(170, 94, 170, 0.8)',
                        pointerEvents: 'none'
                    }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.15, repeat: Infinity }}
                />
            )}
        </div>
    );
}
