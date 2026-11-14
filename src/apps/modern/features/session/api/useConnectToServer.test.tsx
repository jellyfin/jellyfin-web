import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ApiClient } from 'jellyfin-apiclient';
import React, { type PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectionState } from 'lib/jellyfin-apiclient/connectionState';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import type { AvailableServer } from './useAvailableServers';
import { useConnectToAddress, useConnectToServer } from './useConnectToServer';

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        connectToServer: vi.fn(),
        connectToAddress: vi.fn(),
        setLocalApiClient: vi.fn()
    }
}));

vi.mock('scripts/settings/appSettings', () => ({
    default: {
        enableAutoLogin: () => true
    }
}));

const API_CLIENT = { serverId: () => 'server-id' } as ApiClient;
const ADDRESS = 'https://secret-host.example';
const SERVER: AvailableServer = { Id: 'server-id', Name: 'Home', AccessToken: 'secret-token' };
const SIGNED_IN = { State: ConnectionState.SignedIn, ApiClient: API_CLIENT, Servers: [ SERVER ] };

const Wrapper = ({ children }: PropsWithChildren) => {
    const [ queryClient ] = React.useState(() => new QueryClient());
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useConnectToServer', () => {
    beforeEach(() => {
        vi.mocked(ServerConnections.connectToServer).mockReset();
        vi.mocked(ServerConnections.connectToAddress).mockReset();
        vi.mocked(ServerConnections.setLocalApiClient).mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('connects with the auto login setting and resolves the outcome', async () => {
        vi.mocked(ServerConnections.connectToServer).mockResolvedValue(SIGNED_IN);
        const { result } = renderHook(() => useConnectToServer(), { wrapper: Wrapper });

        let outcome;
        await act(async () => {
            outcome = await result.current.mutateAsync(SERVER);
        });

        expect(outcome).toEqual({ kind: 'signedIn' });
        expect(ServerConnections.connectToServer).toHaveBeenCalledWith(SERVER, { enableAutoLogin: true });
    });

    it('makes the server current before the outcome is resolved', async () => {
        vi.mocked(ServerConnections.connectToServer).mockResolvedValue(SIGNED_IN);
        vi.mocked(ServerConnections.setLocalApiClient).mockImplementation(() => {
            expect(ServerConnections.connectToServer).toHaveBeenCalled();
        });
        const { result } = renderHook(() => useConnectToServer(), { wrapper: Wrapper });

        await act(() => result.current.mutateAsync(SERVER));

        expect(ServerConnections.setLocalApiClient).toHaveBeenCalledWith(API_CLIENT);
    });

    it('leaves the current server alone for a server that is unavailable', async () => {
        vi.mocked(ServerConnections.connectToServer).mockResolvedValue({ State: ConnectionState.Unavailable });
        const { result } = renderHook(() => useConnectToServer(), { wrapper: Wrapper });

        let outcome;
        await act(async () => {
            outcome = await result.current.mutateAsync(SERVER);
        });

        expect(outcome).toEqual({ kind: 'unavailable' });
        expect(ServerConnections.setLocalApiClient).not.toHaveBeenCalled();
    });

    it('resolves unavailable and logs only the loggable fields of a failure', async () => {
        const error = Object.assign(new Error('Network Error'), {
            config: { url: ADDRESS, headers: { Authorization: 'secret-token' } }
        });
        vi.mocked(ServerConnections.connectToServer).mockRejectedValue(error);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { result } = renderHook(() => useConnectToServer(), { wrapper: Wrapper });

        let outcome;
        await act(async () => {
            outcome = await result.current.mutateAsync(SERVER);
        });

        expect(outcome).toEqual({ kind: 'unavailable' });
        expect(consoleError).toHaveBeenCalledWith(
            '[useConnectToServer] unable to connect to the server',
            expect.objectContaining({ message: 'Network Error' })
        );
        expect(JSON.stringify(consoleError.mock.calls)).not.toContain('secret');
    });

    it('does not keep the server, with its access token, in the mutation cache', async () => {
        vi.mocked(ServerConnections.connectToServer).mockResolvedValue(SIGNED_IN);
        const queryClient = new QueryClient();
        const { result, unmount } = renderHook(() => useConnectToServer(), {
            wrapper: ({ children }: PropsWithChildren) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            )
        });

        await act(() => result.current.mutateAsync(SERVER));
        unmount();

        await waitFor(() => expect(queryClient.getMutationCache().getAll()).toHaveLength(0));
    });
});

describe('useConnectToAddress', () => {
    beforeEach(() => {
        vi.mocked(ServerConnections.connectToAddress).mockReset();
        vi.mocked(ServerConnections.setLocalApiClient).mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('connects to the address and resolves the outcome', async () => {
        vi.mocked(ServerConnections.connectToAddress).mockResolvedValue({
            State: ConnectionState.ServerSignIn,
            ApiClient: API_CLIENT,
            Servers: [ { Id: 'server-id' } ],
            SystemInfo: { StartupWizardCompleted: true }
        });
        const { result } = renderHook(() => useConnectToAddress(), { wrapper: Wrapper });

        let outcome;
        await act(async () => {
            outcome = await result.current.mutateAsync(ADDRESS);
        });

        expect(outcome).toEqual({ kind: 'serverSignIn', serverId: 'server-id' });
        expect(ServerConnections.connectToAddress).toHaveBeenCalledWith(ADDRESS, { enableAutoLogin: true });
        expect(ServerConnections.setLocalApiClient).toHaveBeenCalledWith(API_CLIENT);
    });

    it('resolves unavailable without logging the address when the connection fails', async () => {
        vi.mocked(ServerConnections.connectToAddress).mockRejectedValue(new Error(`Failed to reach ${ADDRESS}`));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { result } = renderHook(() => useConnectToAddress(), { wrapper: Wrapper });

        let outcome;
        await act(async () => {
            outcome = await result.current.mutateAsync(ADDRESS);
        });

        expect(outcome).toEqual({ kind: 'unavailable' });
        expect(consoleError).toHaveBeenCalledWith(
            '[useConnectToAddress] unable to connect to the server',
            expect.anything()
        );
    });
});
