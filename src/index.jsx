// Import legacy browser polyfills
import 'lib/legacy';

import React from 'react';
import { createRoot } from 'react-dom/client';

// NOTE: We need to import this first to initialize the connection
import { ServerConnections } from 'lib/jellyfin-apiclient';

import { appHost } from './components/apphost';
import autoFocuser from './components/autoFocuser';
import loading from 'components/loading/loading';
import { pluginManager } from './components/pluginManager';
import { appRouter } from './components/router/appRouter';
import { AppFeature } from 'constants/appFeature';
import globalize from './lib/globalize';
import { loadCoreDictionary } from 'lib/globalize/loader';
import { initialize as initializeAutoCast } from 'scripts/autocast';
import browser from './scripts/browser';
import keyboardNavigation from './scripts/keyboardNavigation';
import { getPlugins } from './scripts/settings/webSettings';
import taskButton from './scripts/taskbutton';
import { pageClassOn, serverAddress } from './utils/dashboard';
import Events from './utils/events';

import RootApp from './RootApp';

// Import the button webcomponent for use throughout the site
// NOTE: This is a bit of a hack, files should ensure the component is imported before use
import './elements/emby-button/emby-button';

// Import auto-running components
// NOTE: This is an anti-pattern
import './components/playback/displayMirrorManager';
import './components/playback/playerSelectionMenu';
import './components/themeMediaPlayer';
import './scripts/autoThemes';
import './scripts/mouseManager';
import './scripts/screensavermanager';
import './scripts/serverNotifications';

// Import site styles
import './styles/site.scss';
import './styles/livetv.scss';
import './styles/dashboard.scss';
import './styles/detailtable.scss';
import './styles/librarybrowser.scss';

async function init() {
    // Log current version to console to help out with issue triage and debugging
    console.info(
        `[${__PACKAGE_JSON_NAME__}]
version: ${__PACKAGE_JSON_VERSION__}
commit: ${__COMMIT_SHA__}
build: ${__JF_BUILD_VERSION__}`);

    // Register globals used in plugins
    window.Events = Events;
    window.TaskButton = taskButton;

    // Register handlers to update header classes
    pageClassOn('viewshow', 'standalonePage', function () {
        document.querySelector('.skinHeader').classList.add('noHeaderRight');
    });
    pageClassOn('viewhide', 'standalonePage', function () {
        document.querySelector('.skinHeader').classList.remove('noHeaderRight');
    });

    // Initialize app host
    await appHost.init();

    // Initialize the api client
    const serverUrl = await serverAddress();
    if (serverUrl) {
        ServerConnections.initApiClient(serverUrl);
    }

    // Initialize automatic (default) cast target
    initializeAutoCast();

    // Load the translation dictionary
    await loadCoreDictionary();
    // Update localization on user changes
    Events.on(ServerConnections, 'localusersignedin', globalize.updateCurrentCulture);
    Events.on(ServerConnections, 'localusersignedout', globalize.updateCurrentCulture);

    // Load the font styles
    loadFonts();

    // Load iOS specific styles
    if (browser.iOS) {
        import('./styles/ios.scss');
    }

    // Load frontend plugins
    await loadPlugins();

    // Establish the websocket connection
    Events.on(appHost, 'resume', () => {
        ServerConnections.currentApiClient()?.ensureWebSocket();
    });

    // Register API request error handlers
    ServerConnections.getApiClients().forEach(apiClient => {
        Events.off(apiClient, 'requestfail', appRouter.onRequestFail);
        Events.on(apiClient, 'requestfail', appRouter.onRequestFail);
    });
    Events.on(ServerConnections, 'apiclientcreated', (_e, apiClient) => {
        Events.off(apiClient, 'requestfail', appRouter.onRequestFail);
        Events.on(apiClient, 'requestfail', appRouter.onRequestFail);
    });

    // Render the app
    await renderApp();

    // Load platform specific features
    loadPlatformFeatures();

    // Enable navigation controls
    keyboardNavigation.enable();
    autoFocuser.enable();
}

function loadFonts() {
    if (browser.tv && !browser.android) {
        console.debug('using system fonts with explicit sizes');
        import('./styles/fonts.sized.scss');
    } else if (__USE_SYSTEM_FONTS__) {
        console.debug('using system fonts');
        import('./styles/fonts.scss');
    } else {
        console.debug('using default fonts');
        import('./styles/fonts.scss');
        import('./styles/fonts.noto.scss');
    }
}

async function loadPlugins() {
    console.groupCollapsed('loading installed plugins');
    console.dir(pluginManager);

    let list = await getPlugins();
    if (!appHost.supports(AppFeature.RemoteControl)) {
        // Disable remote player plugins if not supported
        list = list.filter(plugin => !plugin.startsWith('sessionPlayer')
            && !plugin.startsWith('chromecastPlayer'));
    } else if (!browser.chrome && !browser.edgeChromium && !browser.opera) {
        // Disable chromecast player in unsupported browsers
        list = list.filter(plugin => !plugin.startsWith('chromecastPlayer'));
    }

    // add any native plugins
    if (window.NativeShell) {
        list = list.concat(window.NativeShell.getPlugins());
    }

    try {
        await Promise.all(list.map(plugin => pluginManager.loadPlugin(plugin)));
        console.debug('finished loading plugins');
    } catch (e) {
        console.warn('failed loading plugins', e);
    }

    console.groupEnd('loading installed plugins');
}

function loadPlatformFeatures() {
    if (!browser.tv && !browser.xboxOne && !browser.ps4) {
        import('./components/nowPlayingBar/nowPlayingBar');
    }

    if (appHost.supports(AppFeature.RemoteControl)) {
        import('./components/playback/playerSelectionMenu');
        import('./components/playback/remotecontrolautoplay');
    }

    if (!appHost.supports(AppFeature.PhysicalVolumeControl) || browser.touch) {
        import('./components/playback/volumeosd');
    }

    if (!browser.tv && !browser.xboxOne) {
        import('./components/playback/playbackorientation');
        registerServiceWorker();

        if (window.Notification) {
            import('./components/notifications/notifications');
        }
    }
}

function registerServiceWorker() {
    if (navigator.serviceWorker && window.appMode !== 'cordova' && window.appMode !== 'android') {
        navigator.serviceWorker.register('serviceworker.js').then(() =>
            console.log('serviceWorker registered')
        ).catch(error =>
            console.log('error registering serviceWorker: ' + error)
        );
    } else {
        console.warn('serviceWorker unsupported');
    }
}

async function renderApp() {
    const container = document.getElementById('reactRoot');
    // Remove the splash logo
    container.innerHTML = '';

    loading.show();

    const root = createRoot(container);
    root.render(
        <RootApp />
    );
}

init();
