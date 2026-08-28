/**
 * Polyfill for `MediaQueryList` event listeners.
 * Affected platforms:
 *   - iOS 12, 13
 * Refs: https://caniuse.com/mdn-api_mediaquerylist_change_event
 */
(function (window) {
    const mediaQueryAll = window.matchMedia('all');
    if (typeof mediaQueryAll.addEventListener == 'function') return;

    const defaultMatchMedia = window.matchMedia;

    window.matchMedia = function (query) {
        const mediaQuery = defaultMatchMedia(query);

        // eslint-disable-next-line @typescript-eslint/no-deprecated
        mediaQuery.addEventListener = (_, listener) => mediaQuery.addListener(listener);
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        mediaQuery.removeEventListener = (_, listener) => mediaQuery.removeListener(listener);

        return mediaQuery;
    };
})(window);
