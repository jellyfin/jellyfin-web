import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { ApiClient, ConnectResponse } from 'jellyfin-apiclient';

import globalize from 'lib/globalize';
import { ConnectionState, ServerConnections } from 'lib/jellyfin-apiclient';

import alert from './alert';
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

    const [ isLoading, setIsLoading ] = useState(true);

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
                if (location.pathname === BounceRoutes.SelectServer) {
                    setIsLoading(false);
                } else {
                    console.debug('[ConnectionRequired] redirecting to select server page');
                    navigate(BounceRoutes.SelectServer);
                }
                return;
            case ConnectionState.ServerUpdateNeeded:
                // Show update needed message and bounce to select server page
                try {
                    await alert({
                        text: globalize.translate('ServerUpdateNeeded', 'https://github.com/jellyfin/jellyfin'),
                        html: globalize.translate('ServerUpdateNeeded', '<a href="https://github.com/jellyfin/jellyfin">https://github.com/jellyfin/jellyfin</a>')
                    });
                } catch (ex) {
                    console.warn('[ConnectionRequired] failed to show alert', ex);
                }
                console.debug('[ConnectionRequired] server update required, redirecting to select server page');
                navigate(BounceRoutes.SelectServer);
                return;
        }

        console.warn('[ConnectionRequired] unhandled connection state', connectionResponse.State);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, navigate]);

    const handleWizard = useCallback(async (firstConnection: ConnectResponse | null) => {
        const apiClient = firstConnection?.ApiClient || ServerConnections.currentApiClient();
        if (!apiClient) {
            throw new Error('No ApiClient available');
        }

        const systemInfo = await fetchPublicSystemInfo(apiClient);
        if (systemInfo?.StartupWizardCompleted) {
            console.info('[ConnectionRequired] startup wizard is complete, redirecting home');
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

            if (level === AccessLevel.Wizard) {
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

    if (isLoading) {
        return <Loading />;
    }

    return <Outlet />;
};

export default ConnectionRequired;
