import { useEffect } from 'react';
import { useNavigationType } from 'react-router-dom';

const SCROLL_KEY_PREFIX = 'jellyfin-scroll:';

/**
 * Saves the window scroll position to sessionStorage when the component unmounts, and restores it when remounting.
 * @param key A unique key to identify the scroll position in sessionStorage.
 */
export function useScrollRestoration(key: string) {
    const navigationType = useNavigationType();

    useEffect(() => {
        const storageKey = `${SCROLL_KEY_PREFIX}${key}`;

        if (navigationType === 'POP') {
            const savedScroll = sessionStorage.getItem(storageKey);
            if (savedScroll !== null) {
                const scrollTop = parseInt(savedScroll, 10);
                requestAnimationFrame(() => {
                    window.scrollTo(0, scrollTop);
                });
            }
        }

        return () => {
            sessionStorage.setItem(storageKey, String(Math.round(window.scrollY)));
        };
    // Intentionally capture navigationType and key at mount time only
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
