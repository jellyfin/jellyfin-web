import type { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client/models/authentication-result';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import React from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { completeLogin } from 'apps/modern/features/session/utils/completeLogin';
import alert from 'components/alert';
import toast from 'components/toast/toast';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { renderWithRouter } from 'test/renderWithRouter';

import LoginPage from './index';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string) => `translated:${key}`
    }
}));

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        getApi: vi.fn(),
        getLastUsedServer: vi.fn()
    }
}));

vi.mock('@jellyfin/sdk/lib/utils/api/authentication-api', () => ({
    getAuthenticationApi: vi.fn()
}));

vi.mock('@jellyfin/sdk/lib/utils/api/user-api', () => ({
    getUserApi: vi.fn()
}));

vi.mock('@jellyfin/sdk/lib/utils/api/branding-api', () => ({
    getBrandingApi: () => ({
        getBrandingOptions: () => Promise.resolve({ data: {} })
    })
}));

vi.mock('apps/modern/features/session/utils/completeLogin', () => ({
    completeLogin: vi.fn()
}));

vi.mock('components/alert', () => ({
    default: vi.fn(() => Promise.resolve())
}));

vi.mock('components/toast/toast', () => ({
    default: vi.fn()
}));

vi.mock('components/apphost', () => ({
    appHost: {
        supports: () => false
    }
}));

vi.mock('components/Page', () => ({
    default: ({ children }: React.PropsWithChildren) => <div>{children}</div>
}));

vi.mock('components/loading/LoadingComponent', () => ({
    default: () => null
}));

vi.mock('components/UserAvatar', () => ({
    default: () => null
}));

vi.mock('scripts/settings/appSettings', () => ({
    default: {
        enableAutoLogin: () => true
    }
}));

vi.mock('utils/dashboard', () => ({
    selectServer: vi.fn()
}));

const SERVER_ID = 'server-id';
const OTHER_SERVER_ID = 'other-server-id';
const API = { basePath: 'https://jellyfin.example' };
const OTHER_API = { basePath: 'https://other.example' };
const RESULT: AuthenticationResult = { ServerId: SERVER_ID, AccessToken: 'token' };
const QUICK_CONNECT_SECRET = 'quick-connect-secret';
const USERS: UserDto[] = [
    { Id: 'alice-id', Name: 'alice' },
    { Id: 'bob-id', Name: 'bob' }
];
const TYPED_TEXT = 'correct horse';

const authenticationApi = {
    authenticateUserByName: vi.fn(),
    getQuickConnectEnabled: vi.fn(),
    initiateQuickConnect: vi.fn(),
    getQuickConnectState: vi.fn(),
    authenticateWithQuickConnect: vi.fn()
};
const otherAuthenticationApi = {
    authenticateUserByName: vi.fn(),
    getQuickConnectEnabled: vi.fn(),
    getQuickConnectState: vi.fn(),
    authenticateWithQuickConnect: vi.fn()
};
const userApi = {
    getPublicUsers: vi.fn()
};

const httpError = (status: number, config?: InternalAxiosRequestConfig) => new AxiosError(
    `Request failed with status code ${status}`,
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { status, config } as AxiosResponse
);

/** Returns everything logged with console.error, including the properties of logged objects. */
const getLoggedErrors = () => JSON.stringify(vi.mocked(console.error).mock.calls);

/** Creates a promise that can be resolved from the test. */
const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(r => {
        resolve = r;
    });
    return { promise, resolve };
};

const theme = createTheme({ cssVariables: true });

/** Requests a different server while the login page is open. */
const ChangeServerButton = () => {
    const navigate = useNavigate();
    return <button onClick={() => navigate(`/login?serverid=${OTHER_SERVER_ID}`)}>change server</button>;
};

const CurrentLocation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    return (
        <>
            <div data-testid='location'>{location.pathname + location.search}</div>
            <button onClick={() => navigate(-1)}>back</button>
        </>
    );
};

const renderLoginPage = (initialEntry = '/login', previousEntries: string[] = []) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    });

    return renderWithRouter(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <Routes>
                    <Route path='/login' element={<LoginPage />} />
                    <Route path='*' element={<CurrentLocation />} />
                </Routes>
                <ChangeServerButton />
            </ThemeProvider>
        </QueryClientProvider>,
        { initialEntries: [ ...previousEntries, initialEntry ], initialIndex: previousEntries.length }
    );
};

const getUserButton = (name: string) => screen.findByRole('button', { name });

describe('LoginPage', () => {
    beforeEach(() => {
        vi.mocked(ServerConnections.getApi).mockImplementation(serverId => (
            (serverId === OTHER_SERVER_ID ? OTHER_API : API) as never
        ));
        vi.mocked(ServerConnections.getLastUsedServer).mockReturnValue({ Id: SERVER_ID } as never);
        vi.mocked(getAuthenticationApi).mockImplementation(api => (
            (api === OTHER_API as never ? otherAuthenticationApi : authenticationApi) as never
        ));
        vi.mocked(getUserApi).mockReturnValue(userApi as never);

        userApi.getPublicUsers.mockResolvedValue({ data: USERS });
        authenticationApi.getQuickConnectEnabled.mockResolvedValue({ data: false });
        otherAuthenticationApi.getQuickConnectEnabled.mockResolvedValue({ data: true });
        authenticationApi.authenticateUserByName.mockResolvedValue({ data: RESULT });
        vi.mocked(completeLogin).mockResolvedValue();
        vi.mocked(alert).mockResolvedValue(undefined);
        vi.spyOn(console, 'error').mockImplementation(() => { /* silence expected errors */ });
    });

    it('opens the prefilled manual form without trying to login when a user is selected', async () => {
        const { user } = renderLoginPage();

        await user.click(await getUserButton('bob'));

        expect(await screen.findByLabelText(/translated:LabelUser/)).toHaveValue('bob');
        expect(screen.getByLabelText('translated:LabelPassword')).toHaveFocus();
        expect(authenticationApi.authenticateUserByName).not.toHaveBeenCalled();
    });

    it('logs in a selected user and navigates to the target url', async () => {
        const { user } = renderLoginPage('/login?url=%2Fmovies%3Fid%3D1');

        await user.click(await getUserButton('alice'));
        await user.type(await screen.findByLabelText('translated:LabelPassword'), TYPED_TEXT);
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));

        expect(await screen.findByTestId('location')).toHaveTextContent('/movies?id=1');
        expect(authenticationApi.authenticateUserByName).toHaveBeenCalledWith({
            authenticateUserByName: { Username: 'alice', Pw: TYPED_TEXT }
        });
        expect(completeLogin).toHaveBeenCalledWith(RESULT, SERVER_ID);
    });

    it('verifies the result against the requested server', async () => {
        const otherResult = { ...RESULT, ServerId: OTHER_SERVER_ID };
        otherAuthenticationApi.authenticateUserByName.mockResolvedValue({ data: otherResult });
        const { user } = renderLoginPage(`/login?serverid=${OTHER_SERVER_ID}`);

        await user.click(await getUserButton('alice'));
        await user.click(await screen.findByRole('button', { name: 'translated:ButtonSignIn' }));

        await waitFor(() => expect(completeLogin).toHaveBeenCalledWith(otherResult, OTHER_SERVER_ID));
        expect(authenticationApi.authenticateUserByName).not.toHaveBeenCalled();
    });

    it('logs in a selected user without a password', async () => {
        const { user } = renderLoginPage();

        await user.click(await getUserButton('alice'));
        await user.click(await screen.findByRole('button', { name: 'translated:ButtonSignIn' }));

        expect(await screen.findByTestId('location')).toHaveTextContent('/home');
        expect(authenticationApi.authenticateUserByName).toHaveBeenCalledWith({
            authenticateUserByName: { Username: 'alice', Pw: '' }
        });
    });

    it('replaces the login page in the history', async () => {
        const { user } = renderLoginPage('/login', [ '/previous' ]);

        await user.click(await getUserButton('alice'));
        await user.click(await screen.findByRole('button', { name: 'translated:ButtonSignIn' }));
        expect(await screen.findByTestId('location')).toHaveTextContent('/home');

        await user.click(screen.getByRole('button', { name: 'back' }));

        expect(screen.getByTestId('location')).toHaveTextContent('/previous');
    });

    it('shows a toast when the user is not allowed to login', async () => {
        authenticationApi.authenticateUserByName.mockRejectedValueOnce(httpError(403));
        const { user } = renderLoginPage();

        await user.click(await getUserButton('alice'));
        await user.click(await screen.findByRole('button', { name: 'translated:ButtonSignIn' }));

        await waitFor(() => expect(toast).toHaveBeenCalledWith('translated:MessageUnauthorizedUser'));
        expect(alert).not.toHaveBeenCalled();
    });

    it('shows a connection failure for other errors', async () => {
        authenticationApi.authenticateUserByName.mockRejectedValueOnce(httpError(500));
        const { user } = renderLoginPage();

        await user.click(await getUserButton('alice'));
        await user.click(await screen.findByRole('button', { name: 'translated:ButtonSignIn' }));

        await waitFor(() => expect(alert).toHaveBeenCalledWith({
            text: 'translated:MessageUnableToConnectToServer',
            title: 'translated:HeaderConnectionFailure'
        }));
        expect(toast).not.toHaveBeenCalled();
    });

    it('does not log the password of failed logins', async () => {
        userApi.getPublicUsers.mockResolvedValue({ data: [] });
        authenticationApi.authenticateUserByName.mockRejectedValueOnce(httpError(500, {
            data: JSON.stringify({ Username: 'alice', Pw: TYPED_TEXT })
        } as InternalAxiosRequestConfig));
        const { user } = renderLoginPage();

        await user.type(await screen.findByLabelText(/translated:LabelUser/), 'alice');
        await user.type(screen.getByLabelText('translated:LabelPassword'), TYPED_TEXT);
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));

        await waitFor(() => expect(alert).toHaveBeenCalledOnce());
        expect(console.error).toHaveBeenCalled();
        expect(getLoggedErrors()).toContain('Request failed with status code 500');
        expect(getLoggedErrors()).not.toContain(TYPED_TEXT);
    });

    it('keeps the password when completing a manual login fails', async () => {
        userApi.getPublicUsers.mockResolvedValue({ data: [] });
        vi.mocked(completeLogin).mockRejectedValueOnce(new Error('completeLogin failed'));
        const { user } = renderLoginPage();

        await user.type(await screen.findByLabelText(/translated:LabelUser/), 'alice');
        await user.type(screen.getByLabelText('translated:LabelPassword'), TYPED_TEXT);
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));

        await waitFor(() => expect(alert).toHaveBeenCalledOnce());
        expect(screen.getByLabelText('translated:LabelPassword')).toHaveValue(TYPED_TEXT);
        expect(screen.getByRole('button', { name: 'translated:ButtonSignIn' })).toBeEnabled();
    });

    it('clears the password and shows a toast for invalid credentials', async () => {
        userApi.getPublicUsers.mockResolvedValue({ data: [] });
        authenticationApi.authenticateUserByName.mockRejectedValueOnce(httpError(401));
        const { user } = renderLoginPage();

        await user.type(await screen.findByLabelText(/translated:LabelUser/), 'alice');
        await user.type(screen.getByLabelText('translated:LabelPassword'), TYPED_TEXT);
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));

        await waitFor(() => expect(toast).toHaveBeenCalledWith('translated:MessageInvalidUser'));
        expect(screen.getByLabelText('translated:LabelPassword')).toHaveValue('');
        expect(completeLogin).not.toHaveBeenCalled();
    });

    it('does not submit the manual form twice while completing the login', async () => {
        userApi.getPublicUsers.mockResolvedValue({ data: [] });
        const login = deferred<void>();
        vi.mocked(completeLogin).mockReturnValueOnce(login.promise);
        const { user } = renderLoginPage();

        await user.type(await screen.findByLabelText(/translated:LabelUser/), 'alice');
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));
        await waitFor(() => expect(completeLogin).toHaveBeenCalledOnce());

        // The authentication has resolved, but the login is still in progress
        const signIn = screen.getByRole('button', { name: 'translated:ButtonSignIn' });
        expect(signIn).toBeDisabled();
        const form = signIn.closest('form');
        expect(form).not.toBeNull();
        fireEvent.submit(form!);
        fireEvent.submit(form!);

        login.resolve();

        expect(await screen.findByTestId('location')).toHaveTextContent('/home');
        expect(authenticationApi.authenticateUserByName).toHaveBeenCalledOnce();
        expect(completeLogin).toHaveBeenCalledOnce();
    });

    it('focuses the manual login button when the manual form is cancelled', async () => {
        const { user } = renderLoginPage();

        await user.click(await screen.findByRole('button', { name: 'translated:ButtonManualLogin' }));
        await user.click(screen.getByRole('button', { name: 'translated:ButtonCancel' }));

        expect(screen.getByRole('button', { name: 'translated:ButtonManualLogin' })).toHaveFocus();
    });

    it('shows an error when the public users cannot be loaded', async () => {
        userApi.getPublicUsers.mockRejectedValue(new Error('Network Error'));
        renderLoginPage();

        expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageUnableToConnectToServer');
        expect(screen.getByLabelText(/translated:LabelUser/)).toBeInTheDocument();
    });

    it('falls back to the last used server when the server is unknown', async () => {
        vi.mocked(ServerConnections.getApi).mockImplementation(serverId => {
            if (serverId) throw new TypeError('Cannot read properties of undefined');
            return API as never;
        });
        const { user } = renderLoginPage('/login?serverid=unknown');

        expect(await getUserButton('alice')).toBeInTheDocument();
        expect(ServerConnections.getApi).toHaveBeenLastCalledWith();

        await user.click(await getUserButton('alice'));
        await user.click(await screen.findByRole('button', { name: 'translated:ButtonSignIn' }));

        await waitFor(() => expect(completeLogin).toHaveBeenCalledWith(RESULT, SERVER_ID));
    });

    describe('quick connect', () => {
        beforeEach(() => {
            authenticationApi.getQuickConnectEnabled.mockResolvedValue({ data: true });
            authenticationApi.initiateQuickConnect.mockResolvedValue({
                data: { Code: '123456', Secret: QUICK_CONNECT_SECRET }
            });
            authenticationApi.getQuickConnectState.mockResolvedValue({ data: { Authenticated: true } });
            authenticationApi.authenticateWithQuickConnect.mockResolvedValue({ data: RESULT });
        });

        it('logs in with quick connect', async () => {
            const { user } = renderLoginPage();

            await user.click(await screen.findByRole('button', { name: 'translated:ButtonUseQuickConnect' }));

            expect(await screen.findByTestId('location')).toHaveTextContent('/home');
            expect(authenticationApi.authenticateWithQuickConnect).toHaveBeenCalledOnce();
            expect(completeLogin).toHaveBeenCalledOnce();
            expect(completeLogin).toHaveBeenCalledWith(RESULT, SERVER_ID);
        });

        it('keeps using the server that initiated the request', async () => {
            const state = deferred<{ data: { Authenticated: boolean } }>();
            authenticationApi.getQuickConnectState.mockReturnValueOnce(state.promise);
            const { user } = renderLoginPage();

            await user.click(await screen.findByRole('button', { name: 'translated:ButtonUseQuickConnect' }));
            await waitFor(() => expect(authenticationApi.getQuickConnectState).toHaveBeenCalledOnce());
            // The dialog hides the rest of the page from the accessibility tree
            fireEvent.click(screen.getByRole('button', { name: 'change server', hidden: true }));
            await waitFor(() => expect(otherAuthenticationApi.getQuickConnectEnabled).toHaveBeenCalled());

            state.resolve({ data: { Authenticated: true } });

            await waitFor(() => expect(completeLogin).toHaveBeenCalledWith(RESULT, SERVER_ID));
            expect(authenticationApi.authenticateWithQuickConnect).toHaveBeenCalledOnce();
            expect(otherAuthenticationApi.getQuickConnectState).not.toHaveBeenCalled();
            expect(otherAuthenticationApi.authenticateWithQuickConnect).not.toHaveBeenCalled();
        });

        it('does not log the secret when quick connect fails', async () => {
            authenticationApi.getQuickConnectState.mockRejectedValueOnce(httpError(401, {
                url: `/QuickConnect/Connect?secret=${QUICK_CONNECT_SECRET}`,
                params: { secret: QUICK_CONNECT_SECRET }
            } as InternalAxiosRequestConfig));
            const { user } = renderLoginPage();

            await user.click(await screen.findByRole('button', { name: 'translated:ButtonUseQuickConnect' }));

            await waitFor(() => expect(alert).toHaveBeenCalledWith({
                text: 'translated:QuickConnectDeactivated',
                title: 'translated:HeaderError'
            }));
            expect(getLoggedErrors()).toContain('Request failed with status code 401');
            expect(getLoggedErrors()).not.toContain(QUICK_CONNECT_SECRET);
            expect(completeLogin).not.toHaveBeenCalled();
        });
    });
});
