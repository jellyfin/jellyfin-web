import browser from '../../scripts/browser';
import dom from '../../scripts/dom';
import './jellyfin-input.scss';
import 'webcomponents.js/webcomponents-lite';

/* eslint-disable indent */

    const JellyfinInputPrototype = Object.create(HTMLInputElement.prototype);

    let inputId = 0;
    let supportsFloatingLabel = false;

    if (Object.getOwnPropertyDescriptor && Object.defineProperty) {
        const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

        // descriptor returning null in webos
        if (descriptor && descriptor.configurable) {
            const baseSetMethod = descriptor.set;
            descriptor.set = function (value) {
                baseSetMethod.call(this, value);

                this.dispatchEvent(new CustomEvent('valueset', {
                    bubbles: false,
                    cancelable: false
                }));
            };

            Object.defineProperty(HTMLInputElement.prototype, 'value', descriptor);
            supportsFloatingLabel = true;
        }
    }

    JellyfinInputPrototype.createdCallback = function () {
        if (!this.id) {
            this.id = 'jellyfininput' + inputId;
            inputId++;
        }

        if (this.classList.contains('jellyfin-input')) {
            return;
        }

        this.classList.add('jellyfin-input');

        const parentNode = this.parentNode;
        const document = this.ownerDocument;
        const label = document.createElement('label');
        label.innerHTML = this.getAttribute('label') || '';
        label.classList.add('inputLabel');
        label.classList.add('inputLabelUnfocused');

        label.htmlFor = this.id;
        parentNode.insertBefore(label, this);
        this.labelElement = label;

        dom.addEventListener(this, 'focus', function () {
            onChange.call(this);

            // For Samsung orsay devices
            if (document.attachIME) {
                document.attachIME(this);
            }

            label.classList.add('inputLabelFocused');
            label.classList.remove('inputLabelUnfocused');
        }, {
            passive: true
        });

        dom.addEventListener(this, 'blur', function () {
            onChange.call(this);
            label.classList.remove('inputLabelFocused');
            label.classList.add('inputLabelUnfocused');
        }, {
            passive: true
        });

        dom.addEventListener(this, 'change', onChange, {
            passive: true
        });
        dom.addEventListener(this, 'input', onChange, {
            passive: true
        });
        dom.addEventListener(this, 'valueset', onChange, {
            passive: true
        });

        if (browser.orsay) {
            if (this === document.activeElement) {
                //Make sure the IME pops up if this is the first/default element on the page
                if (document.attachIME) {
                    document.attachIME(this);
                }
            }
        }
    };

    function onChange() {
        const label = this.labelElement;
        if (this.value) {
            label.classList.remove('inputLabel-float');
        } else {
            const instanceSupportsFloat = supportsFloatingLabel && this.type !== 'date' && this.type !== 'time';

            if (instanceSupportsFloat) {
                label.classList.add('inputLabel-float');
            }
        }
    }

    JellyfinInputPrototype.attachedCallback = function () {
        this.labelElement.htmlFor = this.id;
        onChange.call(this);
    };

    JellyfinInputPrototype.label = function (text) {
        this.labelElement.innerHTML = text;
    };

    document.registerElement('jellyfin-input', {
        prototype: JellyfinInputPrototype,
        extends: 'input'
    });

/* eslint-enable indent */
