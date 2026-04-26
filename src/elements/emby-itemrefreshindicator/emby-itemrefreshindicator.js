import EmbyProgressRing from '../emby-progressring/emby-progressring';
import dom from '../../utils/dom';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Events from '../../utils/events.ts';
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

        indicator.setAttribute('data-progress', progress);
    }
}

const EmbyItemRefreshIndicatorPrototype = Object.create(EmbyProgressRing);

EmbyItemRefreshIndicatorPrototype.createdCallback = function () {
    // base method
    if (EmbyProgressRing.createdCallback) {
        EmbyProgressRing.createdCallback.call(this);
    }

    const self = this;
    const handler = ({ Data }) => onRefreshProgress(self, Data);

    self._wsApiClientCreatedHandler = (e, newApiClient) => {
        const unsub = newApiClient.subscribe([OutboundWebSocketMessageType.RefreshProgress], handler);
        if (unsub) self._wsUnsubscribers.push(unsub);
    };
    Events.on(ServerConnections, 'apiclientcreated', self._wsApiClientCreatedHandler);

    self._wsUnsubscribers = ServerConnections.getApiClients()
        .map(apiClient => apiClient.subscribe([OutboundWebSocketMessageType.RefreshProgress], handler))
        .filter(Boolean);
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

    if (this._wsApiClientCreatedHandler) {
        Events.off(ServerConnections, 'apiclientcreated', this._wsApiClientCreatedHandler);
        this._wsApiClientCreatedHandler = null;
    }

    this.itemId = null;
};

document.registerElement('emby-itemrefreshindicator', {
    prototype: EmbyItemRefreshIndicatorPrototype,
    extends: 'div'
});

