import dom from 'dom';
import layoutManager from 'layoutManager';
import shell from 'shell';
import appRouter from 'appRouter';
import appHost from 'apphost';
import 'css!./emby-button';
import 'webcomponents';

const EmbyButtonPrototype = Object.create(HTMLButtonElement.prototype);
const EmbyLinkButtonPrototype = Object.create(HTMLAnchorElement.prototype);

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

EmbyButtonPrototype.createdCallback = function () {
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
};

EmbyButtonPrototype.attachedCallback = function () {
    if (this.tagName === 'A') {
        dom.removeEventListener(this, 'click', onAnchorClick, {});
        dom.addEventListener(this, 'click', onAnchorClick, {});

        if (this.getAttribute('data-autohide') === 'true') {
            if (appHost.supports('externallinks')) {
                this.classList.remove('hide');
            } else {
                this.classList.add('hide');
            }
        }
    }
};

EmbyButtonPrototype.detachedCallback = function () {
    dom.removeEventListener(this, 'click', onAnchorClick, {});
};

EmbyLinkButtonPrototype.createdCallback = EmbyButtonPrototype.createdCallback;
EmbyLinkButtonPrototype.attachedCallback = EmbyButtonPrototype.attachedCallback;

document.registerElement('emby-button', {
    prototype: EmbyButtonPrototype,
    extends: 'button'
});

document.registerElement('emby-linkbutton', {
    prototype: EmbyLinkButtonPrototype,
    extends: 'a'
});

export default EmbyButtonPrototype;
