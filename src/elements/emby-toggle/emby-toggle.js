import './emby-toggle.css';
import '@webcomponents/webcomponentsjs/webcomponents-bundle';

class onKeyDown {
    constructor(e) {
        // Don't submit form on enter
        if (e.keyCode === 13) {
            e.preventDefault();

            this.checked = !this.checked;

            this.dispatchEvent(new CustomEvent('change', {
                bubbles: true
            }));

            return false;
        }
    }
}
class EmbyToggle extends HTMLInputElement {
    connectedCallback() {
        if (this.getAttribute('data-embytoggle') === 'true') {
            return;
        }

        this.setAttribute('data-embytoggle', 'true');

        this.classList.add('mdl-switch__input');

        const labelElement = this.parentNode;
        labelElement.classList.add('mdl-switch');
        labelElement.classList.add('mdl-js-switch');

        const labelTextElement = labelElement.querySelector('span');

        labelElement.insertAdjacentHTML('beforeend', '<div class="mdl-switch__trackContainer"><div class="mdl-switch__track"></div><div class="mdl-switch__thumb"><span class="mdl-switch__focus-helper"></span></div></div>');

        labelTextElement.classList.add('toggleButtonLabel');
        labelTextElement.classList.add('mdl-switch__label');

        this.addEventListener('keydown', onKeyDown);
    }
}

customElements.define('emby-toggle', EmbyToggle, {
    extends: 'input'
});
