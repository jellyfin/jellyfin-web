/**
 * Patch 'Headers' to accept 'undefined'.
 * Fixes `TypeError: Failed to construct 'Headers': No matching constructor signature.`
 * Affected platforms:
 *   - Tizen 3
 *   - Tizen 4
 *   - webOS 4
 */

(function (window) {
    'use strict';

    if (window.Headers) {
        try {
            new window.Headers(undefined);
        } catch {
            console.debug('patch \'Headers\' to accept \'undefined\'');

            const _Headers = window.Headers;

            // A plain function returning an object works with `new`, but isn't a full `Headers` constructor type
            window.Headers = function (init?: HeadersInit) {
                return init ? new _Headers(init) : new _Headers();
            } as unknown as typeof Headers;
        }
    }
}(window));
