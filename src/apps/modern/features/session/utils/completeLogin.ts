import type { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client/models/authentication-result';

import { ServerConnections } from 'lib/jellyfin-apiclient';

/**
 * Updates the state of the legacy ApiClient after a successful authentication.
 * @param result The authentication result.
 * @param expectedServerId The id of the server the authentication request was made to. Results for any other
 * server, or if it is unknown, are rejected so a login cannot be completed for a different server.
 */
export const completeLogin = async (result: AuthenticationResult, expectedServerId: string | undefined) => {
    const serverId = result.ServerId;
    if (!serverId) throw new Error('serverId is required');
    if (serverId !== expectedServerId) throw new Error('The authentication result is for a different server');

    const apiClient = ServerConnections.getOrCreateApiClient(serverId);
    await apiClient.onAuthenticated(apiClient, result);
    ServerConnections.setLocalApiClient(apiClient);
};
