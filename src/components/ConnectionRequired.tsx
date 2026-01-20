import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { ApiClient, ConnectResponse } from 'jellyfin-apiclient';

import { ConnectionState, ServerConnections } from 'lib/jellyfin-apiclient';

import ConnectionErrorPage from './ConnectionErrorPage';
import Loading from './loading/LoadingComponent';
import { logger } from '../utils/logger';

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
                logger.debug('[ConnectionRequired] already logged in, redirecting to home', { component: 'ConnectionRequired' });
                navigate(BounceRoutes.Home);
                return;
            case ConnectionState.ServerSignIn:
                // Bounce to the login page
                if (location.pathname === BounceRoutes.Login) {
                    setIsLoading(false);
                } else {
                    logger.debug('[ConnectionRequired] not logged in, redirecting to login page', { component: 'ConnectionRequired', location });
                    const url = encodeURIComponent(location.pathname + location.search);
                    navigate(`${BounceRoutes.Login}?serverid=${connectionResponse.ApiClient.serverId()}&url=${url}`);
                }
                return;
            case ConnectionState.ServerSelection:
                // Bounce to select server page
                logger.debug('[ConnectionRequired] redirecting to select server page', { component: 'ConnectionRequired' });
                navigateIfNotThere(BounceRoutes.SelectServer);
                return;
        }

        logger.warn('[ConnectionRequired] unhandled connection state', { component: 'ConnectionRequired', state: connectionResponse.State });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ navigateIfNotThere, location.pathname, navigate ]);

    const handleWizard = useCallback(async (firstConnection: ConnectResponse | null) => {
        const apiClient = firstConnection?.ApiClient || ServerConnections.currentApiClient();
        if (!apiClient) {
            throw new Error('No ApiClient available');
        }

        const systemInfo = await fetchPublicSystemInfo(apiClient);
        if (systemInfo?.StartupWizardCompleted) {
            logger.info('[ConnectionRequired] startup wizard is complete, redirecting home', { component: 'ConnectionRequired' });
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
                    logger.info('[ConnectionRequired] startup wizard is not complete, redirecting there', { component: 'ConnectionRequired' });
                    navigate(BounceRoutes.StartWizard);
                    return;
                }
            } catch (ex) {
                logger.error('[ConnectionRequired] checking wizard status failed', { component: 'ConnectionRequired' }, ex as Error);
                return;
            }
        }

        // Bounce to the correct page in the login flow
        bounce(firstConnection)
            .catch(err => {
                logger.error('[ConnectionRequired] failed to bounce', { component: 'ConnectionRequired' }, err as Error);
            });
    }, [bounce, navigate]);

    const validateUserAccess = useCallback(async () => {
        const client = ServerConnections.currentApiClient();

        // If this is a user route, ensure a user is logged in
        if ((level === AccessLevel.Admin || level === AccessLevel.User) && !client?.isLoggedIn()) {
            try {
                logger.warn('[ConnectionRequired] unauthenticated user attempted to access user route', { component: 'ConnectionRequired' });
                bounce(await ServerConnections.connect())
                    .catch(err => {
                        logger.error('[ConnectionRequired] failed to bounce', { component: 'ConnectionRequired' }, err as Error);
                    });
            } catch (ex) {
                logger.warn('[ConnectionRequired] error bouncing from user route', { component: 'ConnectionRequired' }, ex as Error);
            }
            return;
        }

        // If this is an admin route, ensure the user has access
        if (level === AccessLevel.Admin) {
            try {
                const user = await client?.getCurrentUser();
                if (!user?.Policy?.IsAdministrator) {
                    logger.warn('[ConnectionRequired] normal user attempted to access admin route', { component: 'ConnectionRequired' });
                    bounce(await ServerConnections.connect())
                        .catch(err => {
                            logger.error('[ConnectionRequired] failed to bounce', { component: 'ConnectionRequired' }, err as Error);
                        });
                    return;
                }
            } catch (ex) {
                logger.warn('[ConnectionRequired] error bouncing from admin route', { component: 'ConnectionRequired' }, ex as Error);
                return;
            }
        }

        setIsLoading(false);
    }, [bounce, level]);

    useEffect(() => {
        // Check connection status on initial page load
        const apiClient = ServerConnections.currentApiClient();
        const hasFirstConnection = ServerConnections.firstConnection !== null;
        const connection = Promise.resolve(hasFirstConnection ? null : ServerConnections.connect());
        connection.then(firstConnection => {
            logger.debug('[ConnectionRequired] connection state', { component: 'ConnectionRequired', state: firstConnection?.State });
            // Mark that we've attempted first connection (using a resolved promise as marker)
            if (!hasFirstConnection) {
                ServerConnections.firstConnection = Promise.resolve();
            }

            const state = firstConnection?.State;
            if (state !== undefined && ERROR_STATES.includes(state)) {
                setErrorState(state);
            } else if (level === AccessLevel.Wizard) {
                handleWizard(firstConnection)
                    .catch(err => {
                        logger.error('[ConnectionRequired] could not validate wizard status', { component: 'ConnectionRequired' }, err as Error);
                    });
            } else if (
                firstConnection && firstConnection.State !== ConnectionState.SignedIn && !apiClient?.isLoggedIn()
            ) {
                handleIncompleteWizard(firstConnection)
                    .catch(err => {
                        logger.error('[ConnectionRequired] could not start wizard', { component: 'ConnectionRequired' }, err as Error);
                    });
            } else {
                validateUserAccess()
                    .catch(err => {
                        logger.error('[ConnectionRequired] could not validate user access', { component: 'ConnectionRequired' }, err as Error);
                    });
            }
        }).catch(err => {
            logger.error('[ConnectionRequired] failed to connect', { component: 'ConnectionRequired' }, err as Error);
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
