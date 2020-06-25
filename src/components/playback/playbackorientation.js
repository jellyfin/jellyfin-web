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
        var lockOrientation = screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation || (screen.orientation && screen.orientation.lock);

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
        var unlockOrientation = screen.unlockOrientation || screen.mozUnlockOrientation || screen.msUnlockOrientation || (screen.orientation && screen.orientation.unlock);

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
