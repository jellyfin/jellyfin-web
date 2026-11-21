import type { Api } from '@jellyfin/sdk/lib/api';
import type { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client/models/authentication-result';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { getBrandingOptionsQuery } from '@/apps/dashboard/features/branding/api/useBrandingOptions';
import { getPublicUsersQuery } from '@/hooks/api/usePublicUsers';
import { getQuickConnectEnabledQuery } from '@/hooks/useQuickConnect';
import { useAuthenticateUserByName, type UserCredentials } from 'apps/modern/features/session/api/useAuthenticateUserByName';
import { useInitiateQuickConnect } from 'apps/modern/features/session/api/useQuickConnect';
import LoginDisclaimer from 'apps/modern/features/session/components/LoginDisclaimer';
import ManualLoginForm, { type LoginFormError } from 'apps/modern/features/session/components/ManualLoginForm';
import PublicUserList from 'apps/modern/features/session/components/PublicUserList';
import QuickConnectDialog from 'apps/modern/features/session/components/QuickConnectDialog';
import { completeLogin } from 'apps/modern/features/session/utils/completeLogin';
import { toLoggableError } from 'apps/modern/features/session/utils/loggableError';
import { getQuickConnectFailure, type QuickConnectFailure } from 'apps/modern/features/session/utils/quickConnectError';
import { getTargetUrl } from 'apps/modern/features/session/utils/targetUrl';
import { VISUALLY_HIDDEN_STYLE } from 'apps/modern/utils/visuallyHidden';
import { appHost } from 'components/apphost';
import LoadingComponent from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { AppFeature } from 'constants/appFeature';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { selectServer } from 'utils/dashboard';

const CARD_SX = { width: '100%', p: { xs: 2, sm: 3 } };
/** Keeps the login controls at a consistent width when the card is widened for the user grid */
const COLUMN_SX = { width: '100%', maxWidth: '25rem' };
// The user grid fits two columns in the narrow card; widen it only when more are needed
const NARROW_CARD_MAX_USERS = 2;
/** The first control of the card: the user filter, a user or the username field. Skips the hidden username input */
const FIRST_CONTROL_SELECTOR = 'input:not([tabindex="-1"]), button:not([disabled])';
/**
 * How long a retry is in progress when there is no server to retry with. Long enough for the loading state to be
 * noticed by assistive technology, so the repeated failure is announced after it.
 */
const UNRESOLVED_SERVER_RETRY_DURATION = 300;

type LoginFailure = Omit<LoginFormError, 'id'>;

/** Login failures reported by the server */
const UNAUTHORIZED_FAILURES: Partial<Record<number, LoginFailure>> = {
    401: { kind: 'credentials', messageKey: 'MessageInvalidUser' },
    403: { kind: 'unauthorized', messageKey: 'MessageUnauthorizedUser' }
};

/** Replaces the invalid credentials failure when a user was selected, since only the password was entered */
const SELECTED_USER_CREDENTIALS_FAILURE: LoginFailure = { kind: 'credentials', messageKey: 'MessageInvalidPassword' };

const CONNECTION_FAILURE: LoginFailure = { kind: 'connection', messageKey: 'MessageServerUnreachable' };
/** The server accepted the credentials, but the login could not be completed on this device */
const COMPLETION_FAILURE: LoginFailure = { kind: 'incomplete', messageKey: 'MessageSignInNotCompleted' };

/** The message shown when the quick connect request fails after the code was shown */
const QUICK_CONNECT_FAILURE_MESSAGES: Record<QuickConnectFailure, string> = {
    unreachable: CONNECTION_FAILURE.messageKey,
    disabled: 'MessageQuickConnectUnavailable',
    expired: 'MessageQuickConnectExpired',
    failed: 'MessageQuickConnectFailed'
};

/** Returns the message shown when quick connect can not be started. No code was shown yet, so it can not have expired. */
const getQuickConnectStartFailureMessage = (error: unknown) => (
    getQuickConnectFailure(error) === 'unreachable' ?
        CONNECTION_FAILURE.messageKey :
        'MessageQuickConnectUnavailable'
);

/** An error of the quick connect flow, shown next to the quick connect button */
interface QuickConnectError {
    messageKey: string
    /** Changes with every failure, so repeated failures are announced again */
    id: number
}

/** Returns the failure for a login rejected by the server, or undefined if the login failed for another reason. */
const getUnauthorizedFailure = (error: unknown) => (
    isAxiosError(error) && error.response ?
        UNAUTHORIZED_FAILURES[error.response.status] :
        undefined
);

interface ServerApi {
    api: Api
    /** The id of the server the api is for, used to verify authentication results */
    serverId: string
}

/** Returns the api of the last used server, which getApi uses when no server is requested. */
const getLastUsedServerApi = (): ServerApi | undefined => {
    const serverId = ServerConnections.getLastUsedServer()?.Id;
    const api = ServerConnections.getApi();
    return api && serverId ? { api, serverId } : undefined;
};

/** Returns the api of the requested server, falling back to the last used server if it is unknown. */
const getServerApi = (serverId?: string): ServerApi | undefined => {
    if (serverId) {
        try {
            const api = ServerConnections.getApi(serverId);
            if (api) return { api, serverId };
        } catch (error) {
            console.error('[LoginPage] unknown server, falling back to the last used server', serverId, toLoggableError(error));
        }
    }

    try {
        return getLastUsedServerApi();
    } catch (error) {
        console.error('[LoginPage] unable to get the last used server', toLoggableError(error));
        return undefined;
    }
};

interface ManualLogin {
    /** The user selected from the user list, or undefined when signing in with a username */
    user?: UserDto
}

/** Where to return the focus after the login form is cancelled */
interface ReturnFocus {
    /** The id of the user that was selected, or undefined to focus the manual login button */
    userId?: string
}

interface QuickConnect extends ServerApi {
    code: string
    secret: string
}

export const LoginPage = () => {
    const navigate = useNavigate();
    const [ searchParams ] = useSearchParams();
    const serverId = searchParams.get('serverid') ?? undefined;
    const targetUrl = getTargetUrl(searchParams.get('url'));

    // The user is not signed in yet, so the api from useApi is not available. The server is kept in state so it
    // can be resolved again when retrying, in case the connection was restored meanwhile
    const [ server, setServer ] = useState(() => getServerApi(serverId));
    const [ resolvedServerId, setResolvedServerId ] = useState(serverId);
    const api = server?.api;

    const {
        data: users,
        isPending: isUsersPending,
        isFetching: isUsersFetching,
        isError: isUsersError,
        refetch: refetchUsers
    } = useQuery(getPublicUsersQuery(api));
    const { data: isQuickConnectEnabled, refetch: refetchQuickConnectEnabled } = useQuery(getQuickConnectEnabledQuery(api));
    const { data: brandingOptions, refetch: refetchBrandingOptions } = useQuery(getBrandingOptionsQuery(api));

    const authenticateUserByName = useAuthenticateUserByName(api);
    const initiateQuickConnect = useInitiateQuickConnect(api);

    const [ manualLogin, setManualLogin ] = useState<ManualLogin>();
    const [ loginError, setLoginError ] = useState<LoginFormError>();
    const [ quickConnect, setQuickConnect ] = useState<QuickConnect>();
    // Covers both the authentication and completing the login, so the controls stay disabled until navigating away.
    // The ref guards against re-entry before the state update is rendered.
    const [ isLoggingIn, setIsLoggingIn ] = useState(false);
    const isLoggingInRef = useRef(false);
    const manualLoginButtonRef = useRef<HTMLButtonElement>(null);
    const returnFocusRef = useRef<ReturnFocus>();
    // The user the user list focuses when it is shown again
    const [ focusUserId, setFocusUserId ] = useState<string>();
    const [ quickConnectError, setQuickConnectError ] = useState<QuickConnectError>();
    const quickConnectErrorId = useId();
    // Whether the users are loaded again after a failed load. Kept here instead of being derived from the query,
    // which remembers its failures in the cache: a page mounted again after a failure would otherwise show the
    // failure, with the retry in progress, while its first load is still running
    const [ isRetrying, setIsRetrying ] = useState(false);
    // Whether the current failure was retried. The alert announces a failure when it appears, but it stays in place
    // over a failed retry (with the focused retry button in it), so repeated failures are announced by the status
    const [ hasRetried, setHasRetried ] = useState(false);
    const wasRetryingRef = useRef(false);
    const unresolvedServerRetryRef = useRef<ReturnType<typeof setTimeout>>();
    const cardRef = useRef<HTMLDivElement>(null);

    if (resolvedServerId !== serverId) {
        // Resolve the server again when a different server is requested, and forget the state of the previous one.
        // Adjusting the state during the render skips the commit with the stale server an effect would make
        setResolvedServerId(serverId);
        setServer(getServerApi(serverId));
        setManualLogin(undefined);
        setLoginError(undefined);
        setQuickConnectError(undefined);
        setFocusUserId(undefined);
        setHasRetried(false);
    }

    const hasPublicUsers = !!users?.length;
    const isWideCard = (users?.length ?? 0) > NARROW_CARD_MAX_USERS;
    const isManualFormVisible = !!manualLogin || !hasPublicUsers;
    // Loading the users again puts the query back to pending until it settles. While retrying, the error and its
    // retry button stay in place instead of being replaced with the loading indicator
    const hasUsersLoadFailed = isUsersError || isRetrying;
    const isUsersLoading = isUsersPending && isUsersFetching && !isRetrying;
    const isServerUnreachable = !api || hasUsersLoadFailed;

    useEffect(() => {
        // The retry is over once the users are no longer being fetched, whatever the outcome
        if (!isUsersFetching) setIsRetrying(false);
    }, [ isUsersFetching ]);

    const onRetryClick = useCallback(() => {
        // The button is not disabled while retrying (to keep its focus), so guard against repeated clicks here
        if (isRetrying) return;

        const nextServer = getServerApi(serverId);
        setServer(nextServer);
        setHasRetried(true);
        setIsRetrying(true);
        if (!nextServer) {
            // Without a server there is nothing to fetch, so the retry ends by itself. It still passes through the
            // loading state for a moment, so the status changes and the repeated failure is announced
            unresolvedServerRetryRef.current = setTimeout(() => setIsRetrying(false), UNRESOLVED_SERVER_RETRY_DURATION);
            return;
        }
        // The queries of a newly resolved server start on their own
        if (nextServer.api !== api) return;

        void refetchUsers();
        void refetchQuickConnectEnabled();
        void refetchBrandingOptions();
    }, [ api, isRetrying, refetchBrandingOptions, refetchQuickConnectEnabled, refetchUsers, serverId ]);

    useEffect(() => () => clearTimeout(unresolvedServerRetryRef.current), []);

    useEffect(() => {
        if (isRetrying) {
            wasRetryingRef.current = true;
            return;
        }
        if (!wasRetryingRef.current) return;
        wasRetryingRef.current = false;

        // A failed retry keeps the error and its button, and the focus with it
        if (isServerUnreachable) return;

        // The failure is over, so the next one is announced by the alert appearing again
        setHasRetried(false);
        // A successful retry removes the error, and the focused retry button with it. Unless the focus was moved
        // meanwhile, it continues at the first control of the card instead of falling back to the top of the page
        if (document.activeElement !== document.body) return;

        cardRef.current?.querySelector<HTMLElement>(FIRST_CONTROL_SELECTOR)?.focus();
    }, [ isRetrying, isServerUnreachable ]);

    useEffect(() => {
        // Return the focus after the form is cancelled, since the focused button was removed
        const returnFocus = returnFocusRef.current;
        if (isManualFormVisible || !returnFocus) return;

        returnFocusRef.current = undefined;
        // The user list has taken the request to focus the selected user, so it is not repeated if the list is
        // mounted again later
        setFocusUserId(undefined);
        // The user list focuses the selected user itself. When that user is no longer listed, fall back to the
        // manual login button
        const { userId } = returnFocus;
        if (userId && users?.some(user => user.Id === userId)) return;

        manualLoginButtonRef.current?.focus();
    }, [ isManualFormVisible, users ]);

    /** Marks a login as in progress. Returns false if another login is already in progress. */
    const startLogin = useCallback(() => {
        if (isLoggingInRef.current) return false;

        isLoggingInRef.current = true;
        setIsLoggingIn(true);
        return true;
    }, []);

    const endLogin = useCallback(() => {
        isLoggingInRef.current = false;
        setIsLoggingIn(false);
    }, []);

    /**
     * Completes the login and navigates to the target url. Returns whether the login succeeded, so the caller
     * can report a failure where the login was started.
     */
    const finishLogin = useCallback(async (result: AuthenticationResult, expectedServerId: string | undefined) => {
        try {
            await completeLogin(result, expectedServerId);
        } catch (error) {
            console.error('[LoginPage] unable to complete the login', toLoggableError(error));
            endLogin();
            return false;
        }

        // The login stays in progress so the controls are not re-enabled while navigating away
        navigate(targetUrl, { replace: true });
        return true;
    }, [ endLogin, navigate, targetUrl ]);

    /**
     * Authenticates and completes the login. Returns the failure to show in the login form, or undefined when
     * the login succeeded or another login is already in progress.
     */
    const login = useCallback(async (credentials: UserCredentials): Promise<LoginFailure | undefined> => {
        if (!startLogin()) return;

        // Keep the server the request is made to, in case the requested server changes during the login
        const expectedServerId = server?.serverId;

        let result: AuthenticationResult;
        try {
            result = await authenticateUserByName.mutateAsync(credentials);
        } catch (error) {
            endLogin();

            const failure = getUnauthorizedFailure(error);
            if (failure) return failure;

            console.error('[LoginPage] login failed', toLoggableError(error));
            return CONNECTION_FAILURE;
        }

        // The credentials were valid, so the password is kept if completing the login fails
        const isLoggedIn = await finishLogin(result, expectedServerId);
        return isLoggedIn ? undefined : COMPLETION_FAILURE;
    }, [ authenticateUserByName, endLogin, finishLogin, server, startLogin ]);

    const showLoginError = useCallback((failure: LoginFailure) => {
        // A new id announces the error again, even when the message is the same as the last one
        setLoginError(previous => ({ ...failure, id: (previous?.id ?? 0) + 1 }));
    }, []);

    const showQuickConnectError = useCallback((messageKey: string) => {
        setQuickConnectError(previous => ({ messageKey, id: (previous?.id ?? 0) + 1 }));
    }, []);

    const isUserSelected = !!manualLogin?.user;

    const onManualLoginSubmit = useCallback((credentials: UserCredentials) => {
        void login(credentials).then(failure => {
            if (!failure) return;

            // The username of a selected user is known to exist, so only the password can be wrong
            showLoginError(isUserSelected && failure.kind === 'credentials' ?
                SELECTED_USER_CREDENTIALS_FAILURE :
                failure);
        });
    }, [ isUserSelected, login, showLoginError ]);

    const onUserSelect = useCallback((user: UserDto) => {
        const username = user.Name ?? undefined;
        setLoginError(undefined);

        // Servers before 12.0 report which users have no password, so those are signed in right away.
        // Newer servers no longer provide this and always report true (the property is deprecated).
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        if (user.HasPassword === false && username) {
            void login({ username, password: '' }).then(failure => {
                if (!failure) return;

                // Open the form to show the failure. When the user has a password after all, it is asked for
                // without reporting the attempt
                setManualLogin({ user });
                if (failure.kind !== 'credentials') showLoginError(failure);
            });
            return;
        }

        setManualLogin({ user });
    }, [ login, showLoginError ]);

    const onManualLoginClick = useCallback(() => {
        setLoginError(undefined);
        setManualLogin({});
    }, []);

    const onManualLoginCancel = useCallback(() => {
        const userId = manualLogin?.user?.Id ?? undefined;
        returnFocusRef.current = { userId };
        setFocusUserId(userId);
        setLoginError(undefined);
        setManualLogin(undefined);
    }, [ manualLogin ]);

    const isQuickConnectDisabled = isLoggingIn || initiateQuickConnect.isPending;

    const onQuickConnectClick = useCallback(() => {
        // The button is not disabled while pending (to keep its focus), so guard against repeated clicks here
        if (!server || isQuickConnectDisabled) return;

        setQuickConnectError(undefined);
        // Keep polling the server that initiated the request, even if the requested server changes
        initiateQuickConnect.mutate(undefined, {
            onSuccess: ({ code, secret }) => setQuickConnect({ ...server, code, secret }),
            onError: error => {
                console.error('[LoginPage] quick connect error', toLoggableError(error));
                showQuickConnectError(getQuickConnectStartFailureMessage(error));
            }
        });
    }, [ initiateQuickConnect, isQuickConnectDisabled, server, showQuickConnectError ]);

    const onQuickConnectClose = useCallback(() => {
        setQuickConnect(undefined);
    }, []);

    const onQuickConnectError = useCallback((error: Error) => {
        console.error('[LoginPage] unable to login with quick connect', toLoggableError(error));
        setQuickConnect(undefined);
        showQuickConnectError(QUICK_CONNECT_FAILURE_MESSAGES[getQuickConnectFailure(error)]);
    }, [ showQuickConnectError ]);

    const onQuickConnectAuthenticated = useCallback((result: AuthenticationResult) => {
        if (!quickConnect || !startLogin()) return;

        void finishLogin(result, quickConnect.serverId)
            .then(isLoggedIn => {
                if (isLoggedIn) return;

                // Closing the dialog returns the focus to the quick connect button, next to the error
                setQuickConnect(undefined);
                showQuickConnectError(COMPLETION_FAILURE.messageKey);
            });
    }, [ finishLogin, quickConnect, showQuickConnectError, startLogin ]);

    const onForgotPasswordClick = useCallback(() => {
        navigate('/forgotpassword');
    }, [ navigate ]);

    const onSelectServerClick = useCallback(() => {
        selectServer();
    }, []);

    return (
        <Page
            id='loginPage'
            className='mainAnimatedPage standalonePage'
            backDropType={[ 'splashscreen' ]}
            isBackButtonEnabled={false}
        >
            <Box
                className='padded-left padded-right padded-bottom-page'
                // border-box keeps the padded-* gutters inside the full width instead of overflowing on small screens
                sx={{ maxWidth: '50rem', mx: 'auto', my: 'auto', width: '100%', boxSizing: 'border-box' }}
            >
                <Stack spacing={3} alignItems='center'>
                    <Typography
                        variant='h1'
                        textAlign='center'
                        // The theme's light h1 is hard to read over the backdrop and would tie with the name of the
                        // selected user, so the title is heavier to stay on top of the hierarchy
                        sx={{ fontWeight: 500 }}
                    >
                        {globalize.translate('HeaderSignIn')}
                    </Typography>

                    {isUsersLoading && <LoadingComponent />}
                    {/* The spinner is a global overlay without a label, so the loading state is announced here,
                        as is a retry (whose spinner is hidden) and its failure, which leaves the alert unchanged.
                        The region stays mounted, since a change of its text is announced more reliably than a
                        region that is added with its text */}
                    <Box component='span' role='status' sx={VISUALLY_HIDDEN_STYLE}>
                        {isUsersLoading || isRetrying ?
                            globalize.translate('Loading') :
                            hasRetried && isServerUnreachable && globalize.translate('MessageServerUnreachable')}
                    </Box>

                    {!isUsersLoading && (
                        <Paper ref={cardRef} sx={{ ...CARD_SX, maxWidth: isWideCard ? '40rem' : '25rem' }}>
                            <Stack spacing={2} alignItems='center'>
                                {isServerUnreachable && (
                                    <Alert
                                        severity='error'
                                        sx={COLUMN_SX}
                                        action={
                                            <Button
                                                color='inherit'
                                                size='small'
                                                // aria-disabled instead of disabled keeps the focus on the button
                                                // while retrying, so it does not fall back to the top of the page
                                                aria-disabled={isRetrying || undefined}
                                                className={isRetrying ? 'Mui-disabled' : undefined}
                                                disableRipple={isRetrying}
                                                startIcon={isRetrying ?
                                                    <CircularProgress size={16} color='inherit' aria-hidden /> :
                                                    undefined}
                                                onClick={onRetryClick}
                                            >
                                                {globalize.translate('Retry')}
                                            </Button>
                                        }
                                    >
                                        {globalize.translate('MessageServerUnreachable')}
                                    </Alert>
                                )}

                                {isManualFormVisible ? (
                                    <Box sx={COLUMN_SX}>
                                        <ManualLoginForm
                                            // Remount when a different user is selected to reset the form
                                            key={manualLogin?.user?.Id ?? 'manual'}
                                            user={manualLogin?.user}
                                            api={api}
                                            isSubmitting={isLoggingIn}
                                            // Without a server, signing in would only fail with the same message
                                            disabled={!api}
                                            error={loginError}
                                            onSubmit={onManualLoginSubmit}
                                            onCancel={hasPublicUsers ? onManualLoginCancel : undefined}
                                        />
                                    </Box>
                                ) : (
                                    <>
                                        <PublicUserList
                                            api={api}
                                            users={users ?? []}
                                            disabled={isLoggingIn}
                                            focusUserId={focusUserId}
                                            onUserSelect={onUserSelect}
                                        />

                                        <Box sx={COLUMN_SX}>
                                            <Button
                                                variant='outlined'
                                                size='large'
                                                fullWidth
                                                ref={manualLoginButtonRef}
                                                disabled={isLoggingIn}
                                                onClick={onManualLoginClick}
                                            >
                                                {globalize.translate('ButtonSignInWithUsername')}
                                            </Button>
                                        </Box>
                                    </>
                                )}

                                <Divider flexItem />

                                <Stack spacing={0.5} sx={COLUMN_SX}>
                                    {isQuickConnectEnabled && (
                                        <>
                                            {quickConnectError && (
                                                <Alert
                                                    // Remount on every failure, so a repeated message is announced again
                                                    key={quickConnectError.id}
                                                    id={quickConnectErrorId}
                                                    severity='error'
                                                    sx={{ mb: 1 }}
                                                >
                                                    {globalize.translate(quickConnectError.messageKey)}
                                                </Alert>
                                            )}

                                            <Button
                                                variant='text'
                                                // aria-disabled instead of disabled keeps the focus on the button,
                                                // so it is restored when the dialog closes. The disabled class gives
                                                // it the disabled look that the disabled prop would.
                                                aria-disabled={isQuickConnectDisabled || undefined}
                                                className={isQuickConnectDisabled ? 'Mui-disabled' : undefined}
                                                disableRipple={isQuickConnectDisabled}
                                                // The error is announced when the focus returns to the button
                                                aria-describedby={quickConnectError ? quickConnectErrorId : undefined}
                                                startIcon={initiateQuickConnect.isPending ?
                                                    <CircularProgress size={16} color='inherit' aria-hidden /> :
                                                    undefined}
                                                onClick={onQuickConnectClick}
                                            >
                                                {globalize.translate('ButtonUseQuickConnect')}
                                            </Button>
                                        </>
                                    )}

                                    {/* Leaving the page would abandon the login in progress */}
                                    <Button variant='text' disabled={isLoggingIn} onClick={onForgotPasswordClick}>
                                        {globalize.translate('ButtonForgotPassword')}
                                    </Button>

                                    {appHost.supports(AppFeature.MultiServer) && (
                                        <Button variant='text' disabled={isLoggingIn} onClick={onSelectServerClick}>
                                            {globalize.translate('ButtonChangeServer')}
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>
                        </Paper>
                    )}

                    <LoginDisclaimer markdown={brandingOptions?.LoginDisclaimer} />
                </Stack>
            </Box>

            {quickConnect && (
                <QuickConnectDialog
                    api={quickConnect.api}
                    code={quickConnect.code}
                    secret={quickConnect.secret}
                    onAuthenticated={onQuickConnectAuthenticated}
                    onClose={onQuickConnectClose}
                    onError={onQuickConnectError}
                />
            )}
        </Page>
    );
};

export default LoginPage;
