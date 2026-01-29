/**
 * useClickOutside Hook
 *
 * Detects clicks outside of a referenced element.
 */

import { RefObject, useCallback, useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLElement>(
    callback: (event: MouseEvent | TouchEvent) => void
): RefObject<T | null> {
    const ref = useRef<T>(null);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const handleEvent = useCallback((event: MouseEvent | TouchEvent) => {
        const element = ref.current;
        if (element && !element.contains(event.target as Node)) {
            callbackRef.current(event);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleEvent);
        document.addEventListener('touchstart', handleEvent);

        return () => {
            document.removeEventListener('mousedown', handleEvent);
            document.removeEventListener('touchstart', handleEvent);
        };
    }, [handleEvent]);

    return ref;
}

export default useClickOutside;
