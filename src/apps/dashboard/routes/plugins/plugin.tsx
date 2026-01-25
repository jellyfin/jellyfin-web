import { PluginStatus } from '@jellyfin/sdk/lib/generated-client/models/plugin-status';
import type { VersionInfo } from '@jellyfin/sdk/lib/generated-client/models/version-info';
import { Component2Icon, DownloadIcon, GearIcon, TrashIcon } from '@radix-ui/react-icons';
import React, { type FC, useState, useCallback, useMemo } from 'react';
import { Link as RouterLink, useParams } from '@tanstack/react-router';
import { useSearchParams } from 'hooks/useSearchParams';
import { Alert } from 'ui-primitives/Alert';
import { Box, Flex } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';
import { Container } from 'ui-primitives/Container';
import { FormControlLabel, Switch } from 'ui-primitives/FormControl';
import { Heading, Text } from 'ui-primitives/Text';
import { Skeleton } from 'ui-primitives/Skeleton';
import { vars } from 'styles/tokens.css';

import { findBestConfigurationPage } from 'apps/dashboard/features/plugins/api/configurationPage';
import { findBestPluginInfo } from 'apps/dashboard/features/plugins/api/pluginInfo';
import { useConfigurationPages } from 'apps/dashboard/features/plugins/api/useConfigurationPages';
import { useDisablePlugin } from 'apps/dashboard/features/plugins/api/useDisablePlugin';
import { useEnablePlugin } from 'apps/dashboard/features/plugins/api/useEnablePlugin';
import { useInstallPackage } from 'apps/dashboard/features/plugins/api/useInstallPackage';
import { usePackageInfo } from 'apps/dashboard/features/plugins/api/usePackageInfo';
import { usePlugins } from 'apps/dashboard/features/plugins/api/usePlugins';
import { useUninstallPlugin } from 'apps/dashboard/features/plugins/api/useUninstallPlugin';
import PluginDetailsTable from 'apps/dashboard/features/plugins/components/PluginDetailsTable';
import PluginRevisions from 'apps/dashboard/features/plugins/components/PluginRevisions';
import type { PluginDetails } from 'apps/dashboard/features/plugins/types/PluginDetails';

import ConfirmDialog from 'components/ConfirmDialog';
import Image from 'components/Image';
import Page from 'components/Page';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { getPluginUrl } from 'utils/dashboard';

interface AlertMessage {
    severity?: 'success' | 'info' | 'warning' | 'error';
    messageKey: string;
}

// Plugins from this url will be trusted and not prompt for confirmation when installing
const TRUSTED_REPO_URL = 'https://repo.jellyfin.org/';

const PluginPage: FC = () => {
    const { api } = useApi();
    const { pluginId } = useParams({ strict: false }) as { pluginId?: string };
    const [searchParams] = useSearchParams();
    const disablePlugin = useDisablePlugin();
    const enablePlugin = useEnablePlugin();
    const installPlugin = useInstallPackage();
    const uninstallPlugin = useUninstallPlugin();

    const [isEnabledOverride, setIsEnabledOverride] = useState<boolean>();
    const [isInstallConfirmOpen, setIsInstallConfirmOpen] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [isUninstallConfirmOpen, setIsUninstallConfirmOpen] = useState(false);
    const [pendingInstallVersion, setPendingInstallVersion] = useState<VersionInfo>();

    const pluginName = searchParams.get('name') ?? undefined;

    const {
        data: configurationPages,
        isError: isConfigurationPagesError,
        isPending: isConfigurationPagesLoading
    } = useConfigurationPages();

    const {
        data: packageInfo,
        isError: isPackageInfoError,
        isPending: isPackageInfoLoading
    } = usePackageInfo(
        pluginName
            ? {
                  name: pluginName,
                  assemblyGuid: pluginId
              }
            : undefined
    );

    const { data: plugins, isError: isPluginsError, isPending: isPluginsLoading } = usePlugins();

    const isLoading = isConfigurationPagesLoading || isPackageInfoLoading || isPluginsLoading;

    const pluginDetails = useMemo<PluginDetails | undefined>(() => {
        if (pluginId && !isPluginsLoading) {
            const pluginInfo = findBestPluginInfo(pluginId, plugins);

            let version;
            if (pluginInfo) {
                // Find the installed version
                const repoVersion = packageInfo?.versions?.find(v => v.version === pluginInfo.Version);
                version = repoVersion || {
                    version: pluginInfo.Version,
                    VersionNumber: pluginInfo.Version
                };
            } else {
                // Use the latest version
                version = packageInfo?.versions?.[0];
            }

            let imageUrl;
            if (pluginInfo?.HasImage) {
                imageUrl = api?.getUri(`/Plugins/${pluginInfo.Id}/${pluginInfo.Version}/Image`);
            }

            return {
                canUninstall: !!pluginInfo?.CanUninstall,
                description: pluginInfo?.Description || packageInfo?.description || packageInfo?.overview,
                id: pluginId,
                imageUrl: imageUrl || packageInfo?.imageUrl || undefined,
                isEnabled:
                    (isEnabledOverride && pluginInfo?.Status === PluginStatus.Restart) ??
                    pluginInfo?.Status !== PluginStatus.Disabled,
                name: pluginName || pluginInfo?.Name || packageInfo?.name,
                owner: pluginInfo?.CanUninstall === false ? 'jellyfin' : packageInfo?.owner,
                status: pluginInfo?.Status,
                configurationPage: findBestConfigurationPage(configurationPages || [], pluginId),
                version,
                versions: packageInfo?.versions || []
            };
        }
    }, [
        api,
        configurationPages,
        isEnabledOverride,
        isPluginsLoading,
        packageInfo?.description,
        packageInfo?.imageUrl,
        packageInfo?.name,
        packageInfo?.overview,
        packageInfo?.owner,
        packageInfo?.versions,
        pluginId,
        pluginName,
        plugins
    ]);

    const alertMessages = useMemo(() => {
        const alerts: AlertMessage[] = [];

        if (disablePlugin.isError) {
            alerts.push({ messageKey: 'PluginDisableError' });
        }

        if (enablePlugin.isError) {
            alerts.push({ messageKey: 'PluginEnableError' });
        }

        if (installPlugin.isSuccess) {
            alerts.push({
                severity: 'success',
                messageKey: 'MessagePluginInstalled'
            });
        }

        if (installPlugin.isError) {
            alerts.push({ messageKey: 'MessagePluginInstallError' });
        }

        if (uninstallPlugin.isError) {
            alerts.push({ messageKey: 'PluginUninstallError' });
        }

        if (isConfigurationPagesError) {
            alerts.push({ messageKey: 'PluginLoadConfigError' });
        }

        // Don't show package load error for built-in plugins
        if (!isPluginsLoading && pluginDetails?.canUninstall && isPackageInfoError) {
            alerts.push({
                severity: 'warning',
                messageKey: 'PluginLoadRepoError'
            });
        }

        if (isPluginsError) {
            alerts.push({ messageKey: 'MessageGetInstalledPluginsError' });
        }

        return alerts;
    }, [
        disablePlugin.isError,
        enablePlugin.isError,
        installPlugin.isError,
        installPlugin.isSuccess,
        isConfigurationPagesError,
        isPackageInfoError,
        isPluginsError,
        isPluginsLoading,
        pluginDetails?.canUninstall,
        uninstallPlugin.isError
    ]);

    /** Enable/disable the plugin */
    const toggleEnabled = useCallback(() => {
        if (!pluginDetails?.version?.version) return;

        console.debug('[PluginPage] %s plugin', pluginDetails.isEnabled ? 'disabling' : 'enabling', pluginDetails);

        if (pluginDetails.isEnabled) {
            disablePlugin.mutate(
                {
                    pluginId: pluginDetails.id,
                    version: pluginDetails.version.version
                },
                {
                    onSuccess: () => {
                        setIsEnabledOverride(false);
                    },
                    onSettled: () => {
                        installPlugin.reset();
                        enablePlugin.reset();
                        uninstallPlugin.reset();
                    }
                }
            );
        } else {
            enablePlugin.mutate(
                {
                    pluginId: pluginDetails.id,
                    version: pluginDetails.version.version
                },
                {
                    onSuccess: () => {
                        setIsEnabledOverride(true);
                    },
                    onSettled: () => {
                        installPlugin.reset();
                        disablePlugin.reset();
                        uninstallPlugin.reset();
                    }
                }
            );
        }
    }, [disablePlugin, enablePlugin, installPlugin, pluginDetails, uninstallPlugin]);

    /** Install the plugin or prompt for confirmation if untrusted */
    const onInstall = useCallback(
        (version?: VersionInfo, isConfirmed = false) =>
            () => {
                if (!pluginDetails?.name) return;
                const installVersion = version || pluginDetails.version;
                if (!installVersion) return;

                if (!isConfirmed && !installVersion.repositoryUrl?.startsWith(TRUSTED_REPO_URL)) {
                    console.debug('[PluginPage] plugin install needs confirmed', installVersion);
                    setPendingInstallVersion(installVersion);
                    setIsInstallConfirmOpen(true);
                    return;
                }

                console.debug('[PluginPage] installing plugin', installVersion);

                setIsInstalling(true);
                installPlugin.mutate(
                    {
                        name: pluginDetails.name,
                        assemblyGuid: pluginDetails.id,
                        version: installVersion.version,
                        repositoryUrl: installVersion.repositoryUrl
                    },
                    {
                        onSettled: () => {
                            setIsInstalling(false);
                            setPendingInstallVersion(undefined);
                            disablePlugin.reset();
                            enablePlugin.reset();
                            uninstallPlugin.reset();
                        }
                    }
                );
            },
        [disablePlugin, enablePlugin, installPlugin, pluginDetails, uninstallPlugin]
    );

    /** Confirm and install the plugin */
    const onConfirmInstall = useCallback(() => {
        console.debug('[PluginPage] confirmed installing plugin', pendingInstallVersion);
        setIsInstallConfirmOpen(false);
        onInstall(pendingInstallVersion, true)();
    }, [onInstall, pendingInstallVersion]);

    /** Close the install confirmation dialog */
    const onCloseInstallConfirmDialog = useCallback(() => {
        setPendingInstallVersion(undefined);
        setIsInstallConfirmOpen(false);
    }, []);

    /** Show the uninstall confirmation dialog */
    const onConfirmUninstall = useCallback(() => {
        setIsUninstallConfirmOpen(true);
    }, []);

    /** Uninstall the plugin */
    const onUninstall = useCallback(() => {
        if (!pluginDetails?.version?.version) return;

        console.debug('[PluginPage] uninstalling plugin', pluginDetails);

        setIsUninstallConfirmOpen(false);

        uninstallPlugin.mutate(
            {
                pluginId: pluginDetails.id,
                version: pluginDetails.version.version
            },
            {
                onSettled: () => {
                    disablePlugin.reset();
                    enablePlugin.reset();
                    installPlugin.reset();
                }
            }
        );
    }, [disablePlugin, enablePlugin, installPlugin, pluginDetails, uninstallPlugin]);

    /** Close the uninstall confirmation dialog */
    const onCloseUninstallConfirmDialog = useCallback(() => {
        setIsUninstallConfirmOpen(false);
    }, []);

    return (
        <Page id="addPluginPage" title={pluginDetails?.name || pluginName} className="mainAnimatedPage type-interior">
            <Container className="content-primary">
                {alertMessages.map(({ severity = 'error', messageKey }) => (
                    <Alert key={messageKey} severity={severity} style={{ marginBottom: vars.spacing.md }}>
                        {globalize.translate(messageKey)}
                    </Alert>
                ))}

                <Flex direction="column" gap={vars.spacing.lg}>
                    <Flex direction="row" wrap="wrap" gap={vars.spacing.lg} align="flex-start">
                        <Box style={{ flex: '1 1 480px', minWidth: 0 }}>
                            <Heading.H1>{pluginDetails?.name || pluginName}</Heading.H1>

                            <Box style={{ marginTop: vars.spacing.md, maxWidth: '80ch' }}>
                                {isLoading && !pluginDetails?.description ? (
                                    <Skeleton width="100%" height={20} />
                                ) : (
                                    <Text>{pluginDetails?.description}</Text>
                                )}
                            </Box>
                        </Box>

                        <Box style={{ flex: '0 0 280px' }}>
                            <Image
                                isLoading={isLoading}
                                alt={pluginDetails?.name}
                                url={pluginDetails?.imageUrl}
                                FallbackIcon={Component2Icon}
                            />
                        </Box>
                    </Flex>

                    {!!pluginDetails?.versions.length && (
                        <Box>
                            <Heading.H3 style={{ marginBottom: vars.spacing.md }}>
                                {globalize.translate('HeaderRevisionHistory')}
                            </Heading.H3>
                            <PluginRevisions pluginDetails={pluginDetails} onInstall={onInstall} />
                        </Box>
                    )}

                    <Flex direction="row" wrap="wrap" gap={vars.spacing.lg}>
                        <Box style={{ flex: '1 1 280px' }}>
                            <Flex direction="column" gap={vars.spacing.sm}>
                                {!isLoading && !pluginDetails?.status && (
                                    <>
                                        <Alert severity="info">
                                            {globalize.translate('ServerRestartNeededAfterPluginInstall')}
                                        </Alert>

                                        <Button
                                            startDecorator={<DownloadIcon />}
                                            onClick={onInstall()}
                                            loading={isInstalling}
                                        >
                                            {globalize.translate('HeaderInstall')}
                                        </Button>
                                    </>
                                )}

                                {!isLoading && pluginDetails?.canUninstall && (
                                    <Box>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={pluginDetails.isEnabled}
                                                    onChange={toggleEnabled}
                                                    disabled={pluginDetails.status === PluginStatus.Restart}
                                                />
                                            }
                                            label={globalize.translate('LabelEnablePlugin')}
                                        />
                                    </Box>
                                )}

                                {!isLoading && pluginDetails?.configurationPage?.Name && (
                                    <Button
                                        component={RouterLink}
                                        to={`/${getPluginUrl(pluginDetails.configurationPage.Name)}`}
                                        startDecorator={<GearIcon />}
                                    >
                                        {globalize.translate('Settings')}
                                    </Button>
                                )}

                                {!isLoading && pluginDetails?.canUninstall && (
                                    <Button
                                        variant="danger"
                                        startDecorator={<TrashIcon />}
                                        onClick={onConfirmUninstall}
                                    >
                                        {globalize.translate('ButtonUninstall')}
                                    </Button>
                                )}
                            </Flex>
                        </Box>

                        <Box style={{ flex: '1 1 280px' }}>
                            <PluginDetailsTable
                                isPluginLoading={isPluginsLoading}
                                isRepositoryLoading={isPackageInfoLoading}
                                pluginDetails={pluginDetails}
                            />
                        </Box>
                    </Flex>
                </Flex>
            </Container>

            <ConfirmDialog
                open={isInstallConfirmOpen}
                title={globalize.translate('HeaderConfirmPluginInstallation')}
                text={globalize.translate('MessagePluginInstallDisclaimer')}
                onCancel={onCloseInstallConfirmDialog}
                onConfirm={onConfirmInstall}
                confirmButtonText={globalize.translate('HeaderInstall')}
            />

            <ConfirmDialog
                open={isUninstallConfirmOpen}
                title={globalize.translate('HeaderUninstallPlugin')}
                text={globalize.translate('UninstallPluginConfirmation', pluginName || '')}
                onCancel={onCloseUninstallConfirmDialog}
                onConfirm={onUninstall}
                confirmButtonColor="error"
                confirmButtonText={globalize.translate('ButtonUninstall')}
            />
        </Page>
    );
};

export default PluginPage;
