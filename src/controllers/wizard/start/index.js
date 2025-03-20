import loading from '../../../components/loading/loading';
import '../../../elements/emby-button/emby-button';
import '../../../elements/emby-select/emby-select';
import Dashboard from '../../../utils/dashboard';
import dom from 'scripts/dom';

function loadPage(page, config, languageOptions) {
    const elem = page.querySelector('#selectLocalizationLanguage');
    elem.innerHTML = languageOptions.map(function (l) {
        return '<option value="' + l.Value + '">' + l.Name + '</option>';
    }).join('');
    elem.value = config.UICulture;
    loading.hide();
}

function save(page) {
    loading.show();
    const apiClient = ApiClient;
    apiClient.getJSON(apiClient.getUrl('Startup/Configuration')).then(function (config) {
        config.UICulture = page.querySelector('#selectLocalizationLanguage').value;
        apiClient.ajax({
            type: 'POST',
            data: JSON.stringify(config),
            url: apiClient.getUrl('Startup/Configuration'),
            contentType: 'application/json'
        }).then(function () {
            Dashboard.navigate('wizarduser');
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
        const apiClient = ApiClient;
        const promise1 = apiClient.getJSON(apiClient.getUrl('Startup/Configuration'));
        const promise2 = apiClient.getJSON(apiClient.getUrl('Localization/Options'));
        Promise.all([promise1, promise2]).then(function (responses) {
            loadPage(page, responses[0], responses[1]);
        });
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
