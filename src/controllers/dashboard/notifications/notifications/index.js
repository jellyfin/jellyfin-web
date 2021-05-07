import loading from '../../../../components/loading/loading';
import globalize from '../../../../scripts/globalize';
import '../../../../components/listview/listview.scss';
import '../../../../elements/emby-button/emby-button';

function reload(page) {
    loading.show();
    ApiClient.getJSON(ApiClient.getUrl('Notifications/Types')).then(function (list) {
        let html = '';
        let lastCategory = '';
        let showHelp = true;
        html += list.map(function (notification) {
            let itemHtml = '';
            if (notification.Category !== lastCategory) {
                lastCategory = notification.Category;
                if (lastCategory) {
                    itemHtml += '</div>';
                    itemHtml += '</div>';
                }
                itemHtml += '<div class="verticalSection verticalSection-extrabottompadding">';
                itemHtml += '<div class="sectionTitleContainer" style="margin-bottom:1em;">';
                itemHtml += '<h2 class="sectionTitle">';
                itemHtml += notification.Category;
                itemHtml += '</h2>';
                if (showHelp) {
                    showHelp = false;
                    itemHtml += '<a is="emby-linkbutton" class="raised button-alt headerHelpButton" target="_blank" href="https://docs.jellyfin.org/general/server/notifications.html">';
                    itemHtml += globalize.translate('Help');
                    itemHtml += '</a>';
                }
                itemHtml += '</div>';
                itemHtml += '<div class="paperList">';
            }
            itemHtml += '<a class="listItem listItem-border" is="emby-linkbutton" data-ripple="false" href="notificationsetting.html?type=' + notification.Type + '">';
            if (notification.Enabled) {
                itemHtml += '<span class="listItemIcon material-icons notifications_active"></span>';
            } else {
                itemHtml += '<span class="listItemIcon material-icons notifications_off" style="background-color:#999;"></span>';
            }
            itemHtml += '<div class="listItemBody">';
            itemHtml += '<div class="listItemBodyText">' + notification.Name + '</div>';
            itemHtml += '</div>';
            itemHtml += '<button type="button" is="paper-icon-button-light"><span class="material-icons mode_edit"></span></button>';
            itemHtml += '</a>';
            return itemHtml;
        }).join('');

        if (list.length) {
            html += '</div>';
            html += '</div>';
        }
        page.querySelector('.notificationList').innerHTML = html;
        loading.hide();
    });
}

export default function (view) {
    view.addEventListener('viewshow', function () {
        reload(view);
    });
}
