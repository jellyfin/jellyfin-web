import dom from '@/utils/dom';
import Events from '@/utils/events.ts';

function getTouches(e) {
    return e.changedTouches || e.targetTouches || e.touches;
}

class TouchHelper {
    constructor(elem, options) {
        options = options || {};
        let touchTarget;
        let touchStartX;
        let touchStartY;
        let lastDeltaX;
        let lastDeltaY;
        let thresholdYMet;
        const self = this;

        const swipeXThreshold = options.swipeXThreshold || 50;
        const swipeYThreshold = options.swipeYThreshold || 50;
        const swipeXMaxY = 30;

        const excludeTagNames = options.ignoreTagNames || [];

        const touchStart = function (e) {
            const touch = getTouches(e)[0];
            touchTarget = null;
            touchStartX = 0;
            touchStartY = 0;
            lastDeltaX = null;
            lastDeltaY = null;
            thresholdYMet = false;

            if (touch) {
                const currentTouchTarget = touch.target;

                if (dom.parentWithTag(currentTouchTarget, excludeTagNames)) {
                    return;
                }

                touchTarget = currentTouchTarget;
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            }
        };

        const touchEnd = function (e) {
            const isTouchMove = e.type === 'touchmove';

            if (touchTarget) {
                const touch = getTouches(e)[0];

                let deltaX;
                let deltaY;

                let clientX;
                let clientY;

                if (touch) {
                    clientX = touch.clientX || 0;
                    clientY = touch.clientY || 0;
                    deltaX = clientX - (touchStartX || 0);
                    deltaY = clientY - (touchStartY || 0);
                } else {
                    deltaX = 0;
                    deltaY = 0;
                }

                const currentDeltaX = lastDeltaX == null ? deltaX : (deltaX - lastDeltaX);
                const currentDeltaY = lastDeltaY == null ? deltaY : (deltaY - lastDeltaY);

                lastDeltaX = deltaX;
                lastDeltaY = deltaY;

                if (deltaX > swipeXThreshold && Math.abs(deltaY) < swipeXMaxY) {
                    Events.trigger(self, 'swiperight', [touchTarget]);
                } else if (deltaX < (0 - swipeXThreshold) && Math.abs(deltaY) < swipeXMaxY) {
                    Events.trigger(self, 'swipeleft', [touchTarget]);
                } else if ((deltaY < (0 - swipeYThreshold) || thresholdYMet) && Math.abs(deltaX) < swipeXMaxY) {
                    thresholdYMet = true;

                    Events.trigger(self, 'swipeup', [touchTarget, {
                        deltaY: deltaY,
                        deltaX: deltaX,
                        clientX: clientX,
                        clientY: clientY,
                        currentDeltaX: currentDeltaX,
                        currentDeltaY: currentDeltaY
                    }]);
                } else if ((deltaY > swipeYThreshold || thresholdYMet) && Math.abs(deltaX) < swipeXMaxY) {
                    thresholdYMet = true;

                    Events.trigger(self, 'swipedown', [touchTarget, {
                        deltaY: deltaY,
                        deltaX: deltaX,
                        clientX: clientX,
                        clientY: clientY,
                        currentDeltaX: currentDeltaX,
                        currentDeltaY: currentDeltaY
                    }]);
                }

                if (isTouchMove && options.preventDefaultOnMove) {
                    e.preventDefault();
                }
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

        this.touchStart = touchStart;
        this.touchEnd = touchEnd;

        dom.addEventListener(elem, 'touchstart', touchStart, {
            passive: true
        });
        if (options.triggerOnMove) {
            dom.addEventListener(elem, 'touchmove', touchEnd, {
                passive: !options.preventDefaultOnMove
            });
        }
        dom.addEventListener(elem, 'touchend', touchEnd, {
            passive: true
        });
        dom.addEventListener(elem, 'touchcancel', touchEnd, {
            passive: true
        });
    }
    destroy() {
        const elem = this.elem;

        if (elem) {
            const touchStart = this.touchStart;
            const touchEnd = this.touchEnd;

            dom.removeEventListener(elem, 'touchstart', touchStart, {
                passive: true
            });
            dom.removeEventListener(elem, 'touchmove', touchEnd, {
                passive: true
            });
            dom.removeEventListener(elem, 'touchend', touchEnd, {
                passive: true
            });
            dom.removeEventListener(elem, 'touchcancel', touchEnd, {
                passive: true
            });
        }

        this.touchStart = null;
        this.touchEnd = null;

        this.elem = null;
    }
}

export default TouchHelper;
