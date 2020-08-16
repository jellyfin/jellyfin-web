import { removeEventListener, addEventListener } from '../../scripts/dom';
import layoutManager from '../../components/layoutManager';
import shell from '../../scripts/shell';
import { appRouter } from '../../components/appRouter';
import { appHost } from '../../components/apphost';
import './emby-button.css';

class EmbyButton extends HTMLButtonElement {
    createdCallback() {
        if (this.classList.contains('emby-button')) {
            return;
        }

        this.classList.add('../../elements/emby-button/emby-button');
        // TODO replace all instances of element-showfocus with this method
        if (layoutManager.tv) {
            // handles all special css for tv layout
            // this method utilizes class chaining
            this.classList.add('show-focus');
        }
    }

    attachedCallback() {
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

    detachedCallback() {
        removeEventListener(this, 'click', onAnchorClick, {});
    }
}

class EmbyLinkButton extends HTMLAnchorElement {
    attachedCallback() {
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

    detachedCallback() {
        removeEventListener(this, 'click', onAnchorClick, {});
    }
}

function onAnchorClick(e) {
    const href = this.getAttribute('href') || '';
    if (href !== '#') {
        if (this.getAttribute('target')) {
            if (!appHost.supports('targetblank')) {
                e.preventDefault();
                shell.openUrl(href);
            }
        } else {
            appRouter.handleAnchorClick(e);
        }
    } else {
        e.preventDefault();
    }
}

customElements.define('emby-button', EmbyButton, { extends: 'button' });

customElements.define('emby-linkbutton', EmbyLinkButton, { extends: 'a' });

export default EmbyButton;
