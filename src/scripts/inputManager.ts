import { safeAppHost } from 'components/apphost';
import focusManager from 'components/focusManager';
import { playbackManager } from 'components/playback/playbackmanager';
import { appRouter } from 'components/router/appRouter';
import { AppFeature } from 'constants/appFeature';
import dom from 'utils/dom';

export interface CommandOptions {
    sourceElement?: HTMLElement;
    [key: string]: any;
}

let lastInputTime = new Date().getTime();

export function notify(): void {
    lastInputTime = new Date().getTime();
    handleCommand('unknown');
}

export function notifyMouseMove(): void {
    lastInputTime = new Date().getTime();
}

export function idleTime(): number {
    return new Date().getTime() - lastInputTime;
}

export function select(sourceElement: HTMLElement): void {
    sourceElement.click();
}

let eventListenerCount = 0;
export function on(scope: EventTarget, fn: EventListenerOrEventListenerObject): void {
    eventListenerCount++;
    dom.addEventListener(scope, 'command', fn, {});
}

export function off(scope: EventTarget, fn: EventListenerOrEventListenerObject): void {
    if (eventListenerCount > 0) {
        eventListenerCount--;
    }
    dom.removeEventListener(scope, 'command', fn, {});
}

const commandTimes: Record<string, number> = {};

function checkCommandTime(command: string): boolean {
    const last = commandTimes[command] || 0;
    const now = new Date().getTime();

    if ((now - last) < 1000) {
        return false;
    }

    commandTimes[command] = now;
    return true;
}

export function handleCommand(commandName: string, options?: CommandOptions): void {
    lastInputTime = new Date().getTime();

    let sourceElement = (options ? options.sourceElement : null) as HTMLElement | null;

    if (sourceElement) {
        sourceElement = focusManager.focusableParent(sourceElement) as HTMLElement;
    }

    if (!sourceElement) {
        sourceElement = (document.activeElement || window) as HTMLElement;

        const dialogs = document.querySelectorAll('.dialogContainer .dialog.opened');
        const dlg = dialogs.length ? dialogs[dialogs.length - 1] as HTMLElement : null;

        if (dlg && !dlg.contains(sourceElement)) {
            sourceElement = dlg;
        }
    }

    if (eventListenerCount > 0) {
        const customEvent = new CustomEvent('command', {
            detail: { command: commandName },
            bubbles: true,
            cancelable: true
        });

        const eventResult = sourceElement.dispatchEvent(customEvent);
        if (!eventResult) {
            return;
        }
    }

    const keyActions: Record<string, () => void> = {
        'up': () => focusManager.moveUp(sourceElement),
        'down': () => focusManager.moveDown(sourceElement),
        'left': () => focusManager.moveLeft(sourceElement),
        'right': () => focusManager.moveRight(sourceElement),
        'home': () => appRouter.goHome(),
        'settings': () => appRouter.showSettings(),
        'back': () => {
            if (appRouter.canGoBack()) {
                appRouter.back();
            } else if (safeAppHost.supports(AppFeature.Exit)) {
                safeAppHost.exit();
            }
        },
        'select': () => sourceElement && select(sourceElement),
        'nextchapter': () => playbackManager.nextChapter(),
        'next': () => playbackManager.nextTrack(),
        'nexttrack': () => playbackManager.nextTrack(),
        'previous': () => playbackManager.previousTrack(),
        'previoustrack': () => playbackManager.previousTrack(),
        'previouschapter': () => playbackManager.previousChapter(),
        'guide': () => appRouter.showGuide(),
        'recordedtv': () => appRouter.showRecordedTV(),
        'livetv': () => appRouter.showLiveTV(),
        'mute': () => playbackManager.setMute(true),
        'unmute': () => playbackManager.setMute(false),
        'togglemute': () => playbackManager.toggleMute(),
        'channelup': () => playbackManager.channelUp(),
        'channeldown': () => playbackManager.channelDown(),
        'volumedown': () => playbackManager.volumeDown(),
        'volumeup': () => playbackManager.volumeUp(),
        'play': () => playbackManager.unpause(),
        'pause': () => playbackManager.pause(),
        'playpause': () => playbackManager.playPause(),
        'stop': () => {
            if (checkCommandTime('stop')) {
                playbackManager.stop();
            }
        },
        'changezoom': () => playbackManager.toggleAspectRatio(),
        'increaseplaybackrate': () => playbackManager.increasePlaybackRate(),
        'decreaseplaybackrate': () => playbackManager.decreasePlaybackRate(),
        'changeaudiotrack': () => playbackManager.changeAudioStream(),
        'changesubtitletrack': () => playbackManager.changeSubtitleStream(),
        'search': () => appRouter.showSearch(),
        'favorites': () => appRouter.showFavorites(),
        'fastforward': () => playbackManager.fastForward(),
        'rewind': () => playbackManager.rewind(),
        'seek': () => playbackManager.seekMs(options as any),
        'togglefullscreen': () => playbackManager.toggleFullscreen(),
        'disabledisplaymirror': () => playbackManager.enableDisplayMirroring(false),
        'enabledisplaymirror': () => playbackManager.enableDisplayMirroring(true),
        'toggledisplaymirror': () => playbackManager.toggleDisplayMirroring(),
        'nowplaying': () => appRouter.showNowPlaying(),
        'repeatnone': () => playbackManager.setRepeatMode('RepeatNone'),
        'repeatall': () => playbackManager.setRepeatMode('RepeatAll'),
        'repeatone': () => playbackManager.setRepeatMode('RepeatOne'),
        'unknown': () => {}
    };

    const action = keyActions[commandName];
    if (action !== undefined) {
        action();
    } else {
        console.debug(`inputManager: tried to process command with no action assigned: ${commandName}`);
    }
}

if (typeof document !== 'undefined') {
    dom.addEventListener(document, 'click', notify, {
        passive: true
    });
}

const inputManager = {
    handleCommand,
    notify,
    notifyMouseMove,
    idleTime,
    on,
    off
};

export default inputManager;
