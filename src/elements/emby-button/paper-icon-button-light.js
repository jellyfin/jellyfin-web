import layoutManager from 'layoutManager';
import 'css!./emby-button';
import 'registerElement';

/* eslint-disable indent */

    const EmbyButtonPrototype = Object.create(HTMLButtonElement.prototype);

    EmbyButtonPrototype.createdCallback = function () {
        this.classList.add('paper-icon-button-light');

        if (layoutManager.tv) {
            this.classList.add('show-focus');
        }
    };

    document.registerElement('paper-icon-button-light', {
        prototype: EmbyButtonPrototype,
        extends: 'button'
    });

/* eslint-enable indent */
