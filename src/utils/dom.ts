/**
 * Useful DOM utilities.
 */

/**
 * Returns parent of element with specified attribute value.
 * @param elem - Element whose parent need to find.
 * @param name - Attribute name.
 * @param [value] - Attribute value.
 * @returns Parent with specified attribute value.
 */
export function parentWithAttribute<T extends Element = HTMLElement>(elem: Element, name: string, value?: string): T | null {
    let current: Element | null = elem;

    while ((value ? current.getAttribute(name) !== value : !current.getAttribute(name))) {
        // The parent may be a Document, which has no getAttribute
        current = current.parentNode as Element | null;

        if (!current?.getAttribute) {
            return null;
        }
    }

    return current as T;
}

/**
 * Returns parent of element with one of specified tag names.
 * @param elem - Element whose parent need to find.
 * @param tagNames - Tag name or array of tag names.
 * @returns Parent with one of specified tag names.
 */
export function parentWithTag<T extends Element = HTMLElement>(elem: Element, tagNames: string | string[]): T | null {
    // accept both string and array passed in
    if (!Array.isArray(tagNames)) {
        tagNames = [tagNames];
    }

    let current: Element | null = elem;

    // The parent may be a Document, which has no tagName
    while (tagNames.indexOf(current.tagName || '') === -1) {
        current = current.parentNode as Element | null;

        if (!current) {
            return null;
        }
    }

    return current as T;
}

/**
 * Returns _true_ if class list contains one of specified names.
 * @param classList - Class list.
 * @param classNames - Array of class names.
 * @returns _true_ if class list contains one of specified names.
 */
function containsAnyClass(classList: DOMTokenList, classNames: string[]): boolean {
    for (let i = 0, length = classNames.length; i < length; i++) {
        if (classList.contains(classNames[i])) {
            return true;
        }
    }
    return false;
}

/**
 * Returns parent of element with one of specified class names.
 * @param elem - Element whose parent need to find.
 * @param classNames - Class name or array of class names.
 * @returns Parent with one of specified class names.
 */
export function parentWithClass<T extends Element = HTMLElement>(elem: Element, classNames: string | string[]): T | null {
    // accept both string and array passed in
    if (!Array.isArray(classNames)) {
        classNames = [classNames];
    }

    let current: Element | null = elem;

    // The parent may be a Document, which has no classList
    while (!current.classList || !containsAnyClass(current.classList, classNames)) {
        current = current.parentNode as Element | null;

        if (!current) {
            return null;
        }
    }

    return current as T;
}

let supportsCaptureOption = false;
try {
    const opts = Object.defineProperty({}, 'capture', {
        get: function () {
            supportsCaptureOption = true;
            return null;
        }
    });
    // EventTarget accepts a null listener, unlike the Window overloads
    (window as EventTarget).addEventListener('test', null, opts);
} catch {
    // no capture support
}

/**
 * Returns the listener options, or only the capture flag when options objects are not supported.
 * @param [options] - Listener options.
 * @returns Options or capture flag.
 */
function getOptionsOrCapture(options?: AddEventListenerOptions): AddEventListenerOptions | boolean | undefined {
    const optionsOrCapture = options || {};
    return supportsCaptureOption ? optionsOrCapture : optionsOrCapture.capture;
}

/**
 * Adds event listener to specified target.
 * @param target - Event target.
 * @param type - Event type.
 * @param handler - Event handler.
 * @param [options] - Listener options.
 */
export function addEventListener<E extends Event>(
    target: EventTarget,
    type: string,
    handler: ((e: E) => void) | EventListenerObject,
    options?: AddEventListenerOptions
): void {
    target.addEventListener(type, handler as EventListenerOrEventListenerObject, getOptionsOrCapture(options));
}

/**
 * Removes event listener from specified target.
 * @param target - Event target.
 * @param type - Event type.
 * @param handler - Event handler.
 * @param [options] - Listener options.
 */
export function removeEventListener<E extends Event>(
    target: EventTarget,
    type: string,
    handler: ((e: E) => void) | EventListenerObject,
    options?: AddEventListenerOptions
): void {
    target.removeEventListener(type, handler as EventListenerOrEventListenerObject, getOptionsOrCapture(options));
}

/**
 * Window size.
 */
export interface WindowSize {
    /** window innerHeight. */
    innerHeight: number;
    /** window innerWidth. */
    innerWidth: number;
}

/**
 * Cached window size.
 */
let windowSize: WindowSize | null = null;

/**
 * Flag of event listener bound.
 */
let windowSizeEventsBound = false;

/**
 * Resets cached window size.
 */
function clearWindowSize(): void {
    windowSize = null;
}

/**
 * Returns window size.
 * @returns Window size.
 */
export function getWindowSize(): WindowSize {
    if (!windowSize) {
        const innerWidth = window.innerWidth;
        const innerHeight = window.innerHeight;

        // NOTE: webOS has a bug that reports window size as infinite on page load, so we use a fallback size of 4K
        if (!Number.isFinite(innerWidth) || !Number.isFinite(innerHeight)) {
            return {
                innerWidth: Number.isFinite(innerWidth) ? innerWidth : 3840,
                innerHeight: Number.isFinite(innerHeight) ? innerHeight : 2160
            };
        }

        windowSize = {
            innerWidth,
            innerHeight
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
 * @returns Screen width.
 */
export function getScreenWidth(): number {
    let width = Number.isFinite(window.innerWidth) ? window.innerWidth : 3840;
    const height = Number.isFinite(window.innerHeight) ? window.innerHeight : 2160;

    if (height > width) {
        width = height * (16.0 / 9.0);
    }

    standardWidths.sort((a, b) => Math.abs(width - a) - Math.abs(width - b));

    return standardWidths[0];
}

/**
 * Returns the first event name whose style property is supported by the browser.
 * @param events - Map of style property names to event names.
 * @returns Event name, if any style property is supported.
 */
function findSupportedEvent(events: Record<string, string>): string | undefined {
    // Vendor-prefixed properties are not part of CSSStyleDeclaration
    const style = document.createElement('div').style as unknown as Partial<Record<string, string>>;
    for (const t in events) {
        if (style[t] !== undefined) {
            return events[t];
        }
    }
}

/**
 * Name of animation end event.
 */
let _animationEvent: string | undefined;

/**
 * Returns name of animation end event.
 * @returns Name of animation end event.
 */
export function whichAnimationEvent(): string {
    if (_animationEvent) {
        return _animationEvent;
    }

    _animationEvent = findSupportedEvent({
        'animation': 'animationend',
        'OAnimation': 'oAnimationEnd',
        'MozAnimation': 'animationend',
        'WebkitAnimation': 'webkitAnimationEnd'
    }) || 'animationend';
    return _animationEvent;
}

/**
 * Returns name of animation cancel event.
 * @returns Name of animation cancel event.
 */
export function whichAnimationCancelEvent(): string {
    return whichAnimationEvent().replace('animationend', 'animationcancel').replace('AnimationEnd', 'AnimationCancel');
}

/**
 * Name of transition end event.
 */
let _transitionEvent: string | undefined;

/**
 * Returns name of transition end event.
 * @returns Name of transition end event.
 */
export function whichTransitionEvent(): string {
    if (_transitionEvent) {
        return _transitionEvent;
    }

    _transitionEvent = findSupportedEvent({
        'transition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'MozTransition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd'
    }) || 'transitionend';
    return _transitionEvent;
}

/**
 * Sets title and ARIA-label of element.
 * @param elem - Element to set the title and ARIA-label.
 * @param title - Title.
 * @param ariaLabel - ARIA-label.
 */
export function setElementTitle(elem: HTMLElement, title: string, ariaLabel: string): void {
    elem.setAttribute('title', title);
    elem.setAttribute('aria-label', ariaLabel);
}

export default {
    parentWithAttribute,
    parentWithClass,
    parentWithTag,
    addEventListener,
    removeEventListener,
    getWindowSize,
    getScreenWidth,
    setElementTitle,
    whichTransitionEvent,
    whichAnimationEvent,
    whichAnimationCancelEvent
};
