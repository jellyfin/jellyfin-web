import AppInfo from '../components/AppInfo';
import ServerConnections from '../components/ServerConnections';
import toast from '../components/toast/toast';
import loading from '../components/loading/loading';
import { appRouter } from '../components/appRouter';
import baseAlert from '../components/alert';
import baseConfirm from '../components/confirm/confirm';
import globalize from '../scripts/globalize';

export function getCurrentUser() {
    return window.ApiClient.getCurrentUser(false);
}

//TODO: investigate url prefix support for serverAddress function
export function serverAddress() {
    if (AppInfo.isNativeApp) {
        const apiClient = window.ApiClient;

        if (apiClient) {
            return apiClient.serverAddress();
        }

        return null;
    }

    const urlLower = window.location.href.toLowerCase();
    const index = urlLower.lastIndexOf('/web');

    if (index != -1) {
        return urlLower.substring(0, index);
    }

    const loc = window.location;
    let address = loc.protocol + '//' + loc.hostname;

    if (loc.port) {
        address += ':' + loc.port;
    }

    return address;
}

export function getCurrentUserId() {
    const apiClient = window.ApiClient;

    if (apiClient) {
        return apiClient.getCurrentUserId();
    }

    return null;
}

export function onServerChanged(userId, accessToken, apiClient) {
    ServerConnections.setLocalApiClient(apiClient);
}

export function logout() {
    ServerConnections.logout().then(function () {
        let loginPage;

        if (AppInfo.isNativeApp) {
            loginPage = 'selectserver.html';
            window.ApiClient = null;
        } else {
            loginPage = 'login.html';
        }

        navigate(loginPage);
    });
}

export function getPluginUrl(name) {
    return 'configurationpage?name=' + encodeURIComponent(name);
}

export function navigate(url, preserveQueryString) {
    if (!url) {
        throw new Error('url cannot be null or empty');
    }

    const queryString = getWindowLocationSearch();

    if (preserveQueryString && queryString) {
        url += queryString;
    }

    return appRouter.show(url);
}

export function processPluginConfigurationUpdateResult() {
    loading.hide();
    toast(globalize.translate('SettingsSaved'));
}

export function processServerConfigurationUpdateResult(result) {
    loading.hide();
    toast.default(globalize.translate('MessageSettingsSaved'));
}

export function processErrorResponse(response) {
    loading.hide();

    let status = '' + response.status;

    if (response.statusText) {
        status = response.statusText;
    }

    alert({
        title: status,
        message: response.headers ? response.headers.get('X-Application-Error-Code') : null
    });
}

export function alert(options) {
    if (typeof options == 'string') {
        toast.default({
            text: options
        });
    } else {
        baseAlert.default({
            title: options.title || globalize.translate('HeaderAlert'),
            text: options.message
        }).then(options.callback || function () {});
    }
}

export function capabilities(appHost) {
    return Object.assign({
        PlayableMediaTypes: ['Audio', 'Video'],
        SupportedCommands: ['MoveUp', 'MoveDown', 'MoveLeft', 'MoveRight', 'PageUp', 'PageDown', 'PreviousLetter', 'NextLetter', 'ToggleOsd', 'ToggleContextMenu', 'Select', 'Back', 'SendKey', 'SendString', 'GoHome', 'GoToSettings', 'VolumeUp', 'VolumeDown', 'Mute', 'Unmute', 'ToggleMute', 'SetVolume', 'SetAudioStreamIndex', 'SetSubtitleStreamIndex', 'DisplayContent', 'GoToSearch', 'DisplayMessage', 'SetRepeatMode', 'SetShuffleQueue', 'ChannelUp', 'ChannelDown', 'PlayMediaSource', 'PlayTrailers'],
        SupportsPersistentIdentifier: window.appMode === 'cordova' || window.appMode === 'android',
        SupportsMediaControl: true
    }, appHost.getPushTokenInfo());
}

export function selectServer() {
    if (window.NativeShell && typeof window.NativeShell.selectServer === 'function') {
        window.NativeShell.selectServer();
    } else {
        navigate('selectserver.html');
    }
}

export function hideLoadingMsg() {
    loading.hide();
}

export function showLoadingMsg() {
    loading.show();
}

export function confirm(message, title, callback) {
    baseConfirm(message, title).then(function() {
        callback(!0);
    }).catch(function() {
        callback(!1);
    });
}

const Dashboard = {
    alert,
    capabilities,
    confirm,
    getPluginUrl,
    getCurrentUser,
    getCurrentUserId,
    hideLoadingMsg,
    logout,
    navigate,
    onServerChanged,
    processErrorResponse,
    processPluginConfigurationUpdateResult,
    processServerConfigurationUpdateResult,
    selectServer,
    serverAddress,
    showLoadingMsg
};

// This is used in plugins and templates, so keep it defined for now.
// TODO: Remove once plugins don't need it
window.Dashboard = Dashboard;

export default Dashboard;
