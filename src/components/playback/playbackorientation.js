import playbackManager from 'playbackManager';
import layoutManager from 'layoutManager';
import events from 'events';

let orientationLocked;

function onOrientationChangeSuccess() {
    orientationLocked = true;
}

function onOrientationChangeError(err) {
    orientationLocked = false;
    console.error('error locking orientation: ' + err);
}

events.on(playbackManager, 'playbackstart', function (e, player, state) {
    const isLocalVideo = player.isLocalPlayer && !player.isExternalPlayer && playbackManager.isPlayingVideo(player);

    if (isLocalVideo && layoutManager.mobile) {
        /* eslint-disable-next-line compat/compat */
        const lockOrientation = window.screen.lockOrientation || window.screen.mozLockOrientation || window.screen.msLockOrientation || (window.screen.orientation && window.screen.orientation.lock);

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

events.on(playbackManager, 'playbackstop', function (e, playbackStopInfo) {
    if (orientationLocked && !playbackStopInfo.nextMediaType) {
        /* eslint-disable-next-line compat/compat */
        const unlockOrientation = window.screen.unlockOrientation || window.screen.mozUnlockOrientation || window.screen.msUnlockOrientation || (window.screen.orientation && window.screen.orientation.unlock);

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
