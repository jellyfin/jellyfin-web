import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { LayoutProvider } from '../LayoutProvider';
import { useUiStore } from '../../../store/uiStore';
import { LayoutMode } from '../../../constants/layoutMode';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import browser from '../../../scripts/browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock browser
vi.mock('../../../scripts/browser', () => ({
    default: {
        tv: false,
        mobile: false,
        touch: false
    }
}));

// Mock utils/dashboard
vi.mock('../../../utils/dashboard', () => ({
    default: {
        logout: vi.fn(),
        capabilities: vi.fn(() => ({})),
        getCurrentUserId: vi.fn(() => 'test-user')
    }
}));

// Mock AppHeader to verify it's rendered and hidden/shown
vi.mock('../../AppHeader', () => ({
    default: ({ isHidden }: { isHidden: boolean }) => (
        <div data-testid="legacy-header" style={isHidden ? { display: 'none' } : {}}>Legacy Header</div>
    )
}));

// Mock Header and Sidebar inside MainLayout
vi.mock('../Header', () => ({
    Header: () => <div data-testid="modern-header">Modern Header</div>
}));

vi.mock('../Sidebar', () => ({
    Sidebar: () => <div data-testid="modern-sidebar">Modern Sidebar</div>
}));

// Mock Dashboard paths
vi.mock('../../apps/dashboard/routes/routes', () => ({
    DASHBOARD_APP_PATHS: {
        Dashboard: 'dashboard'
    }
}));

// Mock TanStack Router
const mockUseLocation = vi.fn();
vi.mock('@tanstack/react-router', () => ({
    useLocation: () => mockUseLocation(),
    Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
    useRouter: () => ({ navigate: vi.fn() })
}));

describe('Layout Integration', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseLocation.mockReturnValue({ pathname: '/' });
        localStorage.clear();
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        
        // Reset store
        useUiStore.setState({
            layout: LayoutMode.Auto,
            effectiveLayout: 'desktop',
            isDrawerOpen: false
        });
    });

    it('should switch from legacy to experimental layout when store state changes', () => {
        localStorage.setItem('layout', LayoutMode.Desktop);
        const { rerender } = render(
            <QueryClientProvider client={queryClient}>
                <LayoutProvider>
                    <div data-testid="content">Content</div>
                </LayoutProvider>
            </QueryClientProvider>
        );

        // Initially Auto -> Desktop (Legacy)
        expect(screen.getByTestId('legacy-header')).toBeInTheDocument();
        expect(screen.getByTestId('legacy-header')).toBeVisible();
        // AppBody mock might be needed or just check content
        expect(screen.getByTestId('content')).toBeInTheDocument();

        // Switch to Experimental
        act(() => {
            useUiStore.getState().setLayout(LayoutMode.Experimental);
        });

        rerender(
            <QueryClientProvider client={queryClient}>
                <LayoutProvider>
                    <div data-testid="content">Content</div>
                </LayoutProvider>
            </QueryClientProvider>
        );

        // Now should show Modern Layout
        expect(screen.getByTestId('modern-header')).toBeInTheDocument();
        expect(screen.getByTestId('modern-sidebar')).toBeInTheDocument();
        // Legacy header should be present but HIDDEN
        expect(screen.getByTestId('legacy-header')).toBeInTheDocument();
        expect(screen.getByTestId('legacy-header')).not.toBeVisible();
    });

    it('should force experimental layout on dashboard paths regardless of store state', () => {
        mockUseLocation.mockReturnValue({ pathname: '/dashboard' });
        
        // Even if layout is set to Desktop
        act(() => {
            useUiStore.getState().setLayout(LayoutMode.Desktop);
        });

        render(
            <QueryClientProvider client={queryClient}>
                <LayoutProvider>
                    <div data-testid="content">Content</div>
                </LayoutProvider>
            </QueryClientProvider>
        );

        // On dashboard path, LayoutProvider renders children directly
        expect(screen.getByTestId('content')).toBeInTheDocument();
        expect(screen.queryByTestId('modern-header')).not.toBeInTheDocument();
        expect(screen.getByTestId('legacy-header')).toBeInTheDocument();
        expect(screen.getByTestId('legacy-header')).not.toBeVisible();
    });
});