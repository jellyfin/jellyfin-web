/**
 * Module for performing auto-focus.
 * @module components/autoFocuser
 */

import focusManager from './focusManager';
import layoutManager from './layoutManager';

/**
     * Previously selected element.
     */
let activeElement;

/**
     * Returns _true_ if AutoFocuser is enabled.
     */
export function isEnabled() {
    return layoutManager.tv;
}

/**
     * Start AutoFocuser.
     */
export function enable() {
    if (!isEnabled()) {
        return;
    }

    window.addEventListener('focusin', function (e) {
        activeElement = e.target;
    });

    console.debug('AutoFocuser enabled');
}

/**
     * Set focus on a suitable element, taking into account the previously selected.
     * @param {HTMLElement | null} [container] - Element to limit scope.
     * @returns {HTMLElement} Focused element.
     */
export function autoFocus(container) {
    if (!isEnabled()) {
        return null;
    }

    container = container || document.body;

    let candidates = [];

    if (activeElement) {
        // These elements are recreated
        if (activeElement.classList.contains('btnPreviousPage')) {
            candidates.push(container.querySelector('.btnPreviousPage'));
            candidates.push(container.querySelector('.btnNextPage'));
        } else if (activeElement.classList.contains('btnNextPage')) {
            candidates.push(container.querySelector('.btnNextPage'));
            candidates.push(container.querySelector('.btnPreviousPage'));
        } else if (activeElement.classList.contains('btnSelectView')) {
            candidates.push(container.querySelector('.btnSelectView'));
        }

        candidates.push(activeElement);
    }

    candidates = candidates.concat(Array.from(container.querySelectorAll('.btnPlay')));

    let focusedElement;

    candidates.every(function (element) {
        if (focusManager.isCurrentlyFocusable(element)) {
            focusManager.focus(element);
            focusedElement = element;
            return false;
        }

        return true;
    });

    if (!focusedElement) {
        // FIXME: Multiple itemsContainers
        const itemsContainer = container.querySelector('.itemsContainer');

        if (itemsContainer) {
            focusedElement = focusManager.autoFocus(itemsContainer);
        }
    }

    if (!focusedElement) {
        focusedElement = focusManager.autoFocus(container);
    }

    return focusedElement;
}

export default {
    isEnabled: isEnabled,
    enable: enable,
    autoFocus: autoFocus
};
