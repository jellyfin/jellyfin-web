import 'jquery';
import loading from '../components/loading/loading';
import globalize from '../scripts/globalize';
import '../elements/emby-button/emby-button';
import Dashboard from '../utils/dashboard';
import alert from '../components/alert';

function loadPage(page, config) {
    $('.liveTvSettingsForm', page).show();
    $('.noLiveTvServices', page).hide();
    $('#selectGuideDays', page).val(config.GuideDays || '');
    $('#txtPrePaddingMinutes', page).val(config.PrePaddingSeconds / 60);
    $('#txtPostPaddingMinutes', page).val(config.PostPaddingSeconds / 60);
    page.querySelector('#txtRecordingPath').value = config.RecordingPath || '';
    page.querySelector('#txtMovieRecordingPath').value = config.MovieRecordingPath || '';
    page.querySelector('#txtSeriesRecordingPath').value = config.SeriesRecordingPath || '';
    page.querySelector('#txtPostProcessor').value = config.RecordingPostProcessor || '';
    page.querySelector('#txtPostProcessorArguments').value = config.RecordingPostProcessorArguments || '';
    page.querySelector('#chkSaveRecordingNFO').checked = config.SaveRecordingNFO;
    page.querySelector('#chkSaveRecordingImages').checked = config.SaveRecordingImages;
    loading.hide();
}

function onSubmit() {
    loading.show();
    const form = this;
    ApiClient.getNamedConfiguration('livetv').then(function (config) {
        config.GuideDays = $('#selectGuideDays', form).val() || null;
        const recordingPath = form.querySelector('#txtRecordingPath').value || null;
        const movieRecordingPath = form.querySelector('#txtMovieRecordingPath').value || null;
        const seriesRecordingPath = form.querySelector('#txtSeriesRecordingPath').value || null;
        const recordingPathChanged = recordingPath != config.RecordingPath || movieRecordingPath != config.MovieRecordingPath || seriesRecordingPath != config.SeriesRecordingPath;
        config.RecordingPath = recordingPath;
        config.MovieRecordingPath = movieRecordingPath;
        config.SeriesRecordingPath = seriesRecordingPath;
        config.RecordingEncodingFormat = 'mkv';
        config.PrePaddingSeconds = 60 * $('#txtPrePaddingMinutes', form).val();
        config.PostPaddingSeconds = 60 * $('#txtPostPaddingMinutes', form).val();
        config.RecordingPostProcessor = $('#txtPostProcessor', form).val();
        config.RecordingPostProcessorArguments = $('#txtPostProcessorArguments', form).val();
        config.SaveRecordingNFO = form.querySelector('#chkSaveRecordingNFO').checked;
        config.SaveRecordingImages = form.querySelector('#chkSaveRecordingImages').checked;
        ApiClient.updateNamedConfiguration('livetv', config).then(function () {
            Dashboard.processServerConfigurationUpdateResult();
            showSaveMessage(recordingPathChanged);
        });
    });
    return false;
}

function showSaveMessage(recordingPathChanged) {
    let msg = '';

    if (recordingPathChanged) {
        msg += globalize.translate('MessageChangeRecordingPath');
    }

    if (msg) {
        alert(msg);
    }
}

$(document).on('pageinit', '#liveTvSettingsPage', function () {
    const page = this;
    $('.liveTvSettingsForm').off('submit', onSubmit).on('submit', onSubmit);
    $('#btnSelectRecordingPath', page).on('click.selectDirectory', function () {
        import('../components/directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
            const picker = new DirectoryBrowser();
            picker.show({
                callback: function (path) {
                    if (path) {
                        $('#txtRecordingPath', page).val(path);
                    }

                    picker.close();
                },
                validateWriteable: true
            });
        });
    });
    $('#btnSelectMovieRecordingPath', page).on('click.selectDirectory', function () {
        import('../components/directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
            const picker = new DirectoryBrowser();
            picker.show({
                callback: function (path) {
                    if (path) {
                        $('#txtMovieRecordingPath', page).val(path);
                    }

                    picker.close();
                },
                validateWriteable: true
            });
        });
    });
    $('#btnSelectSeriesRecordingPath', page).on('click.selectDirectory', function () {
        import('../components/directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
            const picker = new DirectoryBrowser();
            picker.show({
                callback: function (path) {
                    if (path) {
                        $('#txtSeriesRecordingPath', page).val(path);
                    }

                    picker.close();
                },
                validateWriteable: true
            });
        });
    });
    $('#btnSelectPostProcessorPath', page).on('click.selectDirectory', function () {
        import('../components/directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
            const picker = new DirectoryBrowser();
            picker.show({
                includeFiles: true,
                callback: function (path) {
                    if (path) {
                        $('#txtPostProcessor', page).val(path);
                    }

                    picker.close();
                }
            });
        });
    });
}).on('pageshow', '#liveTvSettingsPage', function () {
    loading.show();
    const page = this;
    ApiClient.getNamedConfiguration('livetv').then(function (config) {
        loadPage(page, config);
    });
});
