import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import PublicUserList from './PublicUserList';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string) => `translated:${key}`
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

describe('PublicUserList', () => {
    it('renders a button per user labelled by name', () => {
        renderWithTheme(<PublicUserList users={USERS} onUserSelect={vi.fn()} />);

        const list = screen.getByRole('list');
        expect(within(list).getAllByRole('listitem')).toHaveLength(2);
        expect(screen.getByRole('button', { name: 'alice' })).not.toHaveAttribute('aria-disabled');
        expect(screen.getByRole('button', { name: 'bob' })).not.toHaveAttribute('aria-disabled');
    });

    it('calls onUserSelect with the clicked user', async () => {
        const user = userEvent.setup();
        const onUserSelect = vi.fn();
        renderWithTheme(<PublicUserList users={USERS} onUserSelect={onUserSelect} />);

        await user.click(screen.getByRole('button', { name: 'bob' }));

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

        const bob = screen.getByRole('button', { name: 'bob' });
        await user.click(bob);

        expect(bob).toHaveFocus();
        expect(onUserSelect).not.toHaveBeenCalled();
    });
});
