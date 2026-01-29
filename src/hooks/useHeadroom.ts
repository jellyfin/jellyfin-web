import { useCallback, useEffect, useRef, useState } from 'react';

interface UseHeadroomOptions {
    threshold?: number;
    tolerance?: number;
    onPin?: () => void;
    onUnpin?: () => void;
    onRelease?: () => void;
}

interface UseHeadroomReturn {
    isPinned: boolean;
    isUnpinned: boolean;
    elementRef: React.RefObject<HTMLElement | null>;
}

export function useHeadroom(options: UseHeadroomOptions = {}): UseHeadroomReturn {
    const { threshold = 0, tolerance = 5, onPin, onUnpin, onRelease } = options;
    const [isPinned, setIsPinned] = useState(true);
    const [isUnpinned, setIsUnpinned] = useState(false);
    const elementRef = useRef<HTMLElement | null>(null);
    const lastScrollY = useRef(0);
    const isReleased = useRef(false);

    const handleScroll = useCallback(() => {
        const element = elementRef.current;
        if (!element) return;

        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY.current;

        if (Math.abs(delta) < tolerance) return;

        if (delta > 0 && currentScrollY > threshold && !isUnpinned) {
            setIsUnpinned(true);
            setIsPinned(false);
            onUnpin?.();
            isReleased.current = true;
            onRelease?.();
        } else if (delta < 0 && isUnpinned) {
            setIsUnpinned(false);
            setIsPinned(true);
            onPin?.();
            isReleased.current = false;
        }

        lastScrollY.current = currentScrollY;
    }, [threshold, tolerance, onPin, onUnpin, onRelease]);

    useEffect(() => {
        lastScrollY.current = window.scrollY;
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    return { isPinned, isUnpinned, elementRef };
}
