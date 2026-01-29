import dom from '../utils/dom';
import { logger } from '../utils/logger';
import layoutManager from './layoutManager';

const scopes: HTMLElement[] = [];

export function pushScope(elem: HTMLElement): void {
    scopes.push(elem);
}

export function popScope(): void {
    if (scopes.length) {
        scopes.pop();
    }
}

export function focus(element: HTMLElement | null): void {
    if (!element) return;
    try {
        element.focus({
            preventScroll: layoutManager.tv
        });
    } catch (err) {
        logger.error('Error in focusManager.focus', { err, component: 'focusManager' });
    }
}

const focusableTagNames = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'];
const focusableContainerTagNames = ['BODY', 'DIALOG'];
const focusableQuery =
    focusableTagNames
        .map((t) => {
            if (t === 'INPUT') {
                t += ':not([type="range"]):not([type="file"])';
            }
            return t + ':not([tabindex="-1"]):not(:disabled)';
        })
        .join(',') + ',.focusable';

export function isFocusable(elem: HTMLElement): boolean {
    return focusableTagNames.includes(elem.tagName) || elem.classList?.contains('focusable');
}

function normalizeFocusable(elem: HTMLElement, originalElement: HTMLElement): HTMLElement {
    if (elem) {
        const tagName = elem.tagName;
        if (!tagName || tagName === 'HTML' || tagName === 'BODY') {
            return originalElement;
        }
    }
    return elem;
}

export function focusableParent(elem: HTMLElement | null): HTMLElement | null {
    if (!elem) return null;
    const originalElement = elem;
    let current: HTMLElement | null = elem;

    while (current && !isFocusable(current)) {
        current = current.parentElement;
    }

    return current ? normalizeFocusable(current, originalElement) : originalElement;
}

function isCurrentlyFocusableInternal(elem: HTMLElement): boolean {
    return elem.offsetParent !== null;
}

export function isCurrentlyFocusable(elem: HTMLElement): boolean {
    if (!elem.classList?.contains('focusable')) {
        if ((elem as any).disabled) return false;
        if (elem.getAttribute('tabindex') === '-1') return false;
        if (elem.tagName === 'INPUT') {
            const type = (elem as HTMLInputElement).type;
            if (type === 'range' || type === 'file') return false;
        }
    }
    return isCurrentlyFocusableInternal(elem);
}

function getDefaultScope(): HTMLElement {
    return scopes[0] || document.body;
}

export function getFocusableElements(
    parent: HTMLElement | null,
    limit?: number,
    excludeClass?: string
): HTMLElement[] {
    const root = parent || getDefaultScope();
    const elems = root.querySelectorAll(focusableQuery);
    const focusableElements: HTMLElement[] = [];

    for (let i = 0; i < elems.length; i++) {
        const elem = elems[i] as HTMLElement;
        if (excludeClass && elem.classList.contains(excludeClass)) continue;
        if (isCurrentlyFocusableInternal(elem)) {
            focusableElements.push(elem);
            if (limit && focusableElements.length >= limit) break;
        }
    }

    return focusableElements;
}

export function autoFocus(
    view: HTMLElement,
    defaultToFirst: boolean = true,
    findAutoFocusElement: boolean = true
): HTMLElement | null {
    if (findAutoFocusElement) {
        const element = view.querySelector('*[autofocus]') as HTMLElement | null;
        if (element) {
            focus(element);
            return element;
        }
    }

    if (defaultToFirst) {
        const element = getFocusableElements(view, 1, 'noautofocus')[0];
        if (element) {
            focus(element);
            return element;
        }
    }

    return null;
}

function isFocusContainer(elem: HTMLElement, direction: number): boolean {
    if (focusableContainerTagNames.includes(elem.tagName)) return true;
    const classList = elem.classList;
    if (classList.contains('focuscontainer')) return true;

    if (direction === 0 || direction === 1) {
        // Left/Right
        if (classList.contains('focuscontainer-x')) return true;
        if (direction === 0 && classList.contains('focuscontainer-left')) return true;
        if (direction === 1 && classList.contains('focuscontainer-right')) return true;
    } else if (direction === 2 || direction === 3) {
        // Up/Down
        if (classList.contains('focuscontainer-y')) return true;
        if (direction === 3 && classList.contains('focuscontainer-down')) return true;
    }

    return false;
}

function getFocusContainer(elem: HTMLElement, direction: number): HTMLElement {
    let current: HTMLElement | null = elem;
    while (current && !isFocusContainer(current, direction)) {
        current = current.parentElement;
    }
    return current || getDefaultScope();
}

function getOffset(elem: HTMLElement) {
    const box = elem.getBoundingClientRect();
    return {
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
        right: box.left + box.width,
        bottom: box.top + box.height
    };
}

function intersects(a1: number, a2: number, b1: number, b2: number): boolean {
    const i = (a: number, b: number, c: number, d: number) =>
        (c >= a && c <= b) || (d >= a && d <= b);
    return i(a1, a2, b1, b2) || i(b1, b2, a1, a2);
}

function nav(
    activeElement: HTMLElement | null,
    direction: number,
    container?: HTMLElement,
    focusableElements?: HTMLElement[]
): void {
    const currentActive = activeElement || (document.activeElement as HTMLElement | null);
    const resolvedActive = focusableParent(currentActive);
    const resolvedContainer =
        container ||
        (resolvedActive ? getFocusContainer(resolvedActive, direction) : getDefaultScope());

    if (!resolvedActive || resolvedActive === document.body) {
        autoFocus(resolvedContainer, true, false);
        return;
    }

    const focusableContainer = dom.parentWithClass(resolvedActive, 'focusable');
    const rect = getOffset(resolvedActive);
    const sourceMidX = rect.left + rect.width / 2;
    const sourceMidY = rect.top + rect.height / 2;

    const focusable =
        focusableElements ||
        (Array.from(resolvedContainer.querySelectorAll(focusableQuery)) as HTMLElement[]);
    let minDistance = Infinity;
    let nearestElement: HTMLElement | null = null;

    for (const curr of focusable) {
        if (curr === resolvedActive || curr === focusableContainer) continue;
        const eRect = getOffset(curr);
        if (!eRect.width && !eRect.height) continue;

        if (direction === 0 && eRect.left >= rect.left) continue;
        if (direction === 1 && eRect.right <= rect.right) continue;
        if (direction === 2 && eRect.top >= rect.top) continue;
        if (direction === 3 && eRect.bottom <= rect.bottom) continue;

        const intersectX = intersects(rect.left, rect.right, eRect.left, eRect.right);
        const intersectY = intersects(rect.top, rect.bottom, eRect.top, eRect.bottom);
        const midX = eRect.left + eRect.width / 2;
        const midY = eRect.top + eRect.height / 2;

        let distX = 0,
            distY = 0;
        if (direction === 0) {
            distX = Math.abs(rect.left - Math.min(rect.left, eRect.right));
            distY = intersectY ? 0 : Math.abs(sourceMidY - midY);
        } else if (direction === 1) {
            distX = Math.abs(rect.right - Math.max(rect.right, eRect.left));
            distY = intersectY ? 0 : Math.abs(sourceMidY - midY);
        } else if (direction === 2) {
            distY = Math.abs(rect.top - Math.min(rect.top, eRect.bottom));
            distX = intersectX ? 0 : Math.abs(sourceMidX - midX);
        } else if (direction === 3) {
            distY = Math.abs(rect.bottom - Math.max(rect.bottom, eRect.top));
            distX = intersectX ? 0 : Math.abs(sourceMidX - midX);
        }

        const dist = Math.sqrt(distX * distX + distY * distY);
        if (dist < minDistance) {
            nearestElement = curr;
            minDistance = dist;
        }
    }

    if (nearestElement) {
        const nearestParent = dom.parentWithClass(nearestElement, 'focusable');
        if (
            nearestParent &&
            nearestParent !== nearestElement &&
            focusableContainer !== nearestParent
        ) {
            nearestElement = nearestParent;
        }
        focus(nearestElement);
    }
}

const focusManager = {
    autoFocus,
    focus,
    focusableParent,
    getFocusableElements,
    moveLeft: (s: HTMLElement, o?: any) => nav(s, 0, o?.container, o?.focusableElements),
    moveRight: (s: HTMLElement, o?: any) => nav(s, 1, o?.container, o?.focusableElements),
    moveUp: (s: HTMLElement, o?: any) => nav(s, 2, o?.container, o?.focusableElements),
    moveDown: (s: HTMLElement, o?: any) => nav(s, 3, o?.container, o?.focusableElements),
    sendText: (text: string) => {
        (document.activeElement as HTMLInputElement).value = text;
    },
    isCurrentlyFocusable,
    pushScope,
    popScope,
    focusFirst: (c: HTMLElement, s: string) => {
        const el = Array.from(c.querySelectorAll(s)).find((e) =>
            isCurrentlyFocusableInternal(e as HTMLElement)
        );
        if (el) focus(el as HTMLElement);
    },
    focusLast: (c: HTMLElement, s: string) => {
        const el = Array.from(c.querySelectorAll(s))
            .reverse()
            .find((e) => isCurrentlyFocusableInternal(e as HTMLElement));
        if (el) focus(el as HTMLElement);
    },
    moveFocus: (s: HTMLElement, c: HTMLElement, sel: string, offset: number) => {
        const list = Array.from(c.querySelectorAll(sel)).filter((e) =>
            isCurrentlyFocusableInternal(e as HTMLElement)
        ) as HTMLElement[];
        const idx = list.findIndex((e) => s === e || e.contains(s));
        if (idx !== -1) {
            const next = list[Math.min(Math.max(idx + offset, 0), list.length - 1)];
            if (next) focus(next);
        }
    }
};

export default focusManager;
