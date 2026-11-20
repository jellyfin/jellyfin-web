import type { ConnectResponse } from 'jellyfin-apiclient';

import { ConnectionState } from 'lib/jellyfin-apiclient/connectionState';

/**
 * The fields of a connection result this app reads. ConnectResponse lacks SystemInfo, which the connection manager
 * sets on every result for a connected server.
 */
export type ConnectResult = Pick<ConnectResponse, 'State'> & Partial<Omit<ConnectResponse, 'State'>> & {
    SystemInfo?: { StartupWizardCompleted?: boolean | null }
};

export type ConnectionOutcome =
    | { kind: 'signedIn' }
    | { kind: 'serverSignIn', serverId: string }
    | { kind: 'wizard' }
    | { kind: 'serverSelection' }
    | { kind: 'updateNeeded' }
    | { kind: 'unavailable' };

/** The outcomes the page has to show itself instead of navigating. */
export type ConnectionProblem = Extract<ConnectionOutcome, { kind: 'updateNeeded' | 'unavailable' }>;

export const UNAVAILABLE_OUTCOME: ConnectionOutcome = { kind: 'unavailable' };

/**
 * Maps the result of connecting to a server to what the app does next. A server mismatch is reported as unavailable,
 * as are results that can not be acted on.
 */
export const getConnectionOutcome = (result: ConnectResult): ConnectionOutcome => {
    switch (result.State) {
        case ConnectionState.SignedIn:
            return { kind: 'signedIn' };
        case ConnectionState.ServerSignIn: {
            // The wizard is also considered incomplete when the server does not say, like the rest of the app does
            if (result.SystemInfo && !result.SystemInfo.StartupWizardCompleted) return { kind: 'wizard' };

            // Without the id of the server there is no login page to continue to
            const serverId = result.Servers?.[0]?.Id;
            return serverId ? { kind: 'serverSignIn', serverId } : UNAVAILABLE_OUTCOME;
        }
        case ConnectionState.ServerSelection:
            return { kind: 'serverSelection' };
        case ConnectionState.ServerUpdateNeeded:
            return { kind: 'updateNeeded' };
        default:
            return UNAVAILABLE_OUTCOME;
    }
};

export const isConnectionProblem = (outcome: ConnectionOutcome): outcome is ConnectionProblem => (
    outcome.kind === 'updateNeeded' || outcome.kind === 'unavailable'
);
