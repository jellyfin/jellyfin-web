import JellyfinProgressRing from '../jellyfin-progressring/jellyfin-progressring';
import dom from '../../scripts/dom';
import serverNotifications from '../../scripts/serverNotifications';
import { Events } from 'jellyfin-apiclient';
import 'webcomponents.js/webcomponents-lite';

/* eslint-disable indent */

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

    const JellyfinItemRefreshIndicatorPrototype = Object.create(JellyfinProgressRing);

    JellyfinItemRefreshIndicatorPrototype.createdCallback = function () {
        // base method
        if (JellyfinProgressRing.createdCallback) {
            JellyfinProgressRing.createdCallback.call(this);
        }

        addNotificationEvent(this, 'RefreshProgress', onRefreshProgress);
    };

    JellyfinItemRefreshIndicatorPrototype.attachedCallback = function () {
        // base method
        if (JellyfinProgressRing.attachedCallback) {
            JellyfinProgressRing.attachedCallback.call(this);
        }
    };

    JellyfinItemRefreshIndicatorPrototype.detachedCallback = function () {
        // base method
        if (JellyfinProgressRing.detachedCallback) {
            JellyfinProgressRing.detachedCallback.call(this);
        }

        removeNotificationEvent(this, 'RefreshProgress');
        this.itemId = null;
    };

    document.registerElement('jellyfin-itemrefreshindicator', {
        prototype: JellyfinItemRefreshIndicatorPrototype,
        extends: 'div'
    });

/* eslint-enable indent */
