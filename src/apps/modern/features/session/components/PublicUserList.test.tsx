import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import PublicUserList from './PublicUserList';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string, ...args: unknown[]) => [ `translated:${key}`, ...args ].join(' ')
    }
}));

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {}
}));

const theme = createTheme({ cssVariables: true });

const renderWithTheme = (ui: ReactNode) => render(
    <ThemeProvider theme={theme}>{ui}</ThemeProvider>
);

const USERS: UserDto[] = [
    { Id: 'alice-id', Name: 'alice' },
    { Id: 'bob-id', Name: 'bob' }
];

/** Users named "User 00" to "User NN", listed in reverse so sorting is observable */
const manyUsers = (count: number): UserDto[] => Array.from({ length: count }, (_, i) => ({
    Id: `user-${i}`,
    Name: `User ${String(i).padStart(2, '0')}`
})).reverse();

/** The accessible name of the button of a user */
const userButtonName = (name: string) => `translated:ButtonSignInAs ${name}`;
/** The user buttons in document order, without the "show all" button */
const getUserNames = () => screen.getAllByRole('listitem').map(item => within(item).getByRole('button').textContent);
const queryShowAllButton = () => screen.queryByRole('button', { name: /^translated:ButtonShowAllUsers/ });
const queryFilter = () => screen.queryByRole('searchbox', { name: 'translated:LabelFindUser' });

describe('PublicUserList', () => {
    it('renders a button per user labelled by name', () => {
        renderWithTheme(<PublicUserList users={USERS} onUserSelect={vi.fn()} />);

        const list = screen.getByRole('list');
        // Explicit, so Safari keeps announcing the list and its item count without the bullets
        expect(list).toHaveAttribute('role', 'list');
        expect(within(list).getAllByRole('listitem')).toHaveLength(2);
        // The name says what the button does and still contains the visible name
        const alice = screen.getByRole('button', { name: userButtonName('alice') });
        expect(alice).toHaveAccessibleName('translated:ButtonSignInAs alice');
        expect(alice).toHaveTextContent(/^alice$/);
        expect(alice).not.toHaveAttribute('aria-disabled');
        expect(screen.getByRole('button', { name: userButtonName('bob') })).not.toHaveAttribute('aria-disabled');
    });

    it('calls onUserSelect with the clicked user', async () => {
        const user = userEvent.setup();
        const onUserSelect = vi.fn();
        renderWithTheme(<PublicUserList users={USERS} onUserSelect={onUserSelect} />);

        await user.click(screen.getByRole('button', { name: userButtonName('bob') }));

        expect(onUserSelect).toHaveBeenCalledTimes(1);
        expect(onUserSelect).toHaveBeenCalledWith(USERS[1]);
    });

    it('disables every user when disabled while keeping them focusable', async () => {
        const user = userEvent.setup();
        const onUserSelect = vi.fn();
        renderWithTheme(<PublicUserList users={USERS} disabled onUserSelect={onUserSelect} />);

        for (const button of screen.getAllByRole('button')) {
            expect(button).toHaveAttribute('aria-disabled', 'true');
        }

        const bob = screen.getByRole('button', { name: userButtonName('bob') });
        await user.click(bob);

        expect(bob).toHaveFocus();
        expect(onUserSelect).not.toHaveBeenCalled();
    });

    it('focuses the user with the given id after mounting', () => {
        renderWithTheme(<PublicUserList users={USERS} focusUserId='bob-id' onUserSelect={vi.fn()} />);

        expect(screen.getByRole('button', { name: userButtonName('bob') })).toHaveFocus();
    });

    it('focuses nothing when no listed user has the given id', () => {
        renderWithTheme(<PublicUserList users={USERS} focusUserId='carol-id' onUserSelect={vi.fn()} />);

        expect(document.body).toHaveFocus();
    });

    it('keeps small lists in the order of the server, without a filter', () => {
        renderWithTheme(
            <PublicUserList users={[ { Id: '1', Name: 'carol' }, { Id: '2', Name: 'alice' }, { Id: '3', Name: 'bob' } ]} onUserSelect={vi.fn()} />
        );

        expect(getUserNames()).toEqual([ 'carol', 'alice', 'bob' ]);
        expect(queryFilter()).not.toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('shows every user when at most one more row would be needed', () => {
        // Three rows of three fit in the cap on small screens, a fourth row is shown rather than hidden
        renderWithTheme(<PublicUserList users={manyUsers(12)} onUserSelect={vi.fn()} />);

        expect(screen.getAllByRole('listitem')).toHaveLength(12);
        expect(queryShowAllButton()).not.toBeInTheDocument();
        expect(queryFilter()).not.toBeInTheDocument();
    });

    it('collapses large lists to three rows, sorted by name, and reveals the rest on request', async () => {
        const user = userEvent.setup();
        renderWithTheme(<PublicUserList users={manyUsers(13)} onUserSelect={vi.fn()} />);

        expect(getUserNames()).toEqual(Array.from({ length: 9 }, (_, i) => `User 0${i}`));
        const showAll = queryShowAllButton();
        expect(showAll).toBeInTheDocument();

        await user.click(showAll!);

        expect(screen.getAllByRole('listitem')).toHaveLength(13);
        expect(getUserNames().at(-1)).toBe('User 12');
        // The button is gone and the first revealed user has the focus, so the reading position is kept
        expect(queryShowAllButton()).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: userButtonName('User 09') })).toHaveFocus();
    });

    it('starts expanded when the user to focus would be hidden', () => {
        renderWithTheme(<PublicUserList users={manyUsers(13)} focusUserId='user-12' onUserSelect={vi.fn()} />);

        expect(screen.getAllByRole('listitem')).toHaveLength(13);
        expect(queryShowAllButton()).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: userButtonName('User 12') })).toHaveFocus();
    });

    it('filters large lists by name, announces the matches and picks a single match with enter', async () => {
        const user = userEvent.setup();
        const onUserSelect = vi.fn();
        renderWithTheme(<PublicUserList users={manyUsers(13)} onUserSelect={onUserSelect} />);

        const filter = queryFilter();
        expect(filter).toBeInTheDocument();
        expect(filter).toHaveAttribute('aria-controls', screen.getByRole('list').id);
        expect(screen.getByRole('list')).toHaveAccessibleName('translated:HeaderUsers');
        const status = screen.getByRole('status');
        expect(status).toBeEmptyDOMElement();

        await user.type(filter!, '1');

        // The filter ignores the cap and the case
        expect(getUserNames()).toEqual([ 'User 01', 'User 10', 'User 11', 'User 12' ]);
        expect(queryShowAllButton()).not.toBeInTheDocument();
        await waitFor(() => expect(status).toHaveTextContent('translated:MessageUsersFound'));

        await user.type(filter!, '2');

        expect(getUserNames()).toEqual([ 'User 12' ]);
        await waitFor(() => expect(status).toHaveTextContent('translated:MessageUserFound'));

        await user.keyboard('{Enter}');

        expect(onUserSelect).toHaveBeenCalledOnce();
        expect(onUserSelect).toHaveBeenCalledWith({ Id: 'user-12', Name: 'User 12' });
    });

    it('says when no user matches and points to signing in with a username', async () => {
        const user = userEvent.setup();
        const onUserSelect = vi.fn();
        renderWithTheme(<PublicUserList users={manyUsers(13)} onUserSelect={onUserSelect} />);

        await user.type(queryFilter()!, 'zzz{Enter}');

        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
        expect(screen.getByText('translated:MessageNoUsersMatch')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('translated:MessageNoUsersMatch'));
        expect(onUserSelect).not.toHaveBeenCalled();
        // The field keeps the focus so the query can be corrected
        expect(queryFilter()).toHaveFocus();

        await user.clear(queryFilter()!);

        expect(screen.getAllByRole('listitem')).toHaveLength(9);
        expect(queryShowAllButton()).toBeInTheDocument();
        await waitFor(() => expect(screen.getByRole('status')).toBeEmptyDOMElement());
    });

    it('keeps the filter and the show all button inactive while disabled', async () => {
        const user = userEvent.setup();
        const onUserSelect = vi.fn();
        renderWithTheme(<PublicUserList users={manyUsers(13)} disabled onUserSelect={onUserSelect} />);

        expect(queryShowAllButton()).toBeDisabled();
        expect(queryFilter()).toHaveAttribute('readonly');

        await user.type(queryFilter()!, 'x{Enter}');

        expect(queryFilter()).toHaveValue('');
        expect(onUserSelect).not.toHaveBeenCalled();
    });

    it('does not pick the single match with enter while disabled', async () => {
        const user = userEvent.setup();
        const onUserSelect = vi.fn();
        const { rerender } = renderWithTheme(<PublicUserList users={manyUsers(13)} onUserSelect={onUserSelect} />);
        await user.type(queryFilter()!, '12');
        expect(getUserNames()).toEqual([ 'User 12' ]);

        rerender(
            <ThemeProvider theme={theme}>
                <PublicUserList users={manyUsers(13)} disabled onUserSelect={onUserSelect} />
            </ThemeProvider>
        );
        await user.keyboard('{Enter}');

        expect(onUserSelect).not.toHaveBeenCalled();
    });

    it('does not move the focus back to the revealed user when their item is mounted again', async () => {
        const user = userEvent.setup();
        renderWithTheme(<PublicUserList users={manyUsers(13)} onUserSelect={vi.fn()} />);
        await user.click(queryShowAllButton()!);
        expect(screen.getByRole('button', { name: userButtonName('User 09') })).toHaveFocus();

        // Filter the revealed user out and back in
        const filter = queryFilter()!;
        await user.type(filter, '1');
        expect(screen.queryByRole('button', { name: userButtonName('User 09') })).not.toBeInTheDocument();
        await user.keyboard('{Backspace}');

        expect(screen.getByRole('button', { name: userButtonName('User 09') })).toBeInTheDocument();
        expect(filter).toHaveFocus();
    });

    it('does not move the focus back to the given user when their item is mounted again', async () => {
        const user = userEvent.setup();
        renderWithTheme(<PublicUserList users={manyUsers(13)} focusUserId='user-2' onUserSelect={vi.fn()} />);
        expect(screen.getByRole('button', { name: userButtonName('User 02') })).toHaveFocus();

        // Filter the user out, then clear the filter so the list collapses again with the user in it
        const filter = queryFilter()!;
        await user.type(filter, '1');
        expect(screen.queryByRole('button', { name: userButtonName('User 02') })).not.toBeInTheDocument();
        await user.keyboard('{Backspace}');

        expect(screen.getByRole('button', { name: userButtonName('User 02') })).toBeInTheDocument();
        expect(filter).toHaveFocus();
    });

    it('does not move the focus again when rerendered', async () => {
        const user = userEvent.setup();
        const { rerender } = renderWithTheme(
            <PublicUserList users={USERS} focusUserId='bob-id' onUserSelect={vi.fn()} />
        );
        await user.tab({ shift: true });
        expect(screen.getByRole('button', { name: userButtonName('alice') })).toHaveFocus();

        rerender(
            <ThemeProvider theme={theme}>
                <PublicUserList users={USERS} focusUserId='bob-id' disabled onUserSelect={vi.fn()} />
            </ThemeProvider>
        );

        expect(screen.getByRole('button', { name: userButtonName('alice') })).toHaveFocus();
    });
});
