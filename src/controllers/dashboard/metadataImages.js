import { ImageResolution } from '@jellyfin/sdk/lib/generated-client/models/image-resolution';

import 'jquery';

import loading from '../../components/loading/loading';
import libraryMenu from '../../scripts/libraryMenu';
import globalize from '../../scripts/globalize';
import Dashboard from '../../utils/dashboard';

import '../../components/listview/listview.scss';

function populateImageResolutionOptions(select) {
    let html = '';
    [
        {
            name: globalize.translate('ResolutionMatchSource'),
            value: ImageResolution.MatchSource
        },
        { name: '2160p', value: ImageResolution.P2160 },
        { name: '1440p', value: ImageResolution.P1440 },
        { name: '1080p', value: ImageResolution.P1080 },
        { name: '720p', value: ImageResolution.P720 },
        { name: '480p', value: ImageResolution.P480 },
        { name: '360p', value: ImageResolution.P360 },
        { name: '240p', value: ImageResolution.P240 },
        { name: '144p', value: ImageResolution.P144 }
    ].forEach(({ value, name }) => {
        html += `<option value="${value}">${name}</option>`;
    });
    select.innerHTML = html;
}

function populateLanguages(select) {
    return ApiClient.getCultures().then(function(languages) {
        let html = '';
        html += "<option value=''></option>";
        for (let i = 0, length = languages.length; i < length; i++) {
            const culture = languages[i];
            html += "<option value='" + culture.TwoLetterISOLanguageName + "'>" + culture.DisplayName + '</option>';
        }
        select.innerHTML = html;
    });
}

function populateCountries(select) {
    return ApiClient.getCountries().then(function(allCountries) {
        let html = '';
        html += "<option value=''></option>";
        for (let i = 0, length = allCountries.length; i < length; i++) {
            const culture = allCountries[i];
            html += "<option value='" + culture.TwoLetterISORegionName + "'>" + culture.DisplayName + '</option>';
        }
        select.innerHTML = html;
    });
}

function loadPage(page) {
    const promises = [
        ApiClient.getServerConfiguration(),
        populateLanguages(page.querySelector('#selectLanguage')),
        populateCountries(page.querySelector('#selectCountry'))
    ];

    populateImageResolutionOptions(page.querySelector('#txtChapterImageResolution'));

    Promise.all(promises).then(function(responses) {
        const config = responses[0];
        page.querySelector('#selectLanguage').value = config.PreferredMetadataLanguage || '';
        page.querySelector('#selectCountry').value = config.MetadataCountryCode || '';
        page.querySelector('#valDummyChapterDuration').value = config.DummyChapterDuration || '0';
        page.querySelector('#txtChapterImageResolution').value = config.ChapterImageResolution || '';
        loading.hide();
    });
}

function onSubmit() {
    const form = this;
    loading.show();
    ApiClient.getServerConfiguration().then(function(config) {
        config.PreferredMetadataLanguage = form.querySelector('#selectLanguage').value;
        config.MetadataCountryCode = form.querySelector('#selectCountry').value;
        config.DummyChapterDuration = form.querySelector('#valDummyChapterDuration').value;
        config.ChapterImageResolution = form.querySelector('#txtChapterImageResolution').value;
        ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult);
    });
    return false;
}

function getTabs() {
    return [{
        href: '#/dashboard/libraries',
        name: globalize.translate('HeaderLibraries')
    }, {
        href: '#/dashboard/libraries/display',
        name: globalize.translate('Display')
    }, {
        href: '#/dashboard/libraries/metadata',
        name: globalize.translate('Metadata')
    }, {
        href: '#/dashboard/libraries/nfo',
        name: globalize.translate('TabNfoSettings')
    }];
}

$(document).on('pageinit', '#metadataImagesConfigurationPage', function() {
    $('.metadataImagesConfigurationForm').off('submit', onSubmit).on('submit', onSubmit);
}).on('pageshow', '#metadataImagesConfigurationPage', function() {
    libraryMenu.setTabs('metadata', 2, getTabs);
    loading.show();
    loadPage(this);
});

