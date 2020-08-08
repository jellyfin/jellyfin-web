export function getCurrentUser() {
    return window.ApiClient.getCurrentUser(false);
}

//TODO: investigate url prefix support for serverAddress function
export function serverAddress() {
    if (AppInfo.isNativeApp) {
        var apiClient = window.ApiClient;

        if (apiClient) {
            return apiClient.serverAddress();
        }

        return null;
    }

    var urlLower = window.location.href.toLowerCase();
    var index = urlLower.lastIndexOf('/web');

    if (index != -1) {
        return urlLower.substring(0, index);
    }

    var loc = window.location;
    var address = loc.protocol + '//' + loc.hostname;

    if (loc.port) {
        address += ':' + loc.port;
    }

    return address;
}

export function getCurrentUserId() {
    var apiClient = window.ApiClient;

    if (apiClient) {
        return apiClient.getCurrentUserId();
    }

    return null;
}

export function onServerChanged(userId, accessToken, apiClient) {
    apiClient = apiClient || window.ApiClient;
    window.ApiClient = apiClient;
}

export function logout() {
    ConnectionManager.logout().then(function () {
        var loginPage;

        if (AppInfo.isNativeApp) {
            loginPage = 'selectserver.html';
            window.ApiClient = null;
        } else {
            loginPage = 'login.html';
        }

        navigate(loginPage);
    });
}

export function getConfigurationPageUrl(name) {
    return 'configurationpage?name=' + encodeURIComponent(name);
}

export function getConfigurationResourceUrl(name) {
    if (AppInfo.isNativeApp) {
        return ApiClient.getUrl('web/ConfigurationPage', {
            name: name
        });
    }

    return getConfigurationPageUrl(name);
}

export function navigate(url, preserveQueryString) {
    if (!url) {
        throw new Error('url cannot be null or empty');
    }

    var queryString = getWindowLocationSearch();

    if (preserveQueryString && queryString) {
        url += queryString;
    }

    return new Promise(function (resolve, reject) {
        require(['appRouter'], function (appRouter) {
            return appRouter.show(url).then(resolve, reject);
        });
    });
}

export function processPluginConfigurationUpdateResult() {
    require(['loading', 'toast'], function (loading, toast) {
        loading.hide();
        toast.default(Globalize.translate('MessageSettingsSaved'));
    });
}

export function processServerConfigurationUpdateResult(result) {
    require(['loading', 'toast'], function (loading, toast) {
        loading.hide();
        toast.default(Globalize.translate('MessageSettingsSaved'));
    });
}

export function processErrorResponse(response) {
    require(['loading'], function (loading) {
        loading.hide();
    });

    var status = '' + response.status;

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
        return void require(['toast'], function (toast) {
            toast.default({
                text: options
            });
        });
    }

    require(['alert'], function (alert) {
        alert.default({
            title: options.title || Globalize.translate('HeaderAlert'),
            text: options.message
        }).then(options.callback || function () {});
    });
}

export function capabilities(appHost) {
    var capabilities = {
        PlayableMediaTypes: ['Audio', 'Video'],
        SupportedCommands: ['MoveUp', 'MoveDown', 'MoveLeft', 'MoveRight', 'PageUp', 'PageDown', 'PreviousLetter', 'NextLetter', 'ToggleOsd', 'ToggleContextMenu', 'Select', 'Back', 'SendKey', 'SendString', 'GoHome', 'GoToSettings', 'VolumeUp', 'VolumeDown', 'Mute', 'Unmute', 'ToggleMute', 'SetVolume', 'SetAudioStreamIndex', 'SetSubtitleStreamIndex', 'DisplayContent', 'GoToSearch', 'DisplayMessage', 'SetRepeatMode', 'SetShuffleQueue', 'ChannelUp', 'ChannelDown', 'PlayMediaSource', 'PlayTrailers'],
        SupportsPersistentIdentifier: self.appMode === 'cordova' || self.appMode === 'android',
        SupportsMediaControl: true
    };
    appHost.getPushTokenInfo();
    return capabilities = Object.assign(capabilities, appHost.getPushTokenInfo());
}

export function selectServer() {
    if (window.NativeShell && typeof window.NativeShell.selectServer === 'function') {
        window.NativeShell.selectServer();
    } else {
        navigate('selectserver.html');
    }
}

export function hideLoadingMsg() {
    'use strict';
    require(['loading'], function(loading) {
        loading.hide();
    });
}

export function showLoadingMsg() {
    'use strict';
    require(['loading'], function(loading) {
        loading.show();
    });
}

export function confirm(message, title, callback) {
    'use strict';
    require(['confirm'], function(confirm) {
        confirm(message, title).then(function() {
            callback(!0);
        }).catch(function() {
            callback(!1);
        });
    });
}

// This is used in plugins and templates, so keep it defined for now.
// TODO: Remove once plugins don't need it
window.Dashboard = {
    alert,
    capabilities,
    confirm,
    getConfigurationPageUrl,
    getConfigurationResourceUrl,
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

export default {
    alert,
    capabilities,
    confirm,
    getConfigurationPageUrl,
    getConfigurationResourceUrl,
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
