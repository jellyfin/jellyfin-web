/**
 * Useful DOM utilities.
 */

/**
 * Returns parent of element with specified attribute value.
 */
export function parentWithAttribute(elem: HTMLElement, name: string, value?: string): HTMLElement | null {
    let current: HTMLElement | null = elem;
    while (current !== null && (value === undefined ? current.getAttribute(name) === null : current.getAttribute(name) !== value)) {
        const parent = current.parentNode as HTMLElement;

        if (parent?.getAttribute === undefined) {
            return null;
        }
        current = parent;
    }

    return current;
}

/**
 * Returns parent of element with one of specified tag names.
 */
export function parentWithTag(elem: HTMLElement, tagNames: string | string[]): HTMLElement | null {
    const tags = Array.isArray(tagNames) ? tagNames : [tagNames];
    const normalizedTags = tags.map(t => t.toUpperCase());

    let current: HTMLElement | null = elem;
    while (current !== null && !normalizedTags.includes(current.tagName ?? '')) {
        current = current.parentNode as HTMLElement;

        if (current?.tagName === undefined) {
            return null;
        }
    }

    return current;
}

/**
 * Returns _true_ if class list contains one of specified names.
 */
function containsAnyClass(classList: DOMTokenList, classNames: string[]): boolean {
    for (const className of classNames) {
        if (classList.contains(className)) {
            return true;
        }
    }
    return false;
}

/**
 * Returns parent of element with one of specified class names.
 */
export function parentWithClass(elem: HTMLElement, classNames: string | string[]): HTMLElement | null {
    const classes = Array.isArray(classNames) ? classNames : [classNames];

    let current: HTMLElement | null = elem;
    while (current !== null && (current.classList === undefined || !containsAnyClass(current.classList, classes))) {
        current = current.parentNode as HTMLElement;

        if (current?.classList === undefined) {
            return null;
        }
    }

    return current;
}

let supportsCaptureOption = false;
try {
    const opts = Object.defineProperty({}, 'capture', {
        get: function () {
            supportsCaptureOption = true;
            return null;
        }
    });
    window.addEventListener('test', (() => { return; }) as unknown as EventListener, opts);
} catch {
    // no capture support
}

interface AddEventListenerOptionsType {
    capture?: boolean;
    once?: boolean;
    passive?: boolean;
    signal?: AbortSignal;
}

/**
 * Adds event listener to specified target.
 */
export function addEventListener(target: EventTarget, type: string, handler: EventListenerOrEventListenerObject, options?: AddEventListenerOptionsType): void {
    const optionsOrCapture = options ?? {};
    if (!supportsCaptureOption) {
        optionsOrCapture.capture = optionsOrCapture.capture;
    }
    target.addEventListener(type, handler, optionsOrCapture);
}

/**
 * Removes event listener from specified target.
 */
export function removeEventListener(target: EventTarget, type: string, handler: EventListenerOrEventListenerObject, options?: EventListenerOptions): void {
    const optionsOrCapture = options ?? {};
    if (!supportsCaptureOption) {
        optionsOrCapture.capture = optionsOrCapture.capture;
    }
    target.removeEventListener(type, handler, optionsOrCapture);
}

/**
 * Cached window size.
 */
let windowSize: { innerHeight: number; innerWidth: number } | null = null;

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
 */
export function getWindowSize(): { innerHeight: number; innerWidth: number } {
    if (windowSize === null) {
        const innerWidth = window.innerWidth;
        const innerHeight = window.innerHeight;

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
 */
export function getScreenWidth(): number {
    let width = Number.isFinite(window.innerWidth) ? window.innerWidth : 3840;
    const height = Number.isFinite(window.innerHeight) ? window.innerHeight : 2160;

    if (height > width) {
        width = height * (16.0 / 9.0);
    }

    const sortedWidths = [...standardWidths].sort((a, b) => Math.abs(width - a) - Math.abs(width - b));

    return sortedWidths[0];
}

/**
 * Name of animation end event.
 */
let _animationEvent: string | undefined;

/**
 * Returns name of animation end event.
 */
export function whichAnimationEvent(): string {
    if (_animationEvent !== undefined) {
        return _animationEvent;
    }

    const el = document.createElement('div');
    const animations: Record<string, string> = {
        'animation': 'animationend',
        'OAnimation': 'oAnimationEnd',
        'MozAnimation': 'animationend',
        'WebkitAnimation': 'webkitAnimationEnd'
    };
    for (const t in animations) {
        if ((el.style as unknown as Record<string, unknown>)[t] !== undefined) {
            _animationEvent = animations[t];
            return animations[t];
        }
    }

    _animationEvent = 'animationend';
    return _animationEvent;
}

/**
 * Returns name of animation cancel event.
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
 */
export function whichTransitionEvent(): string {
    if (_transitionEvent !== undefined) {
        return _transitionEvent;
    }

    const el = document.createElement('div');
    const transitions: Record<string, string> = {
        'transition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'MozTransition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd'
    };
    for (const t in transitions) {
        if ((el.style as unknown as Record<string, unknown>)[t] !== undefined) {
            _transitionEvent = transitions[t];
            return transitions[t];
        }
    }

    _transitionEvent = 'transitionend';
    return _transitionEvent;
}

/**
 * Sets title and ARIA-label of element.
 */
export function setElementTitle(elem: HTMLElement, title: string, ariaLabel?: string): void {
    elem.setAttribute('title', title);
    if (ariaLabel !== undefined) {
        elem.setAttribute('aria-label', ariaLabel);
    } else {
        elem.setAttribute('aria-label', title);
    }
}

const dom = {
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

export default dom;
