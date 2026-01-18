import { playbackManager } from './playbackmanager';
import layoutManager from '../layoutManager';
import Events from '../../utils/events';

let orientationLocked;

function onOrientationChangeSuccess() {
    orientationLocked = true;
}

function onOrientationChangeError(err) {
    orientationLocked = false;
    console.error('error locking orientation: ' + err);
}

Events.on(playbackManager, 'playbackstart', (e, player) => {
    const isLocalVideo = player.isLocalPlayer && !player.isExternalPlayer && playbackManager.isPlayingVideo(player);

    if (isLocalVideo && layoutManager.mobile) {
        const lockOrientation = window.screen.lockOrientation || window.screen.mozLockOrientation || window.screen.msLockOrientation || (window.screen.orientation?.lock);

        if (lockOrientation) {
            try {
                const promise = lockOrientation('landscape');
                if (promise.then) {
                    promise.then(onOrientationChangeSuccess, onOrientationChangeError);
                } else {
                    // returns a boolean
                    orientationLocked = promise;
                }
            } catch (err) {
                onOrientationChangeError(err);
            }
        }
    }
});

Events.on(playbackManager, 'playbackstop', (e, playbackStopInfo) => {
    if (orientationLocked && !playbackStopInfo.nextMediaType) {
        const unlockOrientation = window.screen.unlockOrientation || window.screen.mozUnlockOrientation || window.screen.msUnlockOrientation || (window.screen.orientation?.unlock);

        if (unlockOrientation) {
            try {
                unlockOrientation();
            } catch (err) {
                console.error('error unlocking orientation: ' + err);
            }
            orientationLocked = false;
        }
    }
});
