import { ConnectionManager, Credentials, ApiClient, Events } from 'jellyfin-apiclient';
import { appHost } from './apphost';
import Dashboard from '../scripts/clientUtils';
import { setUserInfo } from '../scripts/settings/userSettings';

class ServerConnections extends ConnectionManager {
    constructor() {
        super(...arguments);
        this.localApiClient = null;

        Events.on(this, 'localusersignedout', function (eventName, logoutInfo) {
            setUserInfo(null, null);

            if (window.NativeShell && typeof window.NativeShell.onLocalUserSignedOut === 'function') {
                window.NativeShell.onLocalUserSignedOut(logoutInfo);
            }
        });
    }

    initApiClient(server) {
        console.debug('creating ApiClient singleton');

        const apiClient = new ApiClient(
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

    setLocalApiClient(apiClient) {
        if (apiClient) {
            this.localApiClient = apiClient;
            window.ApiClient = apiClient;
        }
    }

    getLocalApiClient() {
        return this.localApiClient;
    }

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

    onLocalUserSignedIn(user) {
        const apiClient = this.getApiClient(user.ServerId);
        this.setLocalApiClient(apiClient);
        return setUserInfo(user.Id, apiClient).then(() => {
            if (window.NativeShell && typeof window.NativeShell.onLocalUserSignedIn === 'function') {
                return window.NativeShell.onLocalUserSignedIn(user, apiClient.accessToken());
            }
            return Promise.resolve();
        });
    }
}

const credentials = new Credentials();

const capabilities = Dashboard.capabilities(appHost);

export default new ServerConnections(
    credentials,
    appHost.appName(),
    appHost.appVersion(),
    appHost.deviceName(),
    appHost.deviceId(),
    capabilities);
