import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';

import loading from 'components/loading/loading';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';

import 'elements/emby-button/emby-button';
import 'elements/emby-checkbox/emby-checkbox';
import 'elements/emby-select/emby-select';

function save(page) {
    loading.show();
    const systemApi = getSystemApi(ServerConnections.getApi());
    systemApi.getConfiguration().then(function ({ data: config }) {
        config.ServerName = page.querySelector('#txtServerName').value;
        config.PreferredMetadataLanguage = page.querySelector('#selectLanguage').value;
        config.MetadataCountryCode = page.querySelector('#selectCountry').value;
        return systemApi.updateConfiguration({
            serverConfiguration: config
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

function reloadData(page, config, cultures, countries) {
    populateLanguages(page.querySelector('#selectLanguage'), cultures);
    populateCountries(page.querySelector('#selectCountry'), countries);
    page.querySelector('#txtServerName').value = config.ServerName;
    page.querySelector('#selectLanguage').value = config.PreferredMetadataLanguage;
    page.querySelector('#selectCountry').value = config.MetadataCountryCode;
    loading.hide();
}

function reload(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    const promise1 = getSystemApi(ServerConnections.getApi()).getConfiguration().then(({ data }) => data);
    const promise2 = apiClient.getCultures();
    const promise3 = apiClient.getCountries();
    Promise.all([promise1, promise2, promise3]).then(function (responses) {
        reloadData(page, responses[0], responses[1], responses[2]);
    });
}

function navigateToNextPage() {
    Dashboard.navigate('wizard/remoteaccess');
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
