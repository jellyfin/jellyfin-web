import 'webcomponents.js/webcomponents-lite';
import Sortable from 'sortablejs';

import itemShortcuts from '../../components/shortcuts';
import inputManager from '../../scripts/inputManager';
import { playbackManager } from '../../components/playback/playbackmanager';
import imageLoader from '../../components/images/imageLoader';
import layoutManager from '../../components/layoutManager';
import browser from '../../scripts/browser';
import dom from '../../utils/dom';
import loading from '../../components/loading/loading';
import focusManager from '../../components/focusManager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import serverNotifications from '../../scripts/serverNotifications';
import Events from '../../utils/events.ts';

const ItemsContainerPrototype = Object.create(HTMLDivElement.prototype);

function onClick(e) {
    const itemsContainer = this;
    const multiSelect = itemsContainer.multiSelect;

    if (multiSelect?.onContainerClick.call(itemsContainer, e) === false) {
        return;
    }

    itemShortcuts.onClick.call(itemsContainer, e);
}

function disableEvent(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
}

function onContextMenu(e) {
    const target = e.target;
    const card = dom.parentWithAttribute(target, 'data-id');

    // check for serverId, it won't be present on selectserver
    if (card?.getAttribute('data-serverid')) {
        inputManager.handleCommand('menu', {
            sourceElement: card
        });

        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}

function getShortcutOptions() {
    return {
        click: false
    };
}

ItemsContainerPrototype.enableMultiSelect = function (enabled) {
    const current = this.multiSelect;

    if (!enabled) {
        if (current) {
            current.destroy();
            this.multiSelect = null;
        }
        return;
    }

    if (current) {
        return;
    }

    const self = this;
    import('../../components/multiSelect/multiSelect').then(
        ({ default: MultiSelect }) => {
            self.multiSelect = new MultiSelect({
                container: self,
                bindOnClick: false
            });
        }
    );
};

function onDrop(evt, itemsContainer) {
    const el = evt.item;

    const newIndex = evt.newIndex;
    const itemId = el.getAttribute('data-playlistitemid');
    const playlistId = el.getAttribute('data-playlistid');

    if (!playlistId) {
        const oldIndex = evt.oldIndex;
        el.dispatchEvent(
            new CustomEvent('itemdrop', {
                detail: {
                    oldIndex: oldIndex,
                    newIndex: newIndex,
                    playlistItemId: itemId
                },
                bubbles: true,
                cancelable: false
            })
        );
        return;
    }

    const serverId = el.getAttribute('data-serverid');
    const apiClient = ServerConnections.getApiClient(serverId);

    loading.show();

    apiClient
        .ajax({
            url: apiClient.getUrl(
                'Playlists/' +
                    playlistId +
                    '/Items/' +
                    itemId +
                    '/Move/' +
                    newIndex
            ),
            type: 'POST'
        })
        .then(
            function () {
                loading.hide();
            },
            function () {
                loading.hide();
                itemsContainer.refreshItems();
            }
        );
}

ItemsContainerPrototype.enableDragReordering = function (enabled) {
    const current = this.sortable;
    if (!enabled) {
        if (current) {
            current.destroy();
            this.sortable = null;
        }
        return;
    }

    if (current) {
        return;
    }

    const self = this;
    self.sortable = new Sortable(self, {
        draggable: '.listItem',
        handle: '.listViewDragHandle',

        // dragging ended
        onEnd: function (evt) {
            return onDrop(evt, self);
        }
    });
};

function onUserDataChanged(e, apiClient, userData) {
    const itemsContainer = this;

    import('../../components/cardbuilder/cardBuilder').then((cardBuilder) => {
        cardBuilder.onUserDataChanged(userData, itemsContainer);
    });

    const eventsToMonitor = getEventsToMonitor(itemsContainer);

    // TODO: Check user data change reason?
    if (
        eventsToMonitor.indexOf('markfavorite') !== -1 ||
        eventsToMonitor.indexOf('markplayed') !== -1
    ) {
        itemsContainer.notifyRefreshNeeded();
    }
}

function getEventsToMonitor(itemsContainer) {
    const monitor = itemsContainer.getAttribute('data-monitor');
    if (monitor) {
        return monitor.split(',');
    }

    return [];
}

function onTimerCreated(e, apiClient, data) {
    const itemsContainer = this;

    if (getEventsToMonitor(itemsContainer).indexOf('timers') !== -1) {
        itemsContainer.notifyRefreshNeeded();
        return;
    }

    const programId = data.ProgramId;
    // This could be null, not supported by all tv providers
    const newTimerId = data.Id;

    import('../../components/cardbuilder/cardBuilder').then((cardBuilder) => {
        cardBuilder.onTimerCreated(programId, newTimerId, itemsContainer);
    });
}

function onSeriesTimerCreated() {
    const itemsContainer = this;
    if (getEventsToMonitor(itemsContainer).indexOf('seriestimers') !== -1) {
        itemsContainer.notifyRefreshNeeded();
    }
}

function onTimerCancelled(e, apiClient, data) {
    const itemsContainer = this;
    if (getEventsToMonitor(itemsContainer).indexOf('timers') !== -1) {
        itemsContainer.notifyRefreshNeeded();
        return;
    }

    import('../../components/cardbuilder/cardBuilder').then((cardBuilder) => {
        cardBuilder.onTimerCancelled(data.Id, itemsContainer);
    });
}

function onSeriesTimerCancelled(e, apiClient, data) {
    const itemsContainer = this;
    if (getEventsToMonitor(itemsContainer).indexOf('seriestimers') !== -1) {
        itemsContainer.notifyRefreshNeeded();
        return;
    }

    import('../../components/cardbuilder/cardBuilder').then((cardBuilder) => {
        cardBuilder.onSeriesTimerCancelled(data.Id, itemsContainer);
    });
}

function onLibraryChanged(e, apiClient, data) {
    const itemsContainer = this;

    const eventsToMonitor = getEventsToMonitor(itemsContainer);
    if (
        eventsToMonitor.indexOf('seriestimers') !== -1 ||
        eventsToMonitor.indexOf('timers') !== -1
    ) {
        // yes this is an assumption
        return;
    }

    const itemsAdded = data.ItemsAdded || [];
    const itemsRemoved = data.ItemsRemoved || [];
    if (!itemsAdded.length && !itemsRemoved.length) {
        return;
    }

    const parentId = itemsContainer.getAttribute('data-parentid');
    if (parentId) {
        const foldersAddedTo = data.FoldersAddedTo || [];
        const foldersRemovedFrom = data.FoldersRemovedFrom || [];
        const collectionFolders = data.CollectionFolders || [];

        if (
            foldersAddedTo.indexOf(parentId) === -1 &&
            foldersRemovedFrom.indexOf(parentId) === -1 &&
            collectionFolders.indexOf(parentId) === -1
        ) {
            return;
        }
    }

    itemsContainer.notifyRefreshNeeded();
}

function onPlaybackStopped(e, stopInfo) {
    const itemsContainer = this;
    const state = stopInfo.state;

    const eventsToMonitor = getEventsToMonitor(itemsContainer);
    if (state.NowPlayingItem && state.NowPlayingItem.MediaType === 'Video') {
        if (eventsToMonitor.indexOf('videoplayback') !== -1) {
            itemsContainer.notifyRefreshNeeded(true);
            return;
        }
    } else if (
        state.NowPlayingItem?.MediaType === 'Audio' &&
        eventsToMonitor.indexOf('audioplayback') !== -1
    ) {
        itemsContainer.notifyRefreshNeeded(true);
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

ItemsContainerPrototype.createdCallback = function () {
    this.classList.add('itemsContainer');
};

ItemsContainerPrototype.attachedCallback = function () {
    this.addEventListener('click', onClick);

    if (browser.touch) {
        this.addEventListener('contextmenu', disableEvent);
    } else if (this.getAttribute('data-contextmenu') !== 'false') {
        this.addEventListener('contextmenu', onContextMenu);
    }

    if (
        layoutManager.desktop ||
        (layoutManager.mobile &&
            this.getAttribute('data-multiselect') !== 'false')
    ) {
        this.enableMultiSelect(true);
    }

    if (layoutManager.tv) {
        this.classList.add('itemsContainer-tv');
    }

    itemShortcuts.on(this, getShortcutOptions());

    addNotificationEvent(this, 'UserDataChanged', onUserDataChanged);
    addNotificationEvent(this, 'TimerCreated', onTimerCreated);
    addNotificationEvent(this, 'SeriesTimerCreated', onSeriesTimerCreated);
    addNotificationEvent(this, 'TimerCancelled', onTimerCancelled);
    addNotificationEvent(this, 'SeriesTimerCancelled', onSeriesTimerCancelled);
    addNotificationEvent(this, 'LibraryChanged', onLibraryChanged);
    addNotificationEvent(
        this,
        'playbackstop',
        onPlaybackStopped,
        playbackManager
    );

    if (this.getAttribute('data-dragreorder') === 'true') {
        this.enableDragReordering(true);
    }
};

ItemsContainerPrototype.detachedCallback = function () {
    clearRefreshInterval(this);

    this.enableMultiSelect(false);
    this.enableDragReordering(false);
    this.removeEventListener('click', onClick);
    this.removeEventListener('contextmenu', onContextMenu);
    this.removeEventListener('contextmenu', disableEvent);

    itemShortcuts.off(this, getShortcutOptions());

    removeNotificationEvent(this, 'UserDataChanged');
    removeNotificationEvent(this, 'TimerCreated');
    removeNotificationEvent(this, 'SeriesTimerCreated');
    removeNotificationEvent(this, 'TimerCancelled');
    removeNotificationEvent(this, 'SeriesTimerCancelled');
    removeNotificationEvent(this, 'LibraryChanged');
    removeNotificationEvent(this, 'playbackstop', playbackManager);

    this.fetchData = null;
    this.getItemsHtml = null;
    this.parentContainer = null;
};

ItemsContainerPrototype.pause = function () {
    clearRefreshInterval(this, true);
    this.paused = true;
};

ItemsContainerPrototype.resume = function (options) {
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

    if (this.needsRefresh || options?.refresh) {
        return this.refreshItems();
    }

    return Promise.resolve();
};

ItemsContainerPrototype.refreshItems = function () {
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

ItemsContainerPrototype.notifyRefreshNeeded = function (isInForeground) {
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
};

function clearRefreshInterval(itemsContainer, isPausing) {
    if (itemsContainer.refreshInterval) {
        clearInterval(itemsContainer.refreshInterval);
        itemsContainer.refreshInterval = null;

        if (!isPausing) {
            itemsContainer.refreshIntervalEndTime = null;
        }
    }
}

function resetRefreshInterval(itemsContainer, intervalMs) {
    clearRefreshInterval(itemsContainer);

    if (!intervalMs) {
        intervalMs = parseInt(
            itemsContainer.getAttribute('data-refreshinterval') || '0',
            10
        );
    }

    if (intervalMs) {
        itemsContainer.refreshInterval = setInterval(
            itemsContainer.notifyRefreshNeeded.bind(itemsContainer),
            intervalMs
        );
        itemsContainer.refreshIntervalEndTime =
            new Date().getTime() + intervalMs;
    }
}

function onDataFetched(result) {
    const items = result.Items || result;

    const parentContainer = this.parentContainer;
    if (parentContainer) {
        if (items.length) {
            parentContainer.classList.remove('hide');
        } else {
            parentContainer.classList.add('hide');
        }
    }

    const activeElement = document.activeElement;
    let focusId;
    let hasActiveElement;

    if (this.contains(activeElement)) {
        hasActiveElement = true;
        focusId = activeElement.getAttribute('data-id');
    }

    this.innerHTML = this.getItemsHtml(items);

    imageLoader.lazyChildren(this);

    if (hasActiveElement) {
        setFocus(this, focusId);
    }

    resetRefreshInterval(this);

    if (this.afterRefresh) {
        this.afterRefresh(result);
    }
}

function setFocus(itemsContainer, focusId) {
    if (focusId) {
        const newElement = itemsContainer.querySelector(
            '[data-id="' + focusId + '"]'
        );
        if (newElement) {
            try {
                focusManager.focus(newElement);
                return;
            } catch (err) {
                console.error(err);
            }
        }
    }

    focusManager.autoFocus(itemsContainer);
}

document.registerElement('emby-itemscontainer', {
    prototype: ItemsContainerPrototype,
    extends: 'div'
});
