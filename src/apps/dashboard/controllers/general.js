import 'jquery';

import loading from 'components/loading/loading';
import globalize from 'lib/globalize';
import 'elements/emby-checkbox/emby-checkbox';
import 'elements/emby-textarea/emby-textarea';
import 'elements/emby-input/emby-input';
import 'elements/emby-select/emby-select';
import 'elements/emby-button/emby-button';
import Dashboard from 'utils/dashboard';
import alert from 'components/alert';

function loadPage(page, config, languageOptions, systemInfo) {
    page.querySelector('#txtServerName').value = systemInfo.ServerName;
    page.querySelector('#txtCachePath').value = systemInfo.CachePath || '';
    page.querySelector('#chkQuickConnectAvailable').checked = config.QuickConnectAvailable === true;
    page.querySelector('#txtMetadataPath').value = systemInfo.InternalMetadataPath || '';
    page.querySelector('#txtMetadataNetworkPath').value = systemInfo.MetadataNetworkPath || '';
    const localizationLanguageElem = page.querySelector('#selectLocalizationLanguage');
    localizationLanguageElem.innerHTML = languageOptions.map(function (language) {
        return '<option value="' + language.Value + '">' + language.Name + '</option>';
    }).join('');
    localizationLanguageElem.value = config.UICulture;
    page.querySelector('#txtLibraryScanFanoutConcurrency').value = config.LibraryScanFanoutConcurrency || '';
    page.querySelector('#txtParallelImageEncodingLimit').value = config.ParallelImageEncodingLimit || '';

    loading.hide();
}

function onSubmit() {
    loading.show();
    const form = this;
    ApiClient.getServerConfiguration().then(function (config) {
        config.ServerName = form.querySelector('#txtServerName').value;
        config.UICulture = form.querySelector('#selectLocalizationLanguage').value;
        config.CachePath = form.querySelector('#txtCachePath').value;
        config.MetadataPath = form.querySelector('#txtMetadataPath').value;
        config.MetadataNetworkPath = form.querySelector('#txtMetadataNetworkPath').value;
        config.QuickConnectAvailable = form.querySelector('#chkQuickConnectAvailable').checked;
        config.LibraryScanFanoutConcurrency = parseInt(form.querySelector('#txtLibraryScanFanoutConcurrency').value || '0', 10);
        config.ParallelImageEncodingLimit = parseInt(form.querySelector('#txtParallelImageEncodingLimit').value || '0', 10);

        return ApiClient.updateServerConfiguration(config)
            .then(() => {
                Dashboard.processServerConfigurationUpdateResult();
            }).catch(() => {
                loading.hide();
                alert(globalize.translate('ErrorDefault'));
            });
    });
    return false;
}

export default function (view) {
    $('#btnSelectCachePath', view).on('click.selectDirectory', function () {
        import('components/directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
            const picker = new DirectoryBrowser();
            picker.show({
                callback: function (path) {
                    if (path) {
                        view.querySelector('#txtCachePath').value = path;
                    }

                    picker.close();
                },
                validateWriteable: true,
                header: globalize.translate('HeaderSelectServerCachePath'),
                instruction: globalize.translate('HeaderSelectServerCachePathHelp')
            });
        });
    });
    $('#btnSelectMetadataPath', view).on('click.selectDirectory', function () {
        import('components/directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
            const picker = new DirectoryBrowser();
            picker.show({
                path: view.querySelector('#txtMetadataPath').value,
                networkSharePath: view.querySelector('#txtMetadataNetworkPath').value,
                callback: function (path, networkPath) {
                    if (path) {
                        view.querySelector('#txtMetadataPath').value = path;
                    }

                    if (networkPath) {
                        view.querySelector('#txtMetadataNetworkPath').value = networkPath;
                    }

                    picker.close();
                },
                validateWriteable: true,
                header: globalize.translate('HeaderSelectMetadataPath'),
                instruction: globalize.translate('HeaderSelectMetadataPathHelp')
            });
        });
    });
    $('.dashboardGeneralForm', view).off('submit', onSubmit).on('submit', onSubmit);
    view.addEventListener('viewshow', function () {
        const promiseConfig = ApiClient.getServerConfiguration();
        const promiseLanguageOptions = ApiClient.getJSON(ApiClient.getUrl('Localization/Options'));
        const promiseSystemInfo = ApiClient.getSystemInfo();
        Promise.all([promiseConfig, promiseLanguageOptions, promiseSystemInfo]).then(function (responses) {
            loadPage(view, responses[0], responses[1], responses[2]);
        });
    });
}

