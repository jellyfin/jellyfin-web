import serverNotifications from '../../scripts/serverNotifications';
import globalize from '../../scripts/globalize';
import Events from '../../utils/events.ts';
import EmbyButtonPrototype from '../emby-button/emby-button';
import ServerConnections from '../../components/ServerConnections';

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

function showPicker(button, apiClient, itemId, isMyList) {
    return apiClient.updateMyListStatus(apiClient.getCurrentUserId(), itemId, !isMyList);
}

function onClick() {
    const button = this;
    const id = button.getAttribute('data-id');
    const serverId = button.getAttribute('data-serverid');
    const apiClient = ServerConnections.getApiClient(serverId);

    const isMyList = this.getAttribute('data-ismylist') === 'true';

    showPicker(button, apiClient, id, isMyList).then(function (userData) {
        setState(button, userData.IsMyList);
    });
}

function onUserDataChanged(e, apiClient, userData) {
    const button = this;

    if (userData.ItemId === button.getAttribute('data-id')) {
        setState(button, userData.IsMyList);
    }
}

function setState(button, isMyList, updateAttribute) {
    const icon = button.querySelector('.material-icons');

    if (isMyList) {
        if (icon) {
            icon.classList.add('mylist');
            icon.classList.add('mylist-icon-on');
        }

        button.classList.add('mylist-on');
    } else {
        if (icon) {
            icon.classList.add('mylist');
            icon.classList.remove('mylist-icon-on');
        }
        button.classList.remove('mylist-on');
    }

    if (updateAttribute !== false) {
        button.setAttribute('data-ismylist', isMyList);
    }

    setTitle(button, isMyList);
}

function setTitle(button, isMyList) {
    button.title = isMyList ? globalize.translate('MyList') : globalize.translate('AddToMyList');

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

const EmbyMyListButtonPrototype = Object.create(EmbyButtonPrototype);

EmbyMyListButtonPrototype.createdCallback = function () {
    // base method
    if (EmbyButtonPrototype.createdCallback) {
        EmbyButtonPrototype.createdCallback.call(this);
    }
};

EmbyMyListButtonPrototype.attachedCallback = function () {
    // base method
    if (EmbyButtonPrototype.attachedCallback) {
        EmbyButtonPrototype.attachedCallback.call(this);
    }

    const itemId = this.getAttribute('data-id');
    const serverId = this.getAttribute('data-serverid');
    if (itemId && serverId) {
        const isMyList = this.getAttribute('data-ismylist') === 'true';

        setState(this, isMyList, false);
        bindEvents(this);
    } else {
        setTitle(this);
    }
};

EmbyMyListButtonPrototype.detachedCallback = function () {
    // base method
    if (EmbyButtonPrototype.detachedCallback) {
        EmbyButtonPrototype.detachedCallback.call(this);
    }

    clearEvents(this);
};

EmbyMyListButtonPrototype.setItem = function (item) {
    if (item) {
        this.setAttribute('data-id', item.Id);
        this.setAttribute('data-serverid', item.ServerId);

        const userData = item.UserData || {};
        setState(this, userData.IsMyList);
        bindEvents(this);
    } else {
        this.removeAttribute('data-id');
        this.removeAttribute('data-serverid');
        this.removeAttribute('data-ismylist');
        clearEvents(this);
    }
};

document.registerElement('emby-mylistbutton', {
    prototype: EmbyMyListButtonPrototype,
    extends: 'button'
});

