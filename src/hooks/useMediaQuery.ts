/**
 * useMediaQuery Hook
 *
 * Tracks whether a media query matches, for responsive design.
 */

import { useCallback, useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
    const getMatches = useCallback((q: string): boolean => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(q).matches;
    }, []);

    const [matches, setMatches] = useState(() => getMatches(query));

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(query);
        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        setMatches(mediaQuery.matches);

        try {
            mediaQuery.addEventListener('change', handler);
        } catch {
            mediaQuery.addListener(handler);
        }

        return () => {
            try {
                mediaQuery.removeEventListener('change', handler);
            } catch {
                mediaQuery.removeListener(handler);
            }
        };
    }, [query]);

    return matches;
}

export function useBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' {
    const isXs = useMediaQuery('(max-width: 599.95px)');
    const isSm = useMediaQuery('(min-width: 600px) and (max-width: 959.95px)');
    const isMd = useMediaQuery('(min-width: 960px) and (max-width: 1279.95px)');
    const isLg = useMediaQuery('(min-width: 1280px) and (max-width: 1919.95px)');
    const isXl = useMediaQuery('(min-width: 1920px) and (max-width: 2559.95px)');
    const isXxl = useMediaQuery('(min-width: 2560px)');

    if (isXxl) return 'xxl';
    if (isXl) return 'xl';
    if (isLg) return 'lg';
    if (isMd) return 'md';
    if (isSm) return 'sm';
    return 'xs';
}

export default useMediaQuery;
