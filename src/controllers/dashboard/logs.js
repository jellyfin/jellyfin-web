import datetime from 'datetime';
import loading from 'loading';
import 'emby-button';
import 'listViewStyle';
import 'flexStyles';

/* eslint-disable indent */

    export default function(view, params) {
        view.addEventListener('viewbeforeshow', function() {
            loading.show();
            var apiClient = ApiClient;
            apiClient.getJSON(apiClient.getUrl('System/Logs')).then(function(logs) {
                var html = '';
                html += '<div class="paperList">';
                html += logs.map(function(log) {
                    var logUrl = apiClient.getUrl('System/Logs/Log', {
                        name: log.Name
                    });
                    logUrl += '&api_key=' + apiClient.accessToken();
                    var logHtml = '';
                    logHtml += '<a is="emby-linkbutton" href="' + logUrl + '" target="_blank" class="listItem listItem-border" style="color:inherit;">';
                    logHtml += '<div class="listItemBody two-line">';
                    logHtml += "<h3 class='listItemBodyText'>" + log.Name + '</h3>';
                    var date = datetime.parseISO8601Date(log.DateModified, true);
                    var text = datetime.toLocaleDateString(date);
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
