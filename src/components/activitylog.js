import escapeHtml from 'escape-html';
import Events from '../utils/events.ts';
import globalize from '../scripts/globalize';
import dom from '../scripts/dom';
import { formatRelative } from 'date-fns';
import serverNotifications from '../scripts/serverNotifications';
import '../elements/emby-button/emby-button';
import './listview/listview.scss';
import ServerConnections from './ServerConnections';
import alert from './alert';
import { getLocale } from '../utils/dateFnsLocale.ts';
import { toBoolean } from '../utils/string.ts';

function getEntryHtml(entry, apiClient) {
    let html = '';
    html += '<div class="listItem listItem-border">';
    let color = '#00a4dc';
    let icon = 'notifications';

    if (entry.Severity == 'Error' || entry.Severity == 'Fatal' || entry.Severity == 'Warn') {
        color = '#cc0000';
        icon = 'notification_important';
    }

    if (entry.UserId && entry.UserPrimaryImageTag) {
        html += '<span class="listItemIcon material-icons dvr" aria-hidden="true" style="width:2em!important;height:2em!important;padding:0;color:transparent;background-color:' + color + ";background-image:url('" + apiClient.getUserImageUrl(entry.UserId, {
            type: 'Primary',
            tag: entry.UserPrimaryImageTag
        }) + "');background-repeat:no-repeat;background-position:center center;background-size: cover;\"></span>";
    } else {
        html += '<span class="listItemIcon material-icons ' + icon + '" aria-hidden="true" style="background-color:' + color + '"></span>';
    }

    html += '<div class="listItemBody three-line">';
    html += '<div class="listItemBodyText">';
    html += escapeHtml(entry.Name);
    html += '</div>';
    html += '<div class="listItemBodyText secondary">';
    html += formatRelative(Date.parse(entry.Date), Date.now(), { locale: getLocale() });
    html += '</div>';
    html += '<div class="listItemBodyText secondary listItemBodyText-nowrap">';
    html += escapeHtml(entry.ShortOverview || '');
    html += '</div>';
    html += '</div>';

    if (entry.Overview) {
        html += `<button type="button" is="paper-icon-button-light" class="btnEntryInfo" data-id="${entry.Id}" title="${globalize.translate('Info')}">
                       <span class="material-icons info" aria-hidden="true"></span>
                    </button>`;
    }

    html += '</div>';

    return html;
}

function renderList(elem, apiClient, result) {
    elem.innerHTML = result.Items.map(function (i) {
        return getEntryHtml(i, apiClient);
    }).join('');
}

function reloadData(instance, elem, apiClient, startIndex, limit) {
    if (startIndex == null) {
        startIndex = parseInt(elem.getAttribute('data-activitystartindex') || '0', 10);
    }

    limit = limit || parseInt(elem.getAttribute('data-activitylimit') || '7', 10);
    const minDate = new Date();
    const hasUserId = toBoolean(elem.getAttribute('data-useractivity'), true);

    // TODO: Use date-fns
    if (hasUserId) {
        minDate.setTime(minDate.getTime() - 24 * 60 * 60 * 1000); // one day back
    } else {
        minDate.setTime(minDate.getTime() - 7 * 24 * 60 * 60 * 1000); // one week back
    }

    ApiClient.getJSON(ApiClient.getUrl('System/ActivityLog/Entries', {
        startIndex: startIndex,
        limit: limit,
        minDate: minDate.toISOString(),
        hasUserId: hasUserId
    })).then(function (result) {
        elem.setAttribute('data-activitystartindex', startIndex);
        elem.setAttribute('data-activitylimit', limit);
        if (!startIndex) {
            const activityContainer = dom.parentWithClass(elem, 'activityContainer');

            if (activityContainer) {
                if (result.Items.length) {
                    activityContainer.classList.remove('hide');
                } else {
                    activityContainer.classList.add('hide');
                }
            }
        }

        instance.items = result.Items;
        renderList(elem, apiClient, result);
    });
}

function onActivityLogUpdate(e, apiClient) {
    const options = this.options;

    if (options && options.serverId === apiClient.serverId()) {
        reloadData(this, options.element, apiClient);
    }
}

function onListClick(e) {
    const btnEntryInfo = dom.parentWithClass(e.target, 'btnEntryInfo');

    if (btnEntryInfo) {
        const id = btnEntryInfo.getAttribute('data-id');
        const items = this.items;

        if (items) {
            const item = items.filter(function (i) {
                return i.Id.toString() === id;
            })[0];

            if (item) {
                showItemOverview(item);
            }
        }
    }
}

function showItemOverview(item) {
    alert({
        text: item.Overview
    });
}

class ActivityLog {
    constructor(options) {
        this.options = options;
        const element = options.element;
        element.classList.add('activityLogListWidget');
        element.addEventListener('click', onListClick.bind(this));
        const apiClient = ServerConnections.getApiClient(options.serverId);
        reloadData(this, element, apiClient);
        const onUpdate = onActivityLogUpdate.bind(this);
        this.updateFn = onUpdate;
        Events.on(serverNotifications, 'ActivityLogEntry', onUpdate);
        apiClient.sendMessage('ActivityLogEntryStart', '0,1500');
    }
    destroy() {
        const options = this.options;

        if (options) {
            options.element.classList.remove('activityLogListWidget');
            ServerConnections.getApiClient(options.serverId).sendMessage('ActivityLogEntryStop', '0,1500');
        }

        const onUpdate = this.updateFn;

        if (onUpdate) {
            Events.off(serverNotifications, 'ActivityLogEntry', onUpdate);
        }

        this.items = null;
        this.options = null;
    }
}

export default ActivityLog;
