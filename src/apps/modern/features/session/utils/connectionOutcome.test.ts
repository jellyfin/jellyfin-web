import { describe, expect, it } from 'vitest';

import { ConnectionState } from 'lib/jellyfin-apiclient/connectionState';

import { type ConnectResult, getConnectionOutcome, isConnectionProblem, UNAVAILABLE_OUTCOME } from './connectionOutcome';

const SERVER_ID = 'server-id';
const SERVERS = [ { Id: SERVER_ID } ];

describe('getConnectionOutcome', () => {
    it('maps signed in', () => {
        expect(getConnectionOutcome({ State: ConnectionState.SignedIn })).toEqual({ kind: 'signedIn' });
    });

    it('maps the server selection', () => {
        expect(getConnectionOutcome({ State: ConnectionState.ServerSelection })).toEqual({ kind: 'serverSelection' });
    });

    it('maps an update that is needed', () => {
        expect(getConnectionOutcome({
            State: ConnectionState.ServerUpdateNeeded,
            Servers: SERVERS
        })).toEqual({ kind: 'updateNeeded' });
    });

    it('maps an unavailable server', () => {
        expect(getConnectionOutcome({ State: ConnectionState.Unavailable })).toEqual({ kind: 'unavailable' });
    });

    it('maps a server mismatch to unavailable', () => {
        expect(getConnectionOutcome({ State: ConnectionState.ServerMismatch })).toEqual({ kind: 'unavailable' });
    });

    it('maps an unknown state to unavailable', () => {
        expect(getConnectionOutcome({ State: 'Unknown' } as unknown as ConnectResult)).toEqual({ kind: 'unavailable' });
    });

    describe('when the server needs a sign in', () => {
        const signIn = (systemInfo?: ConnectResult['SystemInfo'], servers: unknown[] = SERVERS) => ({
            State: ConnectionState.ServerSignIn,
            Servers: servers,
            SystemInfo: systemInfo
        }) as ConnectResult;

        it('continues to the login of the server when the wizard is completed', () => {
            expect(getConnectionOutcome(signIn({ StartupWizardCompleted: true })))
                .toEqual({ kind: 'serverSignIn', serverId: SERVER_ID });
        });

        it('continues to the wizard when it is not completed', () => {
            expect(getConnectionOutcome(signIn({ StartupWizardCompleted: false }))).toEqual({ kind: 'wizard' });
        });

        it('continues to the wizard when the server does not say whether it is completed', () => {
            expect(getConnectionOutcome(signIn({}))).toEqual({ kind: 'wizard' });
            expect(getConnectionOutcome(signIn({ StartupWizardCompleted: null }))).toEqual({ kind: 'wizard' });
        });

        it('continues to the login when there is no system info', () => {
            expect(getConnectionOutcome(signIn()))
                .toEqual({ kind: 'serverSignIn', serverId: SERVER_ID });
        });

        it('is unavailable without the id of the server', () => {
            expect(getConnectionOutcome(signIn({ StartupWizardCompleted: true }, [ {} ]))).toEqual(UNAVAILABLE_OUTCOME);
            expect(getConnectionOutcome(signIn({ StartupWizardCompleted: true }, []))).toEqual(UNAVAILABLE_OUTCOME);
            expect(getConnectionOutcome({ State: ConnectionState.ServerSignIn })).toEqual(UNAVAILABLE_OUTCOME);
        });
    });
});

describe('isConnectionProblem', () => {
    it('is true for the outcomes the page shows itself', () => {
        expect(isConnectionProblem({ kind: 'updateNeeded' })).toBe(true);
        expect(isConnectionProblem({ kind: 'unavailable' })).toBe(true);
    });

    it('is false for the outcomes that navigate', () => {
        expect(isConnectionProblem({ kind: 'signedIn' })).toBe(false);
        expect(isConnectionProblem({ kind: 'serverSignIn', serverId: SERVER_ID })).toBe(false);
        expect(isConnectionProblem({ kind: 'wizard' })).toBe(false);
        expect(isConnectionProblem({ kind: 'serverSelection' })).toBe(false);
    });
});
