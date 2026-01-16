/**
 * Checks if the document is currently visible to the user.
 * Uses the Page Visibility API to determine visibility state.
 * @returns {boolean} True if the document is visible, false otherwise.
 */
export function isVisible(): boolean {
    // eslint-disable-next-line compat/compat
    return document.visibilityState === 'visible';
}
