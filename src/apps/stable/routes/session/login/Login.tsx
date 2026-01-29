import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { Box, Text, Button, Input, Alert } from 'ui-primitives';
import { LoadingView } from 'components/feedback/LoadingView';
import { useServerStore } from 'store/serverStore';
import { useAuthStore } from 'store/authStore';
import type { ServerInfo } from 'store/serverStore';
import { RequestContext } from 'utils/observability';
import { ServerConnections } from 'lib/jellyfin-apiclient';

interface User {
    Id: string;
    Name: string;
    HasPassword: boolean;
    PrimaryImageTag?: string;
}

export function Login() {
    const navigate = useNavigate();
    const { currentServer, setCurrentServer } = useServerStore();
    const { login } = useAuthStore();

    const [manualMode, setManualMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const usernameInputRef = useRef<HTMLInputElement>(null);

    const { data: users = [] } = useQuery({
        queryKey: ['publicUsers', currentServer?.id],
        enabled: Boolean(currentServer?.id),
        queryFn: async () => {
            if (!currentServer?.id) {
                return [];
            }
            const client = ServerConnections.getApiClient(currentServer.id);
            if (!client) {
                return [];
            }
            return client.getPublicUsers();
        },
        retry: 1
    });

    const updateServerFromAuth = useCallback(
        (result: any) => {
            if (!currentServer) return;
            const updatedServer: ServerInfo = {
                id: currentServer.id,
                name: currentServer.name,
                address: currentServer.address,
                localAddress: currentServer.localAddress,
                remoteAddress: currentServer.remoteAddress,
                manualAddress: currentServer.manualAddress,
                lastConnectionMode: currentServer.lastConnectionMode,
                dateLastAccessed: currentServer.dateLastAccessed,
                userId: result.User.Id,
                accessToken: result.AccessToken
            };
            setCurrentServer(updatedServer);

            // Update auth store
            login({
                id: result.User.Id,
                username: result.User.Name,
                serverId: currentServer.id,
                accessToken: result.AccessToken,
                isLoggedIn: true
            });

            navigate({ to: '/home' });
        },
        [currentServer, setCurrentServer, login, navigate]
    );

    const loginWithUserIdMutation = useMutation({
        mutationFn: async (userId: string) => {
            if (!currentServer?.id) {
                throw new Error('No server selected');
            }
            const client = ServerConnections.getApiClient(currentServer.id);
            if (!client) {
                throw new Error('ApiClient not initialized');
            }
            return (client as any).authenticateUserById(userId);
        },
        onMutate: () => {
            setIsAuthenticating(true);
            setError(null);
        },
        onSuccess: result => {
            if (!result?.User) return;
            updateServerFromAuth(result);
            RequestContext.emit({
                operation: 'userLogin',
                component: 'Login',
                outcome: 'success',
                businessContext: {
                    loginType: 'userId',
                    serverAddress: currentServer?.address,
                    userId: result.User.Id,
                    userName: result.User.Name,
                    hasPassword: result.User.HasPassword,
                    isFirstLogin: false // Could be determined from user data
                }
            });
        },
        onError: (err: any) => {
            RequestContext.emit(
                {
                    operation: 'userLogin',
                    component: 'Login',
                    outcome: 'error',
                    businessContext: {
                        loginType: 'userId',
                        serverAddress: currentServer?.address,
                        errorType: err?.status || 'network',
                        errorCategory: err?.status === 401 ? 'authentication' : 'connection'
                    }
                },
                err
            );
            setError(err?.status === 401 ? 'Invalid user' : 'Unable to connect');
        },
        onSettled: () => {
            setIsAuthenticating(false);
        }
    });

    const loginWithCredentialsMutation = useMutation({
        mutationFn: async ({ user, pass }: { user: string; pass: string }) => {
            if (!currentServer?.id) {
                throw new Error('No server selected');
            }
            const client = ServerConnections.getApiClient(currentServer.id);
            if (!client) {
                throw new Error('ApiClient not initialized');
            }
            return client.authenticateUserByName(user, pass);
        },
        onMutate: () => {
            setIsAuthenticating(true);
            setError(null);
        },
        onSuccess: result => {
            if (!result?.User) return;
            updateServerFromAuth(result);
            RequestContext.emit({
                operation: 'userLogin',
                component: 'Login',
                outcome: 'success',
                businessContext: {
                    loginType: 'credentials',
                    serverAddress: currentServer?.address,
                    userId: result.User.Id,
                    userName: result.User.Name,
                    hasPassword: result.User.HasPassword,
                    isFirstLogin: false // Could be determined from user data
                }
            });
        },
        onError: (err: any) => {
            RequestContext.emit(
                {
                    operation: 'userLogin',
                    component: 'Login',
                    outcome: 'error',
                    businessContext: {
                        loginType: 'credentials',
                        serverAddress: currentServer?.address,
                        errorType: err?.status || 'network',
                        errorCategory: err?.status === 401 ? 'authentication' : 'connection'
                    }
                },
                err
            );
            setError(err?.status === 401 ? 'Invalid username or password' : 'Unable to connect');
        },
        onSettled: () => {
            setIsAuthenticating(false);
        }
    });

    const form = useForm({
        defaultValues: {
            username: '',
            password: ''
        },
        onSubmit: async ({ value }) => {
            if (!value.username || !value.password) {
                setError('Please enter username and password');
                return;
            }

            try {
                await loginWithCredentialsMutation.mutateAsync({ user: value.username, pass: value.password });
            } catch {
                // Error state is handled by the mutation callbacks.
            } finally {
                form.setFieldValue('password', '');
            }
        }
    });

    const getUserImageUrl = (userId: string, imageTag?: string): string => {
        if (!currentServer?.id || !imageTag) return '';
        const client = ServerConnections.getApiClient(currentServer.id);
        if (client) {
            return client.getUserImageUrl(userId, { width: 200, tag: imageTag, type: 'Primary' });
        }
        return '';
    };

    const handleManualLogin = () => {
        void form.handleSubmit();
    };

    /**
     * Ensure proper focus and keyboard input handling when entering manual login mode.
     * This fixes an issue where keyboard input wasn't working on first render.
     */
    useEffect(() => {
        if (manualMode && usernameInputRef.current) {
            // Use requestAnimationFrame to ensure the DOM is fully rendered
            const frameId = requestAnimationFrame(() => {
                usernameInputRef.current?.focus();
            });
            return () => cancelAnimationFrame(frameId);
        }
    }, [manualMode]);

    if (!currentServer) {
        return <LoadingView message="No server selected" />;
    }

    return (
        <Box
            className="loginPage loginPage-welcome centralLogInContainer"
            style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
        >
            <Box className="loginLogo" style={{ textAlign: 'center', padding: 32 }}>
                <Text as="h2" size="xl" weight="bold">
                    Jellyfin
                </Text>
            </Box>

            <Box className="loginContainer" style={{ maxWidth: 400, margin: '0 auto', padding: 16, width: '100%' }}>
                {!manualMode ? (
                    <Box>
                        <Text as="h4" size="lg" weight="bold" style={{ marginBottom: 24, textAlign: 'center' }}>
                            Who is watching?
                        </Text>

                        <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
                            {users.map((user: any) => (
                                <button
                                    key={user.Id}
                                    type="button"
                                    onClick={() => {
                                        if (user.HasPassword) {
                                            setManualMode(true);
                                            form.setFieldValue('username', user.Name);
                                            form.setFieldValue('password', '');
                                            return;
                                        }
                                        loginWithUserIdMutation.mutate(user.Id);
                                    }}
                                    style={{
                                        width: 100,
                                        height: 140,
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: 8,
                                        borderRadius: 16
                                    }}
                                >
                                    <Box
                                        style={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: '50%',
                                            backgroundColor: '#e0e0e0',
                                            backgroundImage: user.PrimaryImageTag
                                                ? `url(${getUserImageUrl(user.Id, user.PrimaryImageTag)})`
                                                : 'none',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {!user.PrimaryImageTag && (
                                            <span className="material-icons" style={{ fontSize: 40, color: '#666' }}>
                                                person
                                            </span>
                                        )}
                                    </Box>
                                    <Text
                                        size="sm"
                                        style={{
                                            maxWidth: 90,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {user.Name}
                                    </Text>
                                </button>
                            ))}
                        </Box>

                        <Box style={{ margin: '24px 0', textAlign: 'center' }}>
                            <Text size="sm" color="secondary">
                                or
                            </Text>
                        </Box>

                        <Button variant="secondary" fullWidth onClick={() => setManualMode(true)}>
                            Sign in manually
                        </Button>
                    </Box>
                ) : (
                    <Box>
                        <Text as="h4" size="lg" weight="bold" style={{ marginBottom: 24, textAlign: 'center' }}>
                            Sign in
                        </Text>

                        {error && (
                            <Alert variant="error" style={{ marginBottom: 16 }}>
                                {error}
                            </Alert>
                        )}

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleManualLogin();
                            }}
                            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                        >
                            <form.Field name="username">
                                {field => (
                                    <Input
                                        ref={usernameInputRef}
                                        id="username"
                                        label="Username"
                                        value={field.state.value ?? ''}
                                        onChange={event => field.handleChange(event.target.value)}
                                        onBlur={field.handleBlur}
                                        autoComplete="username"
                                    />
                                )}
                            </form.Field>

                            <form.Field name="password">
                                {field => (
                                    <Input
                                        id="password"
                                        type="password"
                                        label="Password"
                                        value={field.state.value ?? ''}
                                        onChange={event => field.handleChange(event.target.value)}
                                        onBlur={field.handleBlur}
                                        autoComplete="current-password"
                                    />
                                )}
                            </form.Field>

                            <Button variant="primary" fullWidth type="submit" disabled={isAuthenticating}>
                                {isAuthenticating ? 'Signing in...' : 'Sign in'}
                            </Button>
                            <Button
                                variant="ghost"
                                fullWidth
                                type="button"
                                onClick={() => {
                                    setManualMode(false);
                                    setError(null);
                                }}
                            >
                                Back to user list
                            </Button>
                        </form>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default Login;
