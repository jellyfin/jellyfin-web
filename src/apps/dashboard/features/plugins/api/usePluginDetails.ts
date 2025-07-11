import { PluginStatus } from '@jellyfin/sdk/lib/generated-client/models/plugin-status';
import { useMemo } from 'react';

import { useApi } from 'hooks/useApi';

import { PluginCategory } from '../constants/pluginCategory';
import type { PluginDetails } from '../types/PluginDetails';

import { findBestConfigurationPage } from './configurationPage';
import { findBestPluginInfo } from './pluginInfo';
import { useConfigurationPages } from './useConfigurationPages';
import { usePackages } from './usePackages';
import { usePlugins } from './usePlugins';

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

                    let category = packageInfo?.category;
                    if (!packageInfo) {
                        switch (id) {
                            case 'a629c0dafac54c7e931a7174223f14c8': // AudioDB
                            case '8c95c4d2e50c4fb0a4f36c06ff0f9a1a': // MusicBrainz
                                category = PluginCategory.Music;
                                break;
                            case 'a628c0dafac54c7e9d1a7134223f14c8': // OMDb
                            case 'b8715ed16c4745289ad3f72deb539cd4': // TMDb
                                category = PluginCategory.MoviesAndShows;
                                break;
                            case '872a78491171458da6fb3de3d442ad30': // Studio Images
                                category = PluginCategory.General;
                        }
                    }

                    return {
                        canUninstall: !!pluginInfo?.CanUninstall,
                        category,
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
