import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from '../../../utils/dashboard';
import { Sidebar } from '../Sidebar';

// Mock dependencies
vi.mock('../../../hooks/useApi', () => ({
    useApi: () => ({
        user: { Id: 'user1', Name: 'Test User', Policy: { IsAdministrator: true } }
    })
}));

vi.mock('../../../hooks/useUserViews', () => ({
    useUserViews: () => ({
        data: {
            Items: [
                { Id: 'v1', Name: 'Movies', CollectionType: 'movies' },
                { Id: 'v2', Name: 'TV', CollectionType: 'tvshows' }
            ]
        }
    })
}));

// Use hoisted mock for uiStore
const { mockToggleDrawer } = vi.hoisted(() => ({
    mockToggleDrawer: vi.fn()
}));

vi.mock('../../../store/uiStore', () => ({
    useUiStore: vi.fn((selector) =>
        selector({
            toggleDrawer: mockToggleDrawer
        })
    )
}));

vi.mock('@tanstack/react-router', () => ({
    Link: ({ children, to, activeProps, ...props }: any) => (
        <a href={to} {...props}>
            {children}
        </a>
    )
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}));

vi.mock('../../../utils/dashboard', () => ({
    default: {
        logout: vi.fn(),
        capabilities: vi.fn(() => ({})),
        getCurrentUserId: vi.fn(() => 'user1')
    }
}));

vi.mock('../../apphost', () => {
    const host = {
        appName: vi.fn(() => 'Jellyfin'),
        appVersion: vi.fn(() => '1.0.0'),
        deviceName: vi.fn(() => 'Test Device'),
        deviceId: vi.fn(() => 'test-device-id'),
        supports: vi.fn(() => true)
    };
    return {
        appHost: host,
        safeAppHost: host
    };
});

vi.mock('../../lib/globalize', () => ({
    default: {
        translate: (key: string) => key
    }
}));

// Mock UserAvatar
vi.mock('../UserAvatar', () => ({
    default: () => <div data-testid="user-avatar">User Avatar Mock</div>
}));

describe('Sidebar', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false
                }
            }
        });
    });

    it('should render user info and library links', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <Sidebar />
            </QueryClientProvider>
        );

        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('Movies')).toBeInTheDocument();
        expect(screen.getByText('TV')).toBeInTheDocument();
    });

    it('should call logout when sign out clicked', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <Sidebar />
            </QueryClientProvider>
        );

        fireEvent.click(screen.getByText('SignOut'));
        expect(Dashboard.logout).toHaveBeenCalled();
    });
});
