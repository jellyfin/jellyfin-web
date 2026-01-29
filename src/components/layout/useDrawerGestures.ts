import { useEffect, useRef } from 'react';
import browser from '../../scripts/browser';
import { useUiStore } from '../../store/uiStore';

export const useDrawerGestures = () => {
    const toggleDrawer = useUiStore((state) => state.toggleDrawer);
    const isDrawerOpen = useUiStore((state) => state.isDrawerOpen);

    // Refs to store state without triggering re-renders
    const startX = useRef<number>(0);
    const startY = useRef<number>(0);
    const startTime = useRef<number>(0);
    const isSwiping = useRef<boolean>(false);

    useEffect(() => {
        if (!browser.touch) return;

        const handleTouchStart = (e: TouchEvent) => {
            // Only handle edge swipe if drawer is closed
            if (isDrawerOpen) return;

            const touch = e.touches[0];
            if (!touch) return;

            // Edge detection (20px from left)
            // TODO: Handle RTL
            if (touch.clientX > 20) return;

            startX.current = touch.clientX;
            startY.current = touch.clientY;
            startTime.current = Date.now();
            isSwiping.current = true;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isSwiping.current || isDrawerOpen) return;
            // Prevent scrolling while swiping
            // e.preventDefault(); // Passive listener cannot prevent default
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!isSwiping.current || isDrawerOpen) return;

            const touch = e.changedTouches[0];
            if (!touch) return;

            const deltaX = touch.clientX - startX.current;
            const deltaY = touch.clientY - startY.current;
            const time = Date.now() - startTime.current;
            const velocity = Math.abs(deltaX) / time;

            // Thresholds based on navdrawer.js logic (simplified)
            // navdrawer.js: velocity >= 0.4 || newPos >= 100
            if (deltaX > 70 || (deltaX > 20 && velocity > 0.3)) {
                // Check if it was mostly horizontal
                if (Math.abs(deltaY) < Math.abs(deltaX)) {
                    toggleDrawer(true);
                }
            }

            isSwiping.current = false;
        };

        // Passive listeners for better performance
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDrawerOpen, toggleDrawer]);
};
