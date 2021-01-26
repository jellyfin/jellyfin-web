import globalize from '../../scripts/globalize';
import dom from '../../scripts/dom';
import itemHelper from '../itemHelper';
import '../../elements/emby-button/paper-icon-button-light';
import 'material-design-icons-iconfont';
import '../../elements/emby-button/emby-button';
import './userdatabuttons.scss';
import ServerConnections from '../ServerConnections';

const userDataMethods = {
    markPlayed: markPlayed,
    markDislike: markDislike,
    markLike: markLike,
    markFavorite: markFavorite
};

function getUserDataButtonHtml(method, itemId, serverId, buttonCssClass, iconCssClass, icon, tooltip, style) {
    if (style === 'fab-mini') {
        style = 'fab';
        buttonCssClass = buttonCssClass ? (buttonCssClass + ' mini') : 'mini';
    }

    const is = style === 'fab' ? 'emby-button' : 'paper-icon-button-light';
    let className = style === 'fab' ? 'autoSize fab' : 'autoSize';

    if (buttonCssClass) {
        className += ' ' + buttonCssClass;
    }

    if (iconCssClass) {
        iconCssClass += ' ';
    } else {
        iconCssClass = '';
    }

    iconCssClass += 'material-icons';

    return '<button title="' + tooltip + '" data-itemid="' + itemId + '" data-serverid="' + serverId + '" is="' + is + '" data-method="' + method + '" class="' + className + '"><span class="' + iconCssClass + ' ' + icon + '"></span></button>';
}

function onContainerClick(e) {
    const btnUserData = dom.parentWithClass(e.target, 'btnUserData');

    if (!btnUserData) {
        return;
    }

    const method = btnUserData.getAttribute('data-method');
    userDataMethods[method](btnUserData);
}

function fill(options) {
    const html = getIconsHtml(options);

    if (options.fillMode === 'insertAdjacent') {
        options.element.insertAdjacentHTML(options.insertLocation || 'beforeend', html);
    } else {
        options.element.innerHTML = html;
    }

    dom.removeEventListener(options.element, 'click', onContainerClick, {
        passive: true
    });

    dom.addEventListener(options.element, 'click', onContainerClick, {
        passive: true
    });
}

function destroy(options) {
    options.element.innerHTML = '';

    dom.removeEventListener(options.element, 'click', onContainerClick, {
        passive: true
    });
}

function getIconsHtml(options) {
    const item = options.item;
    const includePlayed = options.includePlayed;
    const cssClass = options.cssClass;
    const style = options.style;

    let html = '';

    const userData = item.UserData || {};

    const itemId = item.Id;

    if (itemHelper.isLocalItem(item)) {
        return html;
    }

    let btnCssClass = 'btnUserData';

    if (cssClass) {
        btnCssClass += ' ' + cssClass;
    }

    const iconCssClass = options.iconCssClass;

    const serverId = item.ServerId;

    if (includePlayed !== false) {
        const tooltipPlayed = globalize.translate('MarkPlayed');

        if (itemHelper.canMarkPlayed(item)) {
            if (userData.Played) {
                html += getUserDataButtonHtml('markPlayed', itemId, serverId, btnCssClass + ' btnUserDataOn', iconCssClass, 'check', tooltipPlayed, style);
            } else {
                html += getUserDataButtonHtml('markPlayed', itemId, serverId, btnCssClass, iconCssClass, 'check', tooltipPlayed, style);
            }
        }
    }

    const tooltipFavorite = globalize.translate('Favorite');
    if (userData.IsFavorite) {
        html += getUserDataButtonHtml('markFavorite', itemId, serverId, btnCssClass + ' btnUserData btnUserDataOn', iconCssClass, 'favorite', tooltipFavorite, style);
    } else {
        html += getUserDataButtonHtml('markFavorite', itemId, serverId, btnCssClass + ' btnUserData', iconCssClass, 'favorite', tooltipFavorite, style);
    }

    return html;
}

function markFavorite(link) {
    const id = link.getAttribute('data-itemid');
    const serverId = link.getAttribute('data-serverid');

    const markAsFavorite = !link.classList.contains('btnUserDataOn');

    favorite(id, serverId, markAsFavorite);

    if (markAsFavorite) {
        link.classList.add('btnUserDataOn');
    } else {
        link.classList.remove('btnUserDataOn');
    }
}

function markLike(link) {
    const id = link.getAttribute('data-itemid');
    const serverId = link.getAttribute('data-serverid');

    if (!link.classList.contains('btnUserDataOn')) {
        likes(id, serverId, true);

        link.classList.add('btnUserDataOn');
    } else {
        clearLike(id, serverId);

        link.classList.remove('btnUserDataOn');
    }

    link.parentNode.querySelector('.btnDislike').classList.remove('btnUserDataOn');
}

function markDislike(link) {
    const id = link.getAttribute('data-itemid');
    const serverId = link.getAttribute('data-serverid');

    if (!link.classList.contains('btnUserDataOn')) {
        likes(id, serverId, false);

        link.classList.add('btnUserDataOn');
    } else {
        clearLike(id, serverId);

        link.classList.remove('btnUserDataOn');
    }

    link.parentNode.querySelector('.btnLike').classList.remove('btnUserDataOn');
}

function markPlayed(link) {
    const id = link.getAttribute('data-itemid');
    const serverId = link.getAttribute('data-serverid');

    if (!link.classList.contains('btnUserDataOn')) {
        played(id, serverId, true);

        link.classList.add('btnUserDataOn');
    } else {
        played(id, serverId, false);

        link.classList.remove('btnUserDataOn');
    }
}

function likes(id, serverId, isLiked) {
    const apiClient = ServerConnections.getApiClient(serverId);
    return apiClient.updateUserItemRating(apiClient.getCurrentUserId(), id, isLiked);
}

function played(id, serverId, isPlayed) {
    const apiClient = ServerConnections.getApiClient(serverId);

    const method = isPlayed ? 'markPlayed' : 'markUnplayed';

    return apiClient[method](apiClient.getCurrentUserId(), id, new Date());
}

function favorite(id, serverId, isFavorite) {
    const apiClient = ServerConnections.getApiClient(serverId);

    return apiClient.updateFavoriteStatus(apiClient.getCurrentUserId(), id, isFavorite);
}

function clearLike(id, serverId) {
    const apiClient = ServerConnections.getApiClient(serverId);

    return apiClient.clearUserItemRating(apiClient.getCurrentUserId(), id);
}

export default {
    fill: fill,
    destroy: destroy,
    getIconsHtml: getIconsHtml
};
