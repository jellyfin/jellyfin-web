import logo from '@jellyfin/ux-web/icon-transparent.png';

import loading from 'components/loading/loading';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import dom from 'utils/dom';
import { renderWizardProgress } from 'apps/wizard/controllers/wizardProgress';
import { goToNextWizardStep } from 'apps/wizard/controllers/wizardSteps';

import 'elements/emby-button/emby-button';
import 'elements/emby-select/emby-select';

function loadPage(page, systemInfo, config, languageOptions) {
    const serverNameElem = page.querySelector('#txtServerName');
    serverNameElem.value = config.ServerName || systemInfo.ServerName;

    const languageElem = page.querySelector('#selectLocalizationLanguage');
    languageElem.innerHTML = languageOptions.map(function (l) {
        return '<option value="' + l.Value + '">' + l.Name + '</option>';
    }).join('');
    languageElem.value = config.UICulture;

    loading.hide();
}

function save(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    apiClient.getJSON(apiClient.getUrl('Startup/Configuration')).then(function (config) {
        config.ServerName = page.querySelector('#txtServerName').value;
        config.UICulture = page.querySelector('#selectLocalizationLanguage').value;

        return apiClient.ajax({
            type: 'POST',
            data: JSON.stringify(config),
            url: apiClient.getUrl('Startup/Configuration'),
            contentType: 'application/json'
        });
    }).then(function () {
        loading.hide();
        goToNextWizardStep('start');
    }).catch(function (err) {
        console.error('[Wizard > Start] failed to save server name / language', err);
        loading.hide();
    });
}

function onSubmit(e) {
    e.preventDefault();
    save(dom.parentWithClass(this, 'page'));
}

export default function (view) {
    view.querySelector('.wizardStartLogo').src = logo;
    view.querySelector('.wizardStartForm').addEventListener('submit', onSubmit);
    renderWizardProgress(view, 'start');

    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
        loading.show();
        const page = this;
        const apiClient = ServerConnections.currentApiClient();

        Promise.all([
            apiClient.getPublicSystemInfo(),
            apiClient.getJSON(apiClient.getUrl('Startup/Configuration')),
            apiClient.getJSON(apiClient.getUrl('Localization/Options'))
        ]).then(([ systemInfo, config, languageOptions ]) => {
            loadPage(page, systemInfo, config, languageOptions);
        }).catch(function (err) {
            console.error('[Wizard > Start] failed to load page data', err);
            loading.hide();
        });
    });

    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
