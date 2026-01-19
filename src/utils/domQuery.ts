/**
 * Native DOM utilities to replace jQuery
 *
 * These functions provide jQuery-like convenience with native APIs.
 * All modern browsers (ES2022+) support these natively.
 */

/**
 * Query selector shorthand
 */
export function $(selector: string, context: Element | Document = document): Element | null {
    return context.querySelector(selector);
}

/**
 * Query selector all shorthand
 */
export function $$(selector: string, context: Element | Document = document): Element[] {
    return Array.from(context.querySelectorAll(selector));
}

/**
 * Get element by ID
 */
export function byId(id: string): HTMLElement | null {
    return document.getElementById(id);
}

/**
 * Append HTML string to element
 */
export function appendHtml(element: Element, html: string): void {
    element.insertAdjacentHTML('beforeend', html);
}

/**
 * Prepend HTML string to element
 */
export function prependHtml(element: Element, html: string): void {
    element.insertAdjacentHTML('afterbegin', html);
}

/**
 * Set inner HTML safely
 */
export function setHtml(element: Element, html: string): void {
    element.innerHTML = html;
}

/**
 * Remove element from DOM
 */
export function remove(element: Element): void {
    element.remove();
}

/**
 * Remove all children matching selector
 */
export function removeAll(selector: string, context: Element | Document = document): void {
    $$(selector, context).forEach(el => el.remove());
}

/**
 * Add event listener with delegation support
 */
export function on<K extends keyof HTMLElementEventMap>(
    element: Element | Document,
    event: K,
    selector: string | null,
    handler: (e: HTMLElementEventMap[K], target: Element) => void
): () => void {
    const listener = (e: Event) => {
        if (selector === null) {
            handler(e as HTMLElementEventMap[K], e.target as Element);
            return;
        }
        const target = (e.target as Element).closest(selector);
        if (target !== null && element.contains(target)) {
            handler(e as HTMLElementEventMap[K], target);
        }
    };
    element.addEventListener(event, listener);
    return () => element.removeEventListener(event, listener);
}

/**
 * Trigger custom event
 */
export function trigger(element: Element, eventName: string, detail?: unknown): void {
    const event = new CustomEvent(eventName, {
        bubbles: true,
        cancelable: true,
        detail
    });
    element.dispatchEvent(event);
}

/**
 * Get parent matching selector
 */
export function closest(element: Element, selector: string): Element | null {
    return element.closest(selector);
}

/**
 * Check if element matches selector
 */
export function matches(element: Element, selector: string): boolean {
    return element.matches(selector);
}

/**
 * Add class(es) to element
 */
export function addClass(element: Element, ...classNames: string[]): void {
    element.classList.add(...classNames);
}

/**
 * Remove class(es) from element
 */
export function removeClass(element: Element, ...classNames: string[]): void {
    element.classList.remove(...classNames);
}

/**
 * Toggle class on element
 */
export function toggleClass(element: Element, className: string, force?: boolean): boolean {
    return element.classList.toggle(className, force);
}

/**
 * Check if element has class
 */
export function hasClass(element: Element, className: string): boolean {
    return element.classList.contains(className);
}

/**
 * Get/set data attribute
 */
export function data(element: HTMLElement, key: string, value?: string): string | undefined {
    if (value !== undefined) {
        element.dataset[key] = value;
        return value;
    }
    return element.dataset[key];
}

/**
 * Get/set attribute
 */
export function attr(element: Element, name: string, value?: string): string | null {
    if (value !== undefined) {
        element.setAttribute(name, value);
        return value;
    }
    return element.getAttribute(name);
}

/**
 * Show element (remove hidden)
 */
export function show(element: HTMLElement): void {
    element.style.display = '';
    element.hidden = false;
}

/**
 * Hide element
 */
export function hide(element: HTMLElement): void {
    element.hidden = true;
}

/**
 * Get form values as object
 */
export function formData(form: HTMLFormElement): Record<string, string> {
    const data: Record<string, string> = {};
    const formData = new FormData(form);
    formData.forEach((value, key) => {
        if (typeof value === 'string') {
            data[key] = value;
        }
    });
    return data;
}

/**
 * Ready handler (DOMContentLoaded)
 */
export function ready(callback: () => void): void {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
}
