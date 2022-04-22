import React, { FunctionComponent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import globalize from '../scripts/globalize';

import alert from './alert';
import { appRouter } from './appRouter';
import loading from './loading/loading';
import ServerConnections from './ServerConnections';

enum Routes {
    Home = '/home.html',
    Login = '/login.html',
    SelectServer = '/selectserver.html',
    StartWizard = '/wizardstart.html'
}

// TODO: This should probably be in the SDK
enum ConnectionState {
    SignedIn = 'SignedIn',
    ServerSignIn = 'ServerSignIn',
    ServerSelection = 'ServerSelection',
    ServerUpdateNeeded = 'ServerUpdateNeeded'
}

type ConnectedRouteProps = {
    isAdminRoute?: boolean,
    isUserRoute?: boolean,
    roles?: string[]
};

const ConnectedRoute: FunctionComponent<ConnectedRouteProps> = ({
    children,
    isAdminRoute = false,
    isUserRoute = true
}) => {
    const navigate = useNavigate();

    const [ isLoading, setIsLoading ] = useState(true);

    useEffect(() => {
        const bounce = async (connectionResponse: any) => {
            switch (connectionResponse.State) {
                case ConnectionState.SignedIn:
                    // Already logged in, bounce to the home page
                    console.debug('[ConnectedRoute] already logged in, redirecting to home');
                    navigate(Routes.Home);
                    return;
                case ConnectionState.ServerSignIn:
                    // Bounce to the login page
                    console.debug('[ConnectedRoute] not logged in, redirecting to login page');
                    navigate(Routes.Login, {
                        state: {
                            serverid: connectionResponse.ApiClient.serverId()
                        }
                    });
                    return;
                case ConnectionState.ServerSelection:
                    // Bounce to select server page
                    console.debug('[ConnectedRoute] redirecting to select server page');
                    navigate(Routes.SelectServer);
                    return;
                case ConnectionState.ServerUpdateNeeded:
                    // Show update needed message and bounce to select server page
                    try {
                        await alert({
                            text: globalize.translate('ServerUpdateNeeded', 'https://github.com/jellyfin/jellyfin'),
                            html: globalize.translate('ServerUpdateNeeded', '<a href="https://github.com/jellyfin/jellyfin">https://github.com/jellyfin/jellyfin</a>')
                        });
                    } catch (ex) {
                        console.warn('[ConnectedRoute] failed to show alert', ex);
                    }
                    console.debug('[ConnectedRoute] server update required, redirecting to select server page');
                    navigate(Routes.SelectServer);
                    return;
            }

            console.warn('[ConnectedRoute] unhandled connection state', connectionResponse.State);
        };

        const validateConnection = async () => {
            // Check connection status on initial page load
            const firstConnection = appRouter.firstConnectionResult;
            appRouter.firstConnectionResult = null;

            if (firstConnection && firstConnection.State !== ConnectionState.SignedIn) {
                if (firstConnection.State === ConnectionState.ServerSignIn) {
                    // Verify the wizard is complete
                    try {
                        const infoResponse = await fetch(`${firstConnection.ApiClient.serverAddress()}/System/Info/Public`);
                        if (!infoResponse.ok) {
                            throw new Error('Public system info request failed');
                        }
                        const systemInfo = await infoResponse.json();
                        if (!systemInfo.StartupWizardCompleted) {
                            // Bounce to the wizard
                            console.info('[ConnectedRoute] startup wizard is not complete, redirecting there');
                            navigate(Routes.StartWizard);
                            return;
                        }
                    } catch (ex) {
                        console.error('[ConnectedRoute] checking wizard status failed', ex);
                    }
                }

                // Bounce to the correct page in the login flow
                bounce(firstConnection);
                return;
            }

            // TODO: should exiting the app be handled here?

            const client = ServerConnections.currentApiClient();

            // If this is a user route, ensure a user is logged in
            if ((isAdminRoute || isUserRoute) && !client?.isLoggedIn()) {
                try {
                    console.warn('[ConnectedRoute] unauthenticated user attempted to access user route');
                    bounce(await ServerConnections.connect());
                } catch (ex) {
                    console.warn('[ConnectedRoute] error bouncing from user route', ex);
                }
                return;
            }

            // If this is an admin route, ensure the user has access
            if (isAdminRoute) {
                try {
                    const user = await client.getCurrentUser();
                    if (!user.Policy.IsAdministrator) {
                        console.warn('[ConnectedRoute] normal user attempted to access admin route');
                        bounce(await ServerConnections.connect());
                        return;
                    }
                } catch (ex) {
                    console.warn('[ConnectedRoute] error bouncing from admin route', ex);
                    return;
                }
            }

            setIsLoading(false);
        };

        loading.show();
        validateConnection();
    }, [ isAdminRoute, isUserRoute, navigate ]);

    useEffect(() => {
        if (!isLoading) {
            loading.hide();
        }
    }, [ isLoading ]);

    if (isLoading) {
        return null;
    }

    return (
        <>{children}</>
    );
};

export default ConnectedRoute;
