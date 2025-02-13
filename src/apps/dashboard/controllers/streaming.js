import 'jquery';

import loading from 'components/loading/loading';
import Dashboard from 'utils/dashboard';

function loadPage(page, config) {
    page.querySelector('#txtRemoteClientBitrateLimit').value = config.RemoteClientBitrateLimit / 1e6 || '';
    loading.hide();
}

function onSubmit() {
    loading.show();
    const form = this;
    ApiClient.getServerConfiguration().then(function (config) {
        config.RemoteClientBitrateLimit = parseInt(1e6 * parseFloat(form.querySelector('#txtRemoteClientBitrateLimit').value || '0'), 10);
        ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult);
    });

    return false;
}

$(document).on('pageinit', '#streamingSettingsPage', function () {
    $('.streamingSettingsForm').off('submit', onSubmit).on('submit', onSubmit);
}).on('pageshow', '#streamingSettingsPage', function () {
    loading.show();
    const page = this;
    ApiClient.getServerConfiguration().then(function (config) {
        loadPage(page, config);
    });
});

