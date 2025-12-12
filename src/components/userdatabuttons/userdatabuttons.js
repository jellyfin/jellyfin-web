import globalize from '@/lib/globalize';
import { ServerConnections } from '@/lib/jellyfin-apiclient';
import dom from '@/utils/dom';
import itemHelper from '@/components/itemHelper';

import '@/elements/emby-button/paper-icon-button-light';
import 'material-design-icons-iconfont';
import '@/elements/emby-button/emby-button';
import './userdatabuttons.scss';

const userDataMethods = {
    markPlayed: markPlayed,
    markFavorite: markFavorite
};

function getUserDataButtonHtml(method, itemId, serverId, icon, tooltip, style, classes) {
    let buttonCssClass = classes.buttonCssClass;
    let iconCssClass = classes.iconCssClass;

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

    return `<button title="${tooltip}" data-itemid="${itemId}" data-serverid="${serverId}" is="${is}" data-method="${method}" class="${className}"><span class="${iconCssClass} ${icon}" aria-hidden="true"></span></button>`;
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
    const classes = { buttonCssClass: btnCssClass, iconCssClass: iconCssClass };
    const serverId = item.ServerId;

    if (includePlayed !== false) {
        const tooltipPlayed = globalize.translate('MarkPlayed');

        if (itemHelper.canMarkPlayed(item)) {
            if (userData.Played) {
                const buttonCssClass = classes.buttonCssClass + ' btnUserDataOn';
                html += getUserDataButtonHtml('markPlayed', itemId, serverId, 'check', tooltipPlayed, style, { buttonCssClass, ...classes });
            } else {
                html += getUserDataButtonHtml('markPlayed', itemId, serverId, 'check', tooltipPlayed, style, classes);
            }
        }
    }

    const tooltipFavorite = globalize.translate('Favorite');
    if (userData.IsFavorite) {
        const buttonCssClass = classes.buttonCssClass + ' btnUserData btnUserDataOn';
        html += getUserDataButtonHtml('markFavorite', itemId, serverId, 'favorite', tooltipFavorite, style, { buttonCssClass, ...classes });
    } else {
        classes.buttonCssClass += ' btnUserData';
        html += getUserDataButtonHtml('markFavorite', itemId, serverId, 'favorite', tooltipFavorite, style, classes);
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

function played(id, serverId, isPlayed) {
    const apiClient = ServerConnections.getApiClient(serverId);

    const method = isPlayed ? 'markPlayed' : 'markUnplayed';

    return apiClient[method](apiClient.getCurrentUserId(), id, new Date());
}

function favorite(id, serverId, isFavorite) {
    const apiClient = ServerConnections.getApiClient(serverId);

    return apiClient.updateFavoriteStatus(apiClient.getCurrentUserId(), id, isFavorite);
}

export default {
    fill: fill,
    destroy: destroy,
    getIconsHtml: getIconsHtml
};
