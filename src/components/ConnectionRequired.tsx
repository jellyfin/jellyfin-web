import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { ConnectResponse } from 'jellyfin-apiclient';

import alert from './alert';
import { appRouter } from './router/appRouter';
import Loading from './loading/LoadingComponent';
import ServerConnections from './ServerConnections';
import globalize from '../scripts/globalize';
import { ConnectionState } from '../utils/jellyfin-apiclient/ConnectionState';

enum BounceRoutes {
    Home = '/home.html',
    Login = '/login.html',
    SelectServer = '/selectserver.html',
    StartWizard = '/wizardstart.html'
}

type ConnectionRequiredProps = {
    isAdminRequired?: boolean,
    isUserRequired?: boolean
};

/**
 * A component that ensures a server connection has been established.
 * Additional parameters exist to verify a user or admin have authenticated.
 * If a condition fails, this component will navigate to the appropriate page.
 */
const ConnectionRequired: FunctionComponent<ConnectionRequiredProps> = ({
    isAdminRequired = false,
    isUserRequired = true
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
    }, [location.pathname, navigate]);

    const handleIncompleteWizard = useCallback(async (firstConnection: ConnectResponse) => {
        if (firstConnection.State === ConnectionState.ServerSignIn) {
            // Verify the wizard is complete
            try {
                const infoResponse = await fetch(`${firstConnection.ApiClient.serverAddress()}/System/Info/Public`);
                if (!infoResponse.ok) {
                    throw new Error('Public system info request failed');
                }
                const systemInfo = await infoResponse.json();
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
        if ((isAdminRequired || isUserRequired) && !client?.isLoggedIn()) {
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
        if (isAdminRequired) {
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
    }, [bounce, isAdminRequired, isUserRequired]);

    useEffect(() => {
        // TODO: appRouter will call appHost.exit() if navigating back when you are already at the default route.
        // This case will need to be handled elsewhere before appRouter can be killed.

        // Check connection status on initial page load
        const firstConnection = appRouter.firstConnectionResult;
        appRouter.firstConnectionResult = null;

        if (firstConnection && firstConnection.State !== ConnectionState.SignedIn) {
            handleIncompleteWizard(firstConnection)
                .catch(err => {
                    console.error('[ConnectionRequired] failed to start wizard', err);
                });
        } else {
            validateUserAccess()
                .catch(err => {
                    console.error('[ConnectionRequired] failed to validate user access', err);
                });
        }
    }, [handleIncompleteWizard, validateUserAccess]);

    if (isLoading) {
        return <Loading />;
    }

    return <Outlet />;
};

export default ConnectionRequired;
