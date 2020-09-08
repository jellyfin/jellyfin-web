import layoutManager from '../../components/layoutManager';
import './emby-button.css';
import 'webcomponents.js/webcomponents-lite';

const EmbyButtonPrototype = Object.create(HTMLButtonElement.prototype);

EmbyButtonPrototype.createdCallback = function () {
    this.classList.add('../../elements/emby-button/paper-icon-button-light');

    if (layoutManager.tv) {
        this.classList.add('show-focus');
    }
};

document.registerElement('../../elements/emby-button/paper-icon-button-light', {
    prototype: EmbyButtonPrototype,
    extends: 'button'
});
