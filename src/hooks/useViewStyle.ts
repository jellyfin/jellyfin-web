/**
 * useViewStyle Hook
 *
 * Manages view style (List, Poster, etc.) persistence in localStorage.
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

type ViewStyle = 'List' | 'Poster' | 'PosterCard' | 'ThumbCard' | 'Banner' | 'Detail';

export type { ViewStyle };

interface UseViewStyleOptions {
    defaultView?: ViewStyle;
    storageKey?: string;
}

interface UseViewStyleReturn {
    viewStyle: ViewStyle;
    setViewStyle: (value: ViewStyle) => void;
    toggleViewStyle: (styles: ViewStyle[]) => void;
}

export const useViewStyle = (
    componentKey: string,
    defaultView: ViewStyle = 'Poster',
    options: UseViewStyleOptions = {}
): UseViewStyleReturn => {
    const { storageKey = 'jellyfin-view-style' } = options;

    const [viewStyle, setViewStyleState] = useState<ViewStyle>(defaultView);
    const [storedValue, setStoredValue] = useLocalStorage<ViewStyle>(`${storageKey}-${componentKey}`, defaultView);

    useEffect(() => {
        if (storedValue) {
            setViewStyleState(storedValue);
        }
    }, [storedValue]);

    const setViewStyle = useCallback(
        (value: ViewStyle) => {
            setViewStyleState(value);
            setStoredValue(value);
        },
        [setStoredValue]
    );

    const toggleViewStyle = useCallback(
        (styles: ViewStyle[]) => {
            const currentIndex = styles.indexOf(viewStyle);
            const nextIndex = (currentIndex + 1) % styles.length;
            setViewStyle(styles[nextIndex]);
        },
        [viewStyle, setViewStyle]
    );

    return {
        viewStyle,
        setViewStyle,
        toggleViewStyle
    };
};

export default useViewStyle;
