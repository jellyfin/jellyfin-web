/**
 * Module for performing auto-focus.
 * @module components/autoFocuser
 */

import focusManager from './focusManager';
import layoutManager from './layoutManager';

/**
 * Previously selected element.
 */
let activeElement: HTMLElement | null = null;

/**
 * Returns _true_ if AutoFocuser is enabled.
 */
export function isEnabled(): boolean {
    return layoutManager.tv;
}

/**
 * Start AutoFocuser.
 */
export function enable(): void {
    if (!isEnabled()) {
        return;
    }

    window.addEventListener('focusin', (e) => {
        activeElement = e.target as HTMLElement;
    });

    console.debug('AutoFocuser enabled');
}

/**
 * Set focus on a suitable element, taking into account the previously selected.
 * @param {HTMLElement | null} [container] - Element to limit scope.
 * @returns {HTMLElement | null} Focused element.
 */
export function autoFocus(container?: HTMLElement | null): HTMLElement | null {
    if (!isEnabled()) {
        return null;
    }

    const scopeContainer = container || document.body;

    let candidates: HTMLElement[] = [];

    if (activeElement) {
        // These elements are recreated
        if (activeElement.classList.contains('btnPreviousPage')) {
            const prev = scopeContainer.querySelector('.btnPreviousPage') as HTMLElement;
            const next = scopeContainer.querySelector('.btnNextPage') as HTMLElement;
            if (prev) candidates.push(prev);
            if (next) candidates.push(next);
        } else if (activeElement.classList.contains('btnNextPage')) {
            const next = scopeContainer.querySelector('.btnNextPage') as HTMLElement;
            const prev = scopeContainer.querySelector('.btnPreviousPage') as HTMLElement;
            if (next) candidates.push(next);
            if (prev) candidates.push(prev);
        } else if (activeElement.classList.contains('btnSelectView')) {
            const el = scopeContainer.querySelector('.btnSelectView') as HTMLElement;
            if (el) candidates.push(el);
        }

        candidates.push(activeElement);
    }

    // Cast NodeList to Array<HTMLElement>
    const playButtons = Array.from(scopeContainer.querySelectorAll('.btnPlay')) as HTMLElement[];
    candidates = candidates.concat(playButtons);

    let focusedElement: HTMLElement | null = null;

    candidates.every((element) => {
        if (element && focusManager.isCurrentlyFocusable(element)) {
            focusManager.focus(element);
            focusedElement = element;
            return false;
        }

        return true;
    });

    if (!focusedElement) {
        // FIXME: Multiple itemsContainers
        const itemsContainer = scopeContainer.querySelector('.itemsContainer') as HTMLElement;

        if (itemsContainer) {
            focusedElement = focusManager.autoFocus(itemsContainer);
        }
    }

    if (!focusedElement) {
        focusedElement = focusManager.autoFocus(scopeContainer);
    }

    return focusedElement;
}

export default {
    isEnabled,
    enable,
    autoFocus
};