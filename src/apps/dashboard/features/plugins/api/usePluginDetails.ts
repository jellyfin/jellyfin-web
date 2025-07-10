import { PluginStatus } from '@jellyfin/sdk/lib/generated-client/models/plugin-status';
import { useMemo } from 'react';

import { useApi } from 'hooks/useApi';

import { useConfigurationPages } from './useConfigurationPages';
import { usePlugins } from './usePlugins';
import type { PluginDetails } from '../types/PluginDetails';
import { findBestConfigurationPage } from './configurationPage';
import { findBestPluginInfo } from './pluginInfo';
import { usePackages } from './usePackages';

export const usePluginDetails = () => {
    const { api } = useApi();

    const {
        data: configurationPages,
        isError: isConfigurationPagesError,
        isPending: isConfigurationPagesPending
    } = useConfigurationPages();

    const {
        data: packages,
        isError: isPackagesError,
        isPending: isPackagesPending
    } = usePackages();

    const {
        data: plugins,
        isError: isPluginsError,
        isPending: isPluginsPending
    } = usePlugins();

    const pluginDetails = useMemo<PluginDetails[]>(() => {
        if (!isPackagesPending && !isPluginsPending) {
            const pluginIds = new Set<string>();
            packages?.forEach(({ guid }) => {
                if (guid) pluginIds.add(guid);
            });
            plugins?.forEach(({ Id }) => {
                if (Id) pluginIds.add(Id);
            });

            return Array.from(pluginIds)
                .map(id => {
                    const packageInfo = packages?.find(pkg => pkg.guid === id);
                    const pluginInfo = findBestPluginInfo(id, plugins);

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
                        category: packageInfo?.category,
                        description: pluginInfo?.Description || packageInfo?.description || packageInfo?.overview,
                        id,
                        imageUrl: imageUrl || packageInfo?.imageUrl || undefined,
                        isEnabled: pluginInfo?.Status !== PluginStatus.Disabled,
                        name: pluginInfo?.Name || packageInfo?.name,
                        owner: packageInfo?.owner,
                        status: pluginInfo?.Status,
                        configurationPage: findBestConfigurationPage(configurationPages || [], id),
                        version,
                        versions: packageInfo?.versions || []
                    };
                })
                .sort(({ name: nameA }, { name: nameB }) => (
                    (nameA || '').localeCompare(nameB || '')
                ));
        }

        return [];
    }, [
        api,
        configurationPages,
        isPluginsPending,
        packages,
        plugins
    ]);

    return {
        data: pluginDetails,
        isError: isConfigurationPagesError || isPackagesError || isPluginsError,
        isPending: isConfigurationPagesPending || isPackagesPending || isPluginsPending
    };
};
