import React from 'react';
import { listItemButtonClasses } from '@mui/material/ListItemButton';
import { screen, within } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from 'test/renderWithRouter';

import AdvancedDrawerSection from './AdvancedDrawerSection';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string) => `translated:${key}`
    }
}));

const navigation = [
    { key: 'TabNetworking', path: '/dashboard/networking' },
    { key: 'HeaderApiKeys', path: '/dashboard/keys' },
    { key: 'HeaderBackups', path: '/dashboard/backups' },
    { key: 'TabLogs', path: '/dashboard/logs' },
    { key: 'TabScheduledTasks', path: '/dashboard/tasks' }
];

const LocationObserver = () => {
    const { pathname } = useLocation();
    return <output aria-label='Current location'>{pathname}</output>;
};

function setup(initialPath = '/dashboard') {
    const result = renderWithRouter(
        <>
            <AdvancedDrawerSection />
            <LocationObserver />
        </>,
        { initialEntries: [ initialPath ] }
    );
    const list = screen.getByRole('list', { name: 'translated:TabAdvanced' });

    return { ...result, list: within(list) };
}

describe('AdvancedDrawerSection', () => {
    it('renders a labeled list with five visible links in navigation order', () => {
        const { list } = setup();

        expect(list.getByText('translated:TabAdvanced')).toBeVisible();
        expect(list.getAllByRole('listitem')).toHaveLength(5);

        const links = list.getAllByRole('link');
        expect(links).toHaveLength(5);
        for (const [ index, { key } ] of navigation.entries()) {
            const link = list.getByRole('link', { name: `translated:${key}` });
            expect(link).toBeVisible();
            expect(links[index]).toBe(link);
        }
    });

    it.each(navigation)('$key links to and navigates to $path', async ({ key, path }) => {
        const { user, list } = setup();
        const link = list.getByRole('link', { name: `translated:${key}` });

        expect(link).toHaveAttribute('href', path);
        await user.click(link);

        expect(screen.getByRole('status', { name: 'Current location' }).textContent).toBe(path);
    });

    it.each(navigation)('selects only $key when starting at $path', ({ key, path }) => {
        const { list } = setup(path);
        const selectedLink = list.getByRole('link', { name: `translated:${key}` });

        expect(selectedLink).toHaveClass(listItemButtonClasses.selected);
        for (const link of list.getAllByRole('link')) {
            if (link !== selectedLink) {
                expect(link).not.toHaveClass(listItemButtonClasses.selected);
            }
        }
    });

    it('selects no links on an unrelated route', () => {
        const { list } = setup('/dashboard');

        for (const link of list.getAllByRole('link')) {
            expect(link).not.toHaveClass(listItemButtonClasses.selected);
        }
    });

    it('moves selection from Networking to API Keys after navigation', async () => {
        const { user, list } = setup('/dashboard/networking');
        const networking = list.getByRole('link', { name: 'translated:TabNetworking' });
        const keys = list.getByRole('link', { name: 'translated:HeaderApiKeys' });

        expect(networking).toHaveClass(listItemButtonClasses.selected);
        expect(keys).not.toHaveClass(listItemButtonClasses.selected);

        await user.click(keys);

        expect(screen.getByRole('status', { name: 'Current location' }))
            .toHaveTextContent(/^\/dashboard\/keys$/);
        expect(keys).toHaveClass(listItemButtonClasses.selected);
        expect(networking).not.toHaveClass(listItemButtonClasses.selected);
    });

    it('supports tabbing through the links and activating Scheduled Tasks with Enter', async () => {
        const { user, list } = setup();

        for (const { key } of navigation) {
            await user.tab();
            expect(list.getByRole('link', { name: `translated:${key}` })).toHaveFocus();
        }

        await user.keyboard('{Enter}');

        expect(screen.getByRole('status', { name: 'Current location' }))
            .toHaveTextContent(/^\/dashboard\/tasks$/);
    });
});
