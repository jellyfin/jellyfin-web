import loading from 'components/loading/loading';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { currentSettings as userSettings } from 'scripts/settings/userSettings';
import Dashboard from 'utils/dashboard';
import dom from 'utils/dom';

import 'elements/emby-button/emby-button';
import 'elements/emby-select/emby-select';

function loadPage(page, languageOptions) {
    const browserLocale = findCulture(languageOptions, globalize.getCurrentLocale());

    const languageElem = page.querySelector('#selectLocalizationLanguage');
    languageElem.innerHTML = languageOptions.map(function (l) {
        return '<option value="' + l.Value + '">' + l.Name + '</option>';
    }).join('');
    languageElem.value = browserLocale || findCulture(languageOptions, 'en-US');

    loading.hide();
}

function save(page) {
    userSettings.language(page.querySelector('#selectLocalizationLanguage').value);
    Dashboard.navigate('wizard/user');
}

function onSubmit(e) {
    e.preventDefault();
    save(dom.parentWithClass(this, 'page'));
}

function findCulture(languageOptions, culture) {
    return languageOptions.find(l => l.Value.toLowerCase() === culture)?.Value;
}

export default function (view) {
    view.querySelector('.wizardStartForm').addEventListener('submit', onSubmit);

    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
        loading.show();
        const page = this;
        const apiClient = ServerConnections.currentApiClient();

        apiClient.getJSON(apiClient.getUrl('Localization/Options')).then(languageOptions => {
            loadPage(page, languageOptions);
        });
    });

    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
