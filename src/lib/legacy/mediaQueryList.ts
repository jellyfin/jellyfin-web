/**
 * Polyfill for `MediaQueryList` event listeners.
 * Affected platforms:
 *   - iOS 12, 13
 * Refs: https://caniuse.com/mdn-api_mediaquerylist_change_event
 */

type MediaQueryListListener = Parameters<MediaQueryList['addListener']>[0];

/** The `EventTarget` methods patched onto `MediaQueryList` (which doesn't inherit from `EventTarget` on affected platforms) */
interface MediaQueryListEventMethods {
    addEventListener(type: string, listener: MediaQueryListListener): void;
    removeEventListener(type: string, listener: MediaQueryListListener): void;
}

(function (window) {
    const mediaQueryAll = window.matchMedia('all');
    if (typeof mediaQueryAll.addEventListener == 'function') return;

    const defaultMatchMedia = window.matchMedia;

    window.matchMedia = function (query) {
        const mediaQuery = defaultMatchMedia(query);

        // eslint-disable-next-line @typescript-eslint/no-deprecated
        (mediaQuery as MediaQueryListEventMethods).addEventListener = (_, listener) => mediaQuery.addListener(listener);
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        (mediaQuery as MediaQueryListEventMethods).removeEventListener = (_, listener) => mediaQuery.removeListener(listener);

        return mediaQuery;
    };
})(window);

export {};
