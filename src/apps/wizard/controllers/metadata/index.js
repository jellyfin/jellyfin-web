import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';
import { renderWizardProgress } from 'apps/wizard/controllers/wizardProgress';

import 'elements/emby-button/emby-button';
import 'elements/emby-select/emby-select';

function populateLanguages(select, cultures) {
    select.innerHTML = cultures.map(function (c) {
        return '<option value="' + c.TwoLetterISOLanguageName + '">' + c.DisplayName + '</option>';
    }).join('');
}

function populateCountries(select, countries) {
    select.innerHTML = countries.map(function (c) {
        return '<option value="' + c.TwoLetterISORegionName + '">' + c.DisplayName + '</option>';
    }).join('');
}

function getDefaultMetadataLanguage(config, cultures) {
    const stored = config.PreferredMetadataLanguage || '';
    if (stored && stored !== 'en') {
        return stored;
    }
    const uiLanguage = (config.UICulture || '').split('-')[0].toLowerCase();
    if (uiLanguage && cultures.some(function (c) {
        return c.TwoLetterISOLanguageName === uiLanguage;
    })) {
        return uiLanguage;
    }
    return stored;
}

function reload(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    Promise.all([
        apiClient.getJSON(apiClient.getUrl('Startup/Configuration')),
        apiClient.getCultures(),
        apiClient.getCountries()
    ]).then(function ([config, cultures, countries]) {
        populateLanguages(page.querySelector('#selectMetadataLanguage'), cultures);
        populateCountries(page.querySelector('#selectMetadataCountry'), countries);
        page.querySelector('#selectMetadataLanguage').value = getDefaultMetadataLanguage(config, cultures);
        page.querySelector('#selectMetadataCountry').value = config.MetadataCountryCode || '';
        loading.hide();
    }).catch(function (err) {
        console.error('[Wizard > Metadata] failed to load options', err);
        toast(globalize.translate('ErrorDefault'));
        loading.hide();
    });
}

function save(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    apiClient.getJSON(apiClient.getUrl('Startup/Configuration')).then(function (config) {
        config.PreferredMetadataLanguage = page.querySelector('#selectMetadataLanguage').value;
        config.MetadataCountryCode = page.querySelector('#selectMetadataCountry').value;
        return apiClient.ajax({
            type: 'POST',
            data: JSON.stringify(config),
            url: apiClient.getUrl('Startup/Configuration'),
            contentType: 'application/json'
        });
    }).then(function () {
        loading.hide();
        Dashboard.navigate('wizard/library');
    }).catch(function (err) {
        console.error('[Wizard > Metadata] failed to save metadata settings', err);
        toast(globalize.translate('ErrorDefault'));
        loading.hide();
    });
}

export default function (view) {
    view.querySelector('.wizardMetadataForm').addEventListener('submit', function (e) {
        e.preventDefault();
        save(view);
        return false;
    });
    view.querySelector('.btnWizardPrev').addEventListener('click', function () {
        window.history.back();
    });
    renderWizardProgress(view);
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
        reload(view);
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
