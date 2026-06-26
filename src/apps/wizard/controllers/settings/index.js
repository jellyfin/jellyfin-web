import loading from 'components/loading/loading';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';

import 'elements/emby-button/emby-button';
import 'elements/emby-checkbox/emby-checkbox';
import 'elements/emby-select/emby-select';

function save(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    apiClient.getJSON(apiClient.getUrl('Startup/Configuration')).then(function (config) {
        config.PreferredMetadataLanguage = page.querySelector('#selectLanguage').value;
        config.MetadataCountryCode = page.querySelector('#selectCountry').value;
        apiClient.ajax({
            type: 'POST',
            data: JSON.stringify(config),
            url: apiClient.getUrl('Startup/Configuration'),
            contentType: 'application/json'
        }).then(function () {
            loading.hide();
            navigateToNextPage();
        });
    });
}

function populateLanguages(select, languages) {
    let html = '';
    html += "<option value=''></option>";

    for (let i = 0, length = languages.length; i < length; i++) {
        const culture = languages[i];
        html += "<option value='" + culture.TwoLetterISOLanguageName + "'>" + culture.DisplayName + '</option>';
    }

    select.innerHTML = html;
}

function populateCountries(select, allCountries) {
    let html = '';
    html += "<option value=''></option>";

    for (let i = 0, length = allCountries.length; i < length; i++) {
        const culture = allCountries[i];
        html += "<option value='" + culture.TwoLetterISORegionName + "'>" + culture.DisplayName + '</option>';
    }

    select.innerHTML = html;
}

function getDefaultMetadataLanguage(config, cultures) {
    // Inherit the display language chosen earlier in the wizard as a sensible
    // default for the preferred metadata language. The server seeds
    // PreferredMetadataLanguage with "en" on a fresh install, so we derive from
    // the UI culture first and only fall back to the stored value when there is
    // no matching metadata culture.
    const uiLanguage = (config.UICulture || '').split('-')[0].toLowerCase();
    if (uiLanguage) {
        const match = cultures.find(function (culture) {
            return culture.TwoLetterISOLanguageName === uiLanguage;
        });

        if (match) {
            return match.TwoLetterISOLanguageName;
        }
    }

    return config.PreferredMetadataLanguage || '';
}

function reloadData(page, config, cultures, countries) {
    populateLanguages(page.querySelector('#selectLanguage'), cultures);
    populateCountries(page.querySelector('#selectCountry'), countries);
    page.querySelector('#selectLanguage').value = getDefaultMetadataLanguage(config, cultures);
    page.querySelector('#selectCountry').value = config.MetadataCountryCode;
    loading.hide();
}

function reload(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    const promise1 = apiClient.getJSON(apiClient.getUrl('Startup/Configuration'));
    const promise2 = apiClient.getCultures();
    const promise3 = apiClient.getCountries();
    Promise.all([promise1, promise2, promise3]).then(function (responses) {
        reloadData(page, responses[0], responses[1], responses[2]);
    });
}

function navigateToNextPage() {
    Dashboard.navigate('wizard/library');
}

function onSubmit(e) {
    save(this);
    e.preventDefault();
    return false;
}

export default function (view) {
    view.querySelector('.wizardSettingsForm').addEventListener('submit', onSubmit);
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
        reload(this);
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
