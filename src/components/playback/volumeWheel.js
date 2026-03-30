export let isWheelingVolume = false;
let wheelVolumeTimer;
let wheelEventX = 0;
let wheelEventY = 0;

export function requestBubbleUpdate(volumeSlider, x, y) {
    if (volumeSlider && !volumeSlider.dragging) {
        const eventName = window.PointerEvent ? 'pointermove' : 'mousemove';
        const EventClass = window.PointerEvent || window.MouseEvent;
        volumeSlider.dispatchEvent(new EventClass(eventName, {
            clientX: x,
            clientY: y,
            bubbles: true
        }));
    }
}

export function updateVolumeSliderBubble(volumeSlider) {
    if (isWheelingVolume && volumeSlider && !volumeSlider.dragging) {
        requestBubbleUpdate(volumeSlider, wheelEventX, wheelEventY);
    }
}

function onVolumeWheel(e, volumeSlider, playbackManager, getCurrentPlayer) {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || e.deltaY === 0) {
        return;
    }

    e.preventDefault();

    isWheelingVolume = true;
    wheelEventX = e.clientX;
    wheelEventY = e.clientY;

    clearTimeout(wheelVolumeTimer);
    wheelVolumeTimer = setTimeout(() => {
        isWheelingVolume = false;
        if (volumeSlider) requestBubbleUpdate(volumeSlider, wheelEventX, wheelEventY);
    }, 600);

    if (e.deltaY < 0) {
        playbackManager.volumeUp(currentPlayer);
    } else {
        playbackManager.volumeDown(currentPlayer);
    }

    setTimeout(() => {
        if (volumeSlider) requestBubbleUpdate(volumeSlider, wheelEventX, wheelEventY);
    }, 10);
}

export function bindVolumeWheelHandler(volumeSliderContainer, volumeSlider, playbackManager, getCurrentPlayer) {
    if (volumeSlider) {
        volumeSlider.getBubbleText = function (percent, value) {
            const currentPlayer = getCurrentPlayer();
            if (isWheelingVolume && currentPlayer && !volumeSlider.dragging) {
                return Math.round(currentPlayer.getVolume());
            }
            return Math.round(value);
        };
    }

    if (volumeSliderContainer) {
        volumeSliderContainer.addEventListener('wheel', (e) => onVolumeWheel(e, volumeSlider, playbackManager, getCurrentPlayer), { passive: false });
    }
}
