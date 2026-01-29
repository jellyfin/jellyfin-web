import { useEffect, useRef, useState } from 'react';
import { backspinHandler } from '../components/audioEngine/backspinHandler';
import { useAudioStore } from '../store/audioStore';
import { useBackspinStore } from '../store/backspinStore';
import { getSessionId, RequestContext } from '../utils/observability';

export function useAudioEngine() {
    const audioContext = useAudioStore((state) => state.audioContext);
    const isInitialized = useRef(false);
    const [isReady, setIsReady] = useState(false);
    const backspinAudioContext = useBackspinStore((state) => state.audioContext);
    const mediaElementRef = useRef<HTMLMediaElement | null>(null);

    const initializeWithMediaElement = useEffect(() => {
        return () => {
            if (isInitialized.current) {
                RequestContext.emit({
                    operation: 'audioEngineCleanup',
                    component: 'useAudioEngine',
                    outcome: 'success',
                    businessContext: {
                        wasInitialized: true,
                        mediaElementAttached: !!mediaElementRef.current
                    }
                });

                backspinHandler.destroy();
                isInitialized.current = false;
                setIsReady(false);
            }
        };
    }, []);

    useEffect(() => {
        if (!audioContext || isInitialized.current) {
            return;
        }

        RequestContext.withContext(
            {
                operation: 'initializeAudioEngine',
                component: 'useAudioEngine',
                sessionId: getSessionId()
            },
            async () => {
                const startTime = Date.now();

                try {
                    await backspinHandler.initialize({
                        mediaElement: mediaElementRef.current,
                        audioContext
                    });

                    isInitialized.current = true;
                    setIsReady(true);

                    RequestContext.emit({
                        operation: 'initializeAudioEngine',
                        component: 'useAudioEngine',
                        outcome: 'success',
                        duration: Date.now() - startTime,
                        businessContext: {
                            audioContextSampleRate: audioContext.sampleRate,
                            audioContextState: audioContext.state,
                            audioContextBaseLatency: audioContext.baseLatency,
                            mediaElementAvailable: !!mediaElementRef.current
                        }
                    });
                } catch (error) {
                    RequestContext.emit(
                        {
                            operation: 'initializeAudioEngine',
                            component: 'useAudioEngine',
                            outcome: 'error',
                            duration: Date.now() - startTime,
                            businessContext: {
                                audioContextAvailable: !!audioContext,
                                audioContextState: audioContext?.state || 'unavailable',
                                mediaElementAvailable: !!mediaElementRef.current
                            }
                        },
                        error as Error
                    );
                }
            }
        );
    }, [audioContext]);

    const setMediaElement = (element: HTMLMediaElement | null) => {
        mediaElementRef.current = element;
        if (isInitialized.current && element) {
            useBackspinStore.getState().setMediaElement(element);

            RequestContext.emit({
                operation: 'setMediaElement',
                component: 'useAudioEngine',
                outcome: 'success',
                businessContext: {
                    mediaElementProvided: true,
                    engineReady: isInitialized.current
                }
            });
        }
    };

    return {
        isReady,
        handler: backspinHandler,
        audioContext: backspinAudioContext,
        setMediaElement
    };
}
