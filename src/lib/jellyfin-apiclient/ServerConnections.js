import { Credentials } from 'jellyfin-apiclient';

import { appHost } from 'components/apphost';
import appSettings from 'scripts/settings/appSettings';
import { setUserInfo } from 'scripts/settings/userSettings';
import { detectBitrate } from 'utils/bitrateTest';
import Dashboard from 'utils/dashboard';
import Events from 'utils/events';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import { createApiClient } from 'utils/jellyfin-apiclient/createApiClient';

import ConnectionManager from './connectionManager';

const normalizeImageOptions = options => {
    if (!options.quality && (options.maxWidth || options.width || options.maxHeight || options.height || options.fillWidth || options.fillHeight)) {
        options.quality = 90;
    }
};

const getMaxBandwidth = () => {
    if (navigator.connection) {
        let max = navigator.connection.downlinkMax;
        if (max && max > 0 && max < Number.POSITIVE_INFINITY) {
            max /= 8;
            max *= 1000000;
            max *= 0.7;
            return parseInt(max, 10);
        }
    }

    return null;
};

class ServerConnections extends ConnectionManager {
    firstConnection = false;

    constructor() {
        super(...arguments);
        this.localApiClient = null;
        this.api = null;
        this.firstConnection = null;

        Events.on(this, 'localusersignedout', (_e, logoutInfo) => {
            setUserInfo(null, null);
            // Ensure the updated credentials are persisted to storage
            credentialProvider.credentials(credentialProvider.credentials());

            if (window.NativeShell && typeof window.NativeShell.onLocalUserSignedOut === 'function') {
                window.NativeShell.onLocalUserSignedOut(logoutInfo);
            }
        });

        Events.on(this, 'apiclientcreated', (_e, apiClient) => {
            apiClient.getMaxBandwidth = getMaxBandwidth;
            apiClient.normalizeImageOptions = normalizeImageOptions;

            const sdkApi = toApi(apiClient);
            apiClient._sdkApi = sdkApi;

            if (!this.api || this.localApiClient === apiClient) {
                this.api = sdkApi;
            }

            apiClient.subscribe = (messageTypes, onMessage, subscriptionIntervals) => {
                return this.api?.subscribe(messageTypes, onMessage, subscriptionIntervals);
            };
        });
    }

    initApiClient(server) {
        console.debug('creating ApiClient singleton');

        const apiClient = createApiClient(
            server,
            appHost.appName(),
            appHost.appVersion(),
            appHost.deviceName(),
            appHost.deviceId()
        );

        apiClient.enableAutomaticNetworking = false;
        apiClient.manualAddressOnly = true;

        this.addApiClient(apiClient);

        this.setLocalApiClient(apiClient);

        console.debug('loaded ApiClient singleton');
    }

    /**
     * @returns {Promise<import('jellyfin-apiclient').ConnectResponse>} The result of the connection attempt.
     */
    connect(options) {
        return super.connect({
            enableAutoLogin: appSettings.enableAutoLogin(),
            ...options
        });
    }

    setLocalApiClient(apiClient) {
        if (apiClient) {
            this.localApiClient = apiClient;
            window.ApiClient = apiClient;

            if (apiClient._sdkApi) {
                this.api = apiClient._sdkApi;
            }
        }
    }

    getLocalApiClient() {
        return this.localApiClient;
    }

    /**
     * Gets the ApiClient that is currently connected.
     * @returns {import('jellyfin-apiclient').ApiClient|undefined} apiClient
     */
    currentApiClient() {
        let apiClient = this.getLocalApiClient();

        if (!apiClient) {
            const server = this.getLastUsedServer();

            if (server) {
                apiClient = this.getApiClient(server.Id);
            }
        }

        return apiClient;
    }

    /**
     * Gets the Api that is currently connected.
     * @returns {import('@jellyfin/sdk').Api|undefined} The current Api instance.
     */
    getCurrentApi() {
        let api = this.api;

        if (!api) {
            const server = this.getLastUsedServer();

            if (server) {
                api = this.getApiClient(server.Id);
            }
        }

        return api;
    }

    /**
     * Gets the ApiClient that is currently connected or throws if not defined.
     * @async
     * @returns {Promise<ApiClient>} The current ApiClient instance.
     */
    async getCurrentApiClientAsync() {
        const apiClient = this.currentApiClient();
        if (!apiClient) throw new Error('[ServerConnection] No current ApiClient instance');

        return apiClient;
    }

    onLocalUserSignedIn(user) {
        const apiClient = this.getApiClient(user.ServerId);
        this.setLocalApiClient(apiClient);
        setTimeout(() => detectBitrate(this.getCurrentApi(), true), 6000);
        return setUserInfo(user.Id, apiClient).then(() => {
            if (window.NativeShell && typeof window.NativeShell.onLocalUserSignedIn === 'function') {
                return window.NativeShell.onLocalUserSignedIn(user, apiClient.accessToken());
            }
            return Promise.resolve();
        });
    }
}

const credentialProvider = new Credentials();

const capabilities = Dashboard.capabilities(appHost);

export default new ServerConnections(
    credentialProvider,
    () => appHost.appName(),
    () => appHost.appVersion(),
    () => appHost.deviceName(),
    () => appHost.deviceId(),
    capabilities);
