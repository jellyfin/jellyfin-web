import type { ConfigurationPageInfo } from '@jellyfin/sdk/lib/generated-client/models/configuration-page-info';

export const findBestConfigurationPage = (
    configurationPages: ConfigurationPageInfo[],
    pluginId: string
) => {
    // Find candidates matching the plugin id
    const candidates = configurationPages.filter(
        (c) => c.PluginId === pluginId
    );

    // If none are found, return undefined
    if (candidates.length === 0) return;
    // If only one is found, return it
    if (candidates.length === 1) return candidates[0];

    // Prefer the first candidate with the EnableInMainMenu flag for consistency
    const menuCandidate = candidates.find((c) => !!c.EnableInMainMenu);
    if (menuCandidate) return menuCandidate;

    // Fallback to the first match
    return candidates[0];
};
