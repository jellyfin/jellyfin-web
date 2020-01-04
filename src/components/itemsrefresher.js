define(['playbackManager', 'serverNotifications', 'events'], function (playbackManager, serverNotifications, events) {
    'use strict';

    /**
     * @param e
     * @param apiClient
     * @param userData
     */
    function onUserDataChanged (e, apiClient, userData) {
        var instance = this;

        var eventsToMonitor = getEventsToMonitor(instance);

        // TODO: Check user data change reason?
        if (eventsToMonitor.indexOf('markfavorite') !== -1) {
            instance.notifyRefreshNeeded();
        } else if (eventsToMonitor.indexOf('markplayed') !== -1) {
            instance.notifyRefreshNeeded();
        }
    }

    /**
     * @param instance
     */
    function getEventsToMonitor (instance) {
        var options = instance.options;
        var monitor = options ? options.monitorEvents : null;
        if (monitor) {
            return monitor.split(',');
        }

        return [];
    }

    /**
     * @param e
     * @param apiClient
     * @param data
     */
    function onTimerCreated (e, apiClient, data) {
        var instance = this;

        if (getEventsToMonitor(instance).indexOf('timers') !== -1) {
            instance.notifyRefreshNeeded();
        }
    }

    /**
     * @param e
     * @param apiClient
     * @param data
     */
    function onSeriesTimerCreated (e, apiClient, data) {
        var instance = this;
        if (getEventsToMonitor(instance).indexOf('seriestimers') !== -1) {
            instance.notifyRefreshNeeded();
        }
    }

    /**
     * @param e
     * @param apiClient
     * @param data
     */
    function onTimerCancelled (e, apiClient, data) {
        var instance = this;

        if (getEventsToMonitor(instance).indexOf('timers') !== -1) {
            instance.notifyRefreshNeeded();
        }
    }

    /**
     * @param e
     * @param apiClient
     * @param data
     */
    function onSeriesTimerCancelled (e, apiClient, data) {
        var instance = this;
        if (getEventsToMonitor(instance).indexOf('seriestimers') !== -1) {
            instance.notifyRefreshNeeded();
        }
    }

    /**
     * @param e
     * @param apiClient
     * @param data
     */
    function onLibraryChanged (e, apiClient, data) {
        var instance = this;
        var eventsToMonitor = getEventsToMonitor(instance);
        if (eventsToMonitor.indexOf('seriestimers') !== -1 || eventsToMonitor.indexOf('timers') !== -1) {
            // yes this is an assumption
            return;
        }

        var itemsAdded = data.ItemsAdded || [];
        var itemsRemoved = data.ItemsRemoved || [];
        if (!itemsAdded.length && !itemsRemoved.length) {
            return;
        }

        var options = instance.options || {};
        var parentId = options.parentId;
        if (parentId) {
            var foldersAddedTo = data.FoldersAddedTo || [];
            var foldersRemovedFrom = data.FoldersRemovedFrom || [];
            var collectionFolders = data.CollectionFolders || [];

            if (foldersAddedTo.indexOf(parentId) === -1 && foldersRemovedFrom.indexOf(parentId) === -1 && collectionFolders.indexOf(parentId) === -1) {
                return;
            }
        }

        instance.notifyRefreshNeeded();
    }

    /**
     * @param e
     * @param stopInfo
     */
    function onPlaybackStopped (e, stopInfo) {
        var instance = this;

        var state = stopInfo.state;

        var eventsToMonitor = getEventsToMonitor(instance);
        if (state.NowPlayingItem && state.NowPlayingItem.MediaType === 'Video') {
            if (eventsToMonitor.indexOf('videoplayback') !== -1) {
                instance.notifyRefreshNeeded(true);
            }
        } else if (state.NowPlayingItem && state.NowPlayingItem.MediaType === 'Audio') {
            if (eventsToMonitor.indexOf('audioplayback') !== -1) {
                instance.notifyRefreshNeeded(true);
            }
        }
    }

    /**
     * @param instance
     * @param name
     * @param handler
     * @param owner
     */
    function addNotificationEvent (instance, name, handler, owner) {
        var localHandler = handler.bind(instance);
        owner = owner || serverNotifications;
        events.on(owner, name, localHandler);
        instance['event_' + name] = localHandler;
    }

    /**
     * @param instance
     * @param name
     * @param owner
     */
    function removeNotificationEvent (instance, name, owner) {
        var handler = instance['event_' + name];
        if (handler) {
            owner = owner || serverNotifications;
            events.off(owner, name, handler);
            instance['event_' + name] = null;
        }
    }

    /**
     * @param options
     */
    function ItemsRefresher (options) {
        this.options = options || {};

        addNotificationEvent(this, 'UserDataChanged', onUserDataChanged);
        addNotificationEvent(this, 'TimerCreated', onTimerCreated);
        addNotificationEvent(this, 'SeriesTimerCreated', onSeriesTimerCreated);
        addNotificationEvent(this, 'TimerCancelled', onTimerCancelled);
        addNotificationEvent(this, 'SeriesTimerCancelled', onSeriesTimerCancelled);
        addNotificationEvent(this, 'LibraryChanged', onLibraryChanged);
        addNotificationEvent(this, 'playbackstop', onPlaybackStopped, playbackManager);
    }

    ItemsRefresher.prototype.pause = function () {
        clearRefreshInterval(this, true);

        this.paused = true;
    };

    ItemsRefresher.prototype.resume = function (options) {
        this.paused = false;

        var refreshIntervalEndTime = this.refreshIntervalEndTime;
        if (refreshIntervalEndTime) {
            var remainingMs = refreshIntervalEndTime - new Date().getTime();
            if (remainingMs > 0 && !this.needsRefresh) {
                resetRefreshInterval(this, remainingMs);
            } else {
                this.needsRefresh = true;
                this.refreshIntervalEndTime = null;
            }
        }

        if (this.needsRefresh || (options && options.refresh)) {
            return this.refreshItems();
        }

        return Promise.resolve();
    };

    ItemsRefresher.prototype.refreshItems = function () {
        if (!this.fetchData) {
            return Promise.resolve();
        }

        if (this.paused) {
            this.needsRefresh = true;
            return Promise.resolve();
        }

        this.needsRefresh = false;

        return this.fetchData().then(onDataFetched.bind(this));
    };

    ItemsRefresher.prototype.notifyRefreshNeeded = function (isInForeground) {
        if (this.paused) {
            this.needsRefresh = true;
            return;
        }

        var timeout = this.refreshTimeout;
        if (timeout) {
            clearTimeout(timeout);
        }

        if (isInForeground === true) {
            this.refreshItems();
        } else {
            this.refreshTimeout = setTimeout(this.refreshItems.bind(this), 10000);
        }
    };

    /**
     * @param instance
     * @param isPausing
     */
    function clearRefreshInterval (instance, isPausing) {
        if (instance.refreshInterval) {
            clearInterval(instance.refreshInterval);
            instance.refreshInterval = null;

            if (!isPausing) {
                instance.refreshIntervalEndTime = null;
            }
        }
    }

    /**
     * @param instance
     * @param intervalMs
     */
    function resetRefreshInterval (instance, intervalMs) {
        clearRefreshInterval(instance);

        if (!intervalMs) {
            var options = instance.options;
            if (options) {
                intervalMs = options.refreshIntervalMs;
            }
        }

        if (intervalMs) {
            instance.refreshInterval = setInterval(instance.notifyRefreshNeeded.bind(instance), intervalMs);
            instance.refreshIntervalEndTime = new Date().getTime() + intervalMs;
        }
    }

    /**
     * @param result
     */
    function onDataFetched (result) {
        resetRefreshInterval(this);

        if (this.afterRefresh) {
            this.afterRefresh(result);
        }
    }

    ItemsRefresher.prototype.destroy = function () {
        clearRefreshInterval(this);

        removeNotificationEvent(this, 'UserDataChanged');
        removeNotificationEvent(this, 'TimerCreated');
        removeNotificationEvent(this, 'SeriesTimerCreated');
        removeNotificationEvent(this, 'TimerCancelled');
        removeNotificationEvent(this, 'SeriesTimerCancelled');
        removeNotificationEvent(this, 'LibraryChanged');
        removeNotificationEvent(this, 'playbackstop', playbackManager);

        this.fetchData = null;
        this.options = null;
    };

    return ItemsRefresher;
});
