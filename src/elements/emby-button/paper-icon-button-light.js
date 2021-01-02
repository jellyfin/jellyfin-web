import layoutManager from '../../components/layoutManager';
import './emby-button.css';
import '@webcomponents/webcomponentsjs/webcomponents-bundle';

// TODO: replace with emby-button
class EmbyButton extends HTMLButtonElement {
    constructor() {
        super();
        this.classList.add('emby-button');

        if (layoutManager.tv) {
            this.classList.add('show-focus');
        }
    }
}

customElements.define('emby-button', EmbyButton, {
    extends: 'button'
});
