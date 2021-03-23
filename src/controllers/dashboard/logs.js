import datetime from '../../scripts/datetime';
import loading from '../../components/loading/loading';
import '../../elements/emby-button/emby-button';
import '../../components/listview/listview.scss';
import '../../assets/css/flexstyles.scss';

/* eslint-disable indent */

    export default function(view, params) {
        view.addEventListener('viewbeforeshow', function() {
            loading.show();
            const apiClient = ApiClient;
            apiClient.getJSON(apiClient.getUrl('System/Logs')).then(function(logs) {
                let html = '';
                html += '<div class="paperList">';
                html += logs.map(function(log) {
                    let logUrl = apiClient.getUrl('System/Logs/Log', {
                        name: log.Name
                    });
                    logUrl += '&api_key=' + apiClient.accessToken();
                    let logHtml = '';
                    logHtml += '<a is="emby-linkbutton" href="' + logUrl + '" target="_blank" class="listItem listItem-border" style="color:inherit;">';
                    logHtml += '<div class="listItemBody two-line">';
                    logHtml += "<h3 class='listItemBodyText'>" + log.Name + '</h3>';
                    const date = datetime.parseISO8601Date(log.DateModified, true);
                    let text = datetime.toLocaleDateString(date);
                    text += ' ' + datetime.getDisplayTime(date);
                    logHtml += '<div class="listItemBodyText secondary">' + text + '</div>';
                    logHtml += '</div>';
                    logHtml += '</a>';
                    return logHtml;
                }).join('');
                html += '</div>';
                view.querySelector('.serverLogs').innerHTML = html;
                loading.hide();
            });
        });
    }

/* eslint-enable indent */
