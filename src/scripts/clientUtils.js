
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
    apiClient = apiClient || window.ApiClient;
    window.ApiClient = apiClient;
}

export function logout() {
    window.connectionManager.logout().then(function () {
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

    return new Promise(function (resolve, reject) {
        import('appRouter').then(({default: appRouter}) => {
            return appRouter.show(url).then(resolve, reject);
        });
    });
}

export function processPluginConfigurationUpdateResult() {
    Promise.all([
        import('loading'),
        import('toast')
    ])
        .then(([{default: loading}, {default: toast}]) => {
            loading.hide();
            toast(Globalize.translate('SettingsSaved'));
        });
}

export function processServerConfigurationUpdateResult(result) {
    Promise.all([
        import('loading'),
        import('toast')
    ])
        .then(([{default: loading}, {default: toast}]) => {
            loading.hide();
            toast(Globalize.translate('SettingsSaved'));
        });
}

export function processErrorResponse(response) {
    import('loading').then(({default: loading}) => {
        loading.hide();
    });

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
        return void import('toast').then(({default: toast}) => {
            toast({
                text: options
            });
        });
    }

    import('alert').then(({default: alert}) => {
        alert({
            title: options.title || Globalize.translate('HeaderAlert'),
            text: options.message
        }).then(options.callback || function () {});
    });
}

export function capabilities(appHost) {
    const capabilities = {
        PlayableMediaTypes: ['Audio', 'Video'],
        SupportedCommands: ['MoveUp', 'MoveDown', 'MoveLeft', 'MoveRight', 'PageUp', 'PageDown', 'PreviousLetter', 'NextLetter', 'ToggleOsd', 'ToggleContextMenu', 'Select', 'Back', 'SendKey', 'SendString', 'GoHome', 'GoToSettings', 'VolumeUp', 'VolumeDown', 'Mute', 'Unmute', 'ToggleMute', 'SetVolume', 'SetAudioStreamIndex', 'SetSubtitleStreamIndex', 'DisplayContent', 'GoToSearch', 'DisplayMessage', 'SetRepeatMode', 'SetShuffleQueue', 'ChannelUp', 'ChannelDown', 'PlayMediaSource', 'PlayTrailers'],
        SupportsPersistentIdentifier: window.appMode === 'cordova' || window.appMode === 'android',
        SupportsMediaControl: true
    };
    return Object.assign(capabilities, appHost.getPushTokenInfo());
}

export function selectServer() {
    if (window.NativeShell && typeof window.NativeShell.selectServer === 'function') {
        window.NativeShell.selectServer();
    } else {
        navigate('selectserver.html');
    }
}

export function hideLoadingMsg() {
    import('loading').then(({default: loading}) => {
        loading.hide();
    });
}

export function showLoadingMsg() {
    import('loading').then(({default: loading}) => {
        loading.show();
    });
}

export function confirm(message, title, callback) {
    import('confirm').then(({default: confirm}) => {
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

export default {
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
