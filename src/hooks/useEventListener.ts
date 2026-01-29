import { useEffect, useRef } from 'react';
import Events, { type Event as CustomEvent } from 'utils/events';

/**
 * Custom hook for adding event listeners with automatic cleanup
 * Supports both native DOM events and custom Events system
 */

type NativeEventTarget = Window | Document | HTMLElement | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CustomEventHandler = (e: CustomEvent, ...args: any[]) => void;

/**
 * Hook for native DOM event listeners
 */
export function useEventListener<K extends keyof WindowEventMap>(
    eventName: K,
    handler: (event: WindowEventMap[K]) => void,
    element?: Window,
    options?: AddEventListenerOptions
): void;

export function useEventListener<K extends keyof DocumentEventMap>(
    eventName: K,
    handler: (event: DocumentEventMap[K]) => void,
    element: Document,
    options?: AddEventListenerOptions
): void;

export function useEventListener<K extends keyof HTMLElementEventMap>(
    eventName: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    element: HTMLElement | null,
    options?: AddEventListenerOptions
): void;

export function useEventListener(
    eventName: string,
    handler: (event: Event) => void,
    element: NativeEventTarget = typeof window !== 'undefined' ? window : null,
    options?: AddEventListenerOptions
): void {
    // Store handler in ref to avoid re-subscribing on handler change
    const savedHandler = useRef(handler);

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!element) return;

        const eventListener = (event: Event): void => {
            savedHandler.current(event);
        };

        element.addEventListener(eventName, eventListener, options);

        return () => {
            element.removeEventListener(eventName, eventListener, options);
        };
    }, [eventName, element, options]);
}

/**
 * Hook for the custom Events system used by playbackManager and other legacy code
 * @param target - The object to listen on (e.g., playbackManager)
 * @param eventName - Event name to listen for
 * @param handler - Event handler function
 */
export function useCustomEvent(
    target: unknown,
    eventName: string,
    handler: CustomEventHandler
): void {
    const savedHandler = useRef(handler);

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!target) return;

        const eventListener: CustomEventHandler = (event, ...args) => {
            savedHandler.current(event, ...args);
        };

        Events.on(target, eventName, eventListener);

        return () => {
            Events.off(target, eventName, eventListener);
        };
    }, [target, eventName]);
}

/**
 * Hook for multiple custom events on the same target
 * @param target - The object to listen on
 * @param events - Object mapping event names to handlers
 */
export function useCustomEvents(target: unknown, events: Record<string, CustomEventHandler>): void {
    const savedHandlers = useRef(events);

    useEffect(() => {
        savedHandlers.current = events;
    }, [events]);

    useEffect(() => {
        if (!target) return;

        const listeners = Object.entries(savedHandlers.current).map(([eventName]) => {
            const listener: CustomEventHandler = (event, ...args) => {
                savedHandlers.current[eventName]?.(event, ...args);
            };
            Events.on(target, eventName, listener);
            return { eventName, listener };
        });

        return () => {
            listeners.forEach(({ eventName, listener }) => {
                Events.off(target, eventName, listener);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, Object.keys(events).join(',')]);
}

export default useEventListener;
