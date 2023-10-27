import type { Api } from '@jellyfin/sdk';
import { Jellyfin } from '@jellyfin/sdk/lib/jellyfin';
import { type ApiClient } from 'jellyfin-apiclient';

/**
 * Returns an SDK instance from the configuration of an ApiClient instance.
 * @param {ApiClient} apiClient The (legacy) ApiClient.
 * @returns {Jellyfin} An instance of the Jellyfin SDK.
 */
export const getSDK = (apiClient: ApiClient): Jellyfin => (
    new Jellyfin({
        clientInfo: {
            name: apiClient.appName(),
            version: apiClient.appVersion()
        },
        deviceInfo: {
            name: apiClient.deviceName(),
            id: apiClient.deviceId()
        }
    })
);

/**
 * Returns an SDK Api instance using the same parameters as the provided ApiClient.
 * @param {ApiClient} apiClient The (legacy) ApiClient.
 * @returns {Api} An equivalent SDK Api instance.
 */
export const toApi = (apiClient: ApiClient): Api => {
    return getSDK(apiClient)
        .createApi(
            apiClient.serverAddress(),
            apiClient.accessToken()
        );
};
