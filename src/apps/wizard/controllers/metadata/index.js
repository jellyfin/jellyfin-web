import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { renderWizardProgress } from 'apps/wizard/controllers/wizardProgress';
import { goToNextWizardStep, goToPreviousWizardStep } from 'apps/wizard/controllers/wizardSteps';

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

function getDefaultMetadataCountry(config, countries) {
    if (config.MetadataCountryCode) {
        return config.MetadataCountryCode;
    }
    // Fall back to the region from the display locale (e.g. en-US -> US).
    const region = (config.UICulture || '').split('-')[1];
    if (region && countries.some(function (c) {
        return c.TwoLetterISORegionName === region.toUpperCase();
    })) {
        return region.toUpperCase();
    }
    return '';
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
        page.querySelector('#selectMetadataCountry').value = getDefaultMetadataCountry(config, countries);
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
        goToNextWizardStep('metadata');
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
        goToPreviousWizardStep('metadata');
    });
    renderWizardProgress(view, 'metadata');
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
        reload(view);
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
