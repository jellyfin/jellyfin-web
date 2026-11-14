import { createTheme, ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { ApiClient } from 'jellyfin-apiclient';
import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AvailableServer } from 'apps/modern/features/session/api/useAvailableServers';
import { ConnectionState } from 'lib/jellyfin-apiclient/connectionState';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { renderWithRouter } from 'test/renderWithRouter';

import SelectServerPage from './index';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string, ...args: unknown[]) => [ `translated:${key}`, ...args ].join(' ')
    }
}));

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        getAvailableServers: vi.fn(),
        deleteServer: vi.fn(),
        connectToServer: vi.fn(),
        currentApiClient: vi.fn(),
        setLocalApiClient: vi.fn()
    }
}));

vi.mock('components/Page', () => ({
    default: ({ children }: React.PropsWithChildren) => <div>{children}</div>
}));

vi.mock('components/loading/LoadingComponent', () => ({
    default: () => null
}));

vi.mock('scripts/settings/appSettings', () => ({
    default: {
        enableAutoLogin: () => true
    }
}));

const HOME: AvailableServer = { Id: 'home-id', Name: 'Home', ManualAddress: 'https://home.example', AccessToken: 'secret-token' };
const WORK: AvailableServer = { Id: 'work-id', Name: 'Work', ManualAddress: 'https://work.example' };
const CABIN: AvailableServer = { Id: 'cabin-id', Name: 'Cabin', ManualAddress: 'https://cabin.example' };
const API_CLIENT = { serverId: () => HOME.Id, accessToken: () => 'secret-token' } as ApiClient;

const theme = createTheme({ cssVariables: true });

/** Creates a promise that can be resolved from the test. */
const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

const CurrentLocation = () => {
    const location = useLocation();
    return <div data-testid='location'>{location.pathname + location.search}</div>;
};

const renderPage = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    });
    return renderWithRouter(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <Routes>
                    <Route path='/selectserver' element={<SelectServerPage />} />
                    <Route path='*' element={<CurrentLocation />} />
                </Routes>
            </ThemeProvider>
        </QueryClientProvider>,
        { initialEntries: [ '/selectserver' ] }
    );
};

const findConnectButton = (name: string) => screen.findByRole('button', { name: `translated:ButtonConnectTo ${name}` });
const getDeleteButton = (name: string) => screen.getByRole('button', { name: `translated:DeleteName ${name}` });
const getStatus = () => screen.getByRole('status');
const getLoggedErrors = () => JSON.stringify(vi.mocked(console.error).mock.calls);

const mockServers = (...servers: AvailableServer[]) => {
    vi.mocked(ServerConnections.getAvailableServers).mockResolvedValue(servers as never);
};

describe('SelectServerPage', () => {
    beforeEach(() => {
        vi.mocked(ServerConnections.getAvailableServers).mockReset();
        vi.mocked(ServerConnections.deleteServer).mockReset();
        vi.mocked(ServerConnections.connectToServer).mockReset();
        vi.mocked(ServerConnections.setLocalApiClient).mockReset();
        vi.mocked(ServerConnections.currentApiClient).mockReset();
        mockServers(HOME, WORK);
        vi.mocked(ServerConnections.deleteServer).mockResolvedValue(undefined);
        vi.spyOn(console, 'error').mockImplementation(() => { /* silence expected errors */ });
    });

    it('lists the saved servers', async () => {
        renderPage();

        expect(await screen.findByRole('heading', { level: 1, name: 'translated:SelectServer' })).toBeInTheDocument();
        expect(await findConnectButton('Home')).toHaveAccessibleDescription('https://home.example');
        expect(await findConnectButton('Work')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'translated:ButtonAddServer' })).toBeInTheDocument();
        expect(screen.queryByText('translated:MessageNoSavedServers')).not.toBeInTheDocument();
    });

    it('announces that the servers are loading', async () => {
        const servers = deferred<AvailableServer[]>();
        vi.mocked(ServerConnections.getAvailableServers).mockReturnValue(servers.promise as never);
        renderPage();

        expect(getStatus()).toHaveTextContent('translated:Loading');
        expect(screen.queryByRole('list')).not.toBeInTheDocument();

        servers.resolve([ HOME ]);

        expect(await findConnectButton('Home')).toBeInTheDocument();
        expect(getStatus()).toBeEmptyDOMElement();
    });

    it('marks the current server', async () => {
        vi.mocked(ServerConnections.currentApiClient).mockReturnValue(API_CLIENT);
        renderPage();

        expect(await findConnectButton('Home')).toHaveAccessibleDescription(/translated:LabelCurrentServer/);
        expect(screen.getAllByText('translated:LabelCurrentServer')).toHaveLength(1);
    });

    it('shows the empty state with a prominent add server button', async () => {
        mockServers();
        renderPage();

        expect(await screen.findByText('translated:MessageNoSavedServers')).toBeInTheDocument();
        expect(screen.queryByRole('list')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'translated:ButtonAddServer' })).toHaveClass('MuiButton-contained');
    });

    it('opens the add server page', async () => {
        const { user } = renderPage();

        await user.click(await screen.findByRole('button', { name: 'translated:ButtonAddServer' }));

        expect(await screen.findByTestId('location')).toHaveTextContent('/addserver');
    });

    describe('when the servers can not be loaded', () => {
        beforeEach(() => {
            vi.mocked(ServerConnections.getAvailableServers).mockRejectedValue(new Error('Failed'));
        });

        it('shows the failure with a retry that loads them again', async () => {
            const { user } = renderPage();
            expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageSavedServersLoadFailed');
            expect(screen.getByRole('button', { name: 'translated:ButtonAddServer' })).toBeInTheDocument();
            expect(screen.queryByText('translated:MessageNoSavedServers')).not.toBeInTheDocument();
            mockServers(HOME);

            await user.click(screen.getByRole('button', { name: 'translated:Retry' }));

            expect(await findConnectButton('Home')).toBeInTheDocument();
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

        it('moves the focus to the first server after a successful retry', async () => {
            const { user } = renderPage();
            await user.click(await screen.findByRole('button', { name: 'translated:Retry' }));
            // The first retry fails as well, which keeps the button and its focus
            await waitFor(() => expect(ServerConnections.getAvailableServers).toHaveBeenCalledTimes(2));
            expect(await screen.findByRole('button', { name: 'translated:Retry' })).toHaveFocus();
            mockServers(HOME);

            await user.click(screen.getByRole('button', { name: 'translated:Retry' }));

            expect(await findConnectButton('Home')).toHaveFocus();
        });

        it('announces a failed retry through the status, since the alert stays in place', async () => {
            const { user } = renderPage();
            await user.click(await screen.findByRole('button', { name: 'translated:Retry' }));

            await waitFor(() => expect(getStatus()).toHaveTextContent('translated:MessageSavedServersLoadFailed'));
            expect(screen.getByRole('button', { name: 'translated:Retry' })).toHaveFocus();
        });

        it('keeps the retry button focusable but inert while retrying', async () => {
            const { user } = renderPage();
            const retryButton = await screen.findByRole('button', { name: 'translated:Retry' });
            const servers = deferred<AvailableServer[]>();
            vi.mocked(ServerConnections.getAvailableServers).mockReturnValue(servers.promise as never);

            await user.click(retryButton);
            await waitFor(() => expect(retryButton).toHaveAttribute('aria-disabled', 'true'));
            // The disabled look has no pointer events, which user.click honors, so click the way a keyboard does
            fireEvent.click(retryButton);

            expect(retryButton).toHaveFocus();
            expect(getStatus()).toHaveTextContent('translated:Loading');
            expect(ServerConnections.getAvailableServers).toHaveBeenCalledTimes(2);
            servers.resolve([ HOME ]);
            expect(await findConnectButton('Home')).toBeInTheDocument();
        });
    });

    describe('when connecting', () => {
        const connectResult = (State: ConnectionState, extra = {}) => ({ State, ApiClient: API_CLIENT, Servers: [ HOME ], ...extra });

        it('goes home when signed in, and makes the server current', async () => {
            vi.mocked(ServerConnections.connectToServer).mockResolvedValue(connectResult(ConnectionState.SignedIn));
            const { user } = renderPage();

            await user.click(await findConnectButton('Home'));

            expect(await screen.findByTestId('location')).toHaveTextContent('/home');
            expect(ServerConnections.connectToServer).toHaveBeenCalledWith(HOME, { enableAutoLogin: true });
            expect(ServerConnections.setLocalApiClient).toHaveBeenCalledWith(API_CLIENT);
        });

        it('goes to the login of the server when it needs a sign in', async () => {
            vi.mocked(ServerConnections.connectToServer).mockResolvedValue(connectResult(ConnectionState.ServerSignIn, {
                SystemInfo: { StartupWizardCompleted: true }
            }));
            const { user } = renderPage();

            await user.click(await findConnectButton('Home'));

            expect(await screen.findByTestId('location')).toHaveTextContent('/login?serverid=home-id');
        });

        it('goes to the wizard when the server is not set up', async () => {
            vi.mocked(ServerConnections.connectToServer).mockResolvedValue(connectResult(ConnectionState.ServerSignIn, {
                SystemInfo: { StartupWizardCompleted: false }
            }));
            const { user } = renderPage();

            await user.click(await findConnectButton('Home'));

            expect(await screen.findByTestId('location')).toHaveTextContent('/wizard/start');
            expect(ServerConnections.setLocalApiClient).toHaveBeenCalledWith(API_CLIENT);
        });

        it('shows the connection in progress and keeps the controls inert until the page is left', async () => {
            const connection = deferred<unknown>();
            vi.mocked(ServerConnections.connectToServer).mockReturnValue(connection.promise as never);
            const { user } = renderPage();
            const homeButton = await findConnectButton('Home');

            await user.click(homeButton);

            expect(getStatus()).toHaveTextContent('translated:MessageConnectingToServer Home');
            expect(homeButton).toHaveAttribute('aria-disabled', 'true');
            expect(homeButton).toHaveFocus();
            expect(getDeleteButton('Home')).toBeDisabled();
            expect(getDeleteButton('Work')).toBeDisabled();
            expect(screen.getByRole('button', { name: 'translated:ButtonAddServer' })).toBeDisabled();

            // Re-entry is ignored, also for another server
            await user.click(homeButton);
            await user.click(await findConnectButton('Work'));
            expect(ServerConnections.connectToServer).toHaveBeenCalledTimes(1);

            connection.resolve(connectResult(ConnectionState.SignedIn));
            expect(await screen.findByTestId('location')).toHaveTextContent('/home');
        });

        it('shows the failure to connect with the focus staying on the server', async () => {
            vi.mocked(ServerConnections.connectToServer).mockResolvedValue({ State: ConnectionState.Unavailable });
            const { user } = renderPage();
            const homeButton = await findConnectButton('Home');

            await user.click(homeButton);

            const alert = await screen.findByRole('alert');
            expect(alert).toHaveTextContent('translated:HeaderConnectionFailure');
            expect(alert).toHaveTextContent('translated:MessageServerConnectionFailed');
            expect(homeButton).toHaveFocus();
            expect(homeButton).not.toHaveAttribute('aria-disabled');
            expect(getDeleteButton('Home')).toBeEnabled();
            expect(screen.queryByTestId('location')).not.toBeInTheDocument();
            expect(ServerConnections.setLocalApiClient).not.toHaveBeenCalled();
        });

        it('shows a failure that was thrown, without logging the server', async () => {
            vi.mocked(ServerConnections.connectToServer).mockRejectedValue(
                Object.assign(new Error('Network Error'), { config: { headers: { Authorization: HOME.AccessToken } } })
            );
            const { user } = renderPage();

            await user.click(await findConnectButton('Home'));

            expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageServerConnectionFailed');
            expect(getLoggedErrors()).not.toContain('secret');
        });

        it('shows the update that is needed, without a retry', async () => {
            vi.mocked(ServerConnections.connectToServer).mockResolvedValue({
                State: ConnectionState.ServerUpdateNeeded,
                Servers: [ HOME ]
            });
            const { user } = renderPage();

            await user.click(await findConnectButton('Home'));

            expect(await screen.findByRole('link')).toHaveAttribute('href', 'https://jellyfin.org/downloads/server/');
            expect(screen.getByRole('alert')).toHaveTextContent('translated:HeaderUpdateRequired');
            expect(screen.queryByRole('button', { name: 'translated:Retry' })).not.toBeInTheDocument();
            expect(screen.queryByTestId('location')).not.toBeInTheDocument();
        });

        it('stays on the page, and enables the controls again, for the server selection', async () => {
            vi.mocked(ServerConnections.connectToServer).mockResolvedValue({ State: ConnectionState.ServerSelection });
            const { user } = renderPage();
            const homeButton = await findConnectButton('Home');

            await user.click(homeButton);

            await waitFor(() => expect(homeButton).not.toHaveAttribute('aria-disabled'));
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
            expect(getDeleteButton('Home')).toBeEnabled();
            expect(getStatus()).toBeEmptyDOMElement();
        });

        it('clears the failure when connecting again', async () => {
            vi.mocked(ServerConnections.connectToServer).mockResolvedValueOnce({ State: ConnectionState.Unavailable });
            const { user } = renderPage();
            await user.click(await findConnectButton('Home'));
            expect(await screen.findByRole('alert')).toBeInTheDocument();
            const connection = deferred<unknown>();
            vi.mocked(ServerConnections.connectToServer).mockReturnValue(connection.promise as never);

            await user.click(await findConnectButton('Work'));

            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
            expect(getStatus()).toHaveTextContent('translated:MessageConnectingToServer Work');
        });

        it('dismisses the failure and returns the focus to the server', async () => {
            vi.mocked(ServerConnections.connectToServer).mockResolvedValue({ State: ConnectionState.Unavailable });
            const { user } = renderPage();
            await user.click(await findConnectButton('Work'));

            await user.click(await screen.findByRole('button', { name: 'translated:ButtonClose' }));

            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
            await waitFor(() => expect(screen.getByRole('button', { name: 'translated:ButtonConnectTo Work' })).toHaveFocus());
        });

        it('ignores a second click while connecting, before the controls are disabled', async () => {
            const connection = deferred<unknown>();
            vi.mocked(ServerConnections.connectToServer).mockReturnValue(connection.promise as never);
            renderPage();
            const homeButton = await findConnectButton('Home');

            // Both clicks happen before the page is rendered again
            fireEvent.click(homeButton);
            fireEvent.click(homeButton);

            await waitFor(() => expect(ServerConnections.connectToServer).toHaveBeenCalled());
            expect(ServerConnections.connectToServer).toHaveBeenCalledTimes(1);
            connection.resolve({ State: ConnectionState.Unavailable });
            await screen.findByRole('alert');
        });

        describe('and retrying', () => {
            it('connects to the last server again, clearing the alert and focusing the server', async () => {
                vi.mocked(ServerConnections.connectToServer).mockResolvedValue({ State: ConnectionState.Unavailable });
                const { user } = renderPage();
                await user.click(await findConnectButton('Work'));
                await screen.findByRole('alert');
                const connection = deferred<unknown>();
                vi.mocked(ServerConnections.connectToServer).mockReturnValue(connection.promise as never);

                await user.click(screen.getByRole('button', { name: 'translated:Retry' }));

                expect(ServerConnections.connectToServer).toHaveBeenLastCalledWith(WORK, { enableAutoLogin: true });
                expect(screen.queryByRole('alert')).not.toBeInTheDocument();
                expect(screen.getByRole('button', { name: 'translated:ButtonConnectTo Work' })).toHaveFocus();
                expect(getStatus()).toHaveTextContent('translated:MessageConnectingToServer Work');

                connection.resolve({ State: ConnectionState.Unavailable });

                expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageServerConnectionFailed');
                expect(screen.getByRole('button', { name: 'translated:ButtonConnectTo Work' })).toHaveFocus();
            });

            it('continues when the retry succeeds', async () => {
                vi.mocked(ServerConnections.connectToServer).mockResolvedValueOnce({ State: ConnectionState.Unavailable });
                const { user } = renderPage();
                await user.click(await findConnectButton('Home'));
                vi.mocked(ServerConnections.connectToServer).mockResolvedValue(connectResult(ConnectionState.SignedIn));

                await user.click(await screen.findByRole('button', { name: 'translated:Retry' }));

                expect(await screen.findByTestId('location')).toHaveTextContent('/home');
            });
        });
    });

    describe('when deleting', () => {
        it('opens a confirmation for the server, with the cancel button focused', async () => {
            const { user } = renderPage();
            await findConnectButton('Work');

            await user.click(getDeleteButton('Work'));

            const dialog = await screen.findByRole('dialog', { name: 'translated:DeleteName Work' });
            expect(dialog).toHaveAccessibleDescription('translated:DeleteServerConfirmation');
            expect(screen.getByRole('button', { name: 'translated:ButtonCancel' })).toHaveFocus();
            expect(screen.queryByText('translated:MessageDeleteActiveServerWarning')).not.toBeInTheDocument();
        });

        it('warns before deleting the current server', async () => {
            vi.mocked(ServerConnections.currentApiClient).mockReturnValue(API_CLIENT);
            const { user } = renderPage();
            await findConnectButton('Home');

            await user.click(getDeleteButton('Home'));

            expect(await screen.findByText('translated:MessageDeleteActiveServerWarning')).toBeInTheDocument();
        });

        it('does not warn before deleting another server', async () => {
            vi.mocked(ServerConnections.currentApiClient).mockReturnValue(API_CLIENT);
            const { user } = renderPage();
            await findConnectButton('Home');

            await user.click(getDeleteButton('Work'));

            await screen.findByRole('dialog');
            expect(screen.queryByText('translated:MessageDeleteActiveServerWarning')).not.toBeInTheDocument();
        });

        it('deletes nothing when cancelled, and returns the focus to the delete button', async () => {
            const { user } = renderPage();
            await findConnectButton('Work');
            await user.click(getDeleteButton('Work'));

            await user.click(await screen.findByRole('button', { name: 'translated:ButtonCancel' }));

            await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
            expect(ServerConnections.deleteServer).not.toHaveBeenCalled();
            expect(getDeleteButton('Work')).toHaveFocus();
        });

        it('deletes the server, announces it, and focuses the server that took its place', async () => {
            const { user } = renderPage();
            await findConnectButton('Work');
            mockServers(WORK);

            await user.click(getDeleteButton('Home'));
            await user.click(await screen.findByRole('button', { name: 'translated:Delete' }));

            await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
            expect(ServerConnections.deleteServer).toHaveBeenCalledWith('home-id');
            await waitFor(() => expect(screen.queryByRole('button', { name: 'translated:ButtonConnectTo Home' })).not.toBeInTheDocument());
            expect(getStatus()).toHaveTextContent('translated:MessageServerDeleted Home');
            await waitFor(() => expect(screen.getByRole('button', { name: 'translated:ButtonConnectTo Work' })).toHaveFocus());
        });

        it('focuses the new last server after the last one was deleted', async () => {
            mockServers(HOME, WORK, CABIN);
            const { user } = renderPage();
            await findConnectButton('Cabin');
            mockServers(HOME, WORK);

            await user.click(getDeleteButton('Cabin'));
            await user.click(await screen.findByRole('button', { name: 'translated:Delete' }));

            await waitFor(() => expect(screen.getByRole('button', { name: 'translated:ButtonConnectTo Work' })).toHaveFocus());
        });

        it('focuses the add server button after the only server was deleted', async () => {
            mockServers(HOME);
            const { user } = renderPage();
            await findConnectButton('Home');
            mockServers();

            await user.click(getDeleteButton('Home'));
            await user.click(await screen.findByRole('button', { name: 'translated:Delete' }));

            expect(await screen.findByText('translated:MessageNoSavedServers')).toBeInTheDocument();
            await waitFor(() => expect(screen.getByRole('button', { name: 'translated:ButtonAddServer' })).toHaveFocus());
        });

        it('stays on the page after the current server was deleted', async () => {
            vi.mocked(ServerConnections.currentApiClient).mockReturnValue(API_CLIENT);
            const { user } = renderPage();
            await findConnectButton('Home');
            mockServers(WORK);

            await user.click(getDeleteButton('Home'));
            await user.click(await screen.findByRole('button', { name: 'translated:Delete' }));

            await waitFor(() => expect(screen.queryByRole('button', { name: 'translated:ButtonConnectTo Home' })).not.toBeInTheDocument());
            expect(screen.queryByTestId('location')).not.toBeInTheDocument();
            expect(ServerConnections.setLocalApiClient).not.toHaveBeenCalled();
        });

        it('shows the deletion in progress, with the dialog kept open', async () => {
            const deletion = deferred<void>();
            vi.mocked(ServerConnections.deleteServer).mockReturnValue(deletion.promise);
            const { user } = renderPage();
            await findConnectButton('Work');
            await user.click(getDeleteButton('Work'));

            await user.click(await screen.findByRole('button', { name: 'translated:Delete' }));

            const deleteButton = screen.getByRole('button', { name: 'translated:Delete' });
            // The page behind the dialog is hidden from assistive technology, so the dialog has the status
            expect(within(screen.getByRole('dialog')).getByRole('status'))
                .toHaveTextContent('translated:MessageDeletingServer Work');
            expect(deleteButton).toHaveAttribute('aria-disabled', 'true');
            expect(deleteButton).toHaveFocus();
            expect(screen.getByRole('button', { name: 'translated:ButtonCancel' })).toBeDisabled();
            fireEvent.click(deleteButton);
            expect(ServerConnections.deleteServer).toHaveBeenCalledTimes(1);

            deletion.resolve();
            await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        });

        it('shows a failure in the dialog, with the focus on the delete button to try again', async () => {
            vi.mocked(ServerConnections.deleteServer).mockRejectedValueOnce(
                Object.assign(new Error('Delete failed'), { config: { headers: { Authorization: HOME.AccessToken } } })
            );
            const { user } = renderPage();
            await findConnectButton('Work');
            await user.click(getDeleteButton('Work'));

            await user.click(await screen.findByRole('button', { name: 'translated:Delete' }));

            expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageServerDeleteFailed');
            const deleteButton = screen.getByRole('button', { name: 'translated:Delete' });
            expect(deleteButton).toHaveFocus();
            expect(deleteButton).not.toHaveAttribute('aria-disabled');
            expect(screen.getByRole('button', { name: 'translated:ButtonCancel' })).toBeEnabled();
            expect(getLoggedErrors()).not.toContain('secret');
            mockServers(HOME);

            await user.click(deleteButton);

            await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
            expect(ServerConnections.deleteServer).toHaveBeenCalledTimes(2);
        });

        it('forgets an earlier failure when the dialog is opened again', async () => {
            vi.mocked(ServerConnections.deleteServer).mockRejectedValueOnce(new Error('Delete failed'));
            const { user } = renderPage();
            await findConnectButton('Work');
            await user.click(getDeleteButton('Work'));
            await user.click(await screen.findByRole('button', { name: 'translated:Delete' }));
            await screen.findByRole('alert');
            await user.click(screen.getByRole('button', { name: 'translated:ButtonCancel' }));
            await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

            await user.click(getDeleteButton('Work'));

            await screen.findByRole('dialog');
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

        it('clears the connection failure of the deleted server', async () => {
            vi.mocked(ServerConnections.connectToServer).mockResolvedValue({ State: ConnectionState.Unavailable });
            const { user } = renderPage();
            await user.click(await findConnectButton('Work'));
            await screen.findByRole('alert');
            mockServers(HOME);

            await user.click(getDeleteButton('Work'));
            await user.click(await screen.findByRole('button', { name: 'translated:Delete' }));

            await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });
});
