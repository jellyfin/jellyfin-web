import 'jquery';

import loading from 'components/loading/loading';
import Dashboard from 'utils/dashboard';

function loadPage(page, config) {
    page.querySelector('#txtMinResumePct').value = config.MinResumePct;
    page.querySelector('#txtMaxResumePct').value = config.MaxResumePct;
    page.querySelector('#txtMinAudiobookResume').value = config.MinAudiobookResume;
    page.querySelector('#txtMaxAudiobookResume').value = config.MaxAudiobookResume;
    page.querySelector('#txtMinResumeDuration').value = config.MinResumeDurationSeconds;
    loading.hide();
}

function onSubmit() {
    loading.show();
    const form = this;
    ApiClient.getServerConfiguration().then(function (config) {
        config.MinResumePct = form.querySelector('#txtMinResumePct').value;
        config.MaxResumePct = form.querySelector('#txtMaxResumePct').value;
        config.MinAudiobookResume = form.querySelector('#txtMinAudiobookResume').value;
        config.MaxAudiobookResume = form.querySelector('#txtMaxAudiobookResume').value;
        config.MinResumeDurationSeconds = form.querySelector('#txtMinResumeDuration').value;

        ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult);
    });

    return false;
}

$(document).on('pageinit', '#playbackConfigurationPage', function () {
    $('.playbackConfigurationForm').off('submit', onSubmit).on('submit', onSubmit);
}).on('pageshow', '#playbackConfigurationPage', function () {
    loading.show();
    const page = this;
    ApiClient.getServerConfiguration().then(function (config) {
        loadPage(page, config);
    });
});
