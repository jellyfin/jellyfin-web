import 'webcomponents.js/webcomponents-lite';

import { safeAppHost } from 'components/apphost';
import layoutManager from 'components/layoutManager';
import { appRouter } from 'components/router/appRouter';
import { AppFeature } from 'constants/appFeature';
import { removeEventListener, addEventListener } from 'utils/dom';
import shell from 'scripts/shell';

import './emby-button.scss';

const EmbyButtonPrototype = Object.create(HTMLButtonElement.prototype);
const EmbyLinkButtonPrototype = Object.create(HTMLAnchorElement.prototype);

function onAnchorClick(e) {
    const href = this.getAttribute('href') || '';
    if (href !== '#') {
        if (this.getAttribute('target')) {
            if (!safeAppHost.supports(AppFeature.TargetBlank)) {
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
        removeEventListener(this, 'click', onAnchorClick, {});
        addEventListener(this, 'click', onAnchorClick, {});

        if (this.getAttribute('data-autohide') === 'true') {
            if (safeAppHost.supports(AppFeature.ExternalLinks)) {
                this.classList.remove('hide');
            } else {
                this.classList.add('hide');
            }
        }
    }
};

EmbyButtonPrototype.detachedCallback = function () {
    removeEventListener(this, 'click', onAnchorClick, {});
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
