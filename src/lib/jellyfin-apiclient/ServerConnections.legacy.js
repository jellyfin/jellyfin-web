// NOTE: This is used for jsdoc return type
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Api } from '@jellyfin/sdk';
import { appHost, safeAppHost } from 'components/apphost';
import { ApiClient, Credentials } from 'jellyfin-apiclient';
import appSettings from 'scripts/settings/appSettings';
import { setUserInfo } from 'scripts/settings/userSettings';
import Dashboard from 'utils/dashboard';
import Events from 'utils/events';
import { toApi } from 'utils/jellyfin-apiclient/compat';

import ConnectionManager from './connectionManager';
import { ConnectionMode } from './connectionMode';

const normalizeImageOptions = (options) => {
    if (
        !options.quality &&
        (options.maxWidth ||
            options.width ||
            options.maxHeight ||
            options.height ||
            options.fillWidth ||
            options.fillHeight)
    ) {
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
    constructor() {
        super(...arguments);
        this.localApiClient = null;
        this.firstConnection = null;
        this.devServerAddress = null;

        Events.on(this, 'localusersignedout', (_e, logoutInfo) => {
            setUserInfo(null, null);
            // Ensure the updated credentials are persisted to storage
            credentialProvider.credentials(credentialProvider.credentials());

            if (
                window.NativeShell &&
                typeof window.NativeShell.onLocalUserSignedOut === 'function'
            ) {
                window.NativeShell.onLocalUserSignedOut(logoutInfo);
            }
        });

        Events.on(this, 'apiclientcreated', (_e, apiClient) => {
            apiClient.getMaxBandwidth = getMaxBandwidth;
            apiClient.normalizeImageOptions = normalizeImageOptions;

            if (this.devServerAddress) {
                apiClient.enableAutomaticNetworking = false;
                apiClient.manualAddressOnly = true;
                apiClient.serverAddress(this.devServerAddress);
                const serverInfo = apiClient.serverInfo() || {};
                serverInfo.ManualAddress = this.devServerAddress;
                serverInfo.LocalAddress = this.devServerAddress;
                serverInfo.RemoteAddress = null;
                serverInfo.LastConnectionMode = ConnectionMode.Manual;
                serverInfo.manualAddressOnly = true;
                apiClient.serverInfo(serverInfo);
            }
        });

        Events.on(this, 'connected', () => {
            if (this.devServerAddress) {
                this.applyDevServerAddress();
            }
        });
    }

    initApiClient(server) {
        console.debug('creating ApiClient singleton');

        const apiClient = new ApiClient(
            server,
            safeAppHost.appName(),
            safeAppHost.appVersion(),
            safeAppHost.deviceName(),
            safeAppHost.deviceId()
        );

        apiClient.enableAutomaticNetworking = false;
        apiClient.manualAddressOnly = true;

        this.addApiClient(apiClient);

        this.setLocalApiClient(apiClient);

        console.debug('loaded ApiClient singleton');
    }

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
        }
    }

    getLocalApiClient() {
        return this.localApiClient;
    }

    /**
     * Gets the ApiClient that is currently connected.
     * @returns {ApiClient|undefined} apiClient
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
     * @returns {Api|undefined} The current Api instance.
     */
    getCurrentApi() {
        const apiClient = this.currentApiClient();
        if (!apiClient) return;

        return toApi(apiClient);
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
        return setUserInfo(user.Id, apiClient).then(() => {
            if (
                window.NativeShell &&
                typeof window.NativeShell.onLocalUserSignedIn === 'function'
            ) {
                return window.NativeShell.onLocalUserSignedIn(user, apiClient.accessToken());
            }
            return Promise.resolve();
        });
    }

    setDevServerAddress(address) {
        if (!address) return;

        this.devServerAddress = address;
        this.applyDevServerAddress();
    }

    applyDevServerAddress() {
        if (!this.devServerAddress) return;

        const credentials = credentialProvider.credentials();
        const servers = credentials?.Servers || [];
        if (!servers.length) return;

        servers.forEach((server) => {
            server.ManualAddress = this.devServerAddress;
            server.LocalAddress = this.devServerAddress;
            server.RemoteAddress = null;
            server.LastConnectionMode = ConnectionMode.Manual;
            server.manualAddressOnly = true;
        });

        credentialProvider.credentials(credentials);

        this.getApiClients().forEach((apiClient) => {
            apiClient.enableAutomaticNetworking = false;
            apiClient.manualAddressOnly = true;
            apiClient.serverAddress(this.devServerAddress);
            const serverInfo = apiClient.serverInfo() || {};
            serverInfo.ManualAddress = this.devServerAddress;
            serverInfo.LocalAddress = this.devServerAddress;
            serverInfo.RemoteAddress = null;
            serverInfo.LastConnectionMode = ConnectionMode.Manual;
            serverInfo.manualAddressOnly = true;
            apiClient.serverInfo(serverInfo);
        });
    }
}

const credentialProvider = new Credentials();

const capabilities = Dashboard.capabilities(appHost || safeAppHost);

export default new ServerConnections(
    credentialProvider,
    safeAppHost.appName(),
    safeAppHost.appVersion(),
    safeAppHost.deviceName(),
    safeAppHost.deviceId(),
    capabilities
);
