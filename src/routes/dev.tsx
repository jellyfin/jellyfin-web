import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createRoute } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Box, Button, Flex, Text, Input, Alert, Card, CardBody, CardHeader, Heading } from 'ui-primitives';
import { Checkbox } from 'ui-primitives/Checkbox';
import { vars } from 'styles/tokens.css';
import Page from 'components/Page';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { useServerStore } from 'store/serverStore';
import { useDevConfigStore } from 'store/devConfigStore';
import { queryClient } from 'utils/query/queryClient';
import { normalizeServerBaseUrl, resolveApiBaseUrl, saveDevConfig } from 'utils/devConfig';
import { resetServiceWorkerAndCaches } from 'utils/devServiceWorker';
import { Route } from './__root';

declare const __DEV_SERVER_PROXY_TARGET__: string;

const devConfigSchema = z.object({
    serverBaseUrl: z
        .string()
        .trim()
        .optional()
        .refine(value => {
            if (!value) return true;
            try {
                normalizeServerBaseUrl(value);
                return true;
            } catch {
                return false;
            }
        }, 'Enter a valid server URL (e.g. https://host:8096 or host:8096)'),
    useProxy: z.boolean()
});

type DevFormValues = z.infer<typeof devConfigSchema>;

const classifyConnectionError = (error: unknown, useProxy: boolean): string => {
    if (error instanceof Error) {
        if (error.name === 'TypeError') {
            return useProxy
                ? 'Network error while using proxy. Check dev server proxy target.'
                : 'Network error. This often indicates CORS or TLS issues when not using the proxy.';
        }
        return error.message || 'Unknown error';
    }
    return 'Unknown error';
};

const DevSettingsPage = () => {
    const devConfig = useDevConfigStore();
    const { clearServers } = useServerStore.getState();

    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const saveMutation = useMutation({
        mutationFn: async (values: DevFormValues) => {
            const parsed = devConfigSchema.safeParse(values);
            if (!parsed.success) {
                throw new Error(parsed.error.errors[0]?.message || 'Invalid configuration');
            }

            const updated = await saveDevConfig({
                serverBaseUrl: values.serverBaseUrl?.trim() || '',
                useProxy: values.useProxy
            });

            devConfig.hydrate(updated);
            return updated;
        },
        onMutate: () => {
            setSaveMessage(null);
        },
        onSuccess: () => {
            setSaveMessage('Settings saved. Reload to apply changes.');
        },
        onError: error => {
            setSaveMessage(error instanceof Error ? error.message : 'Failed to save settings');
        }
    });

    const form = useForm<DevFormValues>({
        defaultValues: {
            serverBaseUrl: devConfig.serverBaseUrl,
            useProxy: devConfig.useProxy
        },
        onSubmit: async ({ value }) => {
            saveMutation.mutate(value);
        }
    });

    const testConnectionMutation = useMutation({
        mutationFn: async () => {
            const parsed = devConfigSchema.safeParse(form.state.values);
            if (!parsed.success) {
                throw new Error('Invalid configuration');
            }

            const serverBaseUrl = parsed.data.serverBaseUrl?.trim() || '';
            const config = {
                serverBaseUrl,
                useProxy: parsed.data.useProxy,
                proxyBasePath: devConfig.proxyBasePath
            };

            const baseUrl = resolveApiBaseUrl(config, true);
            if (!baseUrl) {
                throw new Error('Server URL is required');
            }

            const response = await fetch(`${baseUrl}/System/Info/Public`, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            return response.json();
        }
    });

    const resetSwMutation = useMutation({
        mutationFn: async () => {
            const result = await resetServiceWorkerAndCaches();
            return result;
        },
        onSuccess: () => {
            window.location.reload();
        }
    });

    const resetAppMutation = useMutation({
        mutationFn: async () => {
            await ServerConnections.logout();
            ServerConnections.clearData();
            clearServers();
            queryClient.clear();
        }
    });

    const effectiveBaseUrl = resolveApiBaseUrl(
        {
            serverBaseUrl: form.state.values.serverBaseUrl || '',
            useProxy: form.state.values.useProxy,
            proxyBasePath: devConfig.proxyBasePath
        },
        true
    );

    return (
        <Page id="devSettingsPage" title="Dev Settings" isBackButtonEnabled isMenuButtonEnabled={false}>
            <Box style={{ padding: vars.spacing.lg, maxWidth: '48rem', margin: '0 auto' }}>
                <Card>
                    <CardHeader>
                        <Heading.H2>Dev Settings</Heading.H2>
                        <Text size="sm" color="secondary">
                            Configure Jellyfin server access for local development.
                        </Text>
                    </CardHeader>
                    <CardBody>
                        <form
                            onSubmit={event => {
                                event.preventDefault();
                                void form.handleSubmit();
                            }}
                        >
                            <Flex direction="column" gap={vars.spacing.md}>
                                <Input
                                    label="Jellyfin Server URL"
                                    placeholder="https://server:8096 or server:8096"
                                    value={form.state.values.serverBaseUrl}
                                    onChange={event => form.setFieldValue('serverBaseUrl', event.target.value)}
                                    helperText="Real server address (stored locally for dev)."
                                />

                                <Flex align="center" gap={vars.spacing.sm}>
                                    <Checkbox
                                        checked={form.state.values.useProxy}
                                        onChangeChecked={checked => form.setFieldValue('useProxy', checked)}
                                    >
                                        Use dev proxy (same-origin)
                                    </Checkbox>
                                </Flex>

                                {form.state.values.useProxy && !__DEV_SERVER_PROXY_TARGET__ && (
                                    <Alert variant="warning">
                                        Set `VITE_DEV_JELLYFIN_TARGET` in `.env.local` and restart the dev server.
                                    </Alert>
                                )}

                                <Box>
                                    <Text size="sm" color="secondary">
                                        Proxy base path: {devConfig.proxyBasePath}
                                    </Text>
                                    <Text size="sm" color="secondary">
                                        Proxy target: {__DEV_SERVER_PROXY_TARGET__ || 'Not set'}
                                    </Text>
                                    <Text size="sm" color="secondary">
                                        Effective API base: {effectiveBaseUrl || 'Not configured'}
                                    </Text>
                                </Box>

                                <Flex gap={vars.spacing.sm} style={{ flexWrap: 'wrap' }}>
                                    <Button type="submit" variant="primary">
                                        Save Settings
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
                                        Reload
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => testConnectionMutation.mutate()}
                                        disabled={testConnectionMutation.isPending}
                                    >
                                        {testConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
                                    </Button>
                                </Flex>
                            </Flex>
                        </form>

                        {saveMessage && (
                            <Alert variant="info" style={{ marginTop: vars.spacing.md }}>
                                {saveMessage}
                            </Alert>
                        )}

                        {testConnectionMutation.isError && (
                            <Alert variant="error" style={{ marginTop: vars.spacing.md }}>
                                {classifyConnectionError(testConnectionMutation.error, form.state.values.useProxy)}
                            </Alert>
                        )}

                        {testConnectionMutation.isSuccess && (
                            <Alert variant="success" style={{ marginTop: vars.spacing.md }}>
                                Connection successful.
                            </Alert>
                        )}
                    </CardBody>
                </Card>

                <Card style={{ marginTop: vars.spacing.lg }}>
                    <CardHeader>
                        <Heading.H3>Maintenance</Heading.H3>
                    </CardHeader>
                    <CardBody>
                        <Flex direction="column" gap={vars.spacing.md}>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => resetSwMutation.mutate()}
                                disabled={resetSwMutation.isPending}
                            >
                                {resetSwMutation.isPending ? 'Resetting...' : 'Reset Service Worker & Caches'}
                            </Button>
                            <Text size="sm" color="secondary">
                                Clears stale service workers and cache entries to avoid stale assets in dev.
                            </Text>

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => resetAppMutation.mutate()}
                                disabled={resetAppMutation.isPending}
                            >
                                {resetAppMutation.isPending ? 'Resetting...' : 'Clear Auth / Reset App State'}
                            </Button>
                        </Flex>
                    </CardBody>
                </Card>
            </Box>
        </Page>
    );
};

export const devRoute = createRoute({
    getParentRoute: () => Route,
    path: 'dev',
    component: DevSettingsPage
});

export default DevSettingsPage;
