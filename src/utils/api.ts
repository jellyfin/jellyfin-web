import type { Api } from '@jellyfin/sdk';

/**
 * Gets a full URI for a relative URL to the Jellyfin server for a given SDK Api instance.
 * TODO: Add to SDK
 * @param api - The Jellyfin SDK Api instance.
 * @param url - The relative URL.
 * @returns The complete URI with protocol, host, and base URL (if any).
 */
export const getUri = (url: string, api?: Api) => {
    if (!api) return;

    return api.axiosInstance.getUri({
        baseURL: api.basePath,
        url
    });
};
