import type { ApiClient } from 'jellyfin-apiclient';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectionState } from 'lib/jellyfin-apiclient/connectionState';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import { activateConnection } from './activateConnection';
import type { ConnectionOutcome, ConnectResult } from './connectionOutcome';

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        setLocalApiClient: vi.fn()
    }
}));

const API_CLIENT = { serverId: () => 'server-id' } as ApiClient;
const RESULT: ConnectResult = { State: ConnectionState.SignedIn, ApiClient: API_CLIENT };

describe('activateConnection', () => {
    beforeEach(() => {
        vi.mocked(ServerConnections.setLocalApiClient).mockClear();
    });

    it.each<ConnectionOutcome>([
        { kind: 'signedIn' },
        { kind: 'serverSignIn', serverId: 'server-id' },
        { kind: 'wizard' }
    ])('makes the connected server current for the $kind outcome', outcome => {
        activateConnection(RESULT, outcome);

        expect(ServerConnections.setLocalApiClient).toHaveBeenCalledWith(API_CLIENT);
    });

    it.each<ConnectionOutcome>([
        { kind: 'serverSelection' },
        { kind: 'updateNeeded' },
        { kind: 'unavailable' }
    ])('leaves the current server for the $kind outcome', outcome => {
        activateConnection(RESULT, outcome);

        expect(ServerConnections.setLocalApiClient).not.toHaveBeenCalled();
    });

    it('does nothing without an api client', () => {
        activateConnection({ State: ConnectionState.SignedIn }, { kind: 'signedIn' });

        expect(ServerConnections.setLocalApiClient).not.toHaveBeenCalled();
    });
});
