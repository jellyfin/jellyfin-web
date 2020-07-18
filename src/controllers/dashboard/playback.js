define(['jQuery', 'loading', 'libraryMenu', 'globalize'], function ($, loading, libraryMenu, globalize) {
    'use strict';

    function loadPage(page, config) {
        page.querySelector('#txtMinResumePct', page).value = config.MinResumePct;
        page.querySelector('#txtMaxResumePct', page).value = config.MaxResumePct;
        page.querySelector('#txtMinResumeDuration', page).value = config.MinResumeDurationSeconds;
        loading.hide();
    }

    function onSubmit() {
        loading.show();
        var form = this;
        ApiClient.getServerConfiguration().then(function (config) {
            config.MinResumePct = form.querySelector('#txtMinResumePct').value;
            config.MaxResumePct = form.querySelector('#txtMaxResumePct').value;
            config.MinResumeDurationSeconds = form.querySelector('#txtMinResumeDuration').value;

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

    $(document).on('pageinit', '#playbackConfigurationPage', function () {
        $('.playbackConfigurationForm').off('submit', onSubmit).on('submit', onSubmit);
    }).on('pageshow', '#playbackConfigurationPage', function () {
        loading.show();
        libraryMenu.setTabs('playback', 1, getTabs);
        var page = this;
        ApiClient.getServerConfiguration().then(function (config) {
            loadPage(page, config);
        });
    });
});
