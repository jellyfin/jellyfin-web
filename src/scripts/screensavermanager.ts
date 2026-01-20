import { playbackManager } from '../components/playback/playbackmanager';
import { pluginManager } from '../components/pluginManager';
import { ServerConnections } from '../lib/jellyfin-apiclient';
import { PluginType } from '../types/plugin';
import Events from '../utils/events';

import inputManager from './inputManager';
import * as userSettings from './settings/userSettings';

import './screensavermanager.scss';

function getMinIdleTime(): number {
    return (userSettings as any).screensaverTime() * 1000;
}

let lastFunctionalEvent = 0;

function getFunctionalEventIdleTime(): number {
    return new Date().getTime() - lastFunctionalEvent;
}

Events.on(playbackManager, 'playbackstop', (_e: any, stopInfo: any) => {
    if (stopInfo?.NowPlayingItem?.MediaType === 'Video') {
        lastFunctionalEvent = new Date().getTime();
    }
});

function getScreensaverPlugin(isLoggedIn: boolean): any {
    let option;
    try {
        option = (userSettings as any).get('screensaver', false);
    } catch {
        option = isLoggedIn ? 'backdropscreensaver' : 'logoscreensaver';
    }

    const plugins = pluginManager.ofType(PluginType.Screensaver);
    return plugins.find(p => p.id === option) || null;
}

class ScreenSaverManager {
    private activeScreenSaver: any = null;

    constructor() {
        setInterval(() => this.onInterval(), 5000);
    }

    private showScreenSaver(screensaver: any) {
        if (this.activeScreenSaver) return;

        document.body.classList.add('screensaver-noScroll');
        screensaver.show();
        this.activeScreenSaver = screensaver;

        const hideHandler = () => this.hide();
        if (screensaver.hideOnClick !== false) window.addEventListener('click', hideHandler, true);
        if (screensaver.hideOnMouse !== false) window.addEventListener('mousemove', hideHandler, true);
        if (screensaver.hideOnKey !== false) window.addEventListener('keydown', hideHandler, true);
    }

    private onInterval() {
        if (this.isShowing()) return;
        if (inputManager.idleTime() < getMinIdleTime()) return;
        if (getFunctionalEventIdleTime() < getMinIdleTime()) return;
        if (playbackManager.isPlayingVideo() && !playbackManager.paused()) return;

        this.show();
    }

    isShowing(): boolean { return this.activeScreenSaver != null; }

    show() {
        const apiClient = ServerConnections.currentApiClient();
        const isLoggedIn = !!apiClient?.isLoggedIn();
        const screensaver = getScreensaverPlugin(isLoggedIn);
        if (screensaver) this.showScreenSaver(screensaver);
    }

    hide() {
        if (this.activeScreenSaver) {
            this.activeScreenSaver.hide().then(() => {
                document.body.classList.remove('screensaver-noScroll');
            });
            this.activeScreenSaver = null;
        }
        
        const hideHandler = () => this.hide();
        window.removeEventListener('click', hideHandler, true);
        window.removeEventListener('mousemove', hideHandler, true);
        window.removeEventListener('keydown', hideHandler, true);
    }
}

export default new ScreenSaverManager();
