import { renderHook } from '@testing-library/react';
import { useDrawerGestures } from '../useDrawerGestures';
import { useUiStore } from '../../../store/uiStore';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import browser from '../../../scripts/browser';

// Mock browser
vi.mock('../../../scripts/browser', () => ({
    default: {
        touch: true
    }
}));

describe('useDrawerGestures', () => {
    const toggleDrawer = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup store mock
        useUiStore.setState({
            isDrawerOpen: false,
            toggleDrawer: toggleDrawer
        });
        
        // Mock addEventListener on document
        vi.spyOn(document, 'addEventListener');
        vi.spyOn(document, 'removeEventListener');
    });

    it('should add event listeners when touch is supported', () => {
        renderHook(() => useDrawerGestures());

        expect(document.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
        expect(document.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: true });
        expect(document.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: true });
    });

    it('should NOT add event listeners when touch is NOT supported', () => {
        (browser as any).touch = false;
        renderHook(() => useDrawerGestures());

        expect(document.addEventListener).not.toHaveBeenCalledWith('touchstart', expect.any(Function), expect.any(Object));
    });

    it('should toggle drawer on valid swipe', () => {
        (browser as any).touch = true;
        renderHook(() => useDrawerGestures());

        // Simulate touch start at edge
        const touchStart = new TouchEvent('touchstart', {
            touches: [{ clientX: 10, clientY: 100 } as any]
        });
        document.dispatchEvent(touchStart);

        // Simulate touch end after swipe
        const touchEnd = new TouchEvent('touchend', {
            changedTouches: [{ clientX: 100, clientY: 100 } as any]
        });
        // We need to wait a bit or mock Date.now to test velocity
        // But for simplicity, let's just test deltaX
        
        document.dispatchEvent(touchEnd);

        expect(toggleDrawer).toHaveBeenCalledWith(true);
    });

    it('should NOT toggle drawer on vertical swipe', () => {
        (browser as any).touch = true;
        renderHook(() => useDrawerGestures());

        document.dispatchEvent(new TouchEvent('touchstart', {
            touches: [{ clientX: 10, clientY: 100 } as any]
        }));

        document.dispatchEvent(new TouchEvent('touchend', {
            changedTouches: [{ clientX: 50, clientY: 300 } as any]
        }));

        expect(toggleDrawer).not.toHaveBeenCalled();
    });
});
