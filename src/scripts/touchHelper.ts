import dom from '../utils/dom';
import Events from '../utils/events';

function getTouches(e: TouchEvent | any) {
    return e.changedTouches || e.targetTouches || e.touches;
}

export interface TouchHelperOptions {
    swipeXThreshold?: number;
    swipeYThreshold?: number;
    ignoreTagNames?: string[];
    triggerOnMove?: boolean;
    preventDefaultOnMove?: boolean;
}

class TouchHelper {
    private touchStartHandler: (e: TouchEvent) => void;
    private touchEndHandler: (e: TouchEvent) => void;
    private elem: HTMLElement | null;

    constructor(elem: HTMLElement, options: TouchHelperOptions = {}) {
        this.elem = elem;
        let touchTarget: EventTarget | null = null;
        let touchStartX = 0;
        let touchStartY = 0;
        let lastDeltaX: number | null = null;
        let lastDeltaY: number | null = null;
        let thresholdYMet = false;

        const swipeXThreshold = options.swipeXThreshold || 50;
        const swipeYThreshold = options.swipeYThreshold || 50;
        const swipeXMaxY = 30;
        const excludeTagNames = options.ignoreTagNames || [];

        this.touchStartHandler = (e: TouchEvent) => {
            const touch = getTouches(e)[0];
            touchTarget = null;
            touchStartX = 0;
            touchStartY = 0;
            lastDeltaX = null;
            lastDeltaY = null;
            thresholdYMet = false;

            if (touch) {
                if (dom.parentWithTag(touch.target as HTMLElement, excludeTagNames)) return;
                touchTarget = touch.target;
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            }
        };

        this.touchEndHandler = (e: TouchEvent) => {
            const isTouchMove = e.type === 'touchmove';
            if (touchTarget) {
                const touch = getTouches(e)[0];
                let deltaX = 0;
                let deltaY = 0;
                let clientX = 0;
                let clientY = 0;

                if (touch) {
                    clientX = touch.clientX || 0;
                    clientY = touch.clientY || 0;
                    deltaX = clientX - touchStartX;
                    deltaY = clientY - touchStartY;
                }

                const currentDeltaX = lastDeltaX == null ? deltaX : deltaX - lastDeltaX;
                const currentDeltaY = lastDeltaY == null ? deltaY : deltaY - lastDeltaY;
                lastDeltaX = deltaX;
                lastDeltaY = deltaY;

                if (deltaX > swipeXThreshold && Math.abs(deltaY) < swipeXMaxY) {
                    Events.trigger(this, 'swiperight', [touchTarget]);
                } else if (deltaX < 0 - swipeXThreshold && Math.abs(deltaY) < swipeXMaxY) {
                    Events.trigger(this, 'swipeleft', [touchTarget]);
                } else if ((deltaY < 0 - swipeYThreshold || thresholdYMet) && Math.abs(deltaX) < swipeXMaxY) {
                    thresholdYMet = true;
                    Events.trigger(this, 'swipeup', [
                        touchTarget,
                        { deltaY, deltaX, clientX, clientY, currentDeltaX, currentDeltaY }
                    ]);
                } else if ((deltaY > swipeYThreshold || thresholdYMet) && Math.abs(deltaX) < swipeXMaxY) {
                    thresholdYMet = true;
                    Events.trigger(this, 'swipedown', [
                        touchTarget,
                        { deltaY, deltaX, clientX, clientY, currentDeltaX, currentDeltaY }
                    ]);
                }

                if (isTouchMove && options.preventDefaultOnMove) e.preventDefault();
            }

            if (!isTouchMove) {
                touchTarget = null;
                touchStartX = 0;
                touchStartY = 0;
                lastDeltaX = null;
                lastDeltaY = null;
                thresholdYMet = false;
            }
        };

        dom.addEventListener(elem, 'touchstart', this.touchStartHandler as any, { passive: true });
        if (options.triggerOnMove) {
            dom.addEventListener(elem, 'touchmove', this.touchEndHandler as any, { passive: !options.preventDefaultOnMove });
        }
        dom.addEventListener(elem, 'touchend', this.touchEndHandler as any, { passive: true });
        dom.addEventListener(elem, 'touchcancel', this.touchEndHandler as any, { passive: true });
    }

    destroy(): void {
        if (this.elem) {
            dom.removeEventListener(this.elem, 'touchstart', this.touchStartHandler as any, { passive: true });
            dom.removeEventListener(this.elem, 'touchmove', this.touchEndHandler as any, { passive: true });
            dom.removeEventListener(this.elem, 'touchend', this.touchEndHandler as any, { passive: true });
            dom.removeEventListener(this.elem, 'touchcancel', this.touchEndHandler as any, { passive: true });
        }
        this.elem = null;
    }
}

export default TouchHelper;
