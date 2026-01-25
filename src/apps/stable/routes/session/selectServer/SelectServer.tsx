import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, Button, Input, Alert, Checkbox } from 'ui-primitives';
import { LoadingView } from 'components/feedback/LoadingView';
import globalize from 'lib/globalize';
import { ConnectionState, ServerConnections } from 'lib/jellyfin-apiclient';
import { useServerStore } from 'store/serverStore';
import { useDevConfigStore } from 'store/devConfigStore';
import { saveDevConfig, normalizeServerBaseUrl } from 'utils/devConfig';
import { useNavigate } from '@tanstack/react-router';

interface SelectServerProps {
    showUser?: boolean;
}

export function SelectServer({ showUser = false }: SelectServerProps) {
    const navigate = useNavigate();
    const { servers, addServer, setCurrentServer } = useServerStore();
    const devConfig = useDevConfigStore();

    const [isLoading, setIsLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDevSettings, setShowDevSettings] = useState(false);
    const [manualUrl, setManualUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [serverConnecting, setServerConnecting] = useState<string | null>(null);

    const mapServerInfo = useCallback((server: any) => {
        return {
            id: server.Id,
            name: server.Name,
            address: server.Address || server.ManualAddress || server.LocalAddress || server.RemoteAddress || '',
            localAddress: server.LocalAddress || '',
            remoteAddress: server.RemoteAddress || '',
            manualAddress: server.ManualAddress || '',
            lastConnectionMode: server.LastConnectionMode || 0,
            dateLastAccessed: server.DateLastAccessed || Date.now(),
            userId: server.UserId || null,
            accessToken: server.AccessToken || null
        };
    }, []);

    const loadServers = useCallback(async () => {
        setIsLoading(true);
        try {
            // Race the server discovery against a timeout to ensure UI loads quickly
            const discoveryPromise = new Promise<any[]>(resolve => {
                const servers = ServerConnections.getAvailableServers();
                resolve(servers);
            });
            const timeoutPromise = new Promise<any[]>(resolve => setTimeout(() => resolve([]), 1000));

            const availableServers = await Promise.race([discoveryPromise, timeoutPromise]);

            if (Array.isArray(availableServers)) {
                availableServers.forEach((server: any) => {
                    addServer(mapServerInfo(server));
                });
            }

            // If discovery finishes later, we can still add them (optional, but for now just ensure UI loads)
            discoveryPromise
                .then((servers: any) => {
                    if (Array.isArray(servers) && servers.length > 0) {
                        servers.forEach((server: any) => {
                            addServer(mapServerInfo(server));
                        });
                    }
                })
                .catch(() => {});
        } catch (err) {
            console.error('Error loading servers:', err);
        } finally {
            setIsLoading(false);
        }
    }, [addServer, mapServerInfo]);

    useEffect(() => {
        loadServers();
    }, [loadServers]);

    const connectToServer = async (server: any) => {
        setServerConnecting(server.id);
        setError(null);

        try {
            const result = await ServerConnections.connectToServer(
                {
                    Id: server.id,
                    Name: server.name,
                    Address: server.address,
                    LocalAddress: server.localAddress,
                    RemoteAddress: server.remoteAddress,
                    ManualAddress: server.manualAddress,
                    LastConnectionMode: server.lastConnectionMode,
                    DateLastAccessed: server.dateLastAccessed,
                    UserId: server.userId,
                    AccessToken: server.accessToken
                },
                {
                    enableAutoLogin: true
                }
            );

            switch (result.State) {
                case ConnectionState.SignedIn: {
                    const updatedServer = {
                        ...mapServerInfo(result.Servers[0]),
                        userId: result.ApiClient.getCurrentUserId(),
                        accessToken: result.ApiClient.accessToken()
                    };
                    setCurrentServer(updatedServer);
                    navigate({ to: '/home' });
                    break;
                }
                case ConnectionState.ServerSignIn:
                    setCurrentServer(mapServerInfo(result.Servers[0]));
                    navigate({ to: `/login?serverid=${result.Servers[0].Id}` } as any);
                    break;
                case ConnectionState.ServerUpdateNeeded:
                    setError('Server update needed. Please update your Jellyfin server.');
                    break;
                default:
                    setError('Unable to connect to server');
            }
        } catch (err: any) {
            setError(err.message || 'Connection failed');
        } finally {
            setServerConnecting(null);
        }
    };

    const handleAddServer = async () => {
        if (!manualUrl.trim()) {
            setError('Please enter a server URL');
            return;
        }

        const normalizedUrl = normalizeServerBaseUrl(manualUrl);
        const resolvedAddress =
            import.meta.env.DEV && devConfig.useProxy
                ? `${window.location.origin}${devConfig.proxyBasePath}`
                : normalizedUrl;

        setIsLoading(true);
        setError(null);

        if (import.meta.env.DEV && devConfig.useProxy) {
            devConfig.setServerBaseUrl(normalizedUrl);
            try {
                await saveDevConfig({ serverBaseUrl: normalizedUrl });
            } catch {
                // Ignore dev-config persistence failures
            }
        }

        try {
            const result = await ServerConnections.connectToAddress(resolvedAddress, { enableAutoLogin: true });

            switch (result.State) {
                case ConnectionState.SignedIn: {
                    const updatedServer = {
                        ...mapServerInfo(result.Servers[0]),
                        userId: result.ApiClient.getCurrentUserId(),
                        accessToken: result.ApiClient.accessToken()
                    };
                    addServer(updatedServer);
                    setCurrentServer(updatedServer);
                    setShowAddDialog(false);
                    setManualUrl('');
                    navigate({ to: '/home' });
                    break;
                }
                case ConnectionState.ServerSignIn: {
                    const newServer = mapServerInfo(result.Servers[0]);
                    addServer(newServer);
                    setCurrentServer(newServer);
                    setShowAddDialog(false);
                    setManualUrl('');
                    navigate({ to: `/login?serverid=${result.Servers[0].Id}` } as any);
                    break;
                }
                case ConnectionState.ServerSelection: {
                    const newServer = mapServerInfo(result.Servers[0]);
                    addServer(newServer);
                    setShowAddDialog(false);
                    setManualUrl('');
                    break;
                }
                case ConnectionState.ServerUpdateNeeded:
                    setError('Server update needed. Please update your Jellyfin server.');
                    break;
                case ConnectionState.Unavailable:
                default:
                    setError('No server found at this address');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveDevConfig = async () => {
        try {
            await saveDevConfig({
                useProxy: devConfig.useProxy,
                serverBaseUrl: devConfig.serverBaseUrl,
                proxyBasePath: devConfig.proxyBasePath
            });
            setShowDevSettings(false);
        } catch (err) {
            setError('Failed to save dev config');
        }
    };

    if (isLoading && servers.length === 0) {
        return <LoadingView message={globalize.translate('Loading')} />;
    }

    const pageClass = showUser ? 'libraryPage noSecondaryNavPage' : 'standalonePage';

    return (
        <div className={`${pageClass} selectServerPage`} style={{ minHeight: '100vh', padding: 16 }}>
            <Box style={{ maxWidth: 800, margin: '0 auto' }}>
                <Text as="h2" size="xl" weight="bold" style={{ marginBottom: '8px', textAlign: 'center' }}>
                    {globalize.translate('SelectServer')}
                </Text>

                {error && (
                    <Box style={{ marginBottom: '16px' }}>
                        <Alert variant="error">
                            <Text color="error">{error}</Text>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setError(null)}
                                style={{ marginLeft: '8px' }}
                            >
                                Dismiss
                            </Button>
                        </Alert>
                    </Box>
                )}

                {import.meta.env.DEV && (
                    <Box style={{ textAlign: 'right', marginBottom: 16 }}>
                        <Button variant="ghost" size="sm" onClick={() => setShowDevSettings(true)}>
                            Developer Settings
                        </Button>
                    </Box>
                )}

                {servers.length === 0 ? (
                    <Box style={{ textAlign: 'center', padding: '32px 0' }}>
                        <Text size="md" color="secondary" style={{ marginBottom: '24px' }}>
                            {globalize.translate('MessageNoServersAvailable')}
                        </Text>
                        <Button variant="primary" onClick={() => setShowAddDialog(true)}>
                            {globalize.translate('AddServer')}
                        </Button>
                    </Box>
                ) : (
                    <>
                        <Box
                            className="servers"
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 16,
                                justifyContent: 'center',
                                margin: '24px 0'
                            }}
                        >
                            {servers.map(server => (
                                <button
                                    key={server.id}
                                    type="button"
                                    onClick={() => connectToServer(server)}
                                    disabled={serverConnecting === server.id}
                                    style={{
                                        width: 160,
                                        height: 200,
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: serverConnecting === server.id ? 'default' : 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: 16,
                                        borderRadius: 24
                                    }}
                                >
                                    <Box
                                        style={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: 16,
                                            backgroundColor: 'var(--joy-palette-primary-100)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <span
                                            className="material-icons"
                                            style={{ fontSize: 40, color: 'var(--joy-palette-primary-600)' }}
                                        >
                                            storage
                                        </span>
                                    </Box>
                                    <Text
                                        size="md"
                                        weight="medium"
                                        style={{
                                            maxWidth: 140,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {server.name}
                                    </Text>
                                    <Text
                                        size="sm"
                                        color="secondary"
                                        style={{
                                            maxWidth: 140,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {server.address}
                                    </Text>
                                    {serverConnecting === server.id && (
                                        <Text size="sm" color="primary">
                                            Connecting...
                                        </Text>
                                    )}
                                </button>
                            ))}
                        </Box>

                        <Box style={{ margin: '24px 0', textAlign: 'center' }}>
                            <Text size="sm" color="secondary">
                                or
                            </Text>
                        </Box>

                        <Box style={{ textAlign: 'center' }}>
                            <Button variant="secondary" onClick={() => setShowAddDialog(true)}>
                                {globalize.translate('AddServer')}
                            </Button>
                        </Box>
                    </>
                )}
            </Box>

            {/* Add Server Dialog */}
            {showAddDialog && (
                <Box
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                >
                    <Box
                        style={{
                            backgroundColor: '#252525',
                            borderRadius: '12px',
                            padding: '24px',
                            maxWidth: '400px',
                            width: '90%',
                            position: 'relative'
                        }}
                    >
                        <Box style={{ position: 'absolute', top: 16, right: 16 }}>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAddDialog(false)}
                                style={{ padding: '4px' }}
                            >
                                ×
                            </Button>
                        </Box>
                        <Text as="h4" size="lg" weight="bold">
                            {globalize.translate('AddServer')}
                        </Text>
                        <Box style={{ paddingTop: '16px' }}>
                            <Input
                                id="server-url"
                                label={globalize.translate('ServerURL')}
                                value={manualUrl}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualUrl(e.target.value)}
                                placeholder="http://localhost:8096"
                            />
                        </Box>
                        {error && (
                            <Alert variant="error" style={{ marginTop: '16px' }}>
                                <Text color="error">{error}</Text>
                            </Alert>
                        )}
                        <Box style={{ marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" onClick={() => setShowAddDialog(false)}>
                                {globalize.translate('Cancel')}
                            </Button>
                            <Button variant="primary" onClick={handleAddServer} disabled={isLoading}>
                                {isLoading ? 'Connecting...' : globalize.translate('Connect')}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Developer Settings Dialog */}
            {showDevSettings && (
                <Box
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                >
                    <Box
                        style={{
                            backgroundColor: '#252525',
                            borderRadius: '12px',
                            padding: '24px',
                            maxWidth: '400px',
                            width: '90%',
                            position: 'relative'
                        }}
                    >
                        <Box style={{ position: 'absolute', top: 16, right: 16 }}>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDevSettings(false)}
                                style={{ padding: '4px' }}
                            >
                                ×
                            </Button>
                        </Box>
                        <Text as="h4" size="lg" weight="bold" style={{ marginBottom: 16 }}>
                            Developer Settings
                        </Text>

                        <Box style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Checkbox
                                    id="use-proxy"
                                    checked={devConfig.useProxy}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        devConfig.setUseProxy(e.target.checked)
                                    }
                                />
                                <label htmlFor="use-proxy">
                                    <Text>Use Dev Proxy</Text>
                                </label>
                            </Box>

                            <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Checkbox
                                    id="enable-sw"
                                    checked={localStorage.getItem('enable-service-worker') === 'true'}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        localStorage.setItem('enable-service-worker', String(e.target.checked));
                                        // Force update to reflect change (cheap way)
                                        setShowDevSettings(prev => prev);
                                        window.location.reload(); // Reload to apply SW changes
                                    }}
                                />
                                <label htmlFor="enable-sw">
                                    <Text>Enable Service Worker (Requires Reload)</Text>
                                </label>
                            </Box>

                            {devConfig.useProxy && (
                                <>
                                    <Input
                                        label="Server Base URL (Target)"
                                        value={devConfig.serverBaseUrl}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            devConfig.setServerBaseUrl(e.target.value)
                                        }
                                        placeholder="https://demo.jellyfin.org"
                                    />
                                    <Input
                                        label="Proxy Base Path"
                                        value={devConfig.proxyBasePath}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            devConfig.setProxyBasePath(e.target.value)
                                        }
                                        placeholder="/__proxy__/jellyfin"
                                    />
                                </>
                            )}
                        </Box>

                        <Box style={{ marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" onClick={() => setShowDevSettings(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleSaveDevConfig}>
                                Save & Apply
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}
        </div>
    );
}
