import type { Api } from '@jellyfin/sdk/lib/api';
import type { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client/models/authentication-result';
import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React, { type ReactNode, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import QuickConnectDialog from './QuickConnectDialog';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string) => `translated:${key}`
    }
}));

vi.mock('@jellyfin/sdk/lib/utils/api/authentication-api', () => ({
    getAuthenticationApi: vi.fn()
}));

const API = { basePath: 'https://jellyfin.example' } as Api;
const SECRET = 'quick-connect-secret';
const RESULT: AuthenticationResult = { ServerId: 'server-id', AccessToken: 'token' };
const POLLING_INTERVAL = 5000;

const authenticationApi = {
    getQuickConnectState: vi.fn(),
    authenticateWithQuickConnect: vi.fn()
};

const theme = createTheme({ cssVariables: true });

const renderDialog = (
    props: Partial<React.ComponentProps<typeof QuickConnectDialog>> = {},
    { isStrictMode = false } = {}
) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false }
        }
    });
    const onAuthenticated = vi.fn();
    const onClose = vi.fn();
    const onError = vi.fn();

    const ui = (overrides: Partial<React.ComponentProps<typeof QuickConnectDialog>> = {}): ReactNode => (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <QuickConnectDialog
                    api={API}
                    code='123456'
                    secret={SECRET}
                    onAuthenticated={onAuthenticated}
                    onClose={onClose}
                    onError={onError}
                    {...props}
                    {...overrides}
                />
            </ThemeProvider>
        </QueryClientProvider>
    );

    const result = render(ui(), { wrapper: isStrictMode ? StrictMode : undefined });

    return {
        ...result,
        queryClient,
        rerender: (overrides?: Partial<React.ComponentProps<typeof QuickConnectDialog>>) => result.rerender(ui(overrides)),
        onAuthenticated,
        onClose,
        onError
    };
};

/** Advances the fake timers and flushes the resulting requests and renders. */
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

/**
 * Flushes the state request, the token exchange and the resulting renders. Effects only run when each act
 * scope ends, so every step needs its own pass.
 */
const flush = async () => {
    await advance(10);
    await advance(10);
    await advance(10);
};

describe('QuickConnectDialog', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.mocked(getAuthenticationApi).mockReturnValue(authenticationApi as never);
        authenticationApi.getQuickConnectState.mockResolvedValue({ data: { Authenticated: false } });
        authenticationApi.authenticateWithQuickConnect.mockResolvedValue({ data: RESULT });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows the code and closes when cancelled or escaped', async () => {
        const { onClose } = renderDialog();
        await advance(0);

        expect(screen.getByText('translated:QuickConnectAuthorizeCode')).toBeInTheDocument();
        const cancel = screen.getByRole('button', { name: 'translated:ButtonCancel' });
        fireEvent.click(cancel);
        fireEvent.keyDown(cancel, { key: 'Escape' });

        expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('polls until authenticated, then completes the login once', async () => {
        authenticationApi.getQuickConnectState
            .mockResolvedValueOnce({ data: { Authenticated: false } })
            .mockResolvedValueOnce({ data: { Authenticated: false } })
            .mockResolvedValueOnce({ data: { Authenticated: true } });
        const { onAuthenticated, onClose, rerender } = renderDialog();

        await advance(0);
        expect(authenticationApi.getQuickConnectState).toHaveBeenCalledOnce();
        expect(authenticationApi.getQuickConnectState).toHaveBeenCalledWith({ secret: SECRET }, expect.anything());

        await advance(POLLING_INTERVAL);
        expect(authenticationApi.getQuickConnectState).toHaveBeenCalledTimes(2);
        expect(onAuthenticated).not.toHaveBeenCalled();

        await advance(POLLING_INTERVAL);
        await flush();
        expect(authenticationApi.authenticateWithQuickConnect).toHaveBeenCalledOnce();
        expect(authenticationApi.authenticateWithQuickConnect).toHaveBeenCalledWith({
            quickConnectDto: { Secret: SECRET }
        });
        expect(onAuthenticated).toHaveBeenCalledOnce();
        expect(onAuthenticated).toHaveBeenCalledWith(RESULT);

        // The login can no longer be cancelled
        const cancel = screen.getByRole('button', { name: 'translated:ButtonCancel' });
        expect(cancel).toBeDisabled();
        fireEvent.keyDown(cancel, { key: 'Escape' });
        expect(onClose).not.toHaveBeenCalled();

        // Polling stops and a new callback does not complete the login again
        const nextOnAuthenticated = vi.fn();
        rerender({ onAuthenticated: nextOnAuthenticated });
        await advance(POLLING_INTERVAL * 3);
        expect(authenticationApi.getQuickConnectState).toHaveBeenCalledTimes(3);
        expect(onAuthenticated).toHaveBeenCalledOnce();
        expect(nextOnAuthenticated).not.toHaveBeenCalled();
    });

    it('completes the login once in strict mode', async () => {
        authenticationApi.getQuickConnectState.mockResolvedValue({ data: { Authenticated: true } });
        const { onAuthenticated } = renderDialog({}, { isStrictMode: true });

        await flush();

        expect(authenticationApi.authenticateWithQuickConnect).toHaveBeenCalledOnce();
        expect(onAuthenticated).toHaveBeenCalledOnce();
        expect(onAuthenticated).toHaveBeenCalledWith(RESULT);
    });

    it('does not cache the access token or persist the secret', async () => {
        authenticationApi.getQuickConnectState.mockResolvedValue({ data: { Authenticated: true } });
        const { onAuthenticated, queryClient } = renderDialog();

        await flush();
        expect(onAuthenticated).toHaveBeenCalledOnce();

        const queries = queryClient.getQueryCache().getAll();
        expect(queries).toHaveLength(1);
        const [ query ] = queries;
        // The polling query is scoped to the server and only caches whether the request is authorized
        expect(query.queryKey).toEqual([ 'QuickConnect', 'State', API.basePath, SECRET ]);
        expect(query.state.data).toBe(true);
        expect(query.meta).toEqual({ persist: false });
        expect(JSON.stringify(queries.map(q => q.state))).not.toContain(RESULT.AccessToken);

        // The mutations holding the secret and token are removed from the cache
        await advance(0);
        for (const mutation of queryClient.getMutationCache().getAll()) {
            expect(mutation.options.gcTime).toBe(0);
        }
    });

    it('scopes polling to the server', async () => {
        const otherApi = { basePath: 'https://other.example' } as Api;
        const { queryClient } = renderDialog({ api: otherApi });

        await advance(0);

        expect(getAuthenticationApi).toHaveBeenCalledWith(otherApi);
        expect(queryClient.getQueryCache().getAll()[0].queryKey).toContain(otherApi.basePath);
    });

    it('reports errors exchanging the secret', async () => {
        const error = new Error('Unauthorized');
        authenticationApi.getQuickConnectState.mockResolvedValue({ data: { Authenticated: true } });
        authenticationApi.authenticateWithQuickConnect.mockRejectedValueOnce(error);
        const { onAuthenticated, onError } = renderDialog();

        await flush();

        expect(onError).toHaveBeenCalledWith(error);
        expect(onAuthenticated).not.toHaveBeenCalled();
    });

    it('reports polling errors', async () => {
        const error = new Error('Quick connect deactivated');
        authenticationApi.getQuickConnectState.mockRejectedValueOnce(error);
        const { onAuthenticated, onError } = renderDialog();

        await advance(0);

        expect(onError).toHaveBeenCalledWith(error);
        expect(onAuthenticated).not.toHaveBeenCalled();
    });

    it('stops polling when unmounted', async () => {
        const { unmount } = renderDialog();

        await advance(POLLING_INTERVAL);
        expect(authenticationApi.getQuickConnectState).toHaveBeenCalledTimes(2);

        unmount();
        await advance(POLLING_INTERVAL * 3);

        expect(authenticationApi.getQuickConnectState).toHaveBeenCalledTimes(2);
    });
});
