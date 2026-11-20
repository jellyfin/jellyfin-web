import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ApiClient } from 'jellyfin-apiclient';
import React, { type PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import { shouldDehydrateQuery } from 'utils/query/queryClient';

import {
    type AvailableServer,
    getAvailableServersQuery,
    useActiveServerId,
    useAvailableServers,
    useDeleteServer
} from './useAvailableServers';

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        getAvailableServers: vi.fn(),
        deleteServer: vi.fn(),
        currentApiClient: vi.fn()
    }
}));

vi.mock('idb-keyval', () => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn()
}));

const SERVERS: AvailableServer[] = [
    { Id: 'home-id', Name: 'Home', AccessToken: 'secret-token' },
    { Id: 'work-id', Name: 'Work' }
];

const createQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: { retry: false }
    }
});

const createWrapper = (queryClient: QueryClient) => {
    const Wrapper = ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return Wrapper;
};

describe('useAvailableServers', () => {
    beforeEach(() => {
        vi.mocked(ServerConnections.getAvailableServers).mockReset();
        vi.mocked(ServerConnections.deleteServer).mockReset();
        vi.mocked(ServerConnections.currentApiClient).mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns the servers', async () => {
        vi.mocked(ServerConnections.getAvailableServers).mockReturnValue(Promise.resolve(SERVERS) as never);
        const { result } = renderHook(() => useAvailableServers(), { wrapper: createWrapper(createQueryClient()) });

        await waitFor(() => expect(result.current.data).toEqual(SERVERS));
    });

    it('loads the servers again when mounted again', async () => {
        vi.mocked(ServerConnections.getAvailableServers).mockReturnValue(Promise.resolve(SERVERS) as never);
        const wrapper = createWrapper(createQueryClient());

        const first = renderHook(() => useAvailableServers(), { wrapper });
        await waitFor(() => expect(first.result.current.data).toEqual(SERVERS));
        first.unmount();

        const second = renderHook(() => useAvailableServers(), { wrapper });
        await waitFor(() => expect(ServerConnections.getAvailableServers).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(second.result.current.isFetching).toBe(false));
    });

    it('is not persisted, since the servers carry access tokens', async () => {
        vi.mocked(ServerConnections.getAvailableServers).mockReturnValue(Promise.resolve(SERVERS) as never);
        const queryClient = createQueryClient();
        const options = getAvailableServersQuery();
        await queryClient.query(options);

        const query = queryClient.getQueryCache().find({ queryKey: options.queryKey });

        expect(query).toBeDefined();
        expect(query?.state.status).toBe('success');
        expect(shouldDehydrateQuery(query!)).toBe(false);
    });
});

describe('useActiveServerId', () => {
    beforeEach(() => {
        vi.mocked(ServerConnections.currentApiClient).mockReset();
    });

    it('returns the id of the server a user is signed in to', () => {
        vi.mocked(ServerConnections.currentApiClient).mockReturnValue({
            serverId: () => 'home-id',
            accessToken: () => 'secret-token'
        } as ApiClient);

        const { result } = renderHook(() => useActiveServerId());

        expect(result.current).toBe('home-id');
    });

    it('returns undefined when nobody is signed in to the current server', () => {
        vi.mocked(ServerConnections.currentApiClient).mockReturnValue({
            serverId: () => 'home-id',
            accessToken: () => undefined
        } as unknown as ApiClient);

        const { result } = renderHook(() => useActiveServerId());

        expect(result.current).toBeUndefined();
    });

    it('returns undefined when there is no current server', () => {
        vi.mocked(ServerConnections.currentApiClient).mockReturnValue(undefined);

        const { result } = renderHook(() => useActiveServerId());

        expect(result.current).toBeUndefined();
    });
});

describe('useDeleteServer', () => {
    beforeEach(() => {
        vi.mocked(ServerConnections.getAvailableServers).mockReset();
        vi.mocked(ServerConnections.deleteServer).mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('deletes the server and loads the servers again', async () => {
        vi.mocked(ServerConnections.getAvailableServers)
            .mockReturnValueOnce(Promise.resolve(SERVERS) as never)
            .mockReturnValueOnce(Promise.resolve([ SERVERS[1] ]) as never);
        vi.mocked(ServerConnections.deleteServer).mockResolvedValue(undefined);
        const { result } = renderHook(() => ({
            servers: useAvailableServers(),
            deleteServer: useDeleteServer()
        }), { wrapper: createWrapper(createQueryClient()) });
        await waitFor(() => expect(result.current.servers.data).toEqual(SERVERS));

        await act(() => result.current.deleteServer.mutateAsync('home-id'));

        expect(ServerConnections.deleteServer).toHaveBeenCalledWith('home-id');
        await waitFor(() => expect(result.current.servers.data).toEqual([ SERVERS[1] ]));
    });

    it('logs only the loggable fields of a failure', async () => {
        const error = Object.assign(new Error('Delete failed'), { config: { headers: { Authorization: 'secret-token' } } });
        vi.mocked(ServerConnections.deleteServer).mockRejectedValue(error);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { result } = renderHook(() => useDeleteServer(), { wrapper: createWrapper(createQueryClient()) });

        await act(async () => {
            await expect(result.current.mutateAsync('home-id')).rejects.toThrow('Delete failed');
        });

        expect(consoleError).toHaveBeenCalledWith(
            '[useDeleteServer] unable to delete the server',
            expect.objectContaining({ message: 'Delete failed' })
        );
        expect(JSON.stringify(consoleError.mock.calls)).not.toContain('secret');
    });
});
