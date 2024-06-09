import datetime from '../../scripts/datetime';
import loading from '../../components/loading/loading';
import globalize from '../../scripts/globalize';
import '../../elements/emby-button/emby-button';
import '../../components/listview/listview.scss';
import '../../styles/flexstyles.scss';
import Dashboard from '../../utils/dashboard';
import alert from '../../components/alert';

function onSubmit(event) {
    event.preventDefault();
    loading.show();
    const form = this;
    ApiClient.getServerConfiguration().then(function (config) {
        config.EnableSlowResponseWarning = form.querySelector('#chkSlowResponseWarning').checked;
        config.SlowResponseThresholdMs = form.querySelector('#txtSlowResponseWarning').value;
        ApiClient.updateServerConfiguration(config).then(function() {
            Dashboard.processServerConfigurationUpdateResult();
        }, function () {
            alert(globalize.translate('ErrorDefault'));
            Dashboard.processServerConfigurationUpdateResult();
        });
    });
    return false;
}

export default function(view) {
    view.querySelector('.logsForm').addEventListener('submit', onSubmit);
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
                logHtml += "<h3 class='listItemBodyText' dir='ltr' style='text-align: left'>" + log.Name + '</h3>';
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
        });

        apiClient.getServerConfiguration().then(function (config) {
            view.querySelector('#chkSlowResponseWarning').checked = config.EnableSlowResponseWarning;
            view.querySelector('#txtSlowResponseWarning').value = config.SlowResponseThresholdMs;
        });

        loading.hide();
    });
}
