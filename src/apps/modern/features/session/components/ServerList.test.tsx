import { createTheme, ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import React, { type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { AvailableServer } from '../api/useAvailableServers';
import ServerList, { getServerAddress, getServerDisplayName } from './ServerList';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string, ...args: unknown[]) => [ `translated:${key}`, ...args ].join(' ')
    }
}));

const HOME: AvailableServer = { Id: 'home-id', Name: 'Home', ManualAddress: 'https://home.example' };
const WORK: AvailableServer = { Id: 'work-id', Name: 'Work', LocalAddress: 'https://192.168.1.2:8096', RemoteAddress: 'https://work.example' };
const NAMELESS: AvailableServer = { Id: 'nameless-id', RemoteAddress: 'https://nameless.example' };

const theme = createTheme({ cssVariables: true });

const renderList = (props: Partial<React.ComponentProps<typeof ServerList>> = {}) => {
    const onConnect = vi.fn();
    const onDelete = vi.fn();
    const onFocused = vi.fn();
    const ui = (overrides: Partial<React.ComponentProps<typeof ServerList>> = {}): ReactElement => (
        <ThemeProvider theme={theme}>
            <ServerList
                servers={[ HOME, WORK ]}
                onConnect={onConnect}
                onDelete={onDelete}
                onFocused={onFocused}
                {...props}
                {...overrides}
            />
        </ThemeProvider>
    );
    const result = render(ui());
    return { ...result, onConnect, onDelete, onFocused, rerenderList: (overrides: Partial<React.ComponentProps<typeof ServerList>>) => result.rerender(ui(overrides)) };
};

describe('getServerDisplayName', () => {
    it('is the name of the server', () => {
        expect(getServerDisplayName(HOME)).toBe('Home');
    });

    it('is the address of a server without a name', () => {
        expect(getServerDisplayName(NAMELESS)).toBe('https://nameless.example');
    });

    it('is a placeholder for a server without a name and an address', () => {
        expect(getServerDisplayName({ Id: 'id' })).toBe('translated:LabelUnnamedServer');
    });
});

describe('getServerAddress', () => {
    it('prefers the manual address, then the local address, then the remote address', () => {
        expect(getServerAddress({ ...WORK, ManualAddress: 'https://manual.example' })).toBe('https://manual.example');
        expect(getServerAddress(WORK)).toBe('https://192.168.1.2:8096');
        expect(getServerAddress(NAMELESS)).toBe('https://nameless.example');
        expect(getServerAddress({ Id: 'id' })).toBeUndefined();
    });
});

describe('ServerList', () => {
    it('lists the servers with their names and addresses', () => {
        renderList();

        expect(screen.getByRole('list', { name: 'translated:HeaderSavedServers' })).toBeInTheDocument();
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        const homeButton = screen.getByRole('button', { name: 'translated:ButtonConnectTo Home' });
        expect(homeButton).toHaveTextContent('Home');
        expect(homeButton).toHaveAccessibleDescription('https://home.example');
        expect(screen.getByRole('button', { name: 'translated:ButtonConnectTo Work' }))
            .toHaveAccessibleDescription('https://192.168.1.2:8096');
    });

    it('does not repeat the address of a server without a name', () => {
        renderList({ servers: [ NAMELESS ] });

        const button = screen.getByRole('button', { name: 'translated:ButtonConnectTo https://nameless.example' });
        expect(button.textContent).toBe('https://nameless.example');
        expect(button).not.toHaveAttribute('aria-describedby');
    });

    it('connects when a server is activated', () => {
        const { onConnect } = renderList();

        fireEvent.click(screen.getByRole('button', { name: 'translated:ButtonConnectTo Work' }));

        expect(onConnect).toHaveBeenCalledWith(WORK);
    });

    it('asks to delete a server', () => {
        const { onConnect, onDelete } = renderList();

        fireEvent.click(screen.getByRole('button', { name: 'translated:DeleteName Work' }));

        expect(onDelete).toHaveBeenCalledWith(WORK);
        expect(onConnect).not.toHaveBeenCalled();
    });

    it('marks the current server', () => {
        renderList({ activeServerId: 'work-id' });

        expect(screen.getAllByText('translated:LabelCurrentServer')).toHaveLength(1);
        expect(screen.getByRole('button', { name: 'translated:ButtonConnectTo Work' }))
            .toHaveAccessibleDescription('https://192.168.1.2:8096 translated:LabelCurrentServer');
        expect(screen.getByRole('button', { name: 'translated:ButtonConnectTo Home' }))
            .toHaveAccessibleDescription('https://home.example');
    });

    it('marks nothing when there is no current server', () => {
        renderList();

        expect(screen.queryByText('translated:LabelCurrentServer')).not.toBeInTheDocument();
    });

    it('keeps the servers focusable but inert while disabled', () => {
        const { onConnect } = renderList({ disabled: true, connectingServerId: 'home-id' });

        const homeButton = screen.getByRole('button', { name: 'translated:ButtonConnectTo Home' });
        homeButton.focus();
        fireEvent.click(homeButton);

        expect(homeButton).toHaveFocus();
        expect(homeButton).toHaveAttribute('aria-disabled', 'true');
        expect(onConnect).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'translated:DeleteName Home' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'translated:DeleteName Work' })).toBeDisabled();
    });

    it('shows which server is being connected to', () => {
        renderList({ disabled: true, connectingServerId: 'work-id' });

        expect(screen.getAllByRole('progressbar', { hidden: true })).toHaveLength(1);
        expect(screen.getByRole('button', { name: 'translated:ButtonConnectTo Work' })).toContainElement(
            screen.getByRole('progressbar', { hidden: true })
        );
    });

    it('focuses the requested server once', () => {
        const { onFocused, rerenderList } = renderList();
        expect(onFocused).not.toHaveBeenCalled();

        rerenderList({ focusServerId: 'work-id' });

        expect(screen.getByRole('button', { name: 'translated:ButtonConnectTo Work' })).toHaveFocus();
        expect(onFocused).toHaveBeenCalledTimes(1);
    });
});
