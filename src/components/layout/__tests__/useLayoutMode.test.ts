import { renderHook } from '@testing-library/react';
import { useLayoutMode } from '../useLayoutMode';
import { LayoutMode } from '../../../constants/layoutMode';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
const mockUseLocation = vi.fn();

vi.mock('@tanstack/react-router', () => ({
    useLocation: () => mockUseLocation()
}));

// Mock browser script
vi.mock('../../../scripts/browser', () => ({
    default: {
        tv: false
    }
}));

// Mock DASHBOARD_APP_PATHS
vi.mock('../../../apps/dashboard/routes/routes', () => ({
    DASHBOARD_APP_PATHS: {
        Dashboard: 'dashboard',
        Settings: 'settings'
    }
}));

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        clear: () => {
            store = {};
        },
        removeItem: (key: string) => {
            delete store[key];
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('useLayoutMode', () => {
    beforeEach(() => {
        mockUseLocation.mockReturnValue({ pathname: '/' });
        localStorage.clear();
        vi.clearAllMocks();
        // Reset browser mock if needed, but here it's simple
    });

    it('should default to experimental layout if no setting is present', () => {
        const { result } = renderHook(() => useLayoutMode());

        expect(result.current.isExperimentalLayout).toBe(true);
        expect(result.current.shouldHideLegacyHeader).toBe(true);
    });

    it('should respect legacy desktop setting', () => {
        localStorage.setItem('layout', LayoutMode.Desktop);
        const { result } = renderHook(() => useLayoutMode());

        expect(result.current.layoutMode).toBe(LayoutMode.Desktop);
        expect(result.current.isExperimentalLayout).toBe(false);
        expect(result.current.shouldHideLegacyHeader).toBe(false);
    });

    it('should force experimental/hidden header on dashboard paths', () => {
        // Even if legacy desktop is set
        localStorage.setItem('layout', LayoutMode.Desktop);
        mockUseLocation.mockReturnValue({ pathname: '/dashboard' });
        
        const { result } = renderHook(() => useLayoutMode());

        expect(result.current.isNewLayoutPath).toBe(true);
        expect(result.current.shouldHideLegacyHeader).toBe(true);
    });
});
