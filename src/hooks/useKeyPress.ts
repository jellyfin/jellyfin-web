/**
 * useKeyPress Hook
 *
 * Tracks which keys are currently pressed.
 */

import { useState, useEffect, useCallback } from 'react';

type KeyPressMap = Record<string, boolean>;

export function useKeyPress(targetKey?: string): boolean {
    const [keyPressed, setKeyPressed] = useState(false);

    const downHandler = useCallback(
        (event: KeyboardEvent) => {
            if (targetKey && event.key !== targetKey) return;
            if (event.repeat) return;
            setKeyPressed(true);
        },
        [targetKey]
    );

    const upHandler = useCallback(
        (event: KeyboardEvent) => {
            if (targetKey && event.key !== targetKey) return;
            setKeyPressed(false);
        },
        [targetKey]
    );

    useEffect(() => {
        window.addEventListener('keydown', downHandler);
        window.addEventListener('keyup', upHandler);

        return () => {
            window.removeEventListener('keydown', downHandler);
            window.removeEventListener('keyup', upHandler);
        };
    }, [downHandler, upHandler]);

    return keyPressed;
}

export function useMultipleKeysPress(): KeyPressMap {
    const [keysPressed, setKeysPressed] = useState<KeyPressMap>({});

    const downHandler = useCallback((event: KeyboardEvent) => {
        if (event.repeat) return;
        setKeysPressed(prev => ({ ...prev, [event.key]: true }));
    }, []);

    const upHandler = useCallback((event: KeyboardEvent) => {
        setKeysPressed(prev => {
            const next = { ...prev };
            delete next[event.key];
            return next;
        });
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', downHandler);
        window.addEventListener('keyup', upHandler);

        return () => {
            window.removeEventListener('keydown', downHandler);
            window.removeEventListener('keyup', upHandler);
        };
    }, [downHandler, upHandler]);

    return keysPressed;
}

export default useKeyPress;
