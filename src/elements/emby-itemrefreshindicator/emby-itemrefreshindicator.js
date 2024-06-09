import EmbyProgressRing from '../emby-progressring/emby-progressring';
import dom from '../../scripts/dom';
import serverNotifications from '../../scripts/serverNotifications';
import Events from '../../utils/events.ts';

import 'webcomponents.js/webcomponents-lite';

function addNotificationEvent(instance, name, handler) {
    const localHandler = handler.bind(instance);
    Events.on(serverNotifications, name, localHandler);
    instance[name] = localHandler;
}

function removeNotificationEvent(instance, name) {
    const handler = instance[name];
    if (handler) {
        Events.off(serverNotifications, name, handler);
        instance[name] = null;
    }
}

function onRefreshProgress(e, apiClient, info) {
    const indicator = this;

    if (!indicator.itemId) {
        indicator.itemId = dom.parentWithAttribute(indicator, 'data-id').getAttribute('data-id');
    }

    if (info.ItemId === indicator.itemId) {
        const progress = parseFloat(info.Progress);

        if (progress && progress < 100) {
            this.classList.remove('hide');
        } else {
            this.classList.add('hide');
        }

        this.setAttribute('data-progress', progress);
    }
}

const EmbyItemRefreshIndicatorPrototype = Object.create(EmbyProgressRing);

EmbyItemRefreshIndicatorPrototype.createdCallback = function () {
    // base method
    if (EmbyProgressRing.createdCallback) {
        EmbyProgressRing.createdCallback.call(this);
    }

    addNotificationEvent(this, 'RefreshProgress', onRefreshProgress);
};

EmbyItemRefreshIndicatorPrototype.attachedCallback = function () {
    // base method
    if (EmbyProgressRing.attachedCallback) {
        EmbyProgressRing.attachedCallback.call(this);
    }
};

EmbyItemRefreshIndicatorPrototype.detachedCallback = function () {
    // base method
    if (EmbyProgressRing.detachedCallback) {
        EmbyProgressRing.detachedCallback.call(this);
    }

    removeNotificationEvent(this, 'RefreshProgress');
    this.itemId = null;
};

document.registerElement('emby-itemrefreshindicator', {
    prototype: EmbyItemRefreshIndicatorPrototype,
    extends: 'div'
});

