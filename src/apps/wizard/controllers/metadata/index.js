import escapeHtml from 'escape-html';

import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { initWizardStep } from 'apps/wizard/controllers/wizardProgress';
import { goToNextWizardStep } from 'apps/wizard/controllers/wizardSteps';

import 'elements/emby-button/emby-button';
import 'elements/emby-select/emby-select';

function populateSelect(select, items, valueKey, labelKey) {
    select.innerHTML = items.map(function (item) {
        return `<option value="${escapeHtml(item[valueKey])}">${escapeHtml(item[labelKey])}</option>`;
    }).join('');
}

function reload(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    Promise.all([
        apiClient.getJSON(apiClient.getUrl('Startup/Configuration')),
        apiClient.getCultures(),
        apiClient.getCountries()
    ]).then(function ([config, cultures, countries]) {
        populateSelect(page.querySelector('#selectMetadataLanguage'), cultures, 'TwoLetterISOLanguageName', 'DisplayName');
        populateSelect(page.querySelector('#selectMetadataCountry'), countries, 'TwoLetterISORegionName', 'DisplayName');
        page.querySelector('#selectMetadataLanguage').value = config.PreferredMetadataLanguage || '';
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
    initWizardStep(view, 'metadata', {
        onShow() { reload(view); }
    });
}
