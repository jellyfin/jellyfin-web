/**
 * Polyfill for HTMLMediaElement
 * - HTMLMediaElement.play
 *   Return a `Promise`.
 */

(function (HTMLMediaElement) {
    'use strict';

    const HTMLMediaElement_proto = HTMLMediaElement.prototype;
    const real_play = HTMLMediaElement_proto.play;

    HTMLMediaElement_proto.play = function () {
        try {
            const promise = real_play.apply(this, arguments);

            if (typeof promise?.then === 'function') {
                return promise;
            }

            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    };
}(HTMLMediaElement));
