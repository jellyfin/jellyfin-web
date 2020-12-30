import '@webcomponents/webcomponentsjs/webcomponents-bundle';
import { removeEventListener, addEventListener } from '../../scripts/dom';
import layoutManager from '../../components/layoutManager';
import shell from '../../scripts/shell';
import { appRouter } from '../../components/appRouter';
import { appHost } from '../../components/apphost';
import './emby-button.css';

function onAnchorClick(e) {
    const href = this.getAttribute('href') || '';
    if (href !== '#') {
        if (this.getAttribute('target')) {
            if (!appHost.supports('targetblank')) {
                e.preventDefault();
                shell.openUrl(href);
            }
        } else {
            e.preventDefault();
            appRouter.show(href);
        }
    } else {
        e.preventDefault();
    }
}
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

    connectedCallback() {
        if (this.tagName === 'A') {
            removeEventListener(this, 'click', onAnchorClick, {});
            addEventListener(this, 'click', onAnchorClick, {});

            if (this.getAttribute('data-autohide') === 'true') {
                if (appHost.supports('externallinks')) {
                    this.classList.remove('hide');
                } else {
                    this.classList.add('hide');
                }
            }
        }
    }

    disconnectedCallback() {
        removeEventListener(this, 'click', onAnchorClick, {});
    }
}

class EmbyLinkButton extends HTMLAnchorElement {
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

    connectedCallback() {
        if (this.tagName === 'A') {
            removeEventListener(this, 'click', onAnchorClick, {});
            addEventListener(this, 'click', onAnchorClick, {});

            if (this.getAttribute('data-autohide') === 'true') {
                if (appHost.supports('externallinks')) {
                    this.classList.remove('hide');
                } else {
                    this.classList.add('hide');
                }
            }
        }
    }

    disconnectedCallback() {
    }
}

customElements.define('emby-button', EmbyButton, {
    extends: 'button'
});

customElements.define('emby-linkbutton', EmbyLinkButton, {
    extends: 'a'
});

export default EmbyButton;
