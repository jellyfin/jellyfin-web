import React, { FunctionComponent, useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import alert from './alert';
import { appRouter } from './appRouter';
import loading from './loading/loading';
import ServerConnections from './ServerConnections';
import globalize from '../scripts/globalize';

enum BounceRoutes {
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

    const [ isLoading, setIsLoading ] = useState(true);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bounce = async (connectionResponse: any) => {
            switch (connectionResponse.State) {
                case ConnectionState.SignedIn:
                    // Already logged in, bounce to the home page
                    console.debug('[ConnectionRequired] already logged in, redirecting to home');
                    navigate(BounceRoutes.Home);
                    return;
                case ConnectionState.ServerSignIn:
                    // Bounce to the login page
                    console.debug('[ConnectionRequired] not logged in, redirecting to login page');
                    navigate(BounceRoutes.Login, {
                        state: {
                            serverid: connectionResponse.ApiClient.serverId()
                        }
                    });
                    return;
                case ConnectionState.ServerSelection:
                    // Bounce to select server page
                    console.debug('[ConnectionRequired] redirecting to select server page');
                    navigate(BounceRoutes.SelectServer);
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
                        if (!systemInfo?.StartupWizardCompleted) {
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
                bounce(firstConnection);
                return;
            }

            // TODO: appRouter will call appHost.exit() if navigating back when you are already at the default route.
            // This case will need to be handled elsewhere before appRouter can be killed.

            const client = ServerConnections.currentApiClient();

            // If this is a user route, ensure a user is logged in
            if ((isAdminRequired || isUserRequired) && !client?.isLoggedIn()) {
                try {
                    console.warn('[ConnectionRequired] unauthenticated user attempted to access user route');
                    bounce(await ServerConnections.connect());
                } catch (ex) {
                    console.warn('[ConnectionRequired] error bouncing from user route', ex);
                }
                return;
            }

            // If this is an admin route, ensure the user has access
            if (isAdminRequired) {
                try {
                    const user = await client.getCurrentUser();
                    if (!user.Policy.IsAdministrator) {
                        console.warn('[ConnectionRequired] normal user attempted to access admin route');
                        bounce(await ServerConnections.connect());
                        return;
                    }
                } catch (ex) {
                    console.warn('[ConnectionRequired] error bouncing from admin route', ex);
                    return;
                }
            }

            setIsLoading(false);
        };

        validateConnection();
    }, [ isAdminRequired, isUserRequired, navigate ]);

    // Show/hide the loading indicator
    useEffect(() => {
        if (isLoading) {
            loading.show();
        } else {
            loading.hide();
        }
    }, [ isLoading ]);

    if (isLoading) {
        return null;
    }

    return (
        <div className='skinBody'>
            <Outlet />
        </div>
    );
};

export default ConnectionRequired;
