define("playbackManager", ["components/playback/playbackmanager"],
    function(playbackManager) {
        window.addEventListener("beforeunload", function () {
            try {
                playbackManager.onAppClose();
            } catch (err) {
                console.log("error in onAppClose: " + err);
            }
        });
        return playbackManager;
    });