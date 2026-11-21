import EmbyProgressRing from '../emby-progressring/emby-progressring';
import dom from '../../utils/dom';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { OutboundWebSocketMessageType } from '@jellyfin/sdk/lib/websocket';

import 'webcomponents.js/webcomponents-lite';

function onRefreshProgress(indicator, info) {
    if (!indicator.itemId) {
        indicator.itemId = dom.parentWithAttribute(indicator, 'data-id').getAttribute('data-id');
    }

    if (info?.ItemId === indicator.itemId) {
        const progress = parseFloat(info.Progress);

        if (progress && progress < 100) {
            indicator.classList.remove('hide');
        } else {
            indicator.classList.add('hide');
        }

        indicator.dataset.progress = progress;
    }
}

const EmbyItemRefreshIndicatorPrototype = Object.create(EmbyProgressRing);

EmbyItemRefreshIndicatorPrototype.createdCallback = function () {
    // base method
    if (EmbyProgressRing.createdCallback) {
        EmbyProgressRing.createdCallback.call(this);
    }

    const handler = ({ Data }) => onRefreshProgress(this, Data);

    const serverId = dom.parentWithAttribute(this, 'data-serverid')?.getAttribute('data-serverid');
    const apiClient = serverId ? ServerConnections.getApiClient(serverId) : ServerConnections.currentApiClient();
    this._wsUnsubscribers = [];
    if (apiClient) {
        this._wsUnsubscribers.push(apiClient.subscribe([OutboundWebSocketMessageType.RefreshProgress], handler));
    }
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

    this._wsUnsubscribers?.forEach(unsub => {
        unsub();
    });
    this._wsUnsubscribers = [];

    this.itemId = null;
};

document.registerElement('emby-itemrefreshindicator', {
    prototype: EmbyItemRefreshIndicatorPrototype,
    extends: 'div'
});
