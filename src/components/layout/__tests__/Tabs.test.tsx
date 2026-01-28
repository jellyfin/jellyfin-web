import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { Tabs } from '../Tabs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Events from '../../../utils/events';
import { EventType } from '../../../constants/eventType';

// Mock dependencies
vi.mock('ui-primitives', () => {
    const Tabs = ({ children, value }: any) => <div data-testid="tabs-root" data-value={value}>{children}</div>;
    const TabList = ({ children }: any) => <div>{children}</div>;
    const Tab = ({ children, value }: any) => <button data-testid={`tab-${value}`}>{children}</button>;
    const Box = ({ children }: any) => <div>{children}</div>;
    return { Tabs, TabList, Tab, Box };
});

vi.mock('../maintabsmanager', () => ({
    default: {
        selectedTabIndex: vi.fn()
    }
}));

// Mock apphost and dashboard to prevent ServerConnections error
vi.mock('../../../utils/dashboard', () => ({
    default: {
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

describe('Tabs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render tabs when EventType.SET_TABS is triggered', () => {
        render(<Tabs />);
        
        expect(screen.queryByTestId('tabs-root')).not.toBeInTheDocument();

        act(() => {
            Events.trigger(document, EventType.SET_TABS, [
                'test',
                0,
                [
                    { name: 'Tab 1', enabled: true },
                    { name: 'Tab 2', enabled: true }
                ]
            ]);
        });

        expect(screen.getByTestId('tabs-root')).toBeInTheDocument();
        expect(screen.getByText('Tab 1')).toBeInTheDocument();
        expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });

    it('should update selected tab when EventType.SET_TABS is triggered with new index', () => {
        render(<Tabs />);
        
        act(() => {
            Events.trigger(document, EventType.SET_TABS, [
                'test',
                1,
                [{ name: 'Tab 1' }, { name: 'Tab 2' }]
            ]);
        });

        expect(screen.getByTestId('tabs-root')).toHaveAttribute('data-value', '1');
    });
});