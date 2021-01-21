import EmbyProgressRing from '../emby-progressring/emby-progressring';
import dom from '../../scripts/dom';
import serverNotifications from '../../scripts/serverNotifications';
import { Events } from 'jellyfin-apiclient';

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

class EmbyItemRefreshIndicator extends EmbyProgressRing {
    constructor() {
        super();
        addNotificationEvent(this, 'RefreshProgress', onRefreshProgress);
    }

    connectedCallback() {
        super.connectedCallback(this);
    }

    disconnectedCallback() {
        super.disconnectedCallback(this);

        removeNotificationEvent(this, 'RefreshProgress');
        this.itemId = null;
    }
}

customElements.define('emby-itemrefreshindicator', EmbyItemRefreshIndicator, {
    extends: 'div'
});
