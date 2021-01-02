import '@webcomponents/webcomponentsjs/webcomponents-bundle';
import layoutManager from '../../components/layoutManager';
import './emby-button.css';

class EmbyButton extends HTMLButtonElement {
    constructor() {
        super();
        if (this.classList.contains('emby-button')) {
            return;
        }

        this.classList.add('emby-button');
        // TODO replace all instances of element-showfocus with this method
        if (layoutManager.tv) {
            // handles all special css for tv layout
            // this method utilizes class chaining
            this.classList.add('show-focus');
        }
    }
}

customElements.define('emby-button', EmbyButton, {
    extends: 'button'
});

export default EmbyButton;
