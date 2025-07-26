import { PluginStatus } from '@jellyfin/sdk/lib/generated-client/models/plugin-status';
import type { VersionInfo } from '@jellyfin/sdk/lib/generated-client/models/version-info';
import Alert from '@mui/material/Alert/Alert';
import Button from '@mui/material/Button/Button';
import Container from '@mui/material/Container/Container';
import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel';
import FormGroup from '@mui/material/FormGroup/FormGroup';
import Grid from '@mui/material/Grid2/Grid2';
import Skeleton from '@mui/material/Skeleton/Skeleton';
import Stack from '@mui/material/Stack/Stack';
import Switch from '@mui/material/Switch/Switch';
import Typography from '@mui/material/Typography/Typography';
import Delete from '@mui/icons-material/Delete';
import Download from '@mui/icons-material/Download';
import Extension from '@mui/icons-material/Extension';
import Settings from '@mui/icons-material/Settings';
import React, { type FC, useState, useCallback, useMemo } from 'react';
import { useSearchParams, Link as RouterLink, useParams } from 'react-router-dom';

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
    severity?: 'success' | 'info' | 'warning' | 'error'
    messageKey: string
}

// Plugins from this url will be trusted and not prompt for confirmation when installing
const TRUSTED_REPO_URL = 'https://repo.jellyfin.org/';

const PluginPage: FC = () => {
    const { api } = useApi();
    const { pluginId } = useParams();
    const [ searchParams ] = useSearchParams();
    const disablePlugin = useDisablePlugin();
    const enablePlugin = useEnablePlugin();
    const installPlugin = useInstallPackage();
    const uninstallPlugin = useUninstallPlugin();

    const [ isEnabledOverride, setIsEnabledOverride ] = useState<boolean>();
    const [ isInstallConfirmOpen, setIsInstallConfirmOpen ] = useState(false);
    const [ isInstalling, setIsInstalling ] = useState(false);
    const [ isUninstallConfirmOpen, setIsUninstallConfirmOpen ] = useState(false);
    const [ pendingInstallVersion, setPendingInstallVersion ] = useState<VersionInfo>();

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
    } = usePackageInfo(pluginName ? {
        name: pluginName,
        assemblyGuid: pluginId
    } : undefined);

    const {
        data: plugins,
        isError: isPluginsError,
        isPending: isPluginsLoading
    } = usePlugins();

    const isLoading =
        isConfigurationPagesLoading || isPackageInfoLoading || isPluginsLoading;

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
                isEnabled: (isEnabledOverride && pluginInfo?.Status === PluginStatus.Restart)
                    ?? pluginInfo?.Status !== PluginStatus.Disabled,
                name: pluginName || pluginInfo?.Name || packageInfo?.name,
                owner: packageInfo?.owner,
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

        if (isPackageInfoError) {
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
        uninstallPlugin.isError
    ]);

    /** Enable/disable the plugin */
    const toggleEnabled = useCallback(() => {
        if (!pluginDetails?.version?.version) return;

        console.debug('[PluginPage] %s plugin', pluginDetails.isEnabled ? 'disabling' : 'enabling', pluginDetails);

        if (pluginDetails.isEnabled) {
            disablePlugin.mutate({
                pluginId: pluginDetails.id,
                version: pluginDetails.version.version
            }, {
                onSuccess: () => {
                    setIsEnabledOverride(false);
                },
                onSettled: () => {
                    installPlugin.reset();
                    enablePlugin.reset();
                    uninstallPlugin.reset();
                }
            });
        } else {
            enablePlugin.mutate({
                pluginId: pluginDetails.id,
                version: pluginDetails.version.version
            }, {
                onSuccess: () => {
                    setIsEnabledOverride(true);
                },
                onSettled: () => {
                    installPlugin.reset();
                    disablePlugin.reset();
                    uninstallPlugin.reset();
                }
            });
        }
    }, [ disablePlugin, enablePlugin, installPlugin, pluginDetails, uninstallPlugin ]);

    /** Install the plugin or prompt for confirmation if untrusted */
    const onInstall = useCallback((version?: VersionInfo, isConfirmed = false) => () => {
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
        installPlugin.mutate({
            name: pluginDetails.name,
            assemblyGuid: pluginDetails.id,
            version: installVersion.version,
            repositoryUrl: installVersion.repositoryUrl
        }, {
            onSettled: () => {
                setIsInstalling(false);
                setPendingInstallVersion(undefined);
                disablePlugin.reset();
                enablePlugin.reset();
                uninstallPlugin.reset();
            }
        });
    }, [ disablePlugin, enablePlugin, installPlugin, pluginDetails, uninstallPlugin ]);

    /** Confirm and install the plugin */
    const onConfirmInstall = useCallback(() => {
        console.debug('[PluginPage] confirmed installing plugin', pendingInstallVersion);
        setIsInstallConfirmOpen(false);
        onInstall(pendingInstallVersion, true)();
    }, [ onInstall, pendingInstallVersion ]);

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

        uninstallPlugin.mutate({
            pluginId: pluginDetails.id,
            version: pluginDetails.version.version
        }, {
            onSettled: () => {
                disablePlugin.reset();
                enablePlugin.reset();
                installPlugin.reset();
            }
        });
    }, [ disablePlugin, enablePlugin, installPlugin, pluginDetails, uninstallPlugin ]);

    /** Close the uninstall confirmation dialog */
    const onCloseUninstallConfirmDialog = useCallback(() => {
        setIsUninstallConfirmOpen(false);
    }, []);

    return (
        <Page
            id='addPluginPage'
            title={pluginDetails?.name || pluginName}
            className='mainAnimatedPage type-interior'
        >
            <Container className='content-primary'>

                {alertMessages.map(({ severity = 'error', messageKey }) => (
                    <Alert key={messageKey} severity={severity}>
                        {globalize.translate(messageKey)}
                    </Alert>
                ))}

                <Grid container spacing={2} sx={{ marginTop: 0 }}>
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Stack spacing={2}>
                            <Typography variant='h1'>
                                {pluginDetails?.name || pluginName}
                            </Typography>

                            <Typography sx={{ maxWidth: '80ch' }}>
                                {isLoading && !pluginDetails?.description ? (
                                    <Skeleton />
                                ) : (
                                    pluginDetails?.description
                                )}
                            </Typography>
                        </Stack>
                    </Grid>

                    <Grid size={{ lg: 4 }} sx={{ display: { xs: 'none', lg: 'initial' } }}>
                        <Image
                            isLoading={isLoading}
                            alt={pluginDetails?.name}
                            url={pluginDetails?.imageUrl}
                            FallbackIcon={Extension}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 1, lg: 'initial' } }}>
                        {!!pluginDetails?.versions.length && (
                            <>
                                <Typography variant='h3' sx={{ marginBottom: 2 }}>
                                    {globalize.translate('HeaderRevisionHistory')}
                                </Typography>
                                <PluginRevisions
                                    pluginDetails={pluginDetails}
                                    onInstall={onInstall}
                                />
                            </>
                        )}
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Stack spacing={2} direction={{ xs: 'column', sm: 'row-reverse', lg: 'column' }}>
                            <Stack spacing={1} sx={{ flexBasis: '50%' }}>
                                {!isLoading && !pluginDetails?.status && (
                                    <>
                                        <Alert severity='info'>
                                            {globalize.translate('ServerRestartNeededAfterPluginInstall')}
                                        </Alert>

                                        <Button
                                            startIcon={<Download />}
                                            onClick={onInstall()}
                                            loading={isInstalling}
                                        >
                                            {globalize.translate('HeaderInstall')}
                                        </Button>
                                    </>
                                )}

                                {!isLoading && pluginDetails?.canUninstall && (
                                    <FormGroup>
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
                                    </FormGroup>
                                )}

                                {!isLoading && pluginDetails?.configurationPage?.Name && (
                                    <Button
                                        component={RouterLink}
                                        to={`/${getPluginUrl(pluginDetails.configurationPage.Name)}`}
                                        startIcon={<Settings />}
                                    >
                                        {globalize.translate('Settings')}
                                    </Button>
                                )}

                                {!isLoading && pluginDetails?.canUninstall && (
                                    <Button
                                        color='error'
                                        startIcon={<Delete />}
                                        onClick={onConfirmUninstall}
                                    >
                                        {globalize.translate('ButtonUninstall')}
                                    </Button>
                                )}
                            </Stack>

                            <PluginDetailsTable
                                isPluginLoading={isPluginsLoading}
                                isRepositoryLoading={isPackageInfoLoading}
                                pluginDetails={pluginDetails}
                                sx={{ flexBasis: '50%' }}
                            />
                        </Stack>
                    </Grid>
                </Grid>
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
                confirmButtonColor='error'
                confirmButtonText={globalize.translate('ButtonUninstall')}
            />
        </Page>
    );
};

export default PluginPage;
