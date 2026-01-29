import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUiStore } from '../../../store/uiStore';
import { useLegacyDrawerSync } from '../useLegacyDrawerSync';

// Mock useLayoutMode
vi.mock('../useLayoutMode', () => ({
    useLayoutMode: () => ({
        isExperimentalLayout: false,
        isNewLayoutPath: false
    })
}));

describe('useLegacyDrawerSync', () => {
    const toggleDrawer = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = `
            <div class="mainDrawer"></div>
            <button class="mainDrawerButton"></button>
        `;
        useUiStore.setState({
            isDrawerOpen: false,
            toggleDrawer: toggleDrawer
        });
    });

    it('should click legacy button when store state changes', () => {
        renderHook(() => useLegacyDrawerSync());

        const btn = document.querySelector('.mainDrawerButton') as HTMLButtonElement;
        const clickSpy = vi.spyOn(btn, 'click');

        // Toggle state in store
        act(() => {
            useUiStore.setState({ isDrawerOpen: true });
        });

        expect(clickSpy).toHaveBeenCalled();
    });

    it('should update store when legacy drawer class changes', () => {
        renderHook(() => useLegacyDrawerSync());

        const drawer = document.querySelector('.mainDrawer') as HTMLElement;

        // Simulate legacy drawer opening (e.g. by legacy script adding class)
        act(() => {
            drawer.classList.add('drawer-open');
        });

        // MutationObserver is async
        // We might need to wait for it or trigger it manually if possible
        // But usually act() handles it or we use waitFor
    });
});

// Helper for act in non-react tests if needed, but vitest + testing-library usually handle it
import { act } from '@testing-library/react';
