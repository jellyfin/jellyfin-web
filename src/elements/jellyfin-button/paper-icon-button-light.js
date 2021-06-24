import layoutManager from '../../components/layoutManager';
import './jellyfin-button.scss';
import 'webcomponents.js/webcomponents-lite';

const JellyfinButtonPrototype = Object.create(HTMLButtonElement.prototype);

JellyfinButtonPrototype.createdCallback = function () {
    this.classList.add('paper-icon-button-light');

    if (layoutManager.tv) {
        this.classList.add('show-focus');
    }
};

document.registerElement('paper-icon-button-light', {
    prototype: JellyfinButtonPrototype,
    extends: 'button'
});
