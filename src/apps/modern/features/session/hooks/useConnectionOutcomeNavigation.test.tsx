import { act, renderHook } from '@testing-library/react';
import React, { type PropsWithChildren } from 'react';
import { MemoryRouter, useLocation, useNavigationType } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import type { ConnectionOutcome } from '../utils/connectionOutcome';
import { useConnectionOutcomeNavigation } from './useConnectionOutcomeNavigation';

const Wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter
        initialEntries={[ '/selectserver' ]}
        // eslint-disable-next-line @typescript-eslint/naming-convention
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
        {children}
    </MemoryRouter>
);

const renderNavigation = () => renderHook(() => ({
    navigateForOutcome: useConnectionOutcomeNavigation(),
    location: useLocation(),
    navigationType: useNavigationType()
}), { wrapper: Wrapper });

describe('useConnectionOutcomeNavigation', () => {
    it.each<[ ConnectionOutcome, string, string ]>([
        [ { kind: 'signedIn' }, '/home', 'REPLACE' ],
        [ { kind: 'serverSignIn', serverId: 'server id' }, '/login?serverid=server%20id', 'PUSH' ],
        [ { kind: 'wizard' }, '/wizard/start', 'PUSH' ]
    ])('navigates for the %j outcome', (outcome, destination, navigationType) => {
        const { result } = renderNavigation();

        let problem;
        act(() => {
            problem = result.current.navigateForOutcome(outcome);
        });

        expect(problem).toBeUndefined();
        expect(result.current.location.pathname + result.current.location.search).toBe(destination);
        expect(result.current.navigationType).toBe(navigationType);
    });

    it('stays on the server selection', () => {
        const { result } = renderNavigation();

        act(() => {
            expect(result.current.navigateForOutcome({ kind: 'serverSelection' })).toBeUndefined();
        });

        expect(result.current.location.pathname).toBe('/selectserver');
    });

    it.each<ConnectionOutcome>([
        { kind: 'updateNeeded' },
        { kind: 'unavailable' }
    ])('returns the problem for the $kind outcome without navigating', outcome => {
        const { result } = renderNavigation();

        let problem;
        act(() => {
            problem = result.current.navigateForOutcome(outcome);
        });

        expect(problem).toEqual(outcome);
        expect(result.current.location.pathname).toBe('/selectserver');
        expect(result.current.navigationType).toBe('POP');
    });
});
