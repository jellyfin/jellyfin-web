import { playbackManager } from 'components/playback/playbackmanager';
import { pluginManager } from 'components/pluginManager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { PluginType } from 'types/plugin';
import Events from 'utils/events';

import inputManager from './inputManager';
import * as userSettings from './settings/userSettings';

import './screensavermanager.scss';

function getMinIdleTime() {
    // Returns the minimum amount of idle time required before the screen saver can be displayed
    //time units used Millisecond
    return userSettings.screensaverTime() * 1000;
}

let lastFunctionalEvent = 0;

function getFunctionalEventIdleTime() {
    return new Date().getTime() - lastFunctionalEvent;
}

Events.on(playbackManager, 'playbackstop', (_e, stopInfo) => {
    if (stopInfo && stopInfo.NowPlayingItem && stopInfo.NowPlayingItem.MediaType == 'Video') {
        lastFunctionalEvent = new Date().getTime();
    }
});

function getScreensaverPlugin(isLoggedIn) {
    let option;
    try {
        option = userSettings.get('screensaver', false);
    } catch {
        option = isLoggedIn ? 'backdropscreensaver' : 'logoscreensaver';
    }

    const plugins = pluginManager.ofType(PluginType.Screensaver);

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

        if (apiClient?.isLoggedIn()) {
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

        if (playbackManager.isPlayingVideo() && !playbackManager.paused()) {
            return;
        }

        this.show();
    };

    setInterval(onInterval, 5000);
}

export default new ScreenSaverManager;
