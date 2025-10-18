import serverNotifications from '../../scripts/serverNotifications';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Events from '../../utils/events.ts';
import EmbyButtonPrototype from '../emby-button/emby-button';

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

function showPicker(button, apiClient, itemId, likes, isFavorite) {
    return apiClient.updateFavoriteStatus(apiClient.getCurrentUserId(), itemId, !isFavorite);
}

function onClick() {
    const button = this;
    const id = button.dataset.id;
    const serverId = button.dataset.serverid;
    const apiClient = ServerConnections.getApiClient(serverId);

    let likes = this.dataset.likes;
    const isFavorite = this.dataset.isfavorite === 'true';
    if (likes === 'true') {
        likes = true;
    } else if (likes === 'false') {
        likes = false;
    } else {
        likes = null;
    }

    showPicker(button, apiClient, id, likes, isFavorite).then(function (userData) {
        setState(button, userData.Likes, userData.IsFavorite);
    });
}

function onUserDataChanged(e, apiClient, userData) {
    const button = this;

    if (userData.ItemId === button.dataset.id) {
        setState(button, userData.Likes, userData.IsFavorite);
    }
}

function setState(button, likes, isFavorite, updateAttribute) {
    const icon = button.querySelector('.material-icons');

    if (isFavorite) {
        if (icon) {
            icon.classList.add('favorite');
            icon.classList.add('ratingbutton-icon-withrating');
        }

        button.classList.add('ratingbutton-withrating');
    } else {
        if (icon) {
            icon.classList.add('favorite');
            icon.classList.remove('ratingbutton-icon-withrating');
        }
        button.classList.remove('ratingbutton-withrating');
    }

    if (updateAttribute !== false) {
        button.dataset.isfavorite = isFavorite;

        button.dataset.likes = likes === null ? '' : likes;
    }

    setTitle(button, isFavorite);
}

function setTitle(button, isFavorite) {
    button.title = isFavorite ? globalize.translate('Favorite') : globalize.translate('AddToFavorites');

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

const EmbyRatingButtonPrototype = Object.create(EmbyButtonPrototype);

EmbyRatingButtonPrototype.createdCallback = function () {
    // base method
    if (EmbyButtonPrototype.createdCallback) {
        EmbyButtonPrototype.createdCallback.call(this);
    }
};

EmbyRatingButtonPrototype.attachedCallback = function () {
    // base method
    if (EmbyButtonPrototype.attachedCallback) {
        EmbyButtonPrototype.attachedCallback.call(this);
    }

    const itemId = this.dataset.id;
    const serverId = this.dataset.serverid;
    if (itemId && serverId) {
        let likes = this.dataset.likes;
        const isFavorite = this.dataset.isfavorite === 'true';
        if (likes === 'true') {
            likes = true;
        } else if (likes === 'false') {
            likes = false;
        } else {
            likes = null;
        }

        setState(this, likes, isFavorite, false);
        bindEvents(this);
    } else {
        setTitle(this);
    }
};

EmbyRatingButtonPrototype.detachedCallback = function () {
    // base method
    if (EmbyButtonPrototype.detachedCallback) {
        EmbyButtonPrototype.detachedCallback.call(this);
    }

    clearEvents(this);
};

EmbyRatingButtonPrototype.setItem = function (item) {
    if (item) {
        this.dataset.id = item.Id;
        this.dataset.serverid = item.ServerId;

        const userData = item.UserData || {};
        setState(this, userData.Likes, userData.IsFavorite);
        bindEvents(this);
    } else {
        delete this.dataset.id;
        delete this.dataset.serverid;
        delete this.dataset.likes;
        delete this.dataset.isfavorite;
        clearEvents(this);
    }
};

document.registerElement('emby-ratingbutton', {
    prototype: EmbyRatingButtonPrototype,
    extends: 'button'
});

