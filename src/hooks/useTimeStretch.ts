/**
 * useTimeStretch - Hook for DJ-style time-stretching integration
 *
 * Handles smooth tempo transitions during pause/resume for that
 * classic DJ "slow to stop" effect
 *
 * Usage:
 * ```typescript
 * const { isTransitioning, pause, resume } = useTimeStretch();
 * ```
 */

import { useEffect, useRef, useCallback } from 'react';
import { useTimeStretchStore } from 'store/timeStretchStore';
import { loadAudioWasm, createTimeStretcher } from 'components/audioEngine';
import { logger } from 'utils/logger';

interface TimeStretcher {
    setTempo(tempo: number): void;
    getTempo(): number;
    process(input: Float32Array, numFrames: number): Float32Array;
    reset(): void;
    begin_pause_transition?(durationSeconds: number): void;
    begin_resume_transition?(durationSeconds: number): void;
    is_transitioning?(): boolean;
    is_stopped?(): boolean;
    beginPauseTransition?(durationSeconds: number): void;
    beginResumeTransition?(durationSeconds: number): void;
    isTransitioning?(): boolean;
    isStopped?(): boolean;
}

export function useTimeStretch() {
    const stretcherRef = useRef<TimeStretcher | null>(null);
    const isInitialized = useRef(false);

    const { enabled, pauseDuration, resumeDuration, setIsTransitioning, setIsStopped } = useTimeStretchStore();

    const initializeStretcher = useCallback(async () => {
        if (isInitialized.current) return;

        try {
            const wasm = await loadAudioWasm();
            stretcherRef.current = await createTimeStretcher(44100, 2, 1024);
            isInitialized.current = true;
            logger.info('[useTimeStretch] Initialized time stretcher', { component: 'useTimeStretch' });
        } catch (error) {
            logger.warn('[useTimeStretch] Failed to initialize', { component: 'useTimeStretch' }, error as Error);
        }
    }, []);

    const pause = useCallback(
        (duration?: number) => {
            if (!enabled) return;

            const stretcher = stretcherRef.current;
            if (!stretcher) {
                initializeStretcher();
                return;
            }

            const transitionDuration = duration ?? pauseDuration;

            if (stretcher.begin_pause_transition) {
                stretcher.begin_pause_transition(transitionDuration);
            } else if (stretcher.beginPauseTransition) {
                stretcher.beginPauseTransition(transitionDuration);
            }

            setIsTransitioning(true);
            logger.info(`[useTimeStretch] Pause transition: ${transitionDuration}s`, { component: 'useTimeStretch' });
        },
        [enabled, pauseDuration, initializeStretcher, setIsTransitioning]
    );

    const resume = useCallback(
        (duration?: number) => {
            if (!enabled) return;

            const stretcher = stretcherRef.current;
            if (!stretcher) {
                initializeStretcher();
                return;
            }

            const transitionDuration = duration ?? resumeDuration;

            if (stretcher.begin_resume_transition) {
                stretcher.begin_resume_transition(transitionDuration);
            } else if (stretcher.beginResumeTransition) {
                stretcher.beginResumeTransition(transitionDuration);
            }

            setIsTransitioning(true);
            logger.info(`[useTimeStretch] Resume transition: ${transitionDuration}s`, { component: 'useTimeStretch' });
        },
        [enabled, resumeDuration, initializeStretcher, setIsTransitioning]
    );

    const setTempo = useCallback((tempo: number) => {
        const stretcher = stretcherRef.current;
        if (stretcher) {
            stretcher.setTempo(tempo);
        }
    }, []);

    const getTempo = useCallback(() => {
        const stretcher = stretcherRef.current;
        return stretcher?.getTempo() ?? 1.0;
    }, []);

    const isTransitioning = useCallback(() => {
        const stretcher = stretcherRef.current;
        if (!stretcher) return false;

        if (stretcher.is_transitioning) {
            return stretcher.is_transitioning();
        }
        if (stretcher.isTransitioning) {
            return stretcher.isTransitioning();
        }
        return false;
    }, []);

    const isStopped = useCallback(() => {
        const stretcher = stretcherRef.current;
        if (!stretcher) return false;

        if (stretcher.is_stopped) {
            return stretcher.is_stopped();
        }
        if (stretcher.isStopped) {
            return stretcher.isStopped();
        }
        return stretcher.getTempo() < 0.001;
    }, []);

    const reset = useCallback(() => {
        const stretcher = stretcherRef.current;
        if (stretcher) {
            stretcher.reset();
            setIsTransitioning(false);
            setIsStopped(false);
        }
    }, [setIsTransitioning, setIsStopped]);

    const processAudio = useCallback((input: Float32Array, numFrames: number): Float32Array => {
        const stretcher = stretcherRef.current;
        if (!stretcher) return input;

        return stretcher.process(input, numFrames);
    }, []);

    useEffect(() => {
        if (enabled && !isInitialized.current) {
            initializeStretcher();
        }
    }, [enabled, initializeStretcher]);

    useEffect(() => {
        return () => {
            reset();
        };
    }, [reset]);

    return {
        pause,
        resume,
        setTempo,
        getTempo,
        isTransitioning,
        isStopped,
        reset,
        processAudio,
        isInitialized: isInitialized.current
    };
}

export default useTimeStretch;
