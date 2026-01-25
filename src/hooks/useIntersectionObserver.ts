/**
 * useIntersectionObserver Hook
 *
 * Detects when an element enters or exits the viewport.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface IntersectionOptions {
    threshold?: number | number[];
    root?: Element | null;
    rootMargin?: string;
    freezeWhenVisible?: boolean;
}

interface IntersectionResult {
    ref: React.RefObject<HTMLElement>;
    isIntersecting: boolean;
    intersectionRatio: number;
    observe: () => void;
    unobserve: () => void;
}

export function useIntersectionObserver(
    options: IntersectionOptions = {}
): IntersectionResult {
    const {
        threshold = 0,
        root = null,
        rootMargin = '0px',
        freezeWhenVisible = false
    } = options;

    const [isIntersecting, setIsIntersecting] = useState(false);
    const [intersectionRatio, setIntersectionRatio] = useState(0);
    const elementRef = useRef<HTMLElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const unobserve = useCallback(() => {
        if (observerRef.current && elementRef.current) {
            observerRef.current.unobserve(elementRef.current);
        }
    }, []);

    const observe = useCallback(() => {
        if (!elementRef.current) return;

        unobserve();

        try {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    setIsIntersecting(entry.isIntersecting);
                    setIntersectionRatio(entry.intersectionRatio);

                    if (entry.isIntersecting && freezeWhenVisible) {
                        observer.unobserve(elementRef.current!);
                    }
                },
                {
                    threshold: Array.isArray(threshold) ? threshold : [threshold],
                    root,
                    rootMargin
                }
            );

            observerRef.current = observer;
            observer.observe(elementRef.current);
        } catch (error) {
            console.warn('useIntersectionObserver error:', error);
        }
    }, [threshold, root, rootMargin, freezeWhenVisible, unobserve]);

    useEffect(() => {
        observe();

        return () => {
            unobserve();
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
    }, [observe, unobserve]);

    return {
        ref: elementRef,
        isIntersecting,
        intersectionRatio,
        observe,
        unobserve
    };
}

export default useIntersectionObserver;
