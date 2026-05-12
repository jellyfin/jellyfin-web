/**
 * Polyfill for KeyboardEvent
 * - Constructor.
 * - 'code' property.
 * - 'key' property.
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

    if (!('code' in KeyboardEvent.prototype)) {
        /**
         * Key code mapping.
         */
        const KeyCodes = {
            13: 'Enter',
            19: 'Pause',
            27: 'Escape',
            32: 'Space',
            37: 'ArrowLeft',
            38: 'ArrowUp',
            39: 'ArrowRight',
            40: 'ArrowDown'
        };

        // Add [a..z]
        for (let i = 65; i <= 90; i++) {
            KeyCodes[i] = `Key${String.fromCharCode(i)}`;
        }

        // Add [0..9]
        for (let i = 48; i <= 57; i++) {
            KeyCodes[i] = `Digit${String.fromCharCode(i)}`;
        }

        Object.defineProperty(KeyboardEvent.prototype, 'code', {
            get: function () {
                return KeyCodes[this.keyCode] || '';
            },
            enumerable: true,
            configurable: true
        });
    }

    if (!('key' in KeyboardEvent.prototype)) {
        /**
         * Key mapping.
         */
        const Keys = {
            13: 'Enter',
            19: 'Pause',
            27: 'Escape',
            32: 'Space',
            37: 'ArrowLeft',
            38: 'ArrowUp',
            39: 'ArrowRight',
            40: 'ArrowDown'
        };

        // Add [a..z]
        for (let i = 65; i <= 90; i++) {
            const c = String.fromCharCode(i);
            Keys[i] = [c.toLowerCase(), c.toUpperCase()];
        }

        Object.defineProperty(KeyboardEvent.prototype, 'key', {
            get: function () {
                const key = Keys[this.keyCode] || '';
                return Array.isArray(key) ? key[+this.shiftKey] : key;
            },
            enumerable: true,
            configurable: true
        });
    }
}(window));
