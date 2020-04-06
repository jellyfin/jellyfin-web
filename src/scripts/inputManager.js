define(['playbackManager', 'focusManager', 'appRouter', 'dom', 'apphost'], function (playbackManager, focusManager, appRouter, dom, appHost) {
    'use strict';

    var lastInputTime = new Date().getTime();

    function notify() {
        lastInputTime = new Date().getTime();
        handleCommand('unknown');
    }

    function notifyMouseMove() {
        lastInputTime = new Date().getTime();
    }

    function idleTime() {
        return new Date().getTime() - lastInputTime;
    }

    function select(sourceElement) {
        sourceElement.click();
    }

    var eventListenerCount = 0;
    function on(scope, fn) {
        eventListenerCount++;
        dom.addEventListener(scope, 'command', fn, {});
    }

    function off(scope, fn) {
        if (eventListenerCount) {
            eventListenerCount--;
        }
        dom.removeEventListener(scope, 'command', fn, {});
    }

    var commandTimes = {};

    function checkCommandTime(command) {

        var last = commandTimes[command] || 0;
        var now = new Date().getTime();

        if ((now - last) < 1000) {
            return false;
        }

        commandTimes[command] = now;
        return true;
    }

    function handleCommand(commandName, options) {

        lastInputTime = new Date().getTime();

        var sourceElement = (options ? options.sourceElement : null);

        if (sourceElement) {
            sourceElement = focusManager.focusableParent(sourceElement);
        }

        if (!sourceElement) {
            sourceElement = document.activeElement || window;

            var dlg = document.querySelector('.dialogContainer .dialog.opened');

            if (dlg && (!sourceElement || !dlg.contains(sourceElement))) {
                sourceElement = dlg;
            }
        }

        if (eventListenerCount) {
            var customEvent = new CustomEvent("command", {
                detail: {
                    command: commandName
                },
                bubbles: true,
                cancelable: true
            });

            var eventResult = sourceElement.dispatchEvent(customEvent);
            if (!eventResult) {
                // event cancelled
                return;
            }
        }

        const keyActions = (command) => ({
            'up': focusManager.moveUp(sourceElement),
            'down': focusManager.moveDown(sourceElement),
            'left': focusManager.moveLeft(sourceElement),
            'right': focusManager.moveRight(sourceElement),
            'home': appRouter.goHome(),
            'settings': appRouter.showSettings(),
            'back': () => {
                if (appRouter.canGoBack()) {
                    appRouter.back();
                } else if (appHost.supports('exit')) {
                    appHost.exit();
                }
            },
            'select': select(sourceElement),
            'nextchapter': playbackManager.nextChapter(),
            'next': playbackManager.nextTrack(),
            'nexttrack': playbackManager.nextTrack(),
            'previous': playbackManager.previousTrack(),
            'previoustrack': playbackManager.previousTrack(),
            'previouschapter': playbackManager.previousChapter(),
            'guide': appRouter.showGuide(),
            'recordedtv': appRouter.showRecordedTV(),
            'livetv': appRouter.showLiveTV(),
            'mute': playbackManager.setMute(true),
            'unmute': playbackManager.setMute(false),
            'togglemute': playbackManager.toggleMute(),
            'channelup': playbackManager.channelUp(),
            'channeldown': playbackManager.channelDown(),
            'volumedown': playbackManager.volumeDown(),
            'volumeup': playbackManager.volumeUp(),
            'play': playbackManager.unpause(),
            'pause': playbackManager.pause(),
            'playpause': playbackManager.playPause(),
            'stop': () => {
                if (checkCommandTime('stop')) {
                    playbackManager.stop();
                }
            },
            'changezoom': playbackManager.toggleAspectRatio(),
            'changeaudiotrack': playbackManager.changeAudioStream(),
            'changesubtitletrack': playbackManager.changeSubtitleStream(),
            'search': appRouter.showSearch(),
            'favorites': appRouter.showFavorites(),
            'fastforward': playbackManager.fastForward(),
            'rewind': playbackManager.rewind(),
            'togglefullscreen': playbackManager.toggleFullscreen(),
            'disabledisplaymirror': playbackManager.enableDisplayMirroring(false),
            'enabledisplaymirror': playbackManager.enableDisplayMirroring(true),
            'toggledisplaymirror': playbackManager.toggleDisplayMirroring(),
            'nowplaying': appRouter.showNowPlaying(),
            'repeatnone': playbackManager.setRepeatMode('RepeatNone'),
            'repeatall': playbackManager.setRepeatMode('RepeatAll'),
            'repeatone': playbackManager.setRepeatMode('RepeatOne')
        })[command];

        keyActions(commandName);
    }

    dom.addEventListener(document, 'click', notify, {
        passive: true
    });

    return {
        trigger: handleCommand,
        handle: handleCommand,
        notify: notify,
        notifyMouseMove: notifyMouseMove,
        idleTime: idleTime,
        on: on,
        off: off
    };
});
