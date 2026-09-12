import { playbackManager } from './playbackmanager';

/**
 * Changes the volume of the current player based on the wheel direction.
 * @param {WheelEvent} e - Wheel event.
 */
function onVolumeWheel(e: WheelEvent) {
    if (e.deltaY === 0) {
        return;
    }

    e.preventDefault();

    if (e.deltaY < 0) {
        playbackManager.volumeUp();
    } else {
        playbackManager.volumeDown();
    }
}

/**
 * Enables volume control using the mouse wheel over the specified element.
 * @param {HTMLElement} element - Element the wheel is used over.
 */
export function bindVolumeWheel(element: HTMLElement) {
    element.addEventListener('wheel', onVolumeWheel);
}
