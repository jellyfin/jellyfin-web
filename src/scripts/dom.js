
/**
 * Useful DOM utilities.
 * @module components/dom
 */

/**
     * Returns parent of element with specified attribute value.
     * @param {HTMLElement} elem - Element whose parent need to find.
     * @param {string} name - Attribute name.
     * @param {mixed} [value] - Attribute value.
     * @returns {HTMLElement} Parent with specified attribute value.
     */
export function parentWithAttribute(elem, name, value) {
    while ((value ? elem.getAttribute(name) !== value : !elem.getAttribute(name))) {
        elem = elem.parentNode;

        if (!elem?.getAttribute) {
            return null;
        }
    }

    return elem;
}

/**
     * Returns parent of element with one of specified tag names.
     * @param {HTMLElement} elem - Element whose parent need to find.
     * @param {(string|Array)} tagNames - Tag name or array of tag names.
     * @returns {HTMLElement} Parent with one of specified tag names.
     */
export function parentWithTag(elem, tagNames) {
    // accept both string and array passed in
    if (!Array.isArray(tagNames)) {
        tagNames = [tagNames];
    }

    while (tagNames.indexOf(elem.tagName || '') === -1) {
        elem = elem.parentNode;

        if (!elem) {
            return null;
        }
    }

    return elem;
}

/**
     * Returns _true_ if class list contains one of specified names.
     * @param {DOMTokenList} classList - Class list.
     * @param {Array} classNames - Array of class names.
     * @returns {boolean} _true_ if class list contains one of specified names.
     */
function containsAnyClass(classList, classNames) {
    for (let i = 0, length = classNames.length; i < length; i++) {
        if (classList.contains(classNames[i])) {
            return true;
        }
    }
    return false;
}

/**
     * Returns parent of element with one of specified class names.
     * @param {HTMLElement} elem - Element whose parent need to find.
     * @param {(string|Array)} classNames - Class name or array of class names.
     * @returns {HTMLElement|null} Parent with one of specified class names.
     */
export function parentWithClass(elem, classNames) {
    // accept both string and array passed in
    if (!Array.isArray(classNames)) {
        classNames = [classNames];
    }

    while (!elem.classList || !containsAnyClass(elem.classList, classNames)) {
        elem = elem.parentNode;

        if (!elem) {
            return null;
        }
    }

    return elem;
}

let supportsCaptureOption = false;
try {
    const opts = Object.defineProperty({}, 'capture', {
        get: function () {
            supportsCaptureOption = true;
            return null;
        }
    });
    window.addEventListener('test', null, opts);
} catch {
    // no capture support
}

/**
     * Adds event listener to specified target.
     * @param {EventTarget} target - Event target.
     * @param {string} type - Event type.
     * @param {function} handler - Event handler.
     * @param {Object} [options] - Listener options.
     */
export function addEventListener(target, type, handler, options) {
    let optionsOrCapture = options || {};
    if (!supportsCaptureOption) {
        optionsOrCapture = optionsOrCapture.capture;
    }
    target.addEventListener(type, handler, optionsOrCapture);
}

/**
     * Removes event listener from specified target.
     * @param {EventTarget} target - Event target.
     * @param {string} type - Event type.
     * @param {function} handler - Event handler.
     * @param {Object} [options] - Listener options.
     */
export function removeEventListener(target, type, handler, options) {
    let optionsOrCapture = options || {};
    if (!supportsCaptureOption) {
        optionsOrCapture = optionsOrCapture.capture;
    }
    target.removeEventListener(type, handler, optionsOrCapture);
}

/**
     * Cached window size.
     */
let windowSize;

/**
     * Flag of event listener bound.
     */
let windowSizeEventsBound;

/**
     * Resets cached window size.
     */
function clearWindowSize() {
    windowSize = null;
}

/**
    * @typedef {Object} windowSize
    * @property {number} innerHeight - window innerHeight.
    * @property {number} innerWidth - window innerWidth.
    */

/**
     * Returns window size.
     * @returns {windowSize} Window size.
     */
export function getWindowSize() {
    if (!windowSize) {
        windowSize = {
            innerHeight: window.innerHeight,
            innerWidth: window.innerWidth
        };

        if (!windowSizeEventsBound) {
            windowSizeEventsBound = true;
            addEventListener(window, 'orientationchange', clearWindowSize, { passive: true });
            addEventListener(window, 'resize', clearWindowSize, { passive: true });
        }
    }

    return windowSize;
}

/**
     * Standard screen widths.
     */
const standardWidths = [480, 720, 1280, 1440, 1920, 2560, 3840, 5120, 7680];

/**
     * Returns screen width.
     * @returns {number} Screen width.
     */
export function getScreenWidth() {
    let width = window.innerWidth;
    const height = window.innerHeight;

    if (height > width) {
        width = height * (16.0 / 9.0);
    }

    standardWidths.sort((a, b) => Math.abs(width - a) - Math.abs(width - b));

    return standardWidths[0];
}

/**
     * Name of animation end event.
     */
let _animationEvent;

/**
     * Returns name of animation end event.
     * @returns {string} Name of animation end event.
     */
export function whichAnimationEvent() {
    if (_animationEvent) {
        return _animationEvent;
    }

    const el = document.createElement('div');
    const animations = {
        'animation': 'animationend',
        'OAnimation': 'oAnimationEnd',
        'MozAnimation': 'animationend',
        'WebkitAnimation': 'webkitAnimationEnd'
    };
    for (const t in animations) {
        if (el.style[t] !== undefined) {
            _animationEvent = animations[t];
            return animations[t];
        }
    }

    _animationEvent = 'animationend';
    return _animationEvent;
}

/**
     * Returns name of animation cancel event.
     * @returns {string} Name of animation cancel event.
     */
export function whichAnimationCancelEvent() {
    return whichAnimationEvent().replace('animationend', 'animationcancel').replace('AnimationEnd', 'AnimationCancel');
}

/**
     * Name of transition end event.
     */
let _transitionEvent;

/**
     * Returns name of transition end event.
     * @returns {string} Name of transition end event.
     */
export function whichTransitionEvent() {
    if (_transitionEvent) {
        return _transitionEvent;
    }

    const el = document.createElement('div');
    const transitions = {
        'transition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'MozTransition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd'
    };
    for (const t in transitions) {
        if (el.style[t] !== undefined) {
            _transitionEvent = transitions[t];
            return transitions[t];
        }
    }

    _transitionEvent = 'transitionend';
    return _transitionEvent;
}

/**
 * Sets title and ARIA-label of element.
 * @param {HTMLElement} elem - Element to set the title and ARIA-label.
 * @param {string} title - Title.
 * @param {string?} [ariaLabel] - ARIA-label.
 */
export function setElementTitle(elem, title, ariaLabel) {
    elem.setAttribute('title', title);
    elem.setAttribute('aria-label', ariaLabel);
}

export default {
    parentWithAttribute: parentWithAttribute,
    parentWithClass: parentWithClass,
    parentWithTag: parentWithTag,
    addEventListener: addEventListener,
    removeEventListener: removeEventListener,
    getWindowSize: getWindowSize,
    getScreenWidth: getScreenWidth,
    setElementTitle,
    whichTransitionEvent: whichTransitionEvent,
    whichAnimationEvent: whichAnimationEvent,
    whichAnimationCancelEvent: whichAnimationCancelEvent
};
