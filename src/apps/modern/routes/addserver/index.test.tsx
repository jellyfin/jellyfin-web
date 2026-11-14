import { createTheme, ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import type { ApiClient } from 'jellyfin-apiclient';
import React from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ConnectResult } from 'apps/modern/features/session/utils/connectionOutcome';
import { ConnectionState } from 'lib/jellyfin-apiclient/connectionState';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { renderWithRouter } from 'test/renderWithRouter';

import AddServerPage from './index';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string, ...args: unknown[]) => [ `translated:${key}`, ...args ].join(' ')
    }
}));

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        connectToAddress: vi.fn(),
        setLocalApiClient: vi.fn()
    }
}));

vi.mock('components/Page', () => ({
    default: ({ children }: React.PropsWithChildren) => <div>{children}</div>
}));

vi.mock('scripts/settings/appSettings', () => ({
    default: {
        enableAutoLogin: () => true
    }
}));

const ADDRESS = 'https://jellyfin.example:8096';
const SERVER_ID = 'server/id';
const API_CLIENT = {} as ApiClient;
const UNAVAILABLE: ConnectResult = { State: ConnectionState.Unavailable };
const UPDATE_NEEDED: ConnectResult = { State: ConnectionState.ServerUpdateNeeded, Servers: [ { Id: SERVER_ID } ] };

/** Creates a promise that can be resolved from the test. */
const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(res => {
        resolve = res;
    });
    return { promise, resolve };
};

const theme = createTheme({ cssVariables: true });

const CurrentLocation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    return (
        <>
            <div data-testid='location'>{location.pathname + location.search}</div>
            <button onClick={() => navigate(-1)}>back</button>
        </>
    );
};

const createQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
    }
});

const renderAddServerPage = (previousEntries: string[] = []) => renderWithRouter(
    <QueryClientProvider client={createQueryClient()}>
        <ThemeProvider theme={theme}>
            <Routes>
                <Route path='/addserver' element={<AddServerPage />} />
                <Route path='*' element={<CurrentLocation />} />
            </Routes>
        </ThemeProvider>
    </QueryClientProvider>,
    { initialEntries: [ ...previousEntries, '/addserver' ], initialIndex: previousEntries.length }
);

const getAddressField = () => screen.getByLabelText(/translated:LabelServerHost/);
const getConnectButton = () => screen.getByRole('button', { name: 'translated:Connect' });
const getCancelButton = () => screen.getByRole('button', { name: 'translated:ButtonCancel' });
const getStatus = () => screen.getByRole('status');

describe('AddServerPage', () => {
    beforeEach(() => {
        vi.mocked(ServerConnections.connectToAddress).mockReset().mockResolvedValue(UNAVAILABLE);
        vi.mocked(ServerConnections.setLocalApiClient).mockReset();
        vi.spyOn(console, 'error').mockImplementation(() => { /* silence expected errors */ });
    });

    it('shows the form with the address field focused', () => {
        renderAddServerPage();

        expect(screen.getByRole('heading', { level: 1, name: 'translated:HeaderConnectToServer' })).toBeInTheDocument();
        expect(getAddressField()).toHaveFocus();
        expect(getStatus()).toBeEmptyDOMElement();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it.each([
        [
            'goes home when signed in',
            { State: ConnectionState.SignedIn, ApiClient: API_CLIENT },
            '/home'
        ],
        [
            'continues to the login of the server',
            {
                State: ConnectionState.ServerSignIn,
                ApiClient: API_CLIENT,
                Servers: [ { Id: SERVER_ID } ],
                SystemInfo: { StartupWizardCompleted: true }
            },
            `/login?serverid=${encodeURIComponent(SERVER_ID)}`
        ],
        [
            'continues to the login of a server that does not report its wizard',
            { State: ConnectionState.ServerSignIn, ApiClient: API_CLIENT, Servers: [ { Id: SERVER_ID } ] },
            `/login?serverid=${encodeURIComponent(SERVER_ID)}`
        ],
        [
            'continues to the wizard of a server that is not set up',
            {
                State: ConnectionState.ServerSignIn,
                ApiClient: API_CLIENT,
                Servers: [ { Id: SERVER_ID } ],
                SystemInfo: { StartupWizardCompleted: false }
            },
            '/wizard/start'
        ]
    ])('%s, and makes the server current', async (_, result, expectedLocation) => {
        vi.mocked(ServerConnections.connectToAddress).mockResolvedValue(result);
        const { user } = renderAddServerPage();

        await user.type(getAddressField(), ` ${ADDRESS}/ `);
        await user.click(getConnectButton());

        expect(await screen.findByTestId('location')).toHaveTextContent(expectedLocation);
        expect(ServerConnections.connectToAddress).toHaveBeenCalledExactlyOnceWith(ADDRESS, { enableAutoLogin: true });
        expect(ServerConnections.setLocalApiClient).toHaveBeenCalledExactlyOnceWith(API_CLIENT);
    });

    it('continues to the server selection when asked to choose a server', async () => {
        vi.mocked(ServerConnections.connectToAddress).mockResolvedValue({ State: ConnectionState.ServerSelection });
        const { user } = renderAddServerPage();

        await user.type(getAddressField(), ADDRESS);
        await user.click(getConnectButton());

        expect(await screen.findByTestId('location')).toHaveTextContent('/selectserver');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('goes home with replace, so going back does not return to the form', async () => {
        vi.mocked(ServerConnections.connectToAddress).mockResolvedValue({ State: ConnectionState.SignedIn, ApiClient: API_CLIENT });
        const { user } = renderAddServerPage([ '/selectserver' ]);

        await user.type(getAddressField(), ADDRESS);
        await user.click(getConnectButton());
        expect(await screen.findByTestId('location')).toHaveTextContent('/home');

        await user.click(screen.getByRole('button', { name: 'back' }));
        expect(screen.getByTestId('location')).toHaveTextContent('/selectserver');
    });

    it('does not connect to a blank address', async () => {
        const { user } = renderAddServerPage();

        await user.type(getAddressField(), '   ');
        await user.click(getConnectButton());

        expect(ServerConnections.connectToAddress).not.toHaveBeenCalled();
        expect(getAddressField()).toHaveAttribute('aria-invalid', 'true');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('announces the connection and blocks resubmits while connecting', async () => {
        const connection = deferred<ConnectResult>();
        vi.mocked(ServerConnections.connectToAddress).mockReturnValue(connection.promise);
        const { user } = renderAddServerPage();

        await user.type(getAddressField(), ADDRESS);
        await user.click(getConnectButton());

        expect(getStatus()).toHaveTextContent('translated:MessageConnecting');
        expect(getConnectButton()).toHaveFocus();
        expect(getConnectButton()).toHaveAttribute('aria-disabled', 'true');
        expect(getAddressField()).toHaveAttribute('readonly');
        expect(getCancelButton()).toBeDisabled();

        await user.click(getConnectButton());
        await user.type(getAddressField(), '{Enter}');
        expect(ServerConnections.connectToAddress).toHaveBeenCalledOnce();

        connection.resolve(UNAVAILABLE);
        await screen.findByRole('alert');
        expect(getStatus()).toBeEmptyDOMElement();
    });

    it.each([
        [ 'the server can not be reached', UNAVAILABLE, 'translated:MessageServerConnectionFailed' ],
        [ 'the server mismatches', { State: ConnectionState.ServerMismatch }, 'translated:MessageServerConnectionFailed' ],
        [ 'the server needs an update', UPDATE_NEEDED, 'translated:HeaderUpdateRequired' ]
    ])('stays on the page and shows the problem above the form when %s', async (_, result, expectedText) => {
        vi.mocked(ServerConnections.connectToAddress).mockResolvedValue(result);
        const { user } = renderAddServerPage();

        await user.type(getAddressField(), ADDRESS);
        await user.click(getConnectButton());

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent(expectedText);
        expect(screen.queryByTestId('location')).not.toBeInTheDocument();
        expect(ServerConnections.setLocalApiClient).not.toHaveBeenCalled();
        // The alert slot comes before the form in the card
        expect(alert.compareDocumentPosition(getAddressField()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(getAddressField()).toHaveValue(ADDRESS);
        expect(getAddressField()).not.toHaveAttribute('readonly');
        expect(getConnectButton()).not.toHaveAttribute('aria-disabled');
        expect(getConnectButton()).toHaveFocus();
        expect(getCancelButton()).toBeEnabled();
    });

    it('shows a new alert for a repeated failure, and keeps it while the address is edited', async () => {
        const { user } = renderAddServerPage();

        await user.type(getAddressField(), ADDRESS);
        await user.click(getConnectButton());
        const firstAlert = await screen.findByRole('alert');

        await user.type(getAddressField(), '/jellyfin');
        expect(screen.getByRole('alert')).toBe(firstAlert);

        await user.click(getConnectButton());
        await waitFor(() => expect(ServerConnections.connectToAddress).toHaveBeenCalledTimes(2));
        const secondAlert = await screen.findByRole('alert');
        expect(secondAlert).not.toBe(firstAlert);
        expect(ServerConnections.connectToAddress).toHaveBeenLastCalledWith(`${ADDRESS}/jellyfin`, { enableAutoLogin: true });
    });

    it('clears the alert when a new attempt starts', async () => {
        const connection = deferred<ConnectResult>();
        vi.mocked(ServerConnections.connectToAddress)
            .mockResolvedValueOnce(UNAVAILABLE)
            .mockReturnValueOnce(connection.promise);
        const { user } = renderAddServerPage();

        await user.type(getAddressField(), ADDRESS);
        await user.click(getConnectButton());
        await screen.findByRole('alert');

        await user.click(getConnectButton());

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        connection.resolve(UNAVAILABLE);
        await screen.findByRole('alert');
    });

    it('retries the last normalized address from the alert, and continues with the outcome', async () => {
        const connection = deferred<ConnectResult>();
        vi.mocked(ServerConnections.connectToAddress)
            .mockResolvedValueOnce(UNAVAILABLE)
            .mockReturnValueOnce(connection.promise);
        const { user } = renderAddServerPage();

        await user.type(getAddressField(), `${ADDRESS}/`);
        await user.click(getConnectButton());
        await user.click(await screen.findByRole('button', { name: 'translated:Retry' }));

        expect(ServerConnections.connectToAddress).toHaveBeenCalledTimes(2);
        expect(ServerConnections.connectToAddress).toHaveBeenLastCalledWith(ADDRESS, { enableAutoLogin: true });
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        // The removed retry button hands the focus to the connect button, which shows the progress
        expect(getConnectButton()).toHaveFocus();
        expect(getConnectButton()).toHaveAttribute('aria-disabled', 'true');

        connection.resolve({ State: ConnectionState.SignedIn, ApiClient: API_CLIENT });
        expect(await screen.findByTestId('location')).toHaveTextContent('/home');
    });

    it('keeps the focus on the connect button after a failed retry', async () => {
        const { user } = renderAddServerPage();

        await user.type(getAddressField(), ADDRESS);
        await user.click(getConnectButton());
        const firstAlert = await screen.findByRole('alert');
        await user.click(screen.getByRole('button', { name: 'translated:Retry' }));

        await waitFor(() => expect(screen.getByRole('alert')).not.toBe(firstAlert));
        expect(getConnectButton()).toHaveFocus();
    });

    it('closes the alert and returns the focus to the address field', async () => {
        const { user } = renderAddServerPage();

        await user.type(getAddressField(), ADDRESS);
        await user.click(getConnectButton());
        await user.click(await screen.findByRole('button', { name: 'translated:ButtonClose' }));

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(getAddressField()).toHaveFocus();
    });

    it('reports a failed connection as unavailable, logging it once without the address', async () => {
        vi.mocked(ServerConnections.connectToAddress).mockRejectedValue(new Error('Network Error'));
        const { user } = renderAddServerPage();

        await user.type(getAddressField(), ADDRESS);
        await user.click(getConnectButton());

        expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageServerConnectionFailed');
        expect(console.error).toHaveBeenCalledOnce();
        expect(console.error).toHaveBeenCalledWith('[useConnectToAddress] unable to connect to the server', expect.anything());
        // The address can contain credentials
        expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('jellyfin.example');
    });

    it('renders markup in the address as text only', async () => {
        const { user, container } = renderAddServerPage();

        await user.type(getAddressField(), '<img src=x onerror=alert(1)>');
        await user.click(getConnectButton());

        await screen.findByRole('alert');
        expect(getAddressField()).toHaveValue('<img src=x onerror=alert(1)>');
        expect(container.querySelector('img')).not.toBeInTheDocument();
    });

    it('goes back to the previous page when cancelled', async () => {
        const { user } = renderAddServerPage([ '/selectserver' ]);

        await user.click(getCancelButton());

        expect(await screen.findByTestId('location')).toHaveTextContent('/selectserver');
        // Going back again leaves the app's history, so the location stays the first entry
        await user.click(screen.getByRole('button', { name: 'back' }));
        expect(screen.getByTestId('location')).toHaveTextContent('/selectserver');
    });

    it('replaces a deep linked page with the server selection when cancelled', async () => {
        const { user } = renderAddServerPage();

        await user.click(getCancelButton());

        expect(await screen.findByTestId('location')).toHaveTextContent('/selectserver');
        // The add server page was replaced, so going back does not return to it
        await user.click(screen.getByRole('button', { name: 'back' }));
        expect(screen.getByTestId('location')).toHaveTextContent('/selectserver');
    });
});
