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
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { renderWithRouter } from 'test/renderWithRouter';

import LoginPage from './index';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string, ...args: unknown[]) => [ `translated:${key}`, ...args ].join(' ')
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

const networkError = () => new AxiosError('Network Error', AxiosError.ERR_NETWORK, {} as InternalAxiosRequestConfig);

/** Returns everything logged with console.error, including the properties of logged objects. */
const getLoggedErrors = () => JSON.stringify(vi.mocked(console.error).mock.calls);

/** Creates a promise that can be resolved from the test. */
const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
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

const createQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
    }
});

/** Renders the login page. The query client can be passed to open the page again with the cache of a previous visit. */
const renderLoginPage = (initialEntry = '/login', previousEntries: string[] = [], queryClient = createQueryClient()) => {
    const result = renderWithRouter(
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
    return { ...result, queryClient };
};

/** The accessible name of the button of a user */
const userButtonName = (name: string) => `translated:ButtonSignInAs ${name}`;
const getUserButton = (name: string) => screen.findByRole('button', { name: userButtonName(name) });
const getSignInButton = () => screen.getByRole('button', { name: 'translated:ButtonSignIn' });

/** Expects the login form to show the selected user instead of a username field. */
const expectSelectedUserForm = async (name: string) => {
    expect(await screen.findByRole('heading', { level: 2, name })).toBeInTheDocument();
    expect(screen.getByRole('form', { name })).toBeInTheDocument();
    expect(screen.queryByLabelText(/translated:LabelUsername/)).not.toBeInTheDocument();
};
const findQuickConnectButton = () => screen.findByRole('button', { name: 'translated:ButtonUseQuickConnect' });
const findRetryButton = () => screen.findByRole('button', { name: 'translated:Retry' });

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
        vi.spyOn(console, 'error').mockImplementation(() => { /* silence expected errors */ });
    });

    it('opens the form for the selected user without trying to login when a user is selected', async () => {
        const { user } = renderLoginPage();

        await user.click(await getUserButton('bob'));

        await expectSelectedUserForm('bob');
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

    describe('when the server reports a user without a password', () => {
        beforeEach(() => {
            userApi.getPublicUsers.mockResolvedValue({ data: [ { Id: 'carol-id', Name: 'carol', HasPassword: false } ] });
        });

        it('logs in the user right away', async () => {
            const { user } = renderLoginPage();

            await user.click(await getUserButton('carol'));

            expect(await screen.findByTestId('location')).toHaveTextContent('/home');
            expect(authenticationApi.authenticateUserByName).toHaveBeenCalledWith({
                authenticateUserByName: { Username: 'carol', Pw: '' }
            });
        });

        it('asks for the password without reporting an error when the user has one after all', async () => {
            authenticationApi.authenticateUserByName.mockRejectedValueOnce(httpError(401));
            const { user } = renderLoginPage();

            await user.click(await getUserButton('carol'));

            await expectSelectedUserForm('carol');
            expect(screen.getByLabelText('translated:LabelPassword')).toHaveFocus();
            expect(screen.queryByText('translated:MessageInvalidUser')).not.toBeInTheDocument();
            expect(screen.queryByText('translated:MessageInvalidPassword')).not.toBeInTheDocument();
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

        it('shows the error in the form when the user is not allowed to login', async () => {
            authenticationApi.authenticateUserByName.mockRejectedValueOnce(httpError(403));
            const { user } = renderLoginPage();

            await user.click(await getUserButton('carol'));

            expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageUnauthorizedUser');
            await expectSelectedUserForm('carol');
        });

        it('opens the form with the connection failure when the login fails', async () => {
            authenticationApi.authenticateUserByName.mockRejectedValueOnce(httpError(500));
            const { user } = renderLoginPage();

            await user.click(await getUserButton('carol'));

            expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageServerUnreachable');
            await expectSelectedUserForm('carol');
            expect(screen.getByLabelText('translated:LabelPassword')).not.toHaveAttribute('aria-invalid');
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

    it('shows the error in the form and keeps the password when the user is not allowed to login', async () => {
        authenticationApi.authenticateUserByName.mockRejectedValueOnce(httpError(403));
        const { user } = renderLoginPage();

        await user.click(await getUserButton('alice'));
        await user.type(await screen.findByLabelText('translated:LabelPassword'), TYPED_TEXT);
        await user.click(getSignInButton());

        expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageUnauthorizedUser');
        expect(screen.getByLabelText('translated:LabelPassword')).toHaveValue(TYPED_TEXT);
        expect(screen.getByLabelText('translated:LabelPassword')).not.toHaveAttribute('aria-invalid');
    });

    it('shows the connection failure in the form and keeps the password for other errors', async () => {
        authenticationApi.authenticateUserByName.mockRejectedValueOnce(httpError(500));
        const { user } = renderLoginPage();

        await user.click(await getUserButton('alice'));
        await user.type(await screen.findByLabelText('translated:LabelPassword'), TYPED_TEXT);
        await user.click(getSignInButton());

        expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageServerUnreachable');
        expect(screen.getByLabelText('translated:LabelPassword')).toHaveValue(TYPED_TEXT);
        expect(screen.getByLabelText('translated:LabelPassword')).not.toHaveAttribute('aria-invalid');
        // The focus stays on the button, so the login can be retried right away
        expect(getSignInButton()).toHaveFocus();
        expect(getSignInButton()).not.toHaveAttribute('aria-disabled');
    });

    it('does not log the password of failed logins', async () => {
        userApi.getPublicUsers.mockResolvedValue({ data: [] });
        authenticationApi.authenticateUserByName.mockRejectedValueOnce(httpError(500, {
            data: JSON.stringify({ Username: 'alice', Pw: TYPED_TEXT })
        } as InternalAxiosRequestConfig));
        const { user } = renderLoginPage();

        await user.type(await screen.findByLabelText(/translated:LabelUsername/), 'alice');
        await user.type(screen.getByLabelText('translated:LabelPassword'), TYPED_TEXT);
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));

        await screen.findByRole('alert');
        expect(console.error).toHaveBeenCalled();
        expect(getLoggedErrors()).toContain('Request failed with status code 500');
        expect(getLoggedErrors()).not.toContain(TYPED_TEXT);
    });

    it('keeps the password when completing a manual login fails', async () => {
        userApi.getPublicUsers.mockResolvedValue({ data: [] });
        vi.mocked(completeLogin).mockRejectedValueOnce(new Error('completeLogin failed'));
        const { user } = renderLoginPage();

        await user.type(await screen.findByLabelText(/translated:LabelUsername/), 'alice');
        await user.type(screen.getByLabelText('translated:LabelPassword'), TYPED_TEXT);
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));

        // The credentials were accepted, so the message must not send the user back to their password
        expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageSignInNotCompleted');
        expect(screen.getByLabelText('translated:LabelPassword')).toHaveValue(TYPED_TEXT);
        expect(screen.getByLabelText('translated:LabelPassword')).not.toHaveAttribute('aria-invalid');
        expect(getSignInButton()).not.toHaveAttribute('aria-disabled');
    });

    it('clears the password and reports an incorrect password for a selected user', async () => {
        authenticationApi.authenticateUserByName.mockRejectedValueOnce(httpError(401));
        const { user } = renderLoginPage();

        await user.click(await getUserButton('alice'));
        await user.type(await screen.findByLabelText('translated:LabelPassword'), TYPED_TEXT);
        await user.click(getSignInButton());

        const password = screen.getByLabelText('translated:LabelPassword');
        await waitFor(() => expect(password).toHaveValue(''));
        expect(password).toHaveFocus();
        expect(password).toHaveAttribute('aria-invalid', 'true');
        expect(password).toHaveAccessibleDescription('translated:MessageInvalidPassword');
        // The focused password announces the message, so it is not announced twice
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(completeLogin).not.toHaveBeenCalled();
    });

    it('clears the password and shows the error in the form for invalid credentials', async () => {
        userApi.getPublicUsers.mockResolvedValue({ data: [] });
        authenticationApi.authenticateUserByName.mockRejectedValueOnce(httpError(401));
        const { user } = renderLoginPage();

        await user.type(await screen.findByLabelText(/translated:LabelUsername/), 'alice');
        await user.type(screen.getByLabelText('translated:LabelPassword'), TYPED_TEXT);
        await user.click(getSignInButton());

        const password = screen.getByLabelText('translated:LabelPassword');
        await waitFor(() => expect(password).toHaveValue(''));
        expect(password).toHaveFocus();
        expect(password).toHaveAccessibleDescription('translated:MessageInvalidUser');
        expect(screen.getByLabelText(/translated:LabelUsername/)).toHaveAccessibleDescription('translated:MessageInvalidUser');
        expect(completeLogin).not.toHaveBeenCalled();
    });

    it('keeps the focus on the sign in button while logging in', async () => {
        userApi.getPublicUsers.mockResolvedValue({ data: [] });
        const login = deferred<void>();
        vi.mocked(completeLogin).mockReturnValueOnce(login.promise);
        const { user } = renderLoginPage();

        await user.type(await screen.findByLabelText(/translated:LabelUsername/), 'alice');
        await user.click(getSignInButton());
        await waitFor(() => expect(completeLogin).toHaveBeenCalledOnce());

        expect(getSignInButton()).toHaveFocus();
        expect(getSignInButton()).toHaveAttribute('aria-disabled', 'true');
        expect(getSignInButton().closest('form')).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByLabelText('translated:LabelPassword')).toHaveAttribute('readonly');
        // Leaving the page is not possible while the login is in progress
        expect(screen.getByRole('button', { name: 'translated:ButtonForgotPassword' })).toBeDisabled();

        login.resolve();
    });

    it('enables leaving the page again when the login fails', async () => {
        userApi.getPublicUsers.mockResolvedValue({ data: [] });
        const login = deferred<never>();
        vi.mocked(completeLogin).mockReturnValueOnce(login.promise);
        const { user } = renderLoginPage();

        await user.type(await screen.findByLabelText(/translated:LabelUsername/), 'alice');
        await user.click(getSignInButton());
        await waitFor(() => expect(completeLogin).toHaveBeenCalledOnce());
        const forgotPassword = screen.getByRole('button', { name: 'translated:ButtonForgotPassword' });
        expect(forgotPassword).toBeDisabled();

        login.reject(new Error('completeLogin failed'));

        await waitFor(() => expect(forgotPassword).toBeEnabled());
        expect(screen.getByRole('alert')).toHaveTextContent('translated:MessageSignInNotCompleted');
    });

    it('does not submit the manual form twice while completing the login', async () => {
        userApi.getPublicUsers.mockResolvedValue({ data: [] });
        const login = deferred<void>();
        vi.mocked(completeLogin).mockReturnValueOnce(login.promise);
        const { user } = renderLoginPage();

        await user.type(await screen.findByLabelText(/translated:LabelUsername/), 'alice');
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));
        await waitFor(() => expect(completeLogin).toHaveBeenCalledOnce());

        // The authentication has resolved, but the login is still in progress
        const signIn = getSignInButton();
        expect(signIn).toHaveAttribute('aria-disabled', 'true');
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

        await user.click(await screen.findByRole('button', { name: 'translated:ButtonSignInWithUsername' }));
        await user.click(screen.getByRole('button', { name: 'translated:ButtonBack' }));

        expect(screen.getByRole('button', { name: 'translated:ButtonSignInWithUsername' })).toHaveFocus();
    });

    it('focuses the selected user when the form of the user is cancelled', async () => {
        const { user } = renderLoginPage();

        await user.click(await getUserButton('alice'));
        await expectSelectedUserForm('alice');
        await user.click(screen.getByRole('button', { name: 'translated:ButtonChooseAnotherUser' }));

        expect(screen.getByRole('button', { name: userButtonName('alice') })).toHaveFocus();
    });

    it('focuses the selected user again when the user was hidden behind the show all button', async () => {
        // Sorted by name, "User 12" is the last of 13 users and hidden until the list is expanded
        userApi.getPublicUsers.mockResolvedValue({
            data: Array.from({ length: 13 }, (_, i) => ({ Id: `user-${i}`, Name: `User ${String(i).padStart(2, '0')}` }))
        });
        const { user } = renderLoginPage();

        await user.click(await screen.findByRole('button', { name: /^translated:ButtonShowAllUsers/ }));
        await user.click(await getUserButton('User 12'));
        await expectSelectedUserForm('User 12');
        await user.click(screen.getByRole('button', { name: 'translated:ButtonChooseAnotherUser' }));

        // The list opens expanded so the user is there to take the focus
        expect(await getUserButton('User 12')).toHaveFocus();
        expect(screen.queryByRole('button', { name: /^translated:ButtonShowAllUsers/ })).not.toBeInTheDocument();
    });

    it('focuses the selected user again when the user was found through the filter', async () => {
        userApi.getPublicUsers.mockResolvedValue({
            data: Array.from({ length: 13 }, (_, i) => ({ Id: `user-${i}`, Name: `User ${String(i).padStart(2, '0')}` }))
        });
        const { user } = renderLoginPage();

        await user.type(await screen.findByRole('searchbox', { name: 'translated:LabelFindUser' }), '12');
        await user.click(await getUserButton('User 12'));
        await expectSelectedUserForm('User 12');
        await user.click(screen.getByRole('button', { name: 'translated:ButtonChooseAnotherUser' }));

        expect(await getUserButton('User 12')).toHaveFocus();
        expect(screen.getByRole('button', { name: 'translated:ButtonSignInWithUsername' })).not.toHaveFocus();
    });

    it('focuses the manual login button when the selected user is no longer listed', async () => {
        const { user, queryClient } = renderLoginPage();

        await user.click(await getUserButton('alice'));
        await expectSelectedUserForm('alice');

        userApi.getPublicUsers.mockResolvedValue({ data: [ USERS[1] ] });
        await queryClient.invalidateQueries();
        await user.click(screen.getByRole('button', { name: 'translated:ButtonChooseAnotherUser' }));

        expect(await getUserButton('bob')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: userButtonName('alice') })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'translated:ButtonSignInWithUsername' })).toHaveFocus();
    });

    it('keeps the same title when a user is selected', async () => {
        const { user } = renderLoginPage();

        expect(await screen.findByRole('heading', { level: 1, name: 'translated:HeaderSignIn' })).toBeInTheDocument();

        await user.click(await getUserButton('alice'));
        await expectSelectedUserForm('alice');

        expect(screen.getByRole('heading', { level: 1, name: 'translated:HeaderSignIn' })).toBeInTheDocument();
    });

    it('announces the loading state while the users are loading', async () => {
        const users = deferred<{ data: UserDto[] }>();
        userApi.getPublicUsers.mockReturnValueOnce(users.promise);
        renderLoginPage();

        expect(await screen.findByRole('status')).toHaveTextContent('translated:Loading');
        expect(screen.queryByRole('button', { name: 'translated:ButtonSignIn' })).not.toBeInTheDocument();

        users.resolve({ data: USERS });

        expect(await getUserButton('alice')).toBeInTheDocument();
        // The region stays in place so a later change is announced, but it has nothing to say any more
        expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });

    it('shows an error when the public users cannot be loaded, and loads them again when retrying', async () => {
        userApi.getPublicUsers.mockRejectedValueOnce(new Error('Network Error'));
        const { user } = renderLoginPage();

        expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageServerUnreachable');
        // The server is reachable for all the page knows, so signing in with a username is still possible
        expect(screen.getByLabelText(/translated:LabelUsername/)).toBeInTheDocument();
        expect(getSignInButton()).toBeEnabled();

        await user.click(await findRetryButton());

        expect(await getUserButton('alice')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByRole('status')).toBeEmptyDOMElement();
        expect(userApi.getPublicUsers).toHaveBeenCalledTimes(2);
    });

    it('keeps the focus on the retry button and ignores clicks while retrying', async () => {
        const retry = deferred<{ data: UserDto[] }>();
        userApi.getPublicUsers
            .mockRejectedValueOnce(new Error('Network Error'))
            .mockReturnValueOnce(retry.promise);
        const { user } = renderLoginPage();

        const button = await findRetryButton();
        await user.click(button);
        // The disabled look blocks pointer events, so dispatch the click directly
        fireEvent.click(button);

        expect(userApi.getPublicUsers).toHaveBeenCalledTimes(2);
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).toHaveClass('Mui-disabled');
        expect(button).not.toBeDisabled();
        expect(button).toHaveFocus();
        // The error stays visible while retrying
        expect(screen.getByRole('alert')).toHaveTextContent('translated:MessageServerUnreachable');

        retry.resolve({ data: USERS });

        expect(await getUserButton('alice')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('keeps the error and the focus on the retry button when retrying fails again', async () => {
        const retry = deferred<never>();
        userApi.getPublicUsers
            .mockRejectedValueOnce(new Error('Network Error'))
            .mockReturnValueOnce(retry.promise);
        const { user } = renderLoginPage();

        const button = await findRetryButton();
        const alert = screen.getByRole('alert');
        await user.click(button);
        await waitFor(() => expect(button).toHaveAttribute('aria-disabled', 'true'));

        retry.reject(new Error('Network Error'));

        await waitFor(() => expect(button).not.toHaveAttribute('aria-disabled'));
        // The alert is kept rather than replaced, so the focus stays on its button
        expect(screen.getByRole('alert')).toBe(alert);
        expect(alert).toHaveTextContent('translated:MessageServerUnreachable');
        expect(button).toHaveFocus();
        expect(getSignInButton()).toBeEnabled();
    });

    it('announces retrying and each repeated failure, since the alert does not change', async () => {
        const firstRetry = deferred<never>();
        const secondRetry = deferred<never>();
        userApi.getPublicUsers
            .mockRejectedValueOnce(new Error('Network Error'))
            .mockReturnValueOnce(firstRetry.promise)
            .mockReturnValueOnce(secondRetry.promise);
        const { user } = renderLoginPage();

        const button = await findRetryButton();
        // The first failure is announced by the alert appearing, so the status has nothing to add
        const status = screen.getByRole('status');
        expect(status).toBeEmptyDOMElement();

        await user.click(button);
        expect(status).toHaveTextContent('translated:Loading');

        firstRetry.reject(new Error('Network Error'));

        await waitFor(() => expect(status).toHaveTextContent('translated:MessageServerUnreachable'));
        expect(button).toHaveFocus();

        await user.click(button);
        expect(status).toHaveTextContent('translated:Loading');

        secondRetry.reject(new Error('Network Error'));

        await waitFor(() => expect(status).toHaveTextContent('translated:MessageServerUnreachable'));
    });

    it('moves the focus to the first control of the card when retrying succeeds', async () => {
        userApi.getPublicUsers
            .mockRejectedValueOnce(new Error('Network Error'))
            .mockResolvedValueOnce({ data: USERS });
        const { user } = renderLoginPage();

        await user.click(await findRetryButton());

        // The retry button is gone with the error, so the focus continues at the first user instead of the page
        expect(await getUserButton('alice')).toHaveFocus();
    });

    it('shows the loading state when the page is opened again after a failed load', async () => {
        const reload = deferred<{ data: UserDto[] }>();
        userApi.getPublicUsers
            .mockRejectedValueOnce(new Error('Network Error'))
            .mockReturnValueOnce(reload.promise);
        const { queryClient, unmount } = renderLoginPage();
        await screen.findByRole('alert');
        unmount();

        renderLoginPage('/login', [], queryClient);

        // The failure of the previous visit is not reported while the users are loaded again
        expect(await screen.findByRole('status')).toHaveTextContent('translated:Loading');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();

        reload.resolve({ data: USERS });

        expect(await getUserButton('alice')).toBeInTheDocument();
    });

    it('keeps the focus in the filter when the user focused on return is filtered out and back in', async () => {
        userApi.getPublicUsers.mockResolvedValue({
            data: Array.from({ length: 13 }, (_, i) => ({ Id: `user-${i}`, Name: `User ${String(i).padStart(2, '0')}` }))
        });
        const { user } = renderLoginPage();

        await user.click(await screen.findByRole('button', { name: /^translated:ButtonShowAllUsers/ }));
        await user.click(await getUserButton('User 12'));
        await expectSelectedUserForm('User 12');
        await user.click(screen.getByRole('button', { name: 'translated:ButtonChooseAnotherUser' }));
        expect(await getUserButton('User 12')).toHaveFocus();

        const filter = screen.getByRole('searchbox', { name: 'translated:LabelFindUser' });
        await user.type(filter, '10');
        expect(screen.queryByRole('button', { name: userButtonName('User 12') })).not.toBeInTheDocument();
        await user.keyboard('{Backspace}');

        expect(await getUserButton('User 12')).toBeInTheDocument();
        expect(filter).toHaveFocus();
    });

    it('disables signing in without a server, and resolves the server again when retrying', async () => {
        vi.mocked(ServerConnections.getApi).mockReturnValue(undefined as never);
        vi.mocked(ServerConnections.getLastUsedServer).mockReturnValue(undefined as never);
        const { user } = renderLoginPage();

        expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageServerUnreachable');
        expect(getSignInButton()).toBeDisabled();
        // Submitting the form does not report the failure a second time
        fireEvent.submit(getSignInButton());
        expect(screen.getAllByRole('alert')).toHaveLength(1);
        expect(authenticationApi.authenticateUserByName).not.toHaveBeenCalled();
        expect(userApi.getPublicUsers).not.toHaveBeenCalled();

        // The connection is restored
        vi.mocked(ServerConnections.getApi).mockReturnValue(API as never);
        vi.mocked(ServerConnections.getLastUsedServer).mockReturnValue({ Id: SERVER_ID } as never);
        await user.click(await findRetryButton());

        expect(await getUserButton('alice')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(userApi.getPublicUsers).toHaveBeenCalledOnce();
    });

    it('keeps the error when the server is still unknown after retrying', async () => {
        vi.mocked(ServerConnections.getApi).mockReturnValue(undefined as never);
        vi.mocked(ServerConnections.getLastUsedServer).mockReturnValue(undefined as never);
        const { user } = renderLoginPage();

        const button = await findRetryButton();
        await user.click(button);

        // Nothing is loaded, but the retry still passes through the loading state so the repeated failure is
        // announced by the status
        expect(screen.getByRole('status')).toHaveTextContent('translated:Loading');
        expect(button).toHaveAttribute('aria-disabled', 'true');
        await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('translated:MessageServerUnreachable'));
        expect(button).not.toHaveAttribute('aria-disabled');
        expect(button).toHaveFocus();
        expect(screen.getByRole('alert')).toHaveTextContent('translated:MessageServerUnreachable');
        expect(getSignInButton()).toBeDisabled();
        expect(userApi.getPublicUsers).not.toHaveBeenCalled();
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

            await user.click(await findQuickConnectButton());

            // Quick connect was disabled while waiting for the approval
            expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageQuickConnectUnavailable');
            expect(getLoggedErrors()).toContain('Request failed with status code 401');
            expect(getLoggedErrors()).not.toContain(QUICK_CONNECT_SECRET);
            expect(completeLogin).not.toHaveBeenCalled();
            // The dialog is closed and the focus is back on the button, next to the error
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            expect(await findQuickConnectButton()).toHaveFocus();
        });

        it('tells the user when the code expired before it was approved', async () => {
            authenticationApi.getQuickConnectState.mockRejectedValueOnce(httpError(404));
            const { user } = renderLoginPage();

            await user.click(await findQuickConnectButton());

            expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageQuickConnectExpired');
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            expect(completeLogin).not.toHaveBeenCalled();
        });

        it('shows the connection failure when the secret can not be exchanged because the server is unreachable', async () => {
            authenticationApi.authenticateWithQuickConnect.mockRejectedValueOnce(networkError());
            const { user } = renderLoginPage();

            await user.click(await findQuickConnectButton());

            expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageServerUnreachable');
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            expect(completeLogin).not.toHaveBeenCalled();
        });

        it('shows a generic failure when the secret is rejected for an unexpected reason', async () => {
            authenticationApi.authenticateWithQuickConnect.mockRejectedValueOnce(httpError(400));
            const { user } = renderLoginPage();

            await user.click(await findQuickConnectButton());

            expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageQuickConnectFailed');
            expect(completeLogin).not.toHaveBeenCalled();
        });

        it('shows the connection failure when quick connect can not be started because the server is unreachable', async () => {
            authenticationApi.initiateQuickConnect.mockRejectedValueOnce(networkError());
            const { user } = renderLoginPage();

            await user.click(await findQuickConnectButton());

            expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageServerUnreachable');
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            expect(await findQuickConnectButton()).toHaveFocus();
        });

        it('shows the error next to the button when quick connect can not be started', async () => {
            authenticationApi.initiateQuickConnect.mockRejectedValueOnce(httpError(401));
            const { user } = renderLoginPage();

            await user.click(await findQuickConnectButton());

            expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageQuickConnectUnavailable');
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            // The error also describes the button, so it is heard when the focus lands on it
            expect(await findQuickConnectButton()).toHaveFocus();
            expect(await findQuickConnectButton()).toHaveAccessibleDescription('translated:MessageQuickConnectUnavailable');
        });

        it('keeps the focus on the button and ignores clicks while starting quick connect', async () => {
            const initiate = deferred<{ data: { Code: string, Secret: string } }>();
            authenticationApi.initiateQuickConnect.mockReturnValueOnce(initiate.promise);
            const { user } = renderLoginPage();

            const button = await findQuickConnectButton();
            await user.click(button);
            // The disabled look blocks pointer events, so dispatch the click directly
            fireEvent.click(button);

            expect(authenticationApi.initiateQuickConnect).toHaveBeenCalledOnce();
            expect(button).toHaveAttribute('aria-disabled', 'true');
            expect(button).toHaveClass('Mui-disabled');
            expect(button).not.toBeDisabled();
            expect(button).toHaveFocus();

            initiate.resolve({ data: { Code: '123456', Secret: QUICK_CONNECT_SECRET } });

            expect(await screen.findByRole('dialog')).toBeInTheDocument();
        });

        it('clears the error when retrying and announces a repeated failure again', async () => {
            const retry = deferred<never>();
            authenticationApi.initiateQuickConnect
                .mockRejectedValueOnce(httpError(401))
                .mockReturnValueOnce(retry.promise);
            const { user } = renderLoginPage();

            await user.click(await findQuickConnectButton());
            const firstAlert = await screen.findByRole('alert');

            await user.click(await findQuickConnectButton());
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();

            retry.reject(httpError(401));

            const secondAlert = await screen.findByRole('alert');
            expect(secondAlert).toHaveTextContent('translated:MessageQuickConnectUnavailable');
            expect(secondAlert).not.toBe(firstAlert);
        });

        it('tells that the sign-in was not completed when completing the quick connect login fails', async () => {
            vi.mocked(completeLogin).mockRejectedValueOnce(new Error('completeLogin failed'));
            const { user } = renderLoginPage();

            await user.click(await findQuickConnectButton());

            expect(await screen.findByRole('alert')).toHaveTextContent('translated:MessageSignInNotCompleted');
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            expect(await findQuickConnectButton()).not.toHaveAttribute('aria-disabled');
            expect(await findQuickConnectButton()).toHaveFocus();
            expect(await findQuickConnectButton()).toHaveAccessibleDescription('translated:MessageSignInNotCompleted');
        });
    });
});
