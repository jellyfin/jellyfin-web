import serverNotifications from '../../scripts/serverNotifications';
import { Events } from 'jellyfin-apiclient';
import globalize from '../../scripts/globalize';
import EmbyButton from '../emby-button/emby-button';
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

function showPicker(button, apiClient, itemId, likes, isFavorite) {
    return apiClient.updateFavoriteStatus(apiClient.getCurrentUserId(), itemId, !isFavorite);
}

function onClick(e) {
    const button = this;
    const id = button.getAttribute('data-id');
    const serverId = button.getAttribute('data-serverid');
    const apiClient = ServerConnections.getApiClient(serverId);

    let likes = this.getAttribute('data-likes');
    const isFavorite = this.getAttribute('data-isfavorite') === 'true';
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

    if (userData.ItemId === button.getAttribute('data-id')) {
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
    } else if (likes) {
        if (icon) {
            icon.classList.add('favorite');
            icon.classList.remove('ratingbutton-icon-withrating');
        }
        button.classList.remove('ratingbutton-withrating');
    } else if (likes === false) {
        if (icon) {
            icon.classList.add('favorite');
            icon.classList.remove('ratingbutton-icon-withrating');
        }
        button.classList.remove('ratingbutton-withrating');
    } else {
        if (icon) {
            icon.classList.add('favorite');
            icon.classList.remove('ratingbutton-icon-withrating');
        }
        button.classList.remove('ratingbutton-withrating');
    }

    if (updateAttribute !== false) {
        button.setAttribute('data-isfavorite', isFavorite);

        button.setAttribute('data-likes', (likes === null ? '' : likes));
    }
}

function setTitle(button) {
    button.title = globalize.translate('Favorite');

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

class EmbyRatingButton extends EmbyButton {
    connectedCallback() {
        const itemId = this.getAttribute('data-id');
        const serverId = this.getAttribute('data-serverid');
        if (itemId && serverId) {
            let likes = this.getAttribute('data-likes');
            const isFavorite = this.getAttribute('data-isfavorite') === 'true';
            if (likes === 'true') {
                likes = true;
            } else if (likes === 'false') {
                likes = false;
            } else {
                likes = null;
            }

            setState(this, likes, isFavorite, false);
            bindEvents(this);
        }

        setTitle(this);
    }

    disconnectedCallback() {
        clearEvents(this);
    }

    setItem(item) {
        if (item) {
            this.setAttribute('data-id', item.Id);
            this.setAttribute('data-serverid', item.ServerId);

            const userData = item.UserData || {};
            setState(this, userData.Likes, userData.IsFavorite);
            bindEvents(this);
        } else {
            this.removeAttribute('data-id');
            this.removeAttribute('data-serverid');
            this.removeAttribute('data-likes');
            this.removeAttribute('data-isfavorite');
            clearEvents(this);
        }
    }
}

customElements.define('emby-ratingbutton', EmbyRatingButton, {
    extends: 'button'
});
