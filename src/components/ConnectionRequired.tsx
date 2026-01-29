import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import type { ApiClient, ConnectResponse } from 'jellyfin-apiclient';
import { ConnectionState, ServerConnections } from 'lib/jellyfin-apiclient';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Box, Button, Text } from 'ui-primitives';
import { useServerStore } from '../store/serverStore';
import { logger } from '../utils/logger';
import ConnectionErrorPage from './ConnectionErrorPage';
import Loading from './loading/LoadingComponent';

/**
 * Connection timeout in milliseconds
 * Set to 5 seconds to allow for network latency, server discovery, and auto-login
 * If no server is found by this time, redirect to server selection
 */
const CONNECTION_TIMEOUT_MS = 5000;

enum AccessLevel {
    Admin = 'admin',
    Public = 'public',
    User = 'user',
    Wizard = 'wizard'
}

type AccessLevelValue = `${AccessLevel}`;

enum BounceRoutes {
    Home = '/home',
    Login = '/login',
    SelectServer = '/selectserver',
    StartWizard = '/wizard/start'
}

type ConnectionRequiredProps = {
    level?: AccessLevelValue;
    children?: () => React.ReactElement;
};

const ERROR_STATES = [
    ConnectionState.ServerMismatch,
    ConnectionState.ServerUpdateNeeded,
    ConnectionState.Unavailable
];
logger.debug('ConnectionRequired ERROR_STATES', { ERROR_STATES, component: 'ConnectionRequired' });

const mapServerInfo = (server: any) => ({
    id: server.Id,
    name: server.Name,
    address:
        server.Address || server.ManualAddress || server.LocalAddress || server.RemoteAddress || '',
    localAddress: server.LocalAddress || '',
    remoteAddress: server.RemoteAddress || '',
    manualAddress: server.ManualAddress || '',
    lastConnectionMode: server.LastConnectionMode || 0,
    dateLastAccessed: server.DateLastAccessed || Date.now(),
    userId: server.UserId || null,
    accessToken: server.AccessToken || null
});

const fetchPublicSystemInfo = async (apiClient: ApiClient) => {
    const infoResponse = await fetch(`${apiClient.serverAddress()}/System/Info/Public`, {
        cache: 'no-cache'
    });

    if (!infoResponse.ok) {
        throw new Error('Public system info request failed');
    }

    const data = await infoResponse.json();

    if (!data || !data.Id || !data.ProductName?.toLowerCase().includes('jellyfin')) {
        throw new Error('Not a valid Jellyfin server');
    }

    return data;
};

const NoServerFoundFallback: FunctionComponent<{ onAddServer: () => void }> = ({ onAddServer }) => {
    return (
        <Box
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                backgroundColor: 'var(--joy-palette-background-default, #121212)'
            }}
        >
            <Box style={{ maxWidth: 400, textAlign: 'center' }}>
                <Box
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        backgroundColor: 'var(--joy-palette-warning-light, #4a3d30)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}
                >
                    <span
                        className="material-icons"
                        style={{ fontSize: 40, color: 'var(--joy-palette-warning-main, #ff9800)' }}
                    >
                        wifi_off
                    </span>
                </Box>

                <Text as="h2" size="xl" weight="bold" style={{ marginBottom: 16 }}>
                    No Server Found
                </Text>

                <Text size="md" color="secondary" style={{ marginBottom: 24, lineHeight: 1.6 }}>
                    Could not automatically discover a Jellyfin server on your network. Enter your
                    server address manually to continue.
                </Text>

                <Button variant="primary" size="lg" onClick={onAddServer} fullWidth>
                    Add Server Manually
                </Button>

                <Text size="sm" color="muted" style={{ marginTop: 24 }}>
                    Make sure your Jellyfin server is running and accessible.
                </Text>
            </Box>
        </Box>
    );
};

const ConnectionRequired: FunctionComponent<ConnectionRequiredProps> = ({
    level = 'user',
    children
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setCurrentServer } = useServerStore();

    const [errorState, setErrorState] = useState<ConnectionState>();
    const [isLoading, setIsLoading] = useState(true);
    const [hasConnectionError, setHasConnectionError] = useState(false);

    const navigateIfNotThere = useCallback(
        (route: BounceRoutes) => {
            if (location.pathname === route) setIsLoading(false);
            else navigate({ to: route as string });
        },
        [location, navigate]
    );

    const bounce = useCallback(
        async (connectionResponse: ConnectResponse | null) => {
            // Handle null connection response
            if (!connectionResponse) {
                logger.debug(
                    'ConnectionRequired bounce received null connectionResponse, redirecting to selectserver',
                    {
                        component: 'ConnectionRequired'
                    }
                );
                navigateIfNotThere(BounceRoutes.SelectServer);
                return;
            }

            switch (connectionResponse.State) {
                case ConnectionState.SignedIn:
                    logger.debug('ConnectionRequired bounce: SignedIn state, navigating to /home', {
                        component: 'ConnectionRequired'
                    });
                    navigate({ to: '/home' });
                    return;
                case ConnectionState.ServerSignIn:
                    if (location.pathname === '/login') {
                        logger.debug(
                            'ConnectionRequired bounce: ServerSignIn state, already on /login, setting loading false',
                            {
                                component: 'ConnectionRequired'
                            }
                        );
                        setIsLoading(false);
                    } else {
                        if (connectionResponse.Servers?.[0]) {
                            setCurrentServer(mapServerInfo(connectionResponse.Servers[0]));
                        }
                        const search = typeof location.search === 'string' ? location.search : '';
                        const url = encodeURIComponent(location.pathname + search);
                        logger.debug(
                            'ConnectionRequired bounce: ServerSignIn state, redirecting to /login',
                            {
                                component: 'ConnectionRequired'
                            }
                        );
                        navigate({
                            to: `/login?serverid=${connectionResponse.ApiClient.serverId()}&url=${url}`
                        });
                    }
                    return;
                case ConnectionState.ServerSelection:
                    // When no servers are configured, show server selection
                    logger.debug(
                        'ConnectionRequired bounce: ServerSelection state, redirecting to /selectserver',
                        {
                            component: 'ConnectionRequired'
                        }
                    );
                    navigateIfNotThere(BounceRoutes.SelectServer);
                    return;
                default:
                    logger.warn(
                        'ConnectionRequired bounce: unknown state, redirecting to /selectserver',
                        {
                            state: connectionResponse.State,
                            component: 'ConnectionRequired'
                        }
                    );
                    navigateIfNotThere(BounceRoutes.SelectServer);
            }
        },
        [navigateIfNotThere, location, navigate, setCurrentServer]
    );

    const handleWizard = useCallback(
        async (firstConnection: ConnectResponse | null) => {
            const apiClient = firstConnection?.ApiClient || ServerConnections.currentApiClient();
            if (!apiClient) {
                throw new Error('No ApiClient available');
            }

            const systemInfo = await fetchPublicSystemInfo(apiClient);
            if (systemInfo?.StartupWizardCompleted) {
                navigate({ to: '/home' });
                return;
            }

            ServerConnections.setLocalApiClient(apiClient);
            setIsLoading(false);
        },
        [navigate]
    );

    const handleIncompleteWizard = useCallback(
        async (firstConnection: ConnectResponse) => {
            if (firstConnection.State === ConnectionState.ServerSignIn) {
                try {
                    const systemInfo = await fetchPublicSystemInfo(firstConnection.ApiClient);
                    if (!systemInfo?.StartupWizardCompleted) {
                        ServerConnections.setLocalApiClient(firstConnection.ApiClient);
                        navigate({ to: '/wizard/start' });
                        return;
                    }
                } catch (ex) {
                    logger.warn('[ConnectionRequired] Invalid server detected, showing fallback', {
                        component: 'ConnectionRequired'
                    });
                    setHasConnectionError(true);
                    setIsLoading(false);
                    return;
                }
            }

            bounce(firstConnection).catch(() => {});
        },
        [bounce, navigate]
    );

    const validateUserAccess = useCallback(async () => {
        const client = ServerConnections.currentApiClient();

        if (
            (level === AccessLevel.Admin || level === AccessLevel.User) &&
            (!client || !client.isLoggedIn())
        ) {
            try {
                bounce(await ServerConnections.connect()).catch(() => {});
            } catch (ex) {}
            return;
        }

        if (level === AccessLevel.Admin) {
            try {
                const user = await client?.getCurrentUser();
                if (!user?.Policy?.IsAdministrator) {
                    bounce(await ServerConnections.connect()).catch(() => {});
                    return;
                }
            } catch (ex) {
                return;
            }
        }

        setIsLoading(false);
    }, [bounce, level]);

    const handleAddServer = useCallback(() => {
        navigate({ to: '/selectserver' });
    }, [navigate]);

    useEffect(() => {
        logger.debug('ConnectionRequired useEffect START', {
            errorState,
            hasConnectionError,
            component: 'ConnectionRequired'
        });
        if (errorState || hasConnectionError) {
            logger.debug('ConnectionRequired useEffect SKIPPED - already have error', {
                component: 'ConnectionRequired'
            });
            return;
        }

        let timeoutId: ReturnType<typeof setTimeout>;
        const isMounted = { current: true };
        const connectionAttempts = { current: 0 };
        const MAX_CONNECTION_ATTEMPTS = 3;

        const handleConnectionResult = (firstConnection: ConnectResponse | null) => {
            if (!isMounted.current) {
                logger.debug('ConnectionRequired handleConnectionResult skipped - not mounted', {
                    component: 'ConnectionRequired'
                });
                return;
            }

            connectionAttempts.current++;
            logger.debug('ConnectionRequired handleConnectionResult START', {
                state: firstConnection?.State,
                stateType: typeof firstConnection?.State,
                firstConnectionExists: !!firstConnection,
                connectionAttempts: connectionAttempts.current,
                ERROR_STATES,
                isInErrorStates:
                    firstConnection?.State !== undefined &&
                    ERROR_STATES.includes(firstConnection.State as ConnectionState),
                component: 'ConnectionRequired'
            });

            if (connectionAttempts.current >= MAX_CONNECTION_ATTEMPTS) {
                logger.warn('ConnectionRequired max attempts reached, showing error', {
                    component: 'ConnectionRequired'
                });
                setHasConnectionError(true);
                setIsLoading(false);
                return;
            }

            const state = firstConnection?.State;
            logger.debug('ConnectionRequired state check', {
                state,
                isUndefined: state === undefined,
                ERROR_STATES,
                includes: ERROR_STATES.includes(state as ConnectionState),
                component: 'ConnectionRequired'
            });
            if (state !== undefined && ERROR_STATES.includes(state as ConnectionState)) {
                // UX Improvement: If we are on the root path and fail to connect,
                // redirect to server selection instead of showing a scary error page.
                if (location.pathname === '/') {
                    logger.debug(
                        'ConnectionRequired root path failure, redirecting to selectserver',
                        {
                            component: 'ConnectionRequired'
                        }
                    );
                    navigate({ to: '/selectserver' });
                    return;
                }

                logger.debug('ConnectionRequired MATCHED error state, setting errorState', {
                    component: 'ConnectionRequired'
                });
                setErrorState(state);
                setIsLoading(false);
            } else if (level === AccessLevel.Wizard) {
                logger.debug('ConnectionRequired calling handleWizard', {
                    component: 'ConnectionRequired'
                });
                handleWizard(firstConnection).catch(() => {});
            } else if (
                firstConnection &&
                firstConnection.State !== ConnectionState.SignedIn &&
                !ServerConnections.currentApiClient()?.isLoggedIn()
            ) {
                logger.debug('ConnectionRequired calling handleIncompleteWizard', {
                    component: 'ConnectionRequired'
                });
                handleIncompleteWizard(firstConnection).catch(() => {});
            } else {
                const client = ServerConnections.currentApiClient();
                // If no client and no first connection, redirect to server selection
                if (!client && !firstConnection) {
                    logger.warn(
                        'ConnectionRequired: no client and no connection result, calling bounce with null',
                        {
                            component: 'ConnectionRequired'
                        }
                    );
                    bounce(null).catch(() => {});
                    return;
                }
                logger.debug('ConnectionRequired calling validateUserAccess', {
                    component: 'ConnectionRequired'
                });
                validateUserAccess().catch(() => {});
            }
        };

        const checkConnection = async () => {
            logger.debug('ConnectionRequired checkConnection called', {
                attempts: connectionAttempts.current,
                component: 'ConnectionRequired'
            });
            const hasFirstConnection = ServerConnections.firstConnection !== null;

            if (!hasFirstConnection) {
                logger.debug('ConnectionRequired calling ServerConnections.connect', {
                    component: 'ConnectionRequired'
                });
                const connectionPromise = ServerConnections.connect();

                /**
                 * Use a longer timeout (5 seconds) for initial connection attempt
                 * to allow for network latency and server discovery
                 */
                timeoutId = setTimeout(() => {
                    if (!isMounted.current) return;
                    logger.debug(
                        'ConnectionRequired CONNECTION TIMEOUT REACHED, calling bounce with null',
                        {
                            component: 'ConnectionRequired'
                        }
                    );
                    // Instead of just showing error, try to bounce to server selection
                    handleConnectionResult(null);
                }, CONNECTION_TIMEOUT_MS);

                try {
                    logger.debug('ConnectionRequired awaiting connectionPromise', {
                        component: 'ConnectionRequired'
                    });
                    const firstConnection = await connectionPromise;
                    clearTimeout(timeoutId);
                    logger.debug('ConnectionRequired connectionPromise RESOLVED', {
                        state: firstConnection?.State,
                        hasApiClient: !!firstConnection?.ApiClient,
                        component: 'ConnectionRequired'
                    });
                    handleConnectionResult(firstConnection);
                } catch (err) {
                    clearTimeout(timeoutId);
                    logger.debug('ConnectionRequired connectionPromise REJECTED', {
                        err,
                        component: 'ConnectionRequired'
                    });
                    if (!isMounted.current) return;
                    setHasConnectionError(true);
                    setIsLoading(false);
                }
            } else {
                logger.debug('ConnectionRequired using cached firstConnection', {
                    component: 'ConnectionRequired'
                });
                handleConnectionResult(null);
            }
        };

        logger.debug('ConnectionRequired useEffect scheduling checkConnection', {
            component: 'ConnectionRequired'
        });
        const timerId = setTimeout(checkConnection, 0);

        return () => {
            logger.debug('ConnectionRequired useEffect cleanup', {
                component: 'ConnectionRequired'
            });
            isMounted.current = false;
            clearTimeout(timeoutId);
            clearTimeout(timerId);
        };
    }, [
        handleIncompleteWizard,
        handleWizard,
        level,
        validateUserAccess,
        errorState,
        hasConnectionError
    ]);

    if (errorState) {
        logger.debug('ConnectionRequired RENDERING ConnectionErrorPage', {
            state: errorState,
            component: 'ConnectionRequired'
        });
        return <ConnectionErrorPage state={errorState} />;
    }

    if (hasConnectionError) {
        logger.debug('ConnectionRequired RENDERING NoServerFoundFallback', {
            component: 'ConnectionRequired'
        });
        return <NoServerFoundFallback onAddServer={handleAddServer} />;
    }

    if (isLoading) {
        logger.debug('ConnectionRequired RENDERING Loading', { component: 'ConnectionRequired' });
        return <Loading />;
    }

    return children ? children() : <Outlet />;
};

export default ConnectionRequired;
