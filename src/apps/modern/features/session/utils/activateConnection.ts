import { ServerConnections } from 'lib/jellyfin-apiclient';

import type { ConnectionOutcome, ConnectResult } from './connectionOutcome';

/** The outcomes that leave the page to continue with the connected server. */
const ACTIVATING_OUTCOMES: ConnectionOutcome['kind'][] = [ 'signedIn', 'serverSignIn', 'wizard' ];

/**
 * Makes the connected server the current one for the outcomes that leave the page, so the pages that follow
 * use it. Replaces Dashboard.onServerChanged.
 */
export const activateConnection = (result: ConnectResult, outcome: ConnectionOutcome) => {
    if (!result.ApiClient || !ACTIVATING_OUTCOMES.includes(outcome.kind)) return;

    ServerConnections.setLocalApiClient(result.ApiClient);
};
