import 'jquery';
import loading from '../../components/loading/loading';
import libraryMenu from '../../scripts/libraryMenu';
import globalize from '../../scripts/globalize';
import Dashboard from '../../utils/dashboard';

function loadPage(page, config) {
    $('#txtMinResumePct', page).val(config.MinResumePct);
    $('#txtMaxResumePct', page).val(config.MaxResumePct);
    $('#txtMinAudiobookResume', page).val(config.MinAudiobookResume);
    $('#txtMaxAudiobookResume', page).val(config.MaxAudiobookResume);
    $('#txtMinResumeDuration', page).val(config.MinResumeDurationSeconds);
    loading.hide();
}

function onSubmit() {
    loading.show();
    const form = this;
    ApiClient.getServerConfiguration().then(function (config) {
        config.MinResumePct = $('#txtMinResumePct', form).val();
        config.MaxResumePct = $('#txtMaxResumePct', form).val();
        config.MinAudiobookResume = $('#txtMinAudiobookResume', form).val();
        config.MaxAudiobookResume = $('#txtMaxAudiobookResume', form).val();
        config.MinResumeDurationSeconds = $('#txtMinResumeDuration', form).val();

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

$(document).on('pageinit', '#playbackConfigurationPage', function () {
    $('.playbackConfigurationForm').off('submit', onSubmit).on('submit', onSubmit);
}).on('pageshow', '#playbackConfigurationPage', function () {
    loading.show();
    libraryMenu.setTabs('playback', 1, getTabs);
    const page = this;
    ApiClient.getServerConfiguration().then(function (config) {
        loadPage(page, config);
    });
});
