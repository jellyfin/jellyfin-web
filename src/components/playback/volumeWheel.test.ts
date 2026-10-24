import { beforeEach, describe, expect, it, vi } from 'vitest';

import { playbackManager } from './playbackmanager';
import { bindVolumeWheel } from './volumeWheel';

vi.mock('./playbackmanager', () => ({
    playbackManager: {
        volumeUp: vi.fn(),
        volumeDown: vi.fn()
    }
}));

function dispatchWheel(element: HTMLElement, deltaY: number) {
    const event = new WheelEvent('wheel', { cancelable: true, deltaY });
    element.dispatchEvent(event);
    return event;
}

describe('Components: volumeWheel', () => {
    let element: HTMLElement;

    beforeEach(() => {
        vi.clearAllMocks();
        element = document.createElement('div');
        bindVolumeWheel(element);
    });

    it('should increase the volume when scrolling up', () => {
        dispatchWheel(element, -1);

        expect(playbackManager.volumeUp).toHaveBeenCalledTimes(1);
        expect(playbackManager.volumeDown).not.toHaveBeenCalled();
    });

    it('should decrease the volume when scrolling down', () => {
        dispatchWheel(element, 1);

        expect(playbackManager.volumeDown).toHaveBeenCalledTimes(1);
        expect(playbackManager.volumeUp).not.toHaveBeenCalled();
    });

    it('should prevent the page from scrolling', () => {
        const event = dispatchWheel(element, -1);

        expect(event.defaultPrevented).toBe(true);
    });

    it('should do nothing if there is no vertical scrolling', () => {
        const event = dispatchWheel(element, 0);

        expect(playbackManager.volumeUp).not.toHaveBeenCalled();
        expect(playbackManager.volumeDown).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
    });
});
