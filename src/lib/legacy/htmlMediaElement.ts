/**
 * Polyfill for HTMLMediaElement
 * - HTMLMediaElement.play
 *   Return a `Promise`.
 */

(function (HTMLMediaElement) {
    'use strict';

    const HTMLMediaElementPrototype = HTMLMediaElement.prototype;
    // Old implementations of `play` don't return a `Promise`
    const realPlay: (this: HTMLMediaElement) => Promise<void> | undefined = HTMLMediaElementPrototype.play;

    HTMLMediaElementPrototype.play = function (this: HTMLMediaElement) {
        try {
            // Forward the original arguments to the native implementation
            // eslint-disable-next-line prefer-rest-params
            const promise = realPlay.apply(this, arguments as unknown as Parameters<typeof realPlay>);

            if (typeof promise?.then === 'function') {
                return promise;
            }

            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    };
}(HTMLMediaElement));
