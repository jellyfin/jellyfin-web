/**
 * Gets the route path of a plugin configuration page.
 * @param name The name of the configuration page.
 * @returns The configuration page route path.
 */
export const getPluginUrl = (name: string) => {
    return 'configurationpage?name=' + encodeURIComponent(name);
};
