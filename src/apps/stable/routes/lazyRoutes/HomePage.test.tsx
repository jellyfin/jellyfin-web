import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import mainTabsManager from 'components/maintabsmanager';
import React from 'react';
import Events from 'utils/events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from './HomePage';

vi.mock('hooks/useSearchParams', () => ({
    useSearchParams: () => [new URLSearchParams('tab=0')]
}));

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string) => key
    }
}));

vi.mock('components/backdrop/backdrop', async (importOriginal) => {
    const actual = await importOriginal<typeof import('components/backdrop/backdrop')>();
    return {
        ...actual,
        clearBackdrop: vi.fn(),
        setBackdropTransparency: vi.fn()
    };
});

vi.mock('components/layoutManager', () => ({
    default: { tv: false }
}));

vi.mock('components/Page', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="page">{children}</div>
    )
}));

vi.mock('constants/eventType', () => ({
    EventType: { HEADER_RENDERED: 'header-rendered' }
}));

vi.mock('utils/events', () => ({
    default: {
        on: vi.fn(),
        off: vi.fn()
    }
}));

vi.mock('scripts/libraryMenu', () => ({
    default: {
        setTitle: vi.fn()
    }
}));

vi.mock('components/maintabsmanager', () => ({
    default: {
        setTabs: vi.fn(),
        selectedTabIndex: vi.fn()
    }
}));

vi.mock('audio-driver/bridge/StoreSync', () => ({
    storeSync: {
        start: vi.fn()
    }
}));

describe('HomePage', () => {
    beforeEach(() => {
        const headerTabs = document.createElement('div');
        headerTabs.className = 'headerTabs';
        document.body.appendChild(headerTabs);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('renders tab containers and initializes tabs', async () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false }
            }
        });
        render(
            <QueryClientProvider client={queryClient}>
                <HomePage />
            </QueryClientProvider>
        );

        expect(screen.getByText('Your Libraries')).toBeInTheDocument();
    });
});
