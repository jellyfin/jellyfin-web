import { useEffect, useRef } from 'react';

/**
 * A hook that returns the previous value of a stateful value.
 * @param value A stateful value created by a `useState` hook.
 * @param initialValue The default value.
 * @returns The previous value.
 */
export function usePrevious<T>(value: T, initialValue?: T): T | undefined {
    const ref = useRef<T | undefined>(initialValue);

    useEffect(() => {
        ref.current = value;
    }, [ value ]);

    return ref.current;
}
