define(['emby-progressring', 'dom', 'serverNotifications', 'events', 'registerElement'], function (EmbyProgressRing, dom, serverNotifications, events) {
    'use strict';

    /**
     * @param instance
     * @param name
     * @param handler
     */
    function addNotificationEvent (instance, name, handler) {
        var localHandler = handler.bind(instance);
        events.on(serverNotifications, name, localHandler);
        instance[name] = localHandler;
    }

    /**
     * @param instance
     * @param name
     */
    function removeNotificationEvent (instance, name) {
        var handler = instance[name];
        if (handler) {
            events.off(serverNotifications, name, handler);
            instance[name] = null;
        }
    }

    /**
     * @param e
     * @param apiClient
     * @param info
     */
    function onRefreshProgress (e, apiClient, info) {
        var indicator = this;

        if (!indicator.itemId) {
            indicator.itemId = dom.parentWithAttribute(indicator, 'data-id').getAttribute('data-id');
        }

        if (info.ItemId === indicator.itemId) {
            var progress = parseFloat(info.Progress);

            if (progress && progress < 100) {
                this.classList.remove('hide');
            } else {
                this.classList.add('hide');
            }

            this.setProgress(progress);
        }
    }

    var EmbyItemRefreshIndicatorPrototype = Object.create(EmbyProgressRing);

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
});
