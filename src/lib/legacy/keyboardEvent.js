/**
 * Polyfill for KeyboardEvent
 * - Constructor.
 */

(function (window) {
    'use strict';

    try {
        new window.KeyboardEvent('event', { bubbles: true, cancelable: true });
    } catch {
        // We can't use `KeyboardEvent` in old WebKit because `initKeyboardEvent`
        // doesn't seem to populate some properties (`keyCode`, `which`) that
        // are read-only.
        const KeyboardEventOriginal = window.Event;

        const KeyboardEvent = function (eventName, options) {
            options = options || {};

            const event = new Event(eventName, { bubbles: !!options.bubbles, cancelable: !!options.cancelable });

            event.view = options.view || document.defaultView;

            // Don't populate 'key' and 'code' with dummy values
            event.keyCode = options.keyCode || 0;
            event.charCode = options.charCode || 0;
            event.char = options.char || '';
            event.which = options.which || 0;

            event.location = options.location || options.keyLocation || 0;

            event.ctrlKey = !!options.ctrlKey;
            event.altKey = !!options.altKey;
            event.shiftKey = !!options.shiftKey;
            event.metaKey = !!options.metaKey;

            event.repeat = !!options.repeat;

            return event;
        };

        KeyboardEvent.prototype = KeyboardEventOriginal.prototype;
        window.KeyboardEvent = KeyboardEvent;
    }
}(window));
