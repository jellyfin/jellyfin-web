import { playbackManager } from './playback/playbackmanager';
import serverNotifications from '@/scripts/serverNotifications';
import Events from '@/utils/events.ts';

function onUserDataChanged() {
    const instance = this;
    const eventsToMonitor = getEventsToMonitor(instance);

    // TODO: Check user data change reason?
    if (eventsToMonitor.indexOf('markfavorite') !== -1
        || eventsToMonitor.indexOf('markplayed') !== -1
    ) {
        instance.notifyRefreshNeeded();
    }
}

function getEventsToMonitor(instance) {
    const options = instance.options;
    const monitor = options ? options.monitorEvents : null;
    if (monitor) {
        return monitor.split(',');
    }

    return [];
}

function notifyTimerRefresh() {
    const instance = this;

    if (getEventsToMonitor(instance).indexOf('timers') !== -1) {
        instance.notifyRefreshNeeded();
    }
}

function notifySeriesTimerRefresh() {
    const instance = this;
    if (getEventsToMonitor(instance).indexOf('seriestimers') !== -1) {
        instance.notifyRefreshNeeded();
    }
}

function onLibraryChanged(e, apiClient, data) {
    const instance = this;
    const eventsToMonitor = getEventsToMonitor(instance);
    if (eventsToMonitor.indexOf('seriestimers') !== -1 || eventsToMonitor.indexOf('timers') !== -1) {
        // yes this is an assumption
        return;
    }

    const itemsAdded = data.ItemsAdded || [];
    const itemsRemoved = data.ItemsRemoved || [];
    if (!itemsAdded.length && !itemsRemoved.length) {
        return;
    }

    const options = instance.options || {};
    const parentId = options.parentId;
    if (parentId) {
        const foldersAddedTo = data.FoldersAddedTo || [];
        const foldersRemovedFrom = data.FoldersRemovedFrom || [];
        const collectionFolders = data.CollectionFolders || [];

        if (foldersAddedTo.indexOf(parentId) === -1 && foldersRemovedFrom.indexOf(parentId) === -1 && collectionFolders.indexOf(parentId) === -1) {
            return;
        }
    }

    instance.notifyRefreshNeeded();
}

function onPlaybackStopped(e, stopInfo) {
    const instance = this;

    const state = stopInfo.state;

    const eventsToMonitor = getEventsToMonitor(instance);
    if (state.NowPlayingItem?.MediaType === 'Video') {
        if (eventsToMonitor.indexOf('videoplayback') !== -1) {
            instance.notifyRefreshNeeded(true);
            return;
        }
    } else if (state.NowPlayingItem?.MediaType === 'Audio' && eventsToMonitor.indexOf('audioplayback') !== -1) {
        instance.notifyRefreshNeeded(true);
        return;
    }
}

function addNotificationEvent(instance, name, handler, owner) {
    const localHandler = handler.bind(instance);
    owner = owner || serverNotifications;
    Events.on(owner, name, localHandler);
    instance['event_' + name] = localHandler;
}

function removeNotificationEvent(instance, name, owner) {
    const handler = instance['event_' + name];
    if (handler) {
        owner = owner || serverNotifications;
        Events.off(owner, name, handler);
        instance['event_' + name] = null;
    }
}

class ItemsRefresher {
    constructor(options) {
        this.options = options || {};

        addNotificationEvent(this, 'UserDataChanged', onUserDataChanged);
        addNotificationEvent(this, 'TimerCreated', notifyTimerRefresh);
        addNotificationEvent(this, 'SeriesTimerCreated', notifySeriesTimerRefresh);
        addNotificationEvent(this, 'TimerCancelled', notifyTimerRefresh);
        addNotificationEvent(this, 'SeriesTimerCancelled', notifySeriesTimerRefresh);
        addNotificationEvent(this, 'LibraryChanged', onLibraryChanged);
        addNotificationEvent(this, 'playbackstop', onPlaybackStopped, playbackManager);
    }

    pause() {
        clearRefreshInterval(this, true);

        this.paused = true;
    }

    resume(options) {
        this.paused = false;

        const refreshIntervalEndTime = this.refreshIntervalEndTime;
        if (refreshIntervalEndTime) {
            const remainingMs = refreshIntervalEndTime - new Date().getTime();
            if (remainingMs > 0 && !this.needsRefresh) {
                resetRefreshInterval(this, remainingMs);
            } else {
                this.needsRefresh = true;
                this.refreshIntervalEndTime = null;
            }
        }

        if (this.needsRefresh || (options?.refresh)) {
            return this.refreshItems();
        }

        return Promise.resolve();
    }

    refreshItems() {
        if (!this.fetchData) {
            return Promise.resolve();
        }

        if (this.paused) {
            this.needsRefresh = true;
            return Promise.resolve();
        }

        this.needsRefresh = false;

        return this.fetchData().then(onDataFetched.bind(this));
    }

    notifyRefreshNeeded(isInForeground) {
        if (this.paused) {
            this.needsRefresh = true;
            return;
        }

        const timeout = this.refreshTimeout;
        if (timeout) {
            clearTimeout(timeout);
        }

        if (isInForeground === true) {
            this.refreshItems();
        } else {
            this.refreshTimeout = setTimeout(this.refreshItems.bind(this), 10000);
        }
    }

    destroy() {
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
    }
}

function clearRefreshInterval(instance, isPausing) {
    if (instance.refreshInterval) {
        clearInterval(instance.refreshInterval);
        instance.refreshInterval = null;

        if (!isPausing) {
            instance.refreshIntervalEndTime = null;
        }
    }
}

function resetRefreshInterval(instance, intervalMs) {
    clearRefreshInterval(instance);

    if (!intervalMs) {
        const options = instance.options;
        if (options) {
            intervalMs = options.refreshIntervalMs;
        }
    }

    if (intervalMs) {
        instance.refreshInterval = setInterval(instance.notifyRefreshNeeded.bind(instance), intervalMs);
        instance.refreshIntervalEndTime = new Date().getTime() + intervalMs;
    }
}

function onDataFetched(result) {
    resetRefreshInterval(this);

    if (this.afterRefresh) {
        this.afterRefresh(result);
    }
}

export default ItemsRefresher;
