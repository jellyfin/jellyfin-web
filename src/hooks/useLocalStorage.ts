/**
 * useLocalStorage Hook
 *
 * Persists state to localStorage with type safety.
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from 'utils/logger';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            logger.warn(`Error reading localStorage key "${key}"`, { error, component: 'useLocalStorage' });
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            logger.warn(`Error setting localStorage key "${key}"`, { error, component: 'useLocalStorage' });
        }
    }, [key, storedValue]);

    const setValue = useCallback(
        (value: T | ((prev: T) => T)) => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
            } catch (error) {
                logger.warn(`Error setting localStorage key "${key}"`, { error, component: 'useLocalStorage' });
            }
        },
        [key, storedValue]
    );

    return [storedValue, setValue];
}

export default useLocalStorage;
