import serverNotifications from '../../scripts/serverNotifications';
import { Events } from 'jellyfin-apiclient';
import globalize from '../../scripts/globalize';
import EmbyButtonPrototype from '../../elements/emby-button/emby-button';
import ServerConnections from '../../components/ServerConnections';

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

    function onClick() {
        const button = this;
        const id = button.getAttribute('data-id');
        const serverId = button.getAttribute('data-serverid');
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
        if (userData.ItemId === button.getAttribute('data-id')) {
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
            button.setAttribute('data-played', played);
        }
    }

    function setTitle(button, itemType) {
        if (itemType !== 'AudioBook' && itemType !== 'AudioPodcast') {
            button.title = globalize.translate('Watched');
        } else {
            button.title = globalize.translate('Played');
        }

        const text = button.querySelector('.button-text');
        if (text) {
            text.innerHTML = button.title;
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

        const itemId = this.getAttribute('data-id');
        const serverId = this.getAttribute('data-serverid');
        if (itemId && serverId) {
            setState(this, this.getAttribute('data-played') === 'true', false);
            bindEvents(this);
            setTitle(this, this.getAttribute('data-type'));
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
            this.setAttribute('data-id', item.Id);
            this.setAttribute('data-serverid', item.ServerId);

            const played = item.UserData && item.UserData.Played;
            setState(this, played);
            bindEvents(this);

            setTitle(this, item.Type);
        } else {
            this.removeAttribute('data-id');
            this.removeAttribute('data-serverid');
            this.removeAttribute('data-played');
            clearEvents(this);
        }
    };

    document.registerElement('emby-playstatebutton', {
        prototype: EmbyPlaystateButtonPrototype,
        extends: 'button'
    });

/* eslint-enable indent */
