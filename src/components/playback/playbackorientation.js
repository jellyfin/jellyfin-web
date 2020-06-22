import playbackManager from 'playbackManager';
import layoutManager from 'layoutManager';
import events from 'events';

var orientationLocked;

function onOrientationChangeSuccess() {
    orientationLocked = true;
}

function onOrientationChangeError(err) {
    orientationLocked = false;
    console.error('error locking orientation: ' + err);
}

events.on(playbackManager, 'playbackstart', function (e, player, state) {

    var isLocalVideo = player.isLocalPlayer && !player.isExternalPlayer && playbackManager.isPlayingVideo(player);

    if (isLocalVideo && layoutManager.mobile) {
        /* eslint-disable-next-line compat/compat */
        var lockOrientation = window.screen.lockOrientation || window.creen.mozLockOrientation || window.screen.msLockOrientation || (window.screen.orientation && window.screen.orientation.lock);

        if (lockOrientation) {

            try {
                var promise = lockOrientation('landscape');
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
        var unlockOrientation = window.screen.unlockOrientation || window.screen.mozUnlockOrientation || window.screen.msUnlockOrientation || (window.screen.orientation && window.screen.orientation.unlock);

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
