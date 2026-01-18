// Import legacy browser polyfills
import 'lib/legacy';

import React from 'react';
import { createRoot } from 'react-dom/client';

// NOTE: We need to import this first to initialize the connection
import { ServerConnections } from 'lib/jellyfin-apiclient';

import { appHost, safeAppHost } from './components/apphost';
import { logger } from './utils/logger';
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
import { cleanupExpiredCache } from './utils/randomSortCache';
import './utils/performanceMonitor';
import './utils/pwaInstall';
import './utils/pwaUpdate';
import './utils/pwaOffline';
import './utils/pwaStatus';
import './utils/pwaAudit';
import './utils/bundleAnalyzer';
import './utils/bundleOptimizationReport';
import './utils/lazyLoadingAnalysis';
import './utils/bundleOptimizationAnalysis';

import RootApp from './RootApp';

const supportsFeature = (feature) => safeAppHost.supports(feature);

async function initializeAudioContextEarly() {
    try {
        logger.debug('Initializing audio context early', { component: 'index' });
        const { initializeMasterAudio } = await import('./components/audioEngine/master.logic');
        initializeMasterAudio(() => {
            logger.debug('Early audio context cleanup called', { component: 'index' });
        });
        logger.debug('Audio context initialized early', { component: 'index' });
    } catch (error) {
        logger.warn('Failed to initialize audio context early', { component: 'index' }, error);
    }
}

function setupAudioContextResume() {
    // Resume audio context on user interaction to comply with browser autoplay policies
    const resumeAudioContext = async () => {
        logger.debug('Attempting to resume AudioContext on user interaction', { component: 'index' });
        try {
            const { masterAudioOutput } = await import('./components/audioEngine/master.logic');
            const { safeResumeAudioContext } = await import('./components/audioEngine/audioUtils');

            logger.debug('AudioContext state before resume', { component: 'index', state: masterAudioOutput.audioContext?.state });
            if (masterAudioOutput.audioContext) {
                const resumed = await safeResumeAudioContext(masterAudioOutput.audioContext);
                logger.debug('AudioContext state after resume', { component: 'index', state: masterAudioOutput.audioContext.state });
                if (resumed) {
                    logger.debug('AudioContext resumed on user interaction', { component: 'index' });
                } else {
                    logger.warn('Failed to resume AudioContext - already running or error occurred', { component: 'index' });
                }
            } else {
                logger.warn('AudioContext not available for resume - may not be initialized yet', { component: 'index' });
            }
        } catch (error) {
            logger.error('Failed to resume AudioContext', { component: 'index' }, error);
        }
    };

    document.addEventListener('click', resumeAudioContext, { once: true });
    document.addEventListener('keydown', resumeAudioContext, { once: true });
    document.addEventListener('touchstart', resumeAudioContext, { once: true });
}

// Cleanup audio contexts on page unload to prevent leaks
window.addEventListener('beforeunload', () => {
    try {
        const { masterAudioOutput } = require('./components/audioEngine/master.logic');
        if (masterAudioOutput.audioContext && masterAudioOutput.audioContext.state !== 'closed') {
            masterAudioOutput.audioContext.close();
        }
    } catch {
        // Ignore if not loaded
    }
});

// Import the button webcomponent for use throughout the site
// NOTE: This is a bit of a hack, files should ensure the component is imported before use
import './elements/emby-button/emby-button';

// Import auto-running components
// NOTE: This is an anti-pattern - deferring non-critical components
import './components/playback/displayMirrorManager';
import './components/playback/playerSelectionMenu';
import './scripts/autoThemes';
import './scripts/mouseManager';
import './scripts/serverNotifications';

// Import audio engine early to ensure AudioContext is available for resume
import './components/audioEngine/master.logic';

// Defer loading of non-critical components
setTimeout(() => {
    import('./components/themeMediaPlayer');
    import('./scripts/screensavermanager');
}, 2000);

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

    // Clean up expired random sort cache entries
    cleanupExpiredCache();

    // Register handlers to update header classes
    pageClassOn('viewshow', 'standalonePage', () => {
        document.querySelector('.skinHeader').classList.add('noHeaderRight');
    });
    pageClassOn('viewhide', 'standalonePage', () => {
        document.querySelector('.skinHeader').classList.remove('noHeaderRight');
    });

    // Initialize the api client
    let serverUrl = await serverAddress();
    if (__WEBPACK_SERVE__ && __DEV_SERVER_PROXY_TARGET__) {
        const devServerUrl = window.location.origin;
        ServerConnections.setDevServerAddress(devServerUrl);
        serverUrl = devServerUrl;
    }
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

    // Set up audio context resume on user interaction (after plugins are loaded)
    setupAudioContextResume();

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

    // Initialize audio context early
    initializeAudioContextEarly();

    // Load platform specific features
    loadPlatformFeatures();

    // Enable navigation controls
    keyboardNavigation.enable();
    autoFocuser.enable();
}

function loadFonts() {
    if (browser.tv && !browser.android) {
        logger.debug('using system fonts with explicit sizes', { component: 'index' });
        import('./styles/fonts.sized.scss');
    } else if (__USE_SYSTEM_FONTS__) {
        logger.debug('using system fonts', { component: 'index' });
        import('./styles/fonts.scss');
    } else {
        logger.debug('using default fonts', { component: 'index' });
        import('./styles/fonts.scss');
        import('./styles/fonts.noto.scss');
    }
}

async function loadPlugins() {
    console.groupCollapsed('loading installed plugins');
    console.dir(pluginManager);

    let list = await getPlugins();
    if (!supportsFeature(AppFeature.RemoteControl)) {
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

    if (supportsFeature(AppFeature.RemoteControl)) {
        import('./components/playback/playerSelectionMenu');
        import('./components/playback/remotecontrolautoplay');
    }

    if (!supportsFeature(AppFeature.PhysicalVolumeControl) || browser.touch) {
        import('./components/playback/volumeosd');
    }

    if (!browser.tv && !browser.xboxOne) {
        import('./components/playback/playbackorientation');

        if (window.Notification) {
            import('./components/notifications/notifications');
        }
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
