import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { ApiClient, ConnectResponse } from 'jellyfin-apiclient';

import { ConnectionState, ServerConnections } from 'lib/jellyfin-apiclient';

import ConnectionErrorPage from './ConnectionErrorPage';
import Loading from './loading/LoadingComponent';

enum AccessLevel {
    /** Requires a user with administrator access */
    Admin = 'admin',
    /** No access restrictions */
    Public = 'public',
    /** Requires a valid user session */
    User = 'user',
    /** Requires the startup wizard to NOT be completed */
    Wizard = 'wizard'
};

type AccessLevelValue = `${AccessLevel}`;

enum BounceRoutes {
    Home = '/home',
    Login = '/login',
    SelectServer = '/selectserver',
    StartWizard = '/wizard/start'
}

type ConnectionRequiredProps = {
    level?: AccessLevelValue
};

const ERROR_STATES = [
    ConnectionState.ServerMismatch,
    ConnectionState.ServerUpdateNeeded,
    ConnectionState.Unavailable
];

const fetchPublicSystemInfo = async (apiClient: ApiClient) => {
    const infoResponse = await fetch(
        `${apiClient.serverAddress()}/System/Info/Public`,
        { cache: 'no-cache' }
    );

    if (!infoResponse.ok) {
        throw new Error('Public system info request failed');
    }

    return infoResponse.json();
};

/**
 * A component that ensures a server connection has been established.
 * Additional parameters exist to verify a user or admin have authenticated.
 * If a condition fails, this component will navigate to the appropriate page.
 */
const ConnectionRequired: FunctionComponent<ConnectionRequiredProps> = ({
    level = 'user'
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [ errorState, setErrorState ] = useState<ConnectionState>();
    const [ isLoading, setIsLoading ] = useState(true);

    const navigateIfNotThere = useCallback((route: BounceRoutes) => {
        // If we try to navigate to the current route, just set isLoading = false
        if (location.pathname === route) setIsLoading(false);
        // Otherwise navigate to the route
        else navigate(route);
    }, [ location.pathname, navigate ]);

    const bounce = useCallback(async (connectionResponse: ConnectResponse) => {
        switch (connectionResponse.State) {
            case ConnectionState.SignedIn:
                // Already logged in, bounce to the home page
                console.debug('[ConnectionRequired] already logged in, redirecting to home');
                navigate(BounceRoutes.Home);
                return;
            case ConnectionState.ServerSignIn:
                // Bounce to the login page
                if (location.pathname === BounceRoutes.Login) {
                    setIsLoading(false);
                } else {
                    console.debug('[ConnectionRequired] not logged in, redirecting to login page', location);
                    const url = encodeURIComponent(location.pathname + location.search);
                    navigate(`${BounceRoutes.Login}?serverid=${connectionResponse.ApiClient.serverId()}&url=${url}`);
                }
                return;
            case ConnectionState.ServerSelection:
                // Bounce to select server page
                console.debug('[ConnectionRequired] redirecting to select server page');
                navigateIfNotThere(BounceRoutes.SelectServer);
                return;
        }

        console.warn('[ConnectionRequired] unhandled connection state', connectionResponse.State);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ navigateIfNotThere, location.pathname, navigate ]);

    const handleWizard = useCallback(async (firstConnection: ConnectResponse | null) => {
        const apiClient = firstConnection?.ApiClient || ServerConnections.currentApiClient();
        if (!apiClient) {
            throw new Error('No ApiClient available');
        }

        try {
            const systemInfo = await fetchPublicSystemInfo(apiClient);
            if (systemInfo?.StartupWizardCompleted) {
                console.warn('[ConnectionRequired] attempted to access completed wizard, redirecting home');
                navigate(BounceRoutes.Home);
                return;
            }
        } catch (error) {
            console.error('[ConnectionRequired] failed to fetch system info for wizard validation', error);
            // If we can't verify wizard status, redirect to home for security
            navigate(BounceRoutes.Home);
            return;
        }

        // Additional security check: ensure no admin users exist if wizard should be accessible
        try {
            const users = await apiClient.getUsers();
            const adminUsers = users?.filter(user => user.Policy?.IsAdministrator);
            if (adminUsers && adminUsers.length > 0) {
                console.warn('[ConnectionRequired] admin users exist, wizard should not be accessible, redirecting home');
                navigate(BounceRoutes.Home);
                return;
            }
        } catch (error) {
            console.error('[ConnectionRequired] failed to validate admin users for wizard access', error);
            // If we can't verify user status, redirect to home for security
            navigate(BounceRoutes.Home);
            return;
        }

        // Update the current ApiClient
        ServerConnections.setLocalApiClient(apiClient);
        setIsLoading(false);
    }, [ navigate ]);

    const handleIncompleteWizard = useCallback(async (firstConnection: ConnectResponse) => {
        if (firstConnection.State === ConnectionState.ServerSignIn) {
            // Verify the wizard is complete
            try {
                const systemInfo = await fetchPublicSystemInfo(firstConnection.ApiClient);
                if (!systemInfo?.StartupWizardCompleted) {
                    // Update the current ApiClient
                    // TODO: Is there a better place to handle this?
                    ServerConnections.setLocalApiClient(firstConnection.ApiClient);
                    // Bounce to the wizard
                    console.info('[ConnectionRequired] startup wizard is not complete, redirecting there');
                    navigate(BounceRoutes.StartWizard);
                    return;
                }
            } catch (ex) {
                console.error('[ConnectionRequired] checking wizard status failed', ex);
                return;
            }
        }

        // Bounce to the correct page in the login flow
        bounce(firstConnection)
            .catch(err => {
                console.error('[ConnectionRequired] failed to bounce', err);
            });
    }, [bounce, navigate]);

    const validateUserAccess = useCallback(async () => {
        const client = ServerConnections.currentApiClient();

        // If this is a user route, ensure a user is logged in
        if ((level === AccessLevel.Admin || level === AccessLevel.User) && !client?.isLoggedIn()) {
            try {
                console.warn('[ConnectionRequired] unauthenticated user attempted to access user route');
                bounce(await ServerConnections.connect())
                    .catch(err => {
                        console.error('[ConnectionRequired] failed to bounce', err);
                    });
            } catch (ex) {
                console.warn('[ConnectionRequired] error bouncing from user route', ex);
            }
            return;
        }

        // If this is an admin route, ensure the user has access
        if (level === AccessLevel.Admin) {
            try {
                const user = await client?.getCurrentUser();
                if (!user?.Policy?.IsAdministrator) {
                    console.warn('[ConnectionRequired] normal user attempted to access admin route');
                    bounce(await ServerConnections.connect())
                        .catch(err => {
                            console.error('[ConnectionRequired] failed to bounce', err);
                        });
                    return;
                }
            } catch (ex) {
                console.warn('[ConnectionRequired] error bouncing from admin route', ex);
                return;
            }
        }

        setIsLoading(false);
    }, [bounce, level]);

    useEffect(() => {
        // Check connection status on initial page load
        const apiClient = ServerConnections.currentApiClient();
        const connection = Promise.resolve(ServerConnections.firstConnection ? null : ServerConnections.connect());
        connection.then(firstConnection => {
            console.debug('[ConnectionRequired] connection state', firstConnection?.State);
            ServerConnections.firstConnection = true;

            if (ERROR_STATES.includes(firstConnection?.State)) {
                setErrorState(firstConnection.State);
            } else if (level === AccessLevel.Wizard) {
                handleWizard(firstConnection)
                    .catch(err => {
                        console.error('[ConnectionRequired] could not validate wizard status', err);
                    });
            } else if (
                firstConnection && firstConnection.State !== ConnectionState.SignedIn && !apiClient?.isLoggedIn()
            ) {
                handleIncompleteWizard(firstConnection)
                    .catch(err => {
                        console.error('[ConnectionRequired] could not start wizard', err);
                    });
            } else {
                validateUserAccess()
                    .catch(err => {
                        console.error('[ConnectionRequired] could not validate user access', err);
                    });
            }
        }).catch(err => {
            console.error('[ConnectionRequired] failed to connect', err);
        });
    }, [handleIncompleteWizard, handleWizard, level, validateUserAccess]);

    if (errorState) {
        return <ConnectionErrorPage state={errorState} />;
    }

    if (isLoading) {
        return <Loading />;
    }

    return <Outlet />;
};

export default ConnectionRequired;
