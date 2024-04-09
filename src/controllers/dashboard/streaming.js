import 'jquery';
import libraryMenu from '../../scripts/libraryMenu';
import loading from '../../components/loading/loading';
import globalize from '../../scripts/globalize';
import Dashboard from '../../utils/dashboard';

function loadPage(page, config) {
    $('#txtRemoteClientBitrateLimit', page).val(config.RemoteClientBitrateLimit / 1e6 || '');
    loading.hide();
}

function onSubmit() {
    loading.show();
    const form = this;
    ApiClient.getServerConfiguration().then(function (config) {
        config.RemoteClientBitrateLimit = parseInt(1e6 * parseFloat($('#txtRemoteClientBitrateLimit', form).val() || '0'), 10);
        ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult);
    });

    return false;
}

function getTabs() {
    return [{
        href: '#/dashboard/playback/transcoding',
        name: globalize.translate('Transcoding')
    }, {
        href: '#/dashboard/playback/resume',
        name: globalize.translate('ButtonResume')
    }, {
        href: '#/dashboard/playback/streaming',
        name: globalize.translate('TabStreaming')
    }, {
        href: '#/dashboard/playback/trickplay',
        name: globalize.translate('Trickplay')
    }];
}

$(document).on('pageinit', '#streamingSettingsPage', function () {
    $('.streamingSettingsForm').off('submit', onSubmit).on('submit', onSubmit);
}).on('pageshow', '#streamingSettingsPage', function () {
    loading.show();
    libraryMenu.setTabs('playback', 2, getTabs);
    const page = this;
    ApiClient.getServerConfiguration().then(function (config) {
        loadPage(page, config);
    });
});

