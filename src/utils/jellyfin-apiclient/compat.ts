import { type Api, Jellyfin } from '@jellyfin/sdk';
import { type ApiClient } from 'jellyfin-apiclient';

/**
 * Returns an SDK Api instance using the same parameters as the provided ApiClient.
 * @param {ApiClient} apiClient The (legacy) ApiClient.
 * @returns {Api} An equivalent SDK Api instance.
 */
export const toApi = (apiClient: ApiClient): Api => {
    return new Jellyfin({
        clientInfo: {
            name: apiClient.appName(),
            version: apiClient.appVersion()
        },
        deviceInfo: {
            name: apiClient.deviceName(),
            id: apiClient.deviceId()
        }
    }).createApi(apiClient.serverAddress(), apiClient.accessToken());
};
