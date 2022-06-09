import 'jquery';
import libraryMenu from '../../scripts/libraryMenu';
import loading from '../../components/loading/loading';
import globalize from '../../scripts/globalize';
import Dashboard from '../../utils/dashboard';

/* eslint-disable indent */

    function loadPage(page, config) {
        $('#txtRemoteClientBitrateLimit', page).val(config.RemoteClientBitrateLimit / 1e6 || '');
        loading.hide();
    }

    function onSubmit() {
        loading.show();
        const form = this;
        ApiClient.getServerConfiguration().then(function (config) {
            config.RemoteClientBitrateLimit = parseInt(1e6 * parseFloat($('#txtRemoteClientBitrateLimit', form).val() || '0'));
            ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult);
        });

        return false;
    }

    function getTabs() {
        return [{
            href: '#/encodingsettings.html',
            name: globalize.translate('Transcoding')
        }, {
            href: '#/playbackconfiguration.html',
            name: globalize.translate('ButtonResume')
        }, {
            href: '#/streamingsettings.html',
            name: globalize.translate('TabStreaming')
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

/* eslint-enable indent */
