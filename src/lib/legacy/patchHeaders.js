/**
 * Patch 'Headers' to accept 'undefined'.
 * Fixes `TypeError: Failed to construct 'Headers': No matching constructor signature.`
 * Affected platforms:
 *   - Tizen 3
 *   - Tizen 4
 *   - webOS 4
 */

(((window) => {
    'use strict';

    if (window.Headers) {
        try {
            new window.Headers(undefined);
        } catch {
            console.debug('patch \'Headers\' to accept \'undefined\'');

            const _Headers = window.Headers;

            window.Headers = (init) => init ? new _Headers(init) : new _Headers();
        }
    }
})(window));
