import focusManager from '../components/focusManager';
import dom from '../utils/dom';

let inputDisplayElement;
let currentDisplayText = '';
let currentDisplayTextContainer;

function onKeyDown(e) {
    if (e.ctrlKey) {
        return;
    }
    if (e.shiftKey) {
        return;
    }
    if (e.altKey) {
        return;
    }

    const key = e.key;
    let chr = key ? alphanumeric(key) : null;

    if (chr) {
        chr = chr.toString().toUpperCase();

        if (chr.length === 1) {
            currentDisplayTextContainer = this.options.itemsContainer;
            onAlphanumericKeyPress(e, chr);
        }
    }
}

function alphanumeric(value) {
    const letterNumber = /^[0-9a-zA-Z]+$/;
    return value.match(letterNumber);
}

function ensureInputDisplayElement() {
    if (!inputDisplayElement) {
        inputDisplayElement = document.createElement('div');
        inputDisplayElement.classList.add('alphanumeric-shortcut');
        inputDisplayElement.classList.add('hide');

        document.body.appendChild(inputDisplayElement);
    }
}

let alpanumericShortcutTimeout;
function clearAlphaNumericShortcutTimeout() {
    if (alpanumericShortcutTimeout) {
        clearTimeout(alpanumericShortcutTimeout);
        alpanumericShortcutTimeout = null;
    }
}
function resetAlphaNumericShortcutTimeout() {
    clearAlphaNumericShortcutTimeout();
    alpanumericShortcutTimeout = setTimeout(onAlphanumericShortcutTimeout, 2000);
}

function onAlphanumericKeyPress(e, chr) {
    if (currentDisplayText.length >= 3) {
        return;
    }
    ensureInputDisplayElement();
    currentDisplayText += chr;
    inputDisplayElement.innerHTML = currentDisplayText;
    inputDisplayElement.classList.remove('hide');
    resetAlphaNumericShortcutTimeout();
}

function onAlphanumericShortcutTimeout() {
    const value = currentDisplayText;
    const container = currentDisplayTextContainer;

    currentDisplayText = '';
    currentDisplayTextContainer = null;
    inputDisplayElement.innerHTML = '';
    inputDisplayElement.classList.add('hide');
    clearAlphaNumericShortcutTimeout();
    selectByShortcutValue(container, value);
}

function selectByShortcutValue(container, value) {
    value = value.toUpperCase();

    let focusElem;
    if (value === '#') {
        focusElem = container.querySelector('*[data-prefix]');
    }

    if (!focusElem) {
        focusElem = container.querySelector("*[data-prefix^='" + value + "']");
    }

    if (focusElem) {
        focusManager.focus(focusElem);
    }
}

class AlphaNumericShortcuts {
    constructor(options) {
        this.options = options;

        const keyDownHandler = onKeyDown.bind(this);

        dom.addEventListener(window, 'keydown', keyDownHandler, {
            passive: true
        });

        this.keyDownHandler = keyDownHandler;
    }
    destroy() {
        const keyDownHandler = this.keyDownHandler;

        if (keyDownHandler) {
            dom.removeEventListener(window, 'keydown', keyDownHandler, {
                passive: true
            });
            this.keyDownHandler = null;
        }
        this.options = null;
    }
}

export default AlphaNumericShortcuts;
