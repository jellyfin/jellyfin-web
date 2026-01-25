import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import HomePage from './HomePage';
import Events from 'utils/events';
import mainTabsManager from 'components/maintabsmanager';

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
        <div data-testid='page'>{children}</div>
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
        render(<HomePage />);

        expect(screen.getByTestId('page')).toBeInTheDocument();

        await waitFor(() => {
            expect(mainTabsManager.setTabs).toHaveBeenCalled();
        });

        const eventsMock = Events as unknown as { on: ReturnType<typeof vi.fn> };
        expect(eventsMock.on).toHaveBeenCalled();
    });
});
