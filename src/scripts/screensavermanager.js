import { Events } from 'jellyfin-apiclient';
import { playbackManager } from '../components/playback/playbackmanager';
import { pluginManager } from '../components/pluginManager';
import inputManager from './inputManager';
import * as userSettings from './settings/userSettings';
import ServerConnections from '../components/ServerConnections';
import './screensavermanager.scss';

function getMinIdleTime() {
    // Returns the minimum amount of idle time required before the screen saver can be displayed
    //time units used Millisecond
    return 180000;
}

let lastFunctionalEvent = 0;

function getFunctionalEventIdleTime() {
    return new Date().getTime() - lastFunctionalEvent;
}

Events.on(playbackManager, 'playbackstop', function (_e, stopInfo) {
    const state = stopInfo.state;
    if (state.NowPlayingItem && state.NowPlayingItem.MediaType == 'Video') {
        lastFunctionalEvent = new Date().getTime();
    }
});

function getScreensaverPlugin(isLoggedIn) {
    let option;
    try {
        option = userSettings.get('screensaver', false);
    } catch (err) {
        option = isLoggedIn ? 'backdropscreensaver' : 'logoscreensaver';
    }

    const plugins = pluginManager.ofType('screensaver');

    for (const plugin of plugins) {
        if (plugin.id === option) {
            return plugin;
        }
    }

    return null;
}

function ScreenSaverManager() {
    let activeScreenSaver;

    function showScreenSaver(screensaver) {
        if (activeScreenSaver) {
            throw new Error('An existing screensaver is already active.');
        }

        console.debug('Showing screensaver ' + screensaver.name);

        document.body.classList.add('screensaver-noScroll');

        screensaver.show();
        activeScreenSaver = screensaver;

        if (screensaver.hideOnClick !== false) {
            window.addEventListener('click', hide, true);
        }
        if (screensaver.hideOnMouse !== false) {
            window.addEventListener('mousemove', hide, true);
        }
        if (screensaver.hideOnKey !== false) {
            window.addEventListener('keydown', hide, true);
        }
    }

    function hide() {
        if (activeScreenSaver) {
            console.debug('Hiding screensaver');
            activeScreenSaver.hide().then(() => {
                document.body.classList.remove('screensaver-noScroll');
            });
            activeScreenSaver = null;
        }

        window.removeEventListener('click', hide, true);
        window.removeEventListener('mousemove', hide, true);
        window.removeEventListener('keydown', hide, true);
    }

    this.isShowing = () => {
        return activeScreenSaver != null;
    };

    this.show = function () {
        let isLoggedIn;
        const apiClient = ServerConnections.currentApiClient();

        if (apiClient && apiClient.isLoggedIn()) {
            isLoggedIn = true;
        }

        const screensaver = getScreensaverPlugin(isLoggedIn);

        if (screensaver) {
            showScreenSaver(screensaver);
        }
    };

    this.hide = function () {
        hide();
    };

    const onInterval = () => {
        if (this.isShowing()) {
            return;
        }

        if (inputManager.idleTime() < getMinIdleTime()) {
            return;
        }

        if (getFunctionalEventIdleTime() < getMinIdleTime()) {
            return;
        }

        if (playbackManager.isPlayingVideo()) {
            return;
        }

        this.show();
    };

    setInterval(onInterval, 10000);
}

export default new ScreenSaverManager;
