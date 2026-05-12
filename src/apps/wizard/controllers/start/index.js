import loading from 'components/loading/loading';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';
import dom from 'utils/dom';

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

        apiClient.ajax({
            type: 'POST',
            data: JSON.stringify(config),
            url: apiClient.getUrl('Startup/Configuration'),
            contentType: 'application/json'
        }).then(function () {
            Dashboard.navigate('wizard/user');
        });
    });
}

function onSubmit(e) {
    e.preventDefault();
    save(dom.parentWithClass(this, 'page'));
}

export default function (view) {
    view.querySelector('.wizardStartForm').addEventListener('submit', onSubmit);

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
        });
    });

    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
