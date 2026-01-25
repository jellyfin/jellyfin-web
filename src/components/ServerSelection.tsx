import React, { useCallback, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';
import { ServerConnections, ConnectionState } from 'lib/jellyfin-apiclient';
import { Box, Button, Input, Text, Alert, Flex, Card, CardHeader, CardBody, Heading } from 'ui-primitives';
import { useDevConfigStore } from 'store/devConfigStore';
import { normalizeServerBaseUrl, saveDevConfig } from 'utils/devConfig';
import { logger } from '../utils/logger';

interface ServerSelectionProps {
    onServerSelected?: (server: any) => void;
}

const ServerSelection: React.FC<ServerSelectionProps> = ({ onServerSelected }) => {
    const navigate = useNavigate();
    const devConfig = useDevConfigStore();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const serverSchema = z.object({
        serverAddress: z
            .string()
            .trim()
            .min(1, 'Server address is required')
            .refine(value => {
                try {
                    normalizeServerBaseUrl(value);
                    return true;
                } catch {
                    return false;
                }
            }, 'Invalid server address format. Please enter a valid URL or hostname.')
    });

    const connectMutation = useMutation({
        mutationFn: async (address: string) => {
            logger.info('Attempting to connect to server', { component: 'ServerSelection', address });

            return ServerConnections.connectToAddress(address, {
                enableAutoLogin: false
            });
        },
        onSuccess: (result) => {
            logger.debug('Server connection result', { component: 'ServerSelection', state: result.State });

            if (result.State === ConnectionState.SignedIn) {
                setSuccess('Successfully connected to server!');
                if (onServerSelected && result.Servers?.[0]) {
                    onServerSelected(result.Servers[0]);
                }
                setTimeout(() => navigate({ to: '/home' }), 1500);
                return;
            }

            if (result.State === ConnectionState.ServerSignIn) {
                setSuccess('Server found! Redirecting to login...');
                if (onServerSelected && result.Servers?.[0]) {
                    onServerSelected(result.Servers[0]);
                }
                setTimeout(() => navigate({ to: '/login' }), 1500);
                return;
            }

            if (result.State === ConnectionState.Unavailable) {
                setError('Server is unavailable. Please check that the server is running and accessible.');
                return;
            }

            if (result.State === ConnectionState.ServerMismatch) {
                setError('Server ID mismatch. The server may have been reinstalled or the configuration changed.');
                return;
            }

            if (result.State === ConnectionState.ServerUpdateNeeded) {
                setError('Server update required. Please update your Jellyfin server to a compatible version.');
                return;
            }

            setError('Unable to connect to server. Please check the address and try again.');
        },
        onError: (err) => {
            logger.error('Server connection failed', { component: 'ServerSelection', error: err });
            setError('Failed to connect to server. Please check the address and ensure the server is running.');
        }
    });

    const form = useForm({
        defaultValues: {
            serverAddress: ''
        },
        onSubmit: async ({ value }) => {
            const parsed = serverSchema.safeParse(value);
            if (!parsed.success) {
                setError(parsed.error.errors[0]?.message || 'Invalid server address');
                return;
            }

            setError(null);
            setSuccess(null);

            const normalizedAddress = normalizeServerBaseUrl(parsed.data.serverAddress);
            const resolvedAddress =
                import.meta.env.DEV && devConfig.useProxy
                    ? `${window.location.origin}${devConfig.proxyBasePath}`
                    : normalizedAddress;

            if (import.meta.env.DEV && devConfig.useProxy) {
                devConfig.setServerBaseUrl(normalizedAddress);
                try {
                    await saveDevConfig({ serverBaseUrl: normalizedAddress });
                } catch {
                    // Ignore dev-config persistence failures here.
                }
            }

            connectMutation.mutate(resolvedAddress);
        }
    });

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !connectMutation.isPending) {
                void form.handleSubmit();
            }
        },
        [form, connectMutation.isPending]
    );

    return (
        <Box
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                backgroundColor: 'var(--joy-palette-background-surface, #1a1a1a)'
            }}
        >
            <Card style={{ maxWidth: 500, width: '100%' }}>
                <CardHeader>
                    <Heading.H1 style={{ textAlign: 'center' }}>Connect to Jellyfin Server</Heading.H1>
                </CardHeader>
                <CardBody>
                    <Box style={{ marginBottom: 24 }}>
                        <Text size="md" color="secondary" style={{ textAlign: 'center', lineHeight: 1.6 }}>
                            Enter your Jellyfin server address to connect. This can be an IP address, hostname, or URL.
                        </Text>
                    </Box>

                    <Box style={{ marginBottom: 16 }}>
                        <Input
                            label="Server Address"
                            placeholder="https://demo.jellyfin.org or 192.168.1.100:8096"
                            value={form.state.values.serverAddress}
                            onChange={e => form.setFieldValue('serverAddress', e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={connectMutation.isPending}
                            helperText="Include http:// or https:// for URLs, or just the hostname/IP for automatic protocol detection"
                        />
                    </Box>

                    {error && (
                        <Alert variant="error" style={{ marginBottom: 16 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert variant="success" style={{ marginBottom: 16 }}>
                            {success}
                        </Alert>
                    )}

                    <Flex style={{ gap: 12, justifyContent: 'center' }}>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => form.handleSubmit()}
                            disabled={connectMutation.isPending || !form.state.values.serverAddress.trim()}
                            fullWidth
                        >
                            {connectMutation.isPending ? 'Connecting...' : 'Connect'}
                        </Button>
                    </Flex>

                    <Box style={{ marginTop: 24, textAlign: 'center' }}>
                        <Text size="sm" color="muted">
                            Make sure your Jellyfin server is running and accessible from this device.
                        </Text>
                    </Box>
                </CardBody>
            </Card>
        </Box>
    );
};

export default ServerSelection;
