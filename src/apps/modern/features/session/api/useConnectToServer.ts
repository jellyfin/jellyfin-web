import { useMutation } from '@tanstack/react-query';

import appSettings from 'scripts/settings/appSettings';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import { activateConnection } from '../utils/activateConnection';
import { type ConnectResult, getConnectionOutcome, type ConnectionOutcome, UNAVAILABLE_OUTCOME } from '../utils/connectionOutcome';
import { toLoggableError } from '../utils/loggableError';
import type { AvailableServer } from './useAvailableServers';

/**
 * Connects, makes the server the current one when the outcome continues with it, and maps the result. Never rejects:
 * a failure is the unavailable outcome. The failure is logged without the server, which carries an access token.
 */
const connect = async (
    name: string,
    connectFn: () => Promise<ConnectResult>
): Promise<ConnectionOutcome> => {
    try {
        const result = await connectFn();
        const outcome = getConnectionOutcome(result);
        activateConnection(result, outcome);
        return outcome;
    } catch (error) {
        console.error(`[${name}] unable to connect to the server`, toLoggableError(error));
        return UNAVAILABLE_OUTCOME;
    }
};

export const useConnectToServer = () => useMutation<ConnectionOutcome, Error, AvailableServer>({
    mutationFn: server => connect('useConnectToServer', () => ServerConnections.connectToServer(server, {
        enableAutoLogin: appSettings.enableAutoLogin()
    })),
    // Don't keep the server, with its access token, in the mutation cache
    gcTime: 0
});

export const useConnectToAddress = () => useMutation<ConnectionOutcome, Error, string>({
    mutationFn: address => connect('useConnectToAddress', () => ServerConnections.connectToAddress(address, {
        enableAutoLogin: appSettings.enableAutoLogin()
    })),
    gcTime: 0
});
