import type { Api } from '@jellyfin/sdk/lib/api';
import type { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client/models/authentication-result';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { getBrandingOptionsQuery } from '@/apps/dashboard/features/branding/api/useBrandingOptions';
import { getPublicUsersQuery } from '@/hooks/api/usePublicUsers';
import { getQuickConnectEnabledQuery } from '@/hooks/useQuickConnect';
import { useAuthenticateUserByName, type UserCredentials } from 'apps/modern/features/session/api/useAuthenticateUserByName';
import { useInitiateQuickConnect } from 'apps/modern/features/session/api/useQuickConnect';
import LoginDisclaimer from 'apps/modern/features/session/components/LoginDisclaimer';
import ManualLoginForm from 'apps/modern/features/session/components/ManualLoginForm';
import PublicUserList from 'apps/modern/features/session/components/PublicUserList';
import QuickConnectDialog from 'apps/modern/features/session/components/QuickConnectDialog';
import { completeLogin } from 'apps/modern/features/session/utils/completeLogin';
import { toLoggableError } from 'apps/modern/features/session/utils/loggableError';
import { getTargetUrl } from 'apps/modern/features/session/utils/targetUrl';
import alert from 'components/alert';
import { appHost } from 'components/apphost';
import LoadingComponent from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import toast from 'components/toast/toast';
import { AppFeature } from 'constants/appFeature';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { selectServer } from 'utils/dashboard';

const CARD_SX = { width: '100%', p: { xs: 2, sm: 3 } };
/** Keeps the login controls at a consistent width when the card is widened for the user grid */
const COLUMN_SX = { width: '100%', maxWidth: '25rem' };
// The user grid fits two columns in the narrow card; widen it only when more are needed
const NARROW_CARD_MAX_USERS = 2;

const UNAUTHORIZED_MESSAGES: Partial<Record<number, string>> = {
    401: 'MessageInvalidUser',
    403: 'MessageUnauthorizedUser'
};

const showConnectionFailure = () => {
    void alert({
        text: globalize.translate('MessageUnableToConnectToServer'),
        title: globalize.translate('HeaderConnectionFailure')
    });
};

const onLoginError = (error: unknown) => {
    const messageKey = isAxiosError(error) && error.response ?
        UNAUTHORIZED_MESSAGES[error.response.status] :
        undefined;

    if (messageKey) {
        toast(globalize.translate(messageKey));
    } else {
        console.error('[LoginPage] login failed', toLoggableError(error));
        showConnectionFailure();
    }
};

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
    username?: string
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

    // The user is not signed in yet, so the api from useApi is not available
    const server = useMemo(() => getServerApi(serverId), [ serverId ]);
    const api = server?.api;

    const {
        data: users,
        isLoading: isUsersLoading,
        isError: isUsersError
    } = useQuery(getPublicUsersQuery(api));
    const { data: isQuickConnectEnabled } = useQuery(getQuickConnectEnabledQuery(api));
    const { data: brandingOptions } = useQuery(getBrandingOptionsQuery(api));

    const authenticateUserByName = useAuthenticateUserByName(api);
    const initiateQuickConnect = useInitiateQuickConnect(api);

    const [ manualLogin, setManualLogin ] = useState<ManualLogin>();
    const [ quickConnect, setQuickConnect ] = useState<QuickConnect>();
    // Covers both the authentication and completing the login, so the controls stay disabled until navigating away.
    // The ref guards against re-entry before the state update is rendered.
    const [ isLoggingIn, setIsLoggingIn ] = useState(false);
    const isLoggingInRef = useRef(false);
    const manualLoginButtonRef = useRef<HTMLButtonElement>(null);
    const shouldFocusManualLoginRef = useRef(false);

    const hasPublicUsers = !!users?.length;
    const isWideCard = (users?.length ?? 0) > NARROW_CARD_MAX_USERS;
    const isManualFormVisible = !!manualLogin || !hasPublicUsers;

    useEffect(() => {
        // Return focus to the manual login button after the form is cancelled, since the focused button was removed
        if (!isManualFormVisible && shouldFocusManualLoginRef.current) {
            shouldFocusManualLoginRef.current = false;
            manualLoginButtonRef.current?.focus();
        }
    }, [ isManualFormVisible ]);

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
     * Completes the login and navigates to the target url. Failures are reported here, separately from
     * authentication failures. Returns whether the login succeeded.
     */
    const finishLogin = useCallback(async (result: AuthenticationResult, expectedServerId: string | undefined) => {
        try {
            await completeLogin(result, expectedServerId);
        } catch (error) {
            console.error('[LoginPage] unable to complete the login', toLoggableError(error));
            showConnectionFailure();
            endLogin();
            return false;
        }

        // The login stays in progress so the controls are not re-enabled while navigating away
        navigate(targetUrl, { replace: true });
        return true;
    }, [ endLogin, navigate, targetUrl ]);

    const login = useCallback(async (credentials: UserCredentials) => {
        if (!startLogin()) return;

        // Keep the server the request is made to, in case the requested server changes during the login
        const expectedServerId = server?.serverId;

        let result: AuthenticationResult;
        try {
            result = await authenticateUserByName.mutateAsync(credentials);
        } catch (error) {
            endLogin();
            onLoginError(error);
            // Rejecting clears the password in the form
            throw error;
        }

        // The credentials were valid, so keep the password if completing the login fails
        await finishLogin(result, expectedServerId);
    }, [ authenticateUserByName, endLogin, finishLogin, server, startLogin ]);

    const onUserSelect = useCallback((user: UserDto) => {
        setManualLogin({ username: user.Name ?? undefined });
    }, []);

    const onManualLoginClick = useCallback(() => {
        setManualLogin({});
    }, []);

    const onManualLoginCancel = useCallback(() => {
        shouldFocusManualLoginRef.current = true;
        setManualLogin(undefined);
    }, []);

    const onQuickConnectClick = useCallback(() => {
        if (!server) return;

        // Keep polling the server that initiated the request, even if the requested server changes
        initiateQuickConnect.mutate(undefined, {
            onSuccess: ({ code, secret }) => setQuickConnect({ ...server, code, secret }),
            onError: error => {
                console.error('[LoginPage] quick connect error', toLoggableError(error));
                void alert({
                    text: globalize.translate('QuickConnectNotActive'),
                    title: globalize.translate('HeaderError')
                });
            }
        });
    }, [ initiateQuickConnect, server ]);

    const onQuickConnectClose = useCallback(() => {
        setQuickConnect(undefined);
    }, []);

    const onQuickConnectError = useCallback((error: Error) => {
        console.error('[LoginPage] unable to login with quick connect', toLoggableError(error));
        setQuickConnect(undefined);
        void alert({
            text: globalize.translate('QuickConnectDeactivated'),
            title: globalize.translate('HeaderError')
        });
    }, []);

    const onQuickConnectAuthenticated = useCallback((result: AuthenticationResult) => {
        if (!quickConnect || !startLogin()) return;

        void finishLogin(result, quickConnect.serverId)
            .then(isLoggedIn => {
                if (!isLoggedIn) setQuickConnect(undefined);
            });
    }, [ finishLogin, quickConnect, startLogin ]);

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
                sx={{ maxWidth: '50rem', mx: 'auto', my: 'auto', width: '100%' }}
            >
                <Stack spacing={3} alignItems='center'>
                    <Typography variant='h1' textAlign='center'>
                        {globalize.translate('HeaderPleaseSignIn')}
                    </Typography>

                    {isUsersLoading && <LoadingComponent />}

                    {!isUsersLoading && (
                        <Paper sx={{ ...CARD_SX, maxWidth: isWideCard ? '40rem' : '25rem' }}>
                            <Stack spacing={2} alignItems='center'>
                                {(!api || isUsersError) && (
                                    <Alert severity='error' sx={COLUMN_SX}>
                                        {globalize.translate('MessageUnableToConnectToServer')}
                                    </Alert>
                                )}

                                {isManualFormVisible ? (
                                    <Box sx={COLUMN_SX}>
                                        <ManualLoginForm
                                            // Remount when a different user is selected to reset the form
                                            key={manualLogin?.username}
                                            initialUsername={manualLogin?.username}
                                            isSubmitting={isLoggingIn}
                                            onSubmit={login}
                                            onCancel={hasPublicUsers ? onManualLoginCancel : undefined}
                                        />
                                    </Box>
                                ) : (
                                    <>
                                        <PublicUserList
                                            api={api}
                                            users={users ?? []}
                                            disabled={isLoggingIn}
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
                                                {globalize.translate('ButtonManualLogin')}
                                            </Button>
                                        </Box>
                                    </>
                                )}

                                <Divider flexItem />

                                <Stack spacing={0.5} sx={COLUMN_SX}>
                                    {isQuickConnectEnabled && (
                                        <Button
                                            variant='text'
                                            disabled={isLoggingIn || initiateQuickConnect.isPending}
                                            onClick={onQuickConnectClick}
                                        >
                                            {globalize.translate('ButtonUseQuickConnect')}
                                        </Button>
                                    )}

                                    <Button variant='text' onClick={onForgotPasswordClick}>
                                        {globalize.translate('ButtonForgotPassword')}
                                    </Button>

                                    {appHost.supports(AppFeature.MultiServer) && (
                                        <Button variant='text' onClick={onSelectServerClick}>
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
