import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import AdvancedDrawerSection from './AdvancedDrawerSection';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string) => key
    }
}));

describe('AdvancedDrawerSection', () => {
    it('renders the advanced navigation links', () => {
        render(
            <MemoryRouter>
                <AdvancedDrawerSection />
            </MemoryRouter>
        );

        const list = screen.getByRole('list', { name: 'TabAdvanced' });
        const listQueries = within(list);
        const links = [
            { name: 'TabNetworking', href: '/dashboard/networking' },
            { name: 'HeaderApiKeys', href: '/dashboard/keys' },
            { name: 'HeaderBackups', href: '/dashboard/backups' },
            { name: 'TabLogs', href: '/dashboard/logs' },
            { name: 'TabScheduledTasks', href: '/dashboard/tasks' }
        ];

        for (const link of links) {
            expect(listQueries.getByRole('link', { name: link.name })).toHaveAttribute('href', link.href);
        }
    });
});
