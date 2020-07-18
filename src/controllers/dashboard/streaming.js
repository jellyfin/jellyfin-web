define(['jQuery', 'libraryMenu', 'loading', 'globalize'], function ($, libraryMenu, loading, globalize) {
    'use strict';

    function loadPage(page, config) {
        page.querySelector('#txtRemoteClientBitrateLimit').value = config.RemoteClientBitrateLimit / 1e6 || '';
        loading.hide();
    }

    function onSubmit() {
        loading.show();
        var form = this;
        ApiClient.getServerConfiguration().then(function (config) {
            config.RemoteClientBitrateLimit = parseInt(1e6 * parseFloat(form.querySelector('#txtRemoteClientBitrateLimit').value || '0'));
            ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult);
        });

        return false;
    }

    function getTabs() {
        return [{
            href: 'encodingsettings.html',
            name: globalize.translate('Transcoding')
        }, {
            href: 'playbackconfiguration.html',
            name: globalize.translate('TabResumeSettings')
        }, {
            href: 'streamingsettings.html',
            name: globalize.translate('TabStreaming')
        }];
    }

    $(document).on('pageinit', '#streamingSettingsPage', function () {
        $('.streamingSettingsForm').off('submit', onSubmit).on('submit', onSubmit);
    }).on('pageshow', '#streamingSettingsPage', function () {
        loading.show();
        libraryMenu.setTabs('playback', 2, getTabs);
        var page = this;
        ApiClient.getServerConfiguration().then(function (config) {
            loadPage(page, config);
        });
    });
});
