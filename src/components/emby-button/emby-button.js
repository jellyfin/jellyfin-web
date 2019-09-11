define(['browser', 'dom', 'layoutManager', 'shell', 'appRouter', 'apphost', 'css!./emby-button', 'registerElement'], function (browser, dom, layoutManager, shell, appRouter, appHost) {
    'use strict';

    var EmbyButtonPrototype = Object.create(HTMLButtonElement.prototype);
    var EmbyLinkButtonPrototype = Object.create(HTMLAnchorElement.prototype);

    function onAnchorClick(e) {
        var href = this.getAttribute('href') || '';
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

    return EmbyButtonPrototype;
});
