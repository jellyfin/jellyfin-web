define(["inputManager", "layoutManager"], function (inputManager, layoutManager) {
    "use strict";

    console.log("keyboardnavigation");

    /**
     * Key name mapping.
     */
    // Add more to support old browsers
    var KeyNames = {
        13: "Enter",
        19: "Pause",
        27: "Escape",
        32: "Space",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        // MediaRewind (Tizen/WebOS)
        412: "MediaRewind",
        // MediaStop (Tizen/WebOS)
        413: "MediaStop",
        // MediaPlay (Tizen/WebOS)
        415: "MediaPlay",
        // MediaFastForward (Tizen/WebOS)
        417: "MediaFastForward",
        // Back (WebOS)
        461: "Back",
        // Back (Tizen)
        10009: "Back",
        // MediaTrackPrevious (Tizen)
        10232: "MediaTrackPrevious",
        // MediaTrackNext (Tizen)
        10233: "MediaTrackNext",
        // MediaPlayPause (Tizen)
        10252: "MediaPlayPause"
    };

    var hasFieldKey = false;
    try {
        hasFieldKey = "key" in new KeyboardEvent("keydown");
    } catch (e) {
        console.log("error checking 'key' field");
    }

    if (!hasFieldKey) {
        // Add [a..z]
        for (var i = 65; i <= 90; i++) {
            KeyNames[i] = String.fromCharCode(i).toLowerCase();
        }
    }

    /**
     * Returns key name from event.
     *
     * @param {KeyboardEvent} keyboard event
     * @return {string} key name
     */
    function getKeyName(event) {
        return KeyNames[event.keyCode] || event.key;
    }

    function enable() {
        document.addEventListener("keydown", function (e) {
            var capture = true;

            switch (getKeyName(e)) {
                case "ArrowLeft":
                    inputManager.handle("left");
                    break;
                case "ArrowUp":
                    inputManager.handle("up");
                    break;
                case "ArrowRight":
                    inputManager.handle("right");
                    break;
                case "ArrowDown":
                    inputManager.handle("down");
                    break;

                case "Back":
                    inputManager.handle("back");
                    break;

                case "Escape":
                    if (layoutManager.tv) {
                        inputManager.handle("back");
                    } else {
                        capture = false;
                    }
                    break;

                case "MediaPlay":
                    inputManager.handle("play");
                    break;
                case "Pause":
                    inputManager.handle("pause");
                    break;
                case "MediaPlayPause":
                    inputManager.handle("playpause");
                    break;
                case "MediaRewind":
                    inputManager.handle("rewind");
                    break;
                case "MediaFastForward":
                    inputManager.handle("fastforward");
                    break;
                case "MediaStop":
                    inputManager.handle("stop");
                    break;
                case "MediaTrackPrevious":
                    inputManager.handle("previoustrack");
                    break;
                case "MediaTrackNext":
                    inputManager.handle("nexttrack");
                    break;

                default:
                    capture = false;
            }

            if (capture) {
                console.log("Disabling default event handling");
                e.preventDefault();
            }
        });
    }

    return {
        enable: enable,
        getKeyName: getKeyName
    };
});
