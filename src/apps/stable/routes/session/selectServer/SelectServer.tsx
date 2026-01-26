import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, Button, Input, Alert, Checkbox } from 'ui-primitives';
import { LoadingView } from 'components/feedback/LoadingView';
import globalize from 'lib/globalize';
import { ConnectionState, ServerConnections } from 'lib/jellyfin-apiclient';
import { useServerStore, type ServerInfo } from 'store/serverStore';
import { useDevConfigStore } from 'store/devConfigStore';
import { saveDevConfig, normalizeServerBaseUrl } from 'utils/devConfig';
import { useNavigate } from '@tanstack/react-router';
import { logger } from 'utils/logger';

interface SelectServerProps {
    readonly showUser?: boolean;
}

interface LegacyServerInfo {
    readonly Id: string;
    readonly Name: string;
    readonly Address?: string;
    readonly ManualAddress?: string;
    readonly LocalAddress?: string;
    readonly RemoteAddress?: string;
    readonly LastConnectionMode?: number;
    readonly DateLastAccessed?: number | string;
    readonly UserId?: string;
    readonly AccessToken?: string;
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

    const mapServerInfo = useCallback((server: LegacyServerInfo): ServerInfo => {
        const lastAccessed = typeof server.DateLastAccessed === 'string' 
            ? new Date(server.DateLastAccessed).getTime() 
            : (server.DateLastAccessed ?? Date.now());

        return {
            id: server.Id,
            name: server.Name,
            address: server.Address ?? server.ManualAddress ?? server.LocalAddress ?? server.RemoteAddress ?? '',
            localAddress: server.LocalAddress ?? '',
            remoteAddress: server.RemoteAddress ?? '',
            manualAddress: server.ManualAddress ?? '',
            lastConnectionMode: server.LastConnectionMode ?? 0,
            dateLastAccessed: lastAccessed,
            userId: server.UserId ?? null,
            accessToken: server.AccessToken ?? null
        };
    }, []);

    const loadServers = useCallback(() => {
        setIsLoading(true);
        try {
            const availableServers = ServerConnections.getAvailableServers();
            if (Array.isArray(availableServers)) {
                for (const server of availableServers) {
                    addServer(mapServerInfo(server));
                }
            }
        } catch (err) {
            logger.error('Error loading servers', { component: 'SelectServer', error: err });
        } finally {
            setIsLoading(false);
        }
    }, [addServer, mapServerInfo]);

    useEffect(() => {
        loadServers();
    }, [loadServers]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleConnectionResult = useCallback((result: any, isNewServer: boolean = false) => {
        switch (result.State) {
            case ConnectionState.SignedIn: {
                const updatedServer = {
                    ...mapServerInfo(result.Servers[0]),
                    userId: result.ApiClient.getCurrentUserId(),
                    accessToken: result.ApiClient.accessToken()
                };
                if (isNewServer) {
                    addServer(updatedServer);
                }
                setCurrentServer(updatedServer);
                setShowAddDialog(false);
                setManualUrl('');
                void navigate({ to: '/home' });
                break;
            }
            case ConnectionState.ServerSignIn: {
                const server = mapServerInfo(result.Servers[0]);
                if (isNewServer) {
                    addServer(server);
                }
                setCurrentServer(server);
                setShowAddDialog(false);
                setManualUrl('');
                void navigate({ to: '/login', search: { serverid: result.Servers[0].Id } });
                break;
            }
            case ConnectionState.ServerSelection: {
                if (isNewServer) {
                    const server = mapServerInfo(result.Servers[0]);
                    addServer(server);
                    setShowAddDialog(false);
                    setManualUrl('');
                }
                break;
            }
            case ConnectionState.ServerUpdateNeeded:
                setError('Server update needed. Please update your Jellyfin server.');
                break;
            case ConnectionState.Unavailable:
                setError('No server found at this address');
                break;
            default:
                setError('Unable to connect to server');
        }
    }, [mapServerInfo, setCurrentServer, addServer, navigate]);

    const onConnectClick = useCallback((server: ServerInfo) => {
        void connectToServer(server);
    }, [connectToServer]);

    const onAddServerSubmit = useCallback(() => {
        void handleAddServer();
    }, [handleAddServer]);

    const onSaveDevSettingsSubmit = useCallback(() => {
        void handleSaveDevConfig();
    }, [handleSaveDevConfig]);

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

                {error !== null && (
                    <Box style={{ marginBottom: '16px' }}>
                        <Alert variant="error">
                            <Text color="error">{error}</Text>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onDismissError}
                                style={{ marginLeft: '8px' }}
                            >
                                Dismiss
                            </Button>
                        </Alert>
                    </Box>
                )}

                {import.meta.env.DEV && (
                    <Box style={{ textAlign: 'right', marginBottom: 16 }}>
                        <Button variant="ghost" size="sm" onClick={onShowDevSettings}>
                            Developer Settings
                        </Button>
                    </Box>
                )}

                {servers.length === 0 ? (
                    <Box style={{ textAlign: 'center', padding: '32px 0' }}>
                        <Text size="md" color="secondary" style={{ marginBottom: '24px' }}>
                            {globalize.translate('MessageNoServersAvailable')}
                        </Text>
                        <Button variant="primary" onClick={onShowAddDialog}>
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
                                    onClick={() => onConnectClick(server)}
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
                            <Button variant="secondary" onClick={onShowAddDialog}>
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
                                onClick={onDismissAddDialog}
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
                                onChange={onUrlChange}
                                placeholder="http://localhost:8096"
                            />
                        </Box>
                        {error !== null && (
                            <Alert variant="error" style={{ marginTop: '16px' }}>
                                <Text color="error">{error}</Text>
                            </Alert>
                        )}
                        <Box style={{ marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" onClick={onDismissAddDialog}>
                                {globalize.translate('Cancel')}
                            </Button>
                            <Button variant="primary" onClick={onAddServerSubmit} disabled={isLoading}>
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
                                onClick={onDismissDevSettings}
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
                                    onChange={devConfig.toggleUseProxy}
                                />
                                <label htmlFor="use-proxy">
                                    <Text>Use Dev Proxy</Text>
                                </label>
                            </Box>

                            <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Checkbox
                                    id="enable-sw"
                                    checked={localStorage.getItem('enable-service-worker') === 'true'}
                                    onChange={onSWToggle}
                                />
                                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                                <label htmlFor="enable-sw">
                                    <Text>Enable Service Worker (Requires Reload)</Text>
                                </label>
                            </Box>

                            {devConfig.useProxy && (
                                <>
                                    <Input
                                        label="Server Base URL (Target)"
                                        value={devConfig.serverBaseUrl}
                                        onChange={devConfig.onServerBaseUrlChange}
                                        placeholder="https://demo.jellyfin.org"
                                    />
                                    <Input
                                        label="Proxy Base Path"
                                        value={devConfig.proxyBasePath}
                                        onChange={devConfig.onProxyBasePathChange}
                                        placeholder="/__proxy__/jellyfin"
                                    />
                                </>
                            )}
                        </Box>

                        <Box style={{ marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" onClick={onDismissDevSettings}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={onSaveDevSettingsSubmit}>
                                Save & Apply
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}
        </div>
    );
}
