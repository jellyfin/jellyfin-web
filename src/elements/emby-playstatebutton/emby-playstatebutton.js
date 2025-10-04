import serverNotifications from '../../scripts/serverNotifications';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Events from '../../utils/events.ts';
import EmbyButtonPrototype from '../../elements/emby-button/emby-button';

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

function onClick() {
    const button = this;
    const id = button.dataset.id;
    const serverId = button.dataset.serverid;
    const apiClient = ServerConnections.getApiClient(serverId);

    if (!button.classList.contains('playstatebutton-played')) {
        apiClient.markPlayed(apiClient.getCurrentUserId(), id, new Date());
        setState(button, true);
    } else {
        apiClient.markUnplayed(apiClient.getCurrentUserId(), id, new Date());
        setState(button, false);
    }
}

function onUserDataChanged(e, apiClient, userData) {
    const button = this;
    if (userData.ItemId === button.dataset.id) {
        setState(button, userData.Played);
    }
}

function setState(button, played, updateAttribute) {
    let icon = button.iconElement;
    if (!icon) {
        button.iconElement = button.querySelector('.material-icons');
        icon = button.iconElement;
    }

    if (played) {
        button.classList.add('playstatebutton-played');
        if (icon) {
            icon.classList.add('playstatebutton-icon-played');
            icon.classList.remove('playstatebutton-icon-unplayed');
        }
    } else {
        button.classList.remove('playstatebutton-played');
        if (icon) {
            icon.classList.remove('playstatebutton-icon-played');
            icon.classList.add('playstatebutton-icon-unplayed');
        }
    }

    if (updateAttribute !== false) {
        button.dataset.played = played;
    }

    setTitle(button, button.dataset.type, played);
}

function setTitle(button, itemType, played) {
    if (itemType !== 'AudioBook' && itemType !== 'AudioPodcast') {
        button.title = played ? globalize.translate('Watched') : globalize.translate('MarkPlayed');
    } else {
        button.title = played ? globalize.translate('Played') : globalize.translate('MarkPlayed');
    }

    const text = button.querySelector('.button-text');
    if (text) {
        text.innerText = button.title;
    }
}

function clearEvents(button) {
    button.removeEventListener('click', onClick);
    removeNotificationEvent(button, 'UserDataChanged');
}

function bindEvents(button) {
    clearEvents(button);

    button.addEventListener('click', onClick);
    addNotificationEvent(button, 'UserDataChanged', onUserDataChanged);
}

const EmbyPlaystateButtonPrototype = Object.create(EmbyButtonPrototype);

EmbyPlaystateButtonPrototype.createdCallback = function () {
    // base method
    if (EmbyButtonPrototype.createdCallback) {
        EmbyButtonPrototype.createdCallback.call(this);
    }
};

EmbyPlaystateButtonPrototype.attachedCallback = function () {
    // base method
    if (EmbyButtonPrototype.attachedCallback) {
        EmbyButtonPrototype.attachedCallback.call(this);
    }

    const itemId = this.dataset.id;
    const serverId = this.dataset.serverid;
    if (itemId && serverId) {
        setState(this, this.dataset.played === 'true', false);
        bindEvents(this);
    }
};

EmbyPlaystateButtonPrototype.detachedCallback = function () {
    // base method
    if (EmbyButtonPrototype.detachedCallback) {
        EmbyButtonPrototype.detachedCallback.call(this);
    }

    clearEvents(this);
    this.iconElement = null;
};

EmbyPlaystateButtonPrototype.setItem = function (item) {
    if (item) {
        this.dataset.id = item.Id;
        this.dataset.serverid = item.ServerId;
        this.dataset.type = item.Type;

        const played = item.UserData?.Played;
        setState(this, played);
        bindEvents(this);
    } else {
        delete this.dataset.id;
        delete this.dataset.serverid;
        delete this.dataset.type;
        delete this.dataset.played;
        clearEvents(this);
    }
};

document.registerElement('emby-playstatebutton', {
    prototype: EmbyPlaystateButtonPrototype,
    extends: 'button'
});

