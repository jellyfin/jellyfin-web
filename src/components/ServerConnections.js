import { ConnectionManager, Credentials, ApiClient, Events } from 'jellyfin-apiclient';
import { appHost } from './apphost';
import Dashboard from '../scripts/clientUtils';
import AppInfo from './AppInfo';
import { setUserInfo } from '../scripts/settings/userSettings';

class ServerConnections extends ConnectionManager {
    constructor() {
        super(...arguments);
        this.localApiClient = null;

        Events.on(this, 'localusersignedout', function () {
            setUserInfo(null, null);
        });
    }

    initApiClient() {
        if (!AppInfo.isNativeApp) {
            console.debug('creating ApiClient singleton');

            var apiClient = new ApiClient(
                Dashboard.serverAddress(),
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
        return setUserInfo(user.Id, apiClient);
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
