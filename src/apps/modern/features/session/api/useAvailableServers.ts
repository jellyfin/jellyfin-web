import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ServerConnections } from 'lib/jellyfin-apiclient';

import { toLoggableError } from '../utils/loggableError';

/**
 * A saved or discovered server. It carries the access token and user id, so it must not be persisted or logged.
 * The shape follows the connection manager, which does not type it.
 */
export interface AvailableServer {
    Id: string
    Name?: string
    ManualAddress?: string
    LocalAddress?: string
    RemoteAddress?: string
    AccessToken?: string | null
    UserId?: string | null
    [key: string]: unknown
}

export const AVAILABLE_SERVERS_QUERY_KEY = 'AvailableServers';
/** How long the servers, with their access tokens, stay in memory once nothing uses them */
const GC_TIME = 60 * 1000;

export const getAvailableServersQuery = () => queryOptions({
    queryKey: [ AVAILABLE_SERVERS_QUERY_KEY ],
    // The type is wrong: this resolves with the servers
    queryFn: () => ServerConnections.getAvailableServers() as unknown as Promise<AvailableServer[]>,
    // Servers can be discovered since the last visit, so the list is loaded again every time
    staleTime: 0,
    // Loading it again would flicker the list while a dialog or a connection attempt is in progress
    refetchOnWindowFocus: false,
    // The servers carry access tokens, which must not end up in the persisted cache
    meta: { persist: false },
    gcTime: GC_TIME
});

export const useAvailableServers = () => useQuery(getAvailableServersQuery());

/** Returns the id of the server a user is signed in to, which is not necessarily the most recently used one. */
export const useActiveServerId = (): string | undefined => {
    const apiClient = ServerConnections.currentApiClient();
    // The current ApiClient can outlive the session, or be the last used server without one
    return apiClient?.accessToken() ? apiClient.serverId() : undefined;
};

export const useDeleteServer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (serverId: string) => ServerConnections.deleteServer(serverId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [ AVAILABLE_SERVERS_QUERY_KEY ] }),
        onError: error => {
            console.error('[useDeleteServer] unable to delete the server', toLoggableError(error));
        },
        gcTime: 0
    });
};
