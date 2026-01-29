import { pluginManager } from 'components/pluginManager';
import globalize from 'lib/globalize';
import { useMemo } from 'react';
import { type Plugin, PluginType } from 'types/plugin';

export function useScreensavers() {
    const screensavers = useMemo<Plugin[]>(() => {
        const installedScreensaverPlugins = pluginManager
            .ofType(PluginType.Screensaver)
            .map((plugin) => ({
                ...plugin,
                name: plugin.name || plugin.id || (globalize.translate(plugin.id) as string)
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
