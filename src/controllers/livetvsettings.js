define(['jQuery', 'loading', 'globalize', 'emby-button'], function ($, loading, globalize) {
    'use strict';

    function loadPage(page, config) {
        page.querySelector('.liveTvSettingsForm').classList.remove('hide');
        page.querySelector('.noLiveTvServices').classList.add('hide');
        page.querySelector('#selectGuideDays').value = config.GuideDays || '';
        page.querySelector('#txtPrePaddingMinutes').value = config.PrePaddingSeconds / 60;
        page.querySelector('#txtPostPaddingMinutes').value = config.PostPaddingSeconds / 60;
        page.querySelector('#txtRecordingPath').value = config.RecordingPath || '';
        page.querySelector('#txtMovieRecordingPath').value = config.MovieRecordingPath || '';
        page.querySelector('#txtSeriesRecordingPath').value = config.SeriesRecordingPath || '';
        page.querySelector('#txtPostProcessor').value = config.RecordingPostProcessor || '';
        page.querySelector('#txtPostProcessorArguments').value = config.RecordingPostProcessorArguments || '';
        loading.hide();
    }

    function onSubmit() {
        loading.show();
        var form = this;
        ApiClient.getNamedConfiguration('livetv').then(function (config) {
            config.GuideDays = form.querySelector('#selectGuideDays').value || null;
            var recordingPath = form.querySelector('#txtRecordingPath').value || null;
            var movieRecordingPath = form.querySelector('#txtMovieRecordingPath').value || null;
            var seriesRecordingPath = form.querySelector('#txtSeriesRecordingPath').value || null;
            var recordingPathChanged = recordingPath != config.RecordingPath || movieRecordingPath != config.MovieRecordingPath || seriesRecordingPath != config.SeriesRecordingPath;
            config.RecordingPath = recordingPath;
            config.MovieRecordingPath = movieRecordingPath;
            config.SeriesRecordingPath = seriesRecordingPath;
            config.RecordingEncodingFormat = 'mkv';
            config.PrePaddingSeconds = 60 * form.querySelector('#txtPrePaddingMinutes').value;
            config.PostPaddingSeconds = 60 * form.querySelector('#txtPostPaddingMinutes').value;
            config.RecordingPostProcessor = form.querySelector('#txtPostProcessor').value;
            config.RecordingPostProcessorArguments = form.querySelector('#txtPostProcessorArguments').value;
            ApiClient.updateNamedConfiguration('livetv', config).then(function () {
                Dashboard.processServerConfigurationUpdateResult();
                showSaveMessage(recordingPathChanged);
            });
        });
        return false;
    }

    function showSaveMessage(recordingPathChanged) {
        var msg = '';

        if (recordingPathChanged) {
            msg += globalize.translate('RecordingPathChangeMessage');
        }

        if (msg) {
            require(['alert'], function (alert) {
                alert(msg);
            });
        }
    }

    $(document).on('pageinit', '#liveTvSettingsPage', function () {
        var page = this;
        $('.liveTvSettingsForm').off('submit', onSubmit).on('submit', onSubmit);
        $('#btnSelectRecordingPath', page).on('click.selectDirectory', function () {
            require(['directorybrowser'], function (directoryBrowser) {
                var picker = new directoryBrowser();
                picker.show({
                    callback: function (path) {
                        if (path) {
                            page.querySelector('#txtRecordingPath').value = path;
                        }

                        picker.close();
                    },
                    validateWriteable: true
                });
            });
        });
        $('#btnSelectMovieRecordingPath', page).on('click.selectDirectory', function () {
            require(['directorybrowser'], function (directoryBrowser) {
                var picker = new directoryBrowser();
                picker.show({
                    callback: function (path) {
                        if (path) {
                            page.querySelector('#txtMovieRecordingPath').value = path;
                        }

                        picker.close();
                    },
                    validateWriteable: true
                });
            });
        });
        $('#btnSelectSeriesRecordingPath', page).on('click.selectDirectory', function () {
            require(['directorybrowser'], function (directoryBrowser) {
                var picker = new directoryBrowser();
                picker.show({
                    callback: function (path) {
                        if (path) {
                            page.querySelector('#txtSeriesRecordingPath').value = path;
                        }

                        picker.close();
                    },
                    validateWriteable: true
                });
            });
        });
        $('#btnSelectPostProcessorPath', page).on('click.selectDirectory', function () {
            require(['directorybrowser'], function (directoryBrowser) {
                var picker = new directoryBrowser();
                picker.show({
                    includeFiles: true,
                    callback: function (path) {
                        if (path) {
                            page.querySelector('#txtPostProcessor').value = path;
                        }

                        picker.close();
                    }
                });
            });
        });
    }).on('pageshow', '#liveTvSettingsPage', function () {
        loading.show();
        var page = this;
        ApiClient.getNamedConfiguration('livetv').then(function (config) {
            loadPage(page, config);
        });
    });
});
