// Import legacy browser polyfills
import 'lib/legacy';

import React from 'react';
import { createRoot } from 'react-dom/client';

// NOTE: We need to import this first to initialize the connection
import { ServerConnections } from 'lib/jellyfin-apiclient';

// Initialize observability context
import { initializeEnvironment } from './utils/observability';
initializeEnvironment();

import { appHost, safeAppHost } from './components/apphost';
import { logger } from './utils/logger';
import autoFocuser from './components/autoFocuser';
import loading from 'components/loading/loading';
import { pluginManager } from './components/pluginManager';
import { appRouter } from './components/router/appRouter';
import { AppFeature } from 'constants/appFeature';
import globalize from './lib/globalize';
import { loadCoreDictionary } from 'lib/globalize/loader';
import { initialize as initializeAutoCast } from './scripts/autocast';
import browser from './scripts/browser';
import keyboardNavigation from './scripts/keyboardNavigation';
import { getPlugins, getServers } from './scripts/settings/webSettings';
import taskButton from './scripts/taskbutton';
import { pageClassOn, serverAddress } from './utils/dashboard';
import Events from './utils/events';
import { cleanupExpiredCache } from './utils/randomSortCache';
import { useDevConfigStore } from './store/devConfigStore';
import { fetchDevConfig, normalizeServerBaseUrl, resolveApiBaseUrl, saveDevConfig } from './utils/devConfig';
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

// Initialize modern i18n
import './i18n';

import RootApp from './RootApp';

const supportsFeature = (feature: any) => Boolean(safeAppHost.supports(feature));

async function initializeAudioContextEarly() {
    logger.time('AudioContext Initialization');
    try {
        logger.performance('Initializing audio context early', {
            component: 'AudioEngine'
        });
        const { initializeMasterAudio } = await import('./components/audioEngine/master.logic');
        initializeMasterAudio(() => {
            logger.debug('Early audio context cleanup called', {
                component: 'AudioEngine'
            });
        });
        logger.performance('Audio context initialized early', { component: 'AudioEngine' });
        logger.timeEnd('AudioContext Initialization');
    } catch (error) {
        logger.timeEnd('AudioContext Initialization');
        logger.error('Failed to initialize audio context early', { component: 'AudioEngine' }, error);
    }
}

async function initializeCrossfadePreloader() {
    logger.time('Crossfade Preloader');
    try {
        logger.performance('Initializing crossfade preloader', {
            component: 'AudioEngine'
        });
        const { initializeCrossfadePreloadHandler, destroyCrossfadePreloadHandler } =
            await import('./components/audioEngine');

        // Initialize preload handler to listen for playback events
        initializeCrossfadePreloadHandler();
        logger.performance('Crossfade preloader initialized', { component: 'AudioEngine' });
        logger.timeEnd('Crossfade Preloader');
    } catch (error) {
        logger.timeEnd('Crossfade Preloader');
        logger.error('Failed to initialize crossfade preloader', { component: 'AudioEngine' }, error);
    }
}

function setupAudioContextResume() {
    // Resume audio context on user interaction to comply with browser autoplay policies
    const resumeAudioContext = async () => {
        logger.userAction('User interaction detected - resuming AudioContext', {
            component: 'AudioEngine'
        });
        try {
            const { masterAudioOutput } = await import('./components/audioEngine/master.logic');
            const { safeResumeAudioContext } = await import('./components/audioEngine/audioUtils');

            logger.debug('AudioContext state before resume', {
                component: 'AudioEngine',
                state: masterAudioOutput.audioContext?.state
            });
            if (masterAudioOutput.audioContext) {
                const resumed = await safeResumeAudioContext(masterAudioOutput.audioContext);
                logger.debug('AudioContext state after resume', {
                    component: 'AudioEngine',
                    state: masterAudioOutput.audioContext.state
                });
                if (resumed) {
                    logger.performance('AudioContext resumed successfully', {
                        component: 'AudioEngine'
                    });
                } else {
                    logger.warn('Failed to resume AudioContext - already running or error occurred', {
                        component: 'AudioEngine'
                    });
                }
            } else {
                logger.warn('AudioContext not available for resume - may not be initialized yet', {
                    component: 'AudioEngine'
                });
            }
        } catch (error) {
            logger.error('Failed to resume AudioContext', { component: 'AudioEngine' }, error);
        }
    };

    document.addEventListener('click', resumeAudioContext, { once: true });
    document.addEventListener('keydown', resumeAudioContext, { once: true });
    document.addEventListener('touchstart', resumeAudioContext, { once: true });
}

// Cleanup audio contexts on page unload to prevent leaks
window.addEventListener('beforeunload', () => {
    import('./components/audioEngine/master.logic')
        .then(({ masterAudioOutput }) => {
            if (masterAudioOutput.audioContext && masterAudioOutput.audioContext.state !== 'closed') {
                masterAudioOutput.audioContext.close();
            }
            // eslint-disable-next-line no-empty-function
        })
        .catch(() => {});
});

// Import Radix UI themes styles
import '@radix-ui/themes/styles.css';

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
import './styles/site.css.ts';
import './styles/fonts.css.ts';
import './styles/ios.css.ts';
import './styles/livetv.css.ts';
import './styles/dashboard.css.ts';
import './styles/detailtable.css.ts';
import './styles/librarybrowser.css.ts';

// Import Radix UI semantic tokens and components
import './styles/tokens.semantic.css';
import './styles/components.css';

async function init() {
    // Log current version to console to help out with issue triage and debugging
    logger.info(
        `[${__PACKAGE_JSON_NAME__}]
version: ${__PACKAGE_JSON_VERSION__}
commit: ${__COMMIT_SHA__}
build: ${__JF_BUILD_VERSION__}`,
        { component: 'index' }
    );

    // Register globals used in plugins
    window.Events = Events;
    window.TaskButton = taskButton;

    // Clean up expired random sort cache entries
    cleanupExpiredCache();

    // Register handlers to update header classes
    pageClassOn('viewshow', 'standalonePage', () => {
        document.querySelector('.skinHeader')?.classList.add('noHeaderRight');
    });
    pageClassOn('viewhide', 'standalonePage', () => {
        document.querySelector('.skinHeader')?.classList.remove('noHeaderRight');
    });

    // Load servers from config.json into credential provider BEFORE any connection attempts
    // This must happen first because ConnectionRequired.tsx calls ServerConnections.connect() immediately
    const savedServers = ServerConnections.getSavedServers();
    if (savedServers.length === 0) {
        const configServers = await getServers();
        if (configServers.length > 0) {
            const credentials = (ServerConnections as any).credentialProvider().credentials();
            const updatedServers = [...credentials.Servers];
            configServers.forEach((server: { ManualAddress?: string }) => {
                const existing = updatedServers.find(s => s.ManualAddress === server.ManualAddress);
                if (!existing) {
                    updatedServers.push(server);
                }
            });
            credentials.Servers = updatedServers;
            (ServerConnections as any).credentialProvider?.()?.credentials?.(credentials);
            logger.info('Loaded servers from config.json', {
                component: 'index',
                servers: configServers.map((s: { ManualAddress?: string }) => s.ManualAddress)
            });
        }
    }

    // Initialize the api client
    let serverUrl = await serverAddress();
    if (import.meta.env.DEV) {
        const devConfig = await fetchDevConfig();
        const devStore = useDevConfigStore.getState();
        devStore.hydrate(devConfig);

        if (!devStore.serverBaseUrl && serverUrl) {
            const normalized = normalizeServerBaseUrl(serverUrl);
            if (normalized) {
                devStore.setServerBaseUrl(normalized);
                void saveDevConfig({ serverBaseUrl: normalized });
            }
        }

        const resolvedBaseUrl = resolveApiBaseUrl(devStore, true);
        if (resolvedBaseUrl) {
            serverUrl = resolvedBaseUrl;
        }
    }

    if (serverUrl) {
        if (import.meta.env.DEV) {
            ServerConnections.setDevServerAddress(serverUrl);
        }
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

    // Initialize crossfade preloader for track preloading and smooth transitions
    await initializeCrossfadePreloader();

    // Start playback behavior synchronization
    import('./audio-driver/bridge/PlaybackSync').then(({ playbackSync }) => {
        playbackSync.start();
    });

    // Load platform specific features
    loadPlatformFeatures();

    // Enable navigation controls
    keyboardNavigation.enable();
    autoFocuser.enable();
}

function loadFonts() {
    // Fonts are loaded via global.css.ts - no additional loading needed
}

async function loadPlugins() {
    logger.debug('loading installed plugins', { component: 'index', plugins: pluginManager });

    let list = await getPlugins();
    if (!supportsFeature(AppFeature.RemoteControl)) {
        // Disable remote player plugins if not supported
        list = list.filter(plugin => {
            const name = typeof plugin === 'string' ? plugin : '';
            return !name.startsWith('sessionPlayer') && !name.startsWith('chromecastPlayer');
        });
    } else if (!browser.chrome && !browser.edgeChromium && !browser.operaTv) {
        // Disable chromecast player in unsupported browsers
        list = list.filter(plugin => {
            const name = typeof plugin === 'string' ? plugin : '';
            return !name.startsWith('chromecastPlayer');
        });
    }

    // add any native plugins
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (window.NativeShell) {
        list = list.concat(window.NativeShell.getPlugins());
    }

    logger.time('Plugin Loading');
    try {
        await Promise.all(list.map((plugin: any) => pluginManager.loadPlugin(plugin)));
        logger.performance('All plugins loaded successfully', {
            component: 'PluginManager',
            pluginCount: list.length
        });
        logger.timeEnd('Plugin Loading');
    } catch (e) {
        logger.timeEnd('Plugin Loading');
        logger.error(
            'Failed loading plugins',
            {
                component: 'PluginManager',
                pluginCount: list.length
            },
            e
        );
    }

    logger.debug('finished loading plugins', { component: 'index' });
}

function loadPlatformFeatures() {
    if (!browser.tv && !browser.xboxOne && !browser.ps4) {
        import('./components/nowPlayingBar/mountNowPlayingBar').then(({ mountNowPlayingBar }) => {
            mountNowPlayingBar(document.body);
        });
    }

    if (supportsFeature(AppFeature.RemoteControl)) {
        import('./components/playback/playerSelectionMenu');
        // import("./components/playback/remotecontrolautoplay");
    }

    if (!browser.tv && !browser.xboxOne) {
        // import("./components/playback/playbackorientation");

        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (window.Notification) {
            import('./components/notifications/notifications');
        }
    }
}

async function renderApp() {
    const container = document.getElementById('reactRoot');
    if (!container) {
        logger.error('Failed to find reactRoot container', { component: 'index' });
        return;
    }
    // Remove the splash logo
    container.innerHTML = '';

    loading.show();

    const root = createRoot(container);
    root.render(<RootApp />);
}

init();
