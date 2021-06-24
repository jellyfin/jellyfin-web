import 'webcomponents.js/webcomponents-lite';
import { removeEventListener, addEventListener } from '../../scripts/dom';
import layoutManager from '../../components/layoutManager';
import shell from '../../scripts/shell';
import { appRouter } from '../../components/appRouter';
import { appHost } from '../../components/apphost';
import './jellyfin-button.scss';

const JellyfinButtonPrototype = Object.create(HTMLButtonElement.prototype);
const JellyfinLinkButtonPrototype = Object.create(HTMLAnchorElement.prototype);

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

JellyfinButtonPrototype.createdCallback = function () {
    if (this.classList.contains('jellyfin-button')) {
        return;
    }

    this.classList.add('jellyfin-button');
    // TODO replace all instances of element-showfocus with this method
    if (layoutManager.tv) {
        // handles all special css for tv layout
        // this method utilizes class chaining
        this.classList.add('show-focus');
    }
};

JellyfinButtonPrototype.attachedCallback = function () {
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
};

JellyfinButtonPrototype.detachedCallback = function () {
    removeEventListener(this, 'click', onAnchorClick, {});
};

JellyfinLinkButtonPrototype.createdCallback = JellyfinButtonPrototype.createdCallback;
JellyfinLinkButtonPrototype.attachedCallback = JellyfinButtonPrototype.attachedCallback;

document.registerElement('jellyfin-button', {
    prototype: JellyfinButtonPrototype,
    extends: 'button'
});

document.registerElement('jellyfin-linkbutton', {
    prototype: JellyfinLinkButtonPrototype,
    extends: 'a'
});

export default JellyfinButtonPrototype;
