import layoutManager from '../../components/layoutManager';
import './emby-button.css';
import '@webcomponents/webcomponentsjs/webcomponents-bundle';

class EmbyButton extends HTMLButtonElement {
    constructor() {
        super();
        this.classList.add('paper-icon-button-light');

        if (layoutManager.tv) {
            this.classList.add('show-focus');
        }
    }
}

customElements.define('paper-icon-button-light', EmbyButton, {
    extends: 'button'
});
