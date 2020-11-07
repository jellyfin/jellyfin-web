import * as webSettings from 'webSettings';

export function getCurrentUser() {
    return window.ApiClient.getCurrentUser(false);
}

// TODO: investigate url prefix support for serverAddress function
export async function serverAddress() {
    const apiClient = window.ApiClient;

    if (apiClient) {
        return Promise.resolve(apiClient.serverAddress());
    }

    const current = await window.connectionManager.getAvailableServers().then(servers => {
        if (servers.length !== 0) {
            return Promise.resolve(servers[0].ManualAddress);
        }
    });

    // TODO this makes things faster but it also blocks the wizard in some scenarios
    // if (current) return Promise.resolve(current);

    const urls = [];
    urls.push(window.location.origin);
    urls.push(`https://${window.location.hostname}:8920`);
    urls.push(`http://${window.location.hostname}:8096`);
    urls.push(...await webSettings.getServers());

    const promises = urls.map(url => {
        return fetch(`${url}/System/Info/Public`).catch(error => {
            return Promise.resolve();
        });
    });

    return Promise.all(promises).then(responses => {
        responses = responses.filter(response => response && response.ok);
        return Promise.all(responses.map(response => response.json()));
    }).then(configs => {
        let selection = configs.find(config => !config.StartupWizardCompleted);
        if (!selection) selection = configs[0];
        return Promise.resolve(selection.LocalAddress);
    }).catch(error => {
        console.log(error);
        return Promise.resolve();
    });
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
        webSettings.getMultiServer().then(multi => {
            multi ? navigate('selectserver.html') : navigate('login.html');
        });
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
