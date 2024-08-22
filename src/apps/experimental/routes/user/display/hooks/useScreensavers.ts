import { useMemo } from 'react';

import { pluginManager } from 'components/pluginManager';
import { Plugin, PluginType } from 'types/plugin';
import globalize from 'lib/globalize';

export function useScreensavers() {
    const screensavers = useMemo<Plugin[]>(() => {
        const installedScreensaverPlugins = pluginManager
            .ofType(PluginType.Screensaver)
            .map((plugin: Plugin) => ({
                ...plugin,
                name: globalize.translate(plugin.name) as string
            }));

        return [
            {
                id: 'none',
                name: globalize.translate('None') as string,
                type: PluginType.Screensaver
            },
            ...installedScreensaverPlugins
        ];
    }, []);

    return {
        screensavers: screensavers ?? []
    };
}
