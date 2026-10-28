import { type Api, Jellyfin, type JellyfinParameters } from '@jellyfin/sdk';
import type { ApiClient } from 'jellyfin-apiclient';

import { getLanguages } from 'lib/globalize';
import { safeDecodeURIComponent } from 'utils/url';

const getParameters = (apiClient: ApiClient): JellyfinParameters => ({
    // The SDK encodes these values when creating the authorization header,
    // so we need to decode them here to avoid double encoding.
    clientInfo: {
        name: safeDecodeURIComponent(apiClient.appName()),
        version: safeDecodeURIComponent(apiClient.appVersion())
    },
    deviceInfo: {
        name: safeDecodeURIComponent(apiClient.deviceName()),
        id: safeDecodeURIComponent(apiClient.deviceId()),
        languages: getLanguages()
    }
});

/**
 * Returns an SDK Api instance using the same parameters as the provided ApiClient.
 * @param {ApiClient} apiClient The (legacy) ApiClient.
 * @returns {Api} An equivalent SDK Api instance.
 */
export const toApi = (apiClient: ApiClient): Api => {
    return (new Jellyfin(getParameters(apiClient)))
        .createApi(
            apiClient.serverAddress(),
            apiClient.accessToken()
        );
};

/**
 * Updates the SDK Api instance of the provided ApiClient with the same parameters as the ApiClient.
 * @param {ApiClient} apiClient The (legacy) ApiClient.
 */
export const updateApiClientSdk = (apiClient: ApiClient) => {
    const { clientInfo, deviceInfo } = getParameters(apiClient);
    apiClient._sdk?.update({
        basePath: apiClient.serverAddress(),
        accessToken: apiClient.accessToken(),
        clientInfo,
        deviceInfo
    });
};
