/**
 * NOTE: This file should not be modified.
 * It is a legacy library that should be replaced at some point.
 */

import browser from '../../scripts/browser';
import layoutManager from '../../components/layoutManager';
import dom from '../../utils/dom';
import focusManager from '../../components/focusManager';
import ResizeObserver from 'resize-observer-polyfill';
import '../../styles/scrollstyles.scss';
import globalize from '../globalize';

/**
* Return type of the value.
*
* @param  {Mixed} value
*
* @return {String}
*/
function type(value) {
    if (value == null) {
        return String(value);
    }

    if (typeof value === 'object' || typeof value === 'function') {
        // eslint-disable-next-line sonarjs/prefer-regexp-exec
        return Object.prototype.toString.call(value).match(/\s([a-z]+)/i)[1].toLowerCase() || 'object';
    }

    return typeof value;
}

/**
 * Disables an event it was triggered on and unbinds itself.
 *
 * @param  {Event} event
 *
 * @return {Void}
 */
function disableOneEvent(event) {
    /*jshint validthis:true */
    event.preventDefault();
    event.stopPropagation();
    this.removeEventListener(event.type, disableOneEvent);
}

/**
 * Make sure that number is within the limits.
 *
 * @param {Number} number
 * @param {Number} min
 * @param {Number} max
 *
 * @return {Number}
 */
function within(number, num1, num2) {
    if (num2 === undefined && globalize.getIsRTL()) {
        return number > num1 ? num1 : number;
    } else if (num2 === undefined) {
        return number < num1 ? num1 : number;
    }
    const min = Math.min(num1, num2);
    const max = Math.max(num1, num2);
    if (number < min) {
        return min;
    } else if (number > max) {
        return max;
    }
    return number;
}

// Other global values
const dragMouseEvents = ['mousemove', 'mouseup'];
const dragTouchEvents = ['touchmove', 'touchend'];
const wheelEvent = (document.implementation.hasFeature('Event.wheel', '3.0') ? 'wheel' : 'mousewheel');
const interactiveElements = ['INPUT', 'SELECT', 'TEXTAREA'];

const scrollerFactory = function (frame, options) {
    // Extend options
    const o = Object.assign({}, {
        slidee: null, // Selector, DOM element, or jQuery object with DOM element representing SLIDEE.
        horizontal: false, // Switch to horizontal mode.

        // Scrolling
        mouseWheel: true,
        scrollBy: 0, // Pixels or items to move per one mouse scroll. 0 to disable scrolling

        // Dragging
        dragSource: null, // Selector or DOM element for catching dragging events. Default is FRAME.
        mouseDragging: 1, // Enable navigation by dragging the SLIDEE with mouse cursor.
        touchDragging: 1, // Enable navigation by dragging the SLIDEE with touch events.
        dragThreshold: 3, // Distance in pixels before Sly recognizes dragging.
        intervactive: null, // Selector for special interactive elements.

        // Mixed options
        speed: 0 // Animations speed in milliseconds. 0 to disable animations.

    }, options);

    const isSmoothScrollSupported = 'scrollBehavior' in document.documentElement.style;

    // native scroll is a must with touch input
    // also use native scroll when scrolling vertically in desktop mode - excluding horizontal because the mouse wheel support is choppy at the moment
    // in cases with firefox, if the smooth scroll api is supported then use that because their implementation is very good
    if (options.allowNativeScroll === false) {
        options.enableNativeScroll = false;
    } else if (isSmoothScrollSupported && ((browser.firefox && !layoutManager.tv) || options.allowNativeSmoothScroll)) {
        // native smooth scroll
        options.enableNativeScroll = true;
    } else if (options.requireAnimation && (browser.animate || browser.supportsCssAnimation())) {
        // transform is the only way to guarantee animation
        options.enableNativeScroll = false;
    } else if (!layoutManager.tv || !browser.animate) {
        options.enableNativeScroll = true;
    }

    // Need this for the magic wheel. With the animated scroll the magic wheel will run off of the screen
    if (browser.web0s) {
        options.enableNativeScroll = true;
    }

    // Private variables
    const self = this;
    self.options = o;

    // Frame
    const slideeElement = o.slidee ? o.slidee : sibling(frame.firstChild)[0];
    self._pos = {
        start: 0,
        center: 0,
        end: 0,
        cur: 0,
        dest: 0
    };

    const transform = !options.enableNativeScroll;

    // Miscellaneous
    const scrollSource = frame;
    const dragSourceElement = o.dragSource ? o.dragSource : frame;
    const dragging = {
        released: 1
    };
    const scrolling = {
        last: 0,
        delta: 0,
        resetTime: 200
    };

    // Expose properties
    self.initialized = 0;
    self.slidee = slideeElement;
    self.options = o;
    self.dragging = dragging;

    const nativeScrollElement = frame;

    function sibling(n, elem) {
        const matched = [];

        for (; n; n = n.nextSibling) {
            if (n.nodeType === 1 && n !== elem) {
                matched.push(n);
            }
        }
        return matched;
    }

    let requiresReflow = true;

    let frameSize = 0;
    let slideeSize = 0;
    function ensureSizeInfo() {
        if (requiresReflow) {
            requiresReflow = false;

            // Reset global variables
            frameSize = slideeElement[o.horizontal ? 'clientWidth' : 'clientHeight'];
            slideeSize = o.scrollWidth || Math.max(slideeElement[o.horizontal ? 'offsetWidth' : 'offsetHeight'], slideeElement[o.horizontal ? 'scrollWidth' : 'scrollHeight']);

            // Set position limits & relatives
            self._pos.end = Math.max(slideeSize - frameSize, 0);
            if (globalize.getIsRTL()) {
                self._pos.end *= -1;
            }
        }
    }

    /**
     * Loading function.
     *
     * Populate arrays, set sizes, bind events, ...
     *
     * @param {Boolean} [isInit] Whether load is called from within self.init().
     * @return {Void}
     */
    function load(isInit) {
        requiresReflow = true;

        if (!isInit) {
            ensureSizeInfo();

            // Fix possible overflowing
            const pos = self._pos;
            self.slideTo(within(pos.dest, pos.start, pos.end));
        }
    }

    function initFrameResizeObserver() {
        const observerOptions = {};

        self.frameResizeObserver = new ResizeObserver(onResize, observerOptions);

        self.frameResizeObserver.observe(frame);
    }

    self.reload = function () {
        load();
    };

    self.getScrollEventName = function () {
        return transform ? 'scrollanimate' : 'scroll';
    };

    self.getScrollSlider = function () {
        return slideeElement;
    };

    self.getScrollFrame = function () {
        return frame;
    };

    function nativeScrollTo(container, pos, immediate) {
        if (container.scroll) {
            if (o.horizontal) {
                container.scroll({
                    left: pos,
                    behavior: immediate ? 'instant' : 'smooth'
                });
            } else {
                container.scroll({
                    top: pos,
                    behavior: immediate ? 'instant' : 'smooth'
                });
            }
        } else if (!immediate && container.scrollTo) {
            if (o.horizontal) {
                container.scrollTo(Math.round(pos), 0);
            } else {
                container.scrollTo(0, Math.round(pos));
            }
        } else if (o.horizontal) {
            container.scrollLeft = Math.round(pos);
        } else {
            container.scrollTop = Math.round(pos);
        }
    }

    let lastAnimate;

    /**
         * Animate to a position.
         *
         * @param {Int}  newPos    New position.
         * @param {Bool} immediate Reposition immediately without an animation.
         *
         * @return {Void}
         */
    self.slideTo = function (newPos, immediate, fullItemPos) {
        ensureSizeInfo();
        const pos = self._pos;

        if (layoutManager.tv && globalize.getIsRTL()) {
            newPos = within(-newPos, pos.start);
        } else if (layoutManager.tv) {
            newPos = within(newPos, pos.start);
        } else {
            newPos = within(newPos, pos.start, pos.end);
        }

        if (!transform) {
            nativeScrollTo(nativeScrollElement, newPos, immediate);
            return;
        }

        // Update the animation object
        const from = pos.cur;
        immediate = immediate || dragging.init || !o.speed;

        const now = new Date().getTime();

        if (o.autoImmediate && !immediate && (now - (lastAnimate || 0)) <= 50) {
            immediate = true;
        }

        if (!immediate && o.skipSlideToWhenVisible && fullItemPos?.isVisible) {
            return;
        }

        // Start animation rendering
        // NOTE the dependency was modified here to fix a scrollbutton issue
        pos.dest = newPos;
        renderAnimateWithTransform(from, newPos, immediate);
        lastAnimate = now;
    };

    function setStyleProperty(elem, name, value, speed, resetTransition) {
        const style = elem.style;

        if (resetTransition || browser.edge) {
            style.transition = 'none';
            void elem.offsetWidth;
        }

        style.transition = 'transform ' + speed + 'ms ease-out';
        style[name] = value;
    }

    function dispatchScrollEventIfNeeded() {
        if (o.dispatchScrollEvent) {
            frame.dispatchEvent(new CustomEvent(self.getScrollEventName(), {
                bubbles: true,
                cancelable: false
            }));
        }
    }

    function renderAnimateWithTransform(fromPosition, toPosition, immediate) {
        let speed = o.speed;

        if (immediate) {
            speed = o.immediateSpeed || 50;
        }

        if (o.horizontal) {
            setStyleProperty(slideeElement, 'transform', 'translateX(' + (-Math.round(toPosition)) + 'px)', speed);
        } else {
            setStyleProperty(slideeElement, 'transform', 'translateY(' + (-Math.round(toPosition)) + 'px)', speed);
        }
        self._pos.cur = toPosition;

        dispatchScrollEventIfNeeded();
    }

    function getBoundingClientRect(elem) {
        // Support: BlackBerry 5, iOS 3 (original iPhone)
        // If we don't have gBCR, just use 0,0 rather than error
        if (elem.getBoundingClientRect) {
            return elem.getBoundingClientRect();
        } else {
            return { top: 0, left: 0 };
        }
    }

    /**
     * Returns the position object.
     *
     * @param {Mixed} item
     *
     * @return {Object}
     */
    self.getPos = function (item) {
        const scrollElement = transform ? slideeElement : nativeScrollElement;
        const slideeOffset = getBoundingClientRect(scrollElement);
        const itemOffset = getBoundingClientRect(item);

        let horizontalOffset = itemOffset.left - slideeOffset.left;
        if (globalize.getIsRTL()) {
            horizontalOffset = slideeOffset.right - itemOffset.right;
        }

        let offset = o.horizontal ? horizontalOffset : itemOffset.top - slideeOffset.top;

        let size = o.horizontal ? itemOffset.width : itemOffset.height;
        if (!size && size !== 0) {
            size = item[o.horizontal ? 'offsetWidth' : 'offsetHeight'];
        }

        let centerOffset = o.centerOffset || 0;

        if (!transform) {
            centerOffset = 0;
            if (o.horizontal) {
                offset += nativeScrollElement.scrollLeft;
            } else {
                offset += nativeScrollElement.scrollTop;
            }
        }

        ensureSizeInfo();

        const currentStart = self._pos.cur;
        let currentEnd = currentStart + frameSize;
        if (globalize.getIsRTL()) {
            currentEnd = currentStart - frameSize;
        }

        console.debug('offset:' + offset + ' currentStart:' + currentStart + ' currentEnd:' + currentEnd);
        const isVisible = offset >= Math.min(currentStart, currentEnd)
            && (globalize.getIsRTL() ? (offset - size) : (offset + size)) <= Math.max(currentStart, currentEnd);

        return {
            start: offset,
            center: offset + centerOffset - (frameSize / 2) + (size / 2),
            end: offset - frameSize + size,
            size,
            isVisible
        };
    };

    self.getCenterPosition = function (item) {
        ensureSizeInfo();

        const pos = self.getPos(item);
        return within(pos.center, pos.start, pos.end);
    };

    function dragInitSlidee(event) {
        const isTouch = event.type === 'touchstart';

        // Ignore when already in progress, or interactive element in non-touch navivagion
        if (dragging.init || !isTouch && isInteractive(event.target)) {
            return;
        }

        // SLIDEE dragging conditions
        if (!(isTouch ? o.touchDragging : o.mouseDragging && event.which < 2)) {
            return;
        }

        if (!isTouch) {
            // prevents native image dragging in Firefox
            event.preventDefault();
        }

        // Reset dragging object
        dragging.released = 0;

        // Properties used in dragHandler
        dragging.init = 0;
        dragging.source = event.target;
        dragging.touch = isTouch;
        const pointer = isTouch ? event.touches[0] : event;
        dragging.initX = pointer.pageX;
        dragging.initY = pointer.pageY;
        dragging.initPos = self._pos.cur;
        dragging.start = +new Date();
        dragging.time = 0;
        dragging.path = 0;
        dragging.delta = 0;
        dragging.locked = 0;
        dragging.pathToLock = isTouch ? 30 : 10;

        // Bind dragging events
        if (transform) {
            if (isTouch) {
                dragTouchEvents.forEach(function (eventName) {
                    dom.addEventListener(document, eventName, dragHandler, {
                        passive: true
                    });
                });
            } else {
                dragMouseEvents.forEach(function (eventName) {
                    dom.addEventListener(document, eventName, dragHandler, {
                        passive: true
                    });
                });
            }
        }
    }

    /**
     * Handler for dragging scrollbar handle or SLIDEE.
     *
     * @param  {Event} event
     *
     * @return {Void}
     */
    function dragHandler(event) {
        dragging.released = event.type === 'mouseup' || event.type === 'touchend';
        const eventName = dragging.released ? 'changedTouches' : 'touches';
        const pointer = dragging.touch ? event[eventName][0] : event;
        dragging.pathX = pointer.pageX - dragging.initX;
        dragging.pathY = pointer.pageY - dragging.initY;
        dragging.path = Math.sqrt(Math.pow(dragging.pathX, 2) + Math.pow(dragging.pathY, 2));
        dragging.delta = o.horizontal ? dragging.pathX : dragging.pathY;

        if (!dragging.released && dragging.path < 1) {
            return;
        }

        // We haven't decided whether this is a drag or not...
        if (!dragging.init) {
            // If the drag path was very short, maybe it's not a drag?
            if (dragging.path < o.dragThreshold) {
                // If the pointer was released, the path will not become longer and it's
                // definitely not a drag. If not released yet, decide on next iteration
                return dragging.released ? dragEnd() : undefined;
            } else if (o.horizontal ? Math.abs(dragging.pathX) > Math.abs(dragging.pathY) : Math.abs(dragging.pathX) < Math.abs(dragging.pathY)) {
                // If dragging path is sufficiently long we can confidently start a drag
                // if drag is in different direction than scroll, ignore it
                dragging.init = 1;
            } else {
                return dragEnd();
            }
        }

        // Disable click on a source element, as it is unwelcome when dragging
        if (!dragging.locked && dragging.path > dragging.pathToLock) {
            dragging.locked = 1;
            dragging.source.addEventListener('click', disableOneEvent);
        }

        // Cancel dragging on release
        if (dragging.released) {
            dragEnd();
        }

        self.slideTo(Math.round(dragging.initPos - dragging.delta));
    }

    /**
     * Stops dragging and cleans up after it.
     *
     * @return {Void}
     */
    function dragEnd() {
        dragging.released = true;

        dragTouchEvents.forEach(function (eventName) {
            dom.removeEventListener(document, eventName, dragHandler, {
                passive: true
            });
        });

        dragMouseEvents.forEach(function (eventName) {
            dom.removeEventListener(document, eventName, dragHandler, {
                passive: true
            });
        });

        // Make sure that disableOneEvent is not active in next tick.
        setTimeout(function () {
            dragging.source.removeEventListener('click', disableOneEvent);
        });

        dragging.init = 0;
    }

    /**
     * Check whether element is interactive.
     *
     * @return {Boolean}
     */
    function isInteractive(element) {
        while (element) {
            if (interactiveElements.indexOf(element.tagName) !== -1) {
                return true;
            }

            element = element.parentNode;
        }
        return false;
    }

    /**
     * Mouse wheel delta normalization.
     *
     * @param  {Event} event
     *
     * @return {Int}
     */
    function normalizeWheelDelta(event) {
        // JELLYFIN MOD: Only use deltaX for horizontal scroll and remove IE8 support
        scrolling.curDelta = o.horizontal ? event.deltaX : event.deltaY;
        // END JELLYFIN MOD

        if (transform) {
            scrolling.curDelta /= event.deltaMode === 1 ? 3 : 100;
        }
        return scrolling.curDelta;
    }

    /**
     * Mouse scrolling handler.
     *
     * @param  {Event} event
     *
     * @return {Void}
     */
    function scrollHandler(event) {
        ensureSizeInfo();
        const pos = self._pos;
        // Ignore if there is no scrolling to be done
        if (!o.scrollBy || pos.start === pos.end) {
            return;
        }
        let delta = normalizeWheelDelta(event);

        if (transform) {
            if (o.horizontal && event.deltaX !== 0
                && (event.deltaY >= -5 && event.deltaY <= 5)
                && (pos.dest + o.scrollBy * delta > 0)
                && (pos.dest + o.scrollBy * delta < pos.end)
            ) {
                event.preventDefault();
            }
            self.slideBy(o.scrollBy * delta);
        } else {
            if (isSmoothScrollSupported) {
                delta *= 12;
            }

            if (o.horizontal) {
                nativeScrollElement.scrollLeft += delta;
            } else {
                nativeScrollElement.scrollTop += delta;
            }
        }
    }

    /**
     * Destroys instance and everything it created.
     *
     * @return {Void}
     */
    self.destroy = function () {
        if (self.frameResizeObserver) {
            self.frameResizeObserver.disconnect();
            self.frameResizeObserver = null;
        }

        // Reset native FRAME element scroll
        dom.removeEventListener(frame, 'scroll', resetScroll, {
            passive: true
        });

        dom.removeEventListener(scrollSource, wheelEvent, scrollHandler, {
            passive: false
        });

        dom.removeEventListener(dragSourceElement, 'touchstart', dragInitSlidee, {
            passive: true
        });

        dom.removeEventListener(frame, 'click', onFrameClick, {
            passive: true,
            capture: true
        });

        dom.removeEventListener(dragSourceElement, 'mousedown', dragInitSlidee, {
            //passive: true
        });

        scrollSource.removeAttribute(`data-scroll-mode-${o.horizontal ? 'x' : 'y'}`);

        // Reset initialized status and return the instance
        self.initialized = 0;
        return self;
    };

    let contentRect = {};

    function onResize(entries) {
        const entry = entries[0];

        if (entry) {
            const newRect = entry.contentRect;

            // handle element being hidden
            if (newRect.width === 0 || newRect.height === 0) {
                return;
            }

            if (newRect.width !== contentRect.width || newRect.height !== contentRect.height) {
                contentRect = newRect;

                load(false);
            }
        }
    }

    function resetScroll() {
        if (o.horizontal) {
            this.scrollLeft = 0;
        } else {
            this.scrollTop = 0;
        }
    }

    function onFrameClick(e) {
        if (e.which === 1) {
            const focusableParent = focusManager.focusableParent(e.target);
            if (focusableParent && focusableParent !== document.activeElement) {
                focusableParent.focus();
            }
        }
    }

    self.getScrollPosition = function () {
        if (transform) {
            return self._pos.cur;
        }

        if (o.horizontal) {
            return nativeScrollElement.scrollLeft;
        } else {
            return nativeScrollElement.scrollTop;
        }
    };

    self.getScrollSize = function () {
        if (transform) {
            return slideeSize;
        }

        if (o.horizontal) {
            return nativeScrollElement.scrollWidth;
        } else {
            return nativeScrollElement.scrollHeight;
        }
    };

    /**
     * Initialize.
     *
     * @return {Object}
     */
    self.init = function () {
        if (self.initialized) {
            return;
        }

        if (!transform) {
            if (o.horizontal) {
                if (layoutManager.desktop && !o.hideScrollbar) {
                    nativeScrollElement.classList.add('scrollX');
                } else {
                    nativeScrollElement.classList.add('scrollX');
                    nativeScrollElement.classList.add('hiddenScrollX');

                    if (layoutManager.tv && o.allowNativeSmoothScroll !== false) {
                        nativeScrollElement.classList.add('smoothScrollX');
                    }
                }

                if (o.forceHideScrollbars) {
                    nativeScrollElement.classList.add('hiddenScrollX-forced');
                }
            } else {
                if (layoutManager.desktop && !o.hideScrollbar) {
                    nativeScrollElement.classList.add('scrollY');
                } else {
                    nativeScrollElement.classList.add('scrollY');
                    nativeScrollElement.classList.add('hiddenScrollY');

                    if (layoutManager.tv && o.allowNativeSmoothScroll !== false) {
                        nativeScrollElement.classList.add('smoothScrollY');
                    }
                }

                if (o.forceHideScrollbars) {
                    nativeScrollElement.classList.add('hiddenScrollY-forced');
                }
            }
        } else {
            frame.style.overflow = 'hidden';
            slideeElement.style['will-change'] = 'transform';
            slideeElement.style.transition = 'transform ' + o.speed + 'ms ease-out';

            if (o.horizontal) {
                slideeElement.classList.add('animatedScrollX');
            } else {
                slideeElement.classList.add('animatedScrollY');
            }
        }

        scrollSource.setAttribute(`data-scroll-mode-${o.horizontal ? 'x' : 'y'}`, 'custom');

        if (transform || layoutManager.tv) {
            // This can prevent others from being able to listen to mouse events
            dom.addEventListener(dragSourceElement, 'mousedown', dragInitSlidee, {
                //passive: true
            });
        }

        initFrameResizeObserver();

        if (transform) {
            dom.addEventListener(dragSourceElement, 'touchstart', dragInitSlidee, {
                passive: true
            });

            if (!o.horizontal) {
                dom.addEventListener(frame, 'scroll', resetScroll, {
                    passive: true
                });
            }

            if (o.mouseWheel) {
                // Scrolling navigation
                dom.addEventListener(scrollSource, wheelEvent, scrollHandler, {
                    passive: false
                });
            }
        } else if (o.horizontal && o.mouseWheel) {
            // Don't bind to mouse events with vertical scroll since the mouse wheel can handle this natively

            // Scrolling navigation
            dom.addEventListener(scrollSource, wheelEvent, scrollHandler, {
                passive: false
            });
        }

        dom.addEventListener(frame, 'click', onFrameClick, {
            passive: true,
            capture: true
        });

        // Mark instance as initialized
        self.initialized = 1;

        // Load
        load(true);

        // Return instance
        return self;
    };
};

/**
 * Slide SLIDEE by amount of pixels.
 *
 * @param {Int}  delta     Pixels/Items. Positive means forward, negative means backward.
 * @param {Bool} immediate Reposition immediately without an animation.
 *
 * @return {Void}
 */
scrollerFactory.prototype.slideBy = function (delta, immediate) {
    if (!delta) {
        return;
    }
    this.slideTo(this._pos.dest + delta, immediate);
};

/**
 * Core method for handling `toLocation` methods.
 *
 * @param  {String} location
 * @param  {Mixed}  item
 * @param  {Bool}   immediate
 *
 * @return {Void}
 */
scrollerFactory.prototype.to = function (location, item, immediate) {
    // Optional arguments logic
    if (type(item) === 'boolean') {
        immediate = item;
        item = undefined;
    }

    if (item === undefined) {
        this.slideTo(this._pos[location], immediate);
    } else {
        const itemPos = this.getPos(item);

        if (itemPos) {
            this.slideTo(itemPos[location], immediate, itemPos);
        }
    }
};

/**
 * Animate element or the whole SLIDEE to the start of the frame.
 *
 * @param {Mixed} item      Item DOM element, or index starting at 0. Omitting will animate SLIDEE.
 * @param {Bool}  immediate Reposition immediately without an animation.
 *
 * @return {Void}
 */
scrollerFactory.prototype.toStart = function (item, immediate) {
    this.to('start', item, immediate);
};

/**
 * Animate element or the whole SLIDEE to the end of the frame.
 *
 * @param {Mixed} item      Item DOM element, or index starting at 0. Omitting will animate SLIDEE.
 * @param {Bool}  immediate Reposition immediately without an animation.
 *
 * @return {Void}
 */
scrollerFactory.prototype.toEnd = function (item, immediate) {
    this.to('end', item, immediate);
};

/**
 * Animate element or the whole SLIDEE to the center of the frame.
 *
 * @param {Mixed} item      Item DOM element, or index starting at 0. Omitting will animate SLIDEE.
 * @param {Bool}  immediate Reposition immediately without an animation.
 *
 * @return {Void}
 */
scrollerFactory.prototype.toCenter = function (item, immediate) {
    this.to('center', item, immediate);
};

scrollerFactory.create = function (frame, options) {
    // eslint-disable-next-line new-cap
    const instance = new scrollerFactory(frame, options);
    return Promise.resolve(instance);
};

export default scrollerFactory;
