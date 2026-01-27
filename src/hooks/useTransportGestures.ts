import { useCallback, useRef } from 'react';
import { useMotionValue, useTransform, MotionValue } from 'motion/react';
import { useBackspinStore } from '../store/backspinStore';
import { backspinHandler } from '../components/audioEngine/backspinHandler';
import { HAPTIC_PATTERNS } from '../types/transport';

export interface UseTransportGesturesOptions {
    enabled?: boolean;
    onSeekExpand?: () => void;
    onSeekCollapse?: () => void;
    onZoom?: (level: number) => void;
}

export interface UseTransportGesturesReturn {
    bind: () => Record<string, any>;
    positionX: MotionValue<number>;
    positionY: MotionValue<number>;
    rotation: MotionValue<number>;
}

export function useTransportGestures(options: UseTransportGesturesOptions = {}): UseTransportGesturesReturn {
    const { enabled = true, onSeekExpand, onSeekCollapse, onZoom } = options;

    const positionX = useMotionValue(0);
    const positionY = useMotionValue(0);
    const rotation = useMotionValue(0);

    const store = useBackspinStore();
    const hapticEnabled = store.config.hapticEnabled;

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

    const isPausedState = store.state === 'PAUSED_HELD' || store.state === 'PAUSING_SLOWDOWN';
    const isPlayingState = store.state === 'LOCKED_PLAYING' || store.state === 'RESUMING_SPINUP';

    const bind = useCallback(() => {
        if (!enabled) return {};

        return {
            onClick: (event: React.MouseEvent) => {
                const isPauseButton = (event.target as HTMLElement).closest('.transport-pause');
                const isPlayButton = (event.target as HTMLElement).closest('.transport-play');

                if (isPauseButton && isPlayingState) {
                    backspinHandler.pauseEngage();
                    triggerHaptic('click');
                } else if (isPlayButton && isPausedState) {
                    backspinHandler.pauseDisengage();
                    triggerHaptic('click');
                }
            },
            onDoubleClick: (event: React.MouseEvent) => {
                const isSeekBar =
                    (event.target as HTMLElement).closest('.seek-bar') ||
                    (event.target as HTMLElement).closest('.wavesurfer-container');

                if (isSeekBar) {
                    if (store.isExpanded) {
                        onSeekCollapse?.();
                    } else {
                        onSeekExpand?.();
                    }
                    store.setExpanded(!store.isExpanded);
                    triggerHaptic('double_tap');
                }
            },
            onMouseDown: (event: React.MouseEvent) => {
                const isPauseButton = (event.target as HTMLElement).closest('.transport-pause');
                if (isPauseButton && isPlayingState) {
                    backspinHandler.pauseEngage();
                    triggerHaptic('brake_start');
                }
            },
            onMouseUp: () => {
                if (isPausedState) {
                    backspinHandler.pauseDisengage();
                    triggerHaptic('spin_up_complete');
                }
            },
            onTouchStart: (event: React.TouchEvent) => {
                const isPauseButton = (event.target as HTMLElement).closest('.transport-pause');
                if (isPauseButton && isPlayingState) {
                    backspinHandler.pauseEngage();
                    triggerHaptic('brake_start');
                }
            },
            onTouchEnd: () => {
                if (isPausedState) {
                    backspinHandler.pauseDisengage();
                    triggerHaptic('spin_up_complete');
                }
            }
        };
    }, [enabled, isPlayingState, isPausedState, store.isExpanded, onSeekExpand, onSeekCollapse, triggerHaptic]);

    return {
        bind,
        positionX,
        positionY,
        rotation
    };
}
