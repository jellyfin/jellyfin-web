import escapeHtml from 'escape-html';

import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { initWizardStep } from 'apps/wizard/controllers/wizardProgress';
import { goToNextWizardStep } from 'apps/wizard/controllers/wizardSteps';
import { getWizardDraft } from 'apps/wizard/controllers/wizardDraft';

import 'elements/emby-button/emby-button';
import 'elements/emby-select/emby-select';

function populateSelect(select, items, valueKey, labelKey) {
    select.innerHTML = items.map(function (item) {
        return `<option value="${escapeHtml(item[valueKey])}">${escapeHtml(item[labelKey])}</option>`;
    }).join('');
}

function reload(page) {
    loading.show();
    const draft = getWizardDraft().config;
    const apiClient = ServerConnections.currentApiClient();
    Promise.all([
        apiClient.getJSON(apiClient.getUrl('Startup/Configuration')),
        apiClient.getCultures(),
        apiClient.getCountries()
    ]).then(function ([config, cultures, countries]) {
        populateSelect(page.querySelector('#selectMetadataLanguage'), cultures, 'TwoLetterISOLanguageName', 'DisplayName');
        populateSelect(page.querySelector('#selectMetadataCountry'), countries, 'TwoLetterISORegionName', 'DisplayName');
        page.querySelector('#selectMetadataLanguage').value = draft.PreferredMetadataLanguage ?? config.PreferredMetadataLanguage ?? '';
        page.querySelector('#selectMetadataCountry').value = draft.MetadataCountryCode ?? config.MetadataCountryCode ?? '';
        loading.hide();
    }).catch(function (err) {
        console.error('[Wizard > Metadata] failed to load options', err);
        toast(globalize.translate('ErrorDefault'));
        loading.hide();
    });
}

function save(page) {
    Object.assign(getWizardDraft().config, {
        PreferredMetadataLanguage: page.querySelector('#selectMetadataLanguage').value,
        MetadataCountryCode: page.querySelector('#selectMetadataCountry').value
    });
    goToNextWizardStep('metadata');
}

export default function initMetadataView(view) {
    view.querySelector('.wizardMetadataForm').addEventListener('submit', function (e) {
        e.preventDefault();
        save(view);
    });
    initWizardStep(view, 'metadata', {
        onShow() { reload(view); }
    });
}
