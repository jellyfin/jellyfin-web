import 'jquery';

import loading from '../../components/loading/loading';
import globalize from '../../scripts/globalize';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-textarea/emby-textarea';
import '../../elements/emby-input/emby-input';
import '../../elements/emby-select/emby-select';
import '../../elements/emby-button/emby-button';
import Dashboard from '../../utils/dashboard';
import alert from '../../components/alert';

function loadPage(page, config, languageOptions, systemInfo) {
    page.querySelector('#txtServerName').value = systemInfo.ServerName;
    page.querySelector('#txtCachePath').value = systemInfo.CachePath || '';
    page.querySelector('#chkQuickConnectAvailable').checked = config.QuickConnectAvailable === true;
    $('#txtMetadataPath', page).val(systemInfo.InternalMetadataPath || '');
    $('#txtMetadataNetworkPath', page).val(systemInfo.MetadataNetworkPath || '');
    $('#selectLocalizationLanguage', page).html(languageOptions.map(function (language) {
        return '<option value="' + language.Value + '">' + language.Name + '</option>';
    })).val(config.UICulture);
    page.querySelector('#txtParallelImageEncodingLimit').value = config.ParallelImageEncodingLimit || '';

    loading.hide();
}

function onSubmit() {
    loading.show();
    const form = this;
    $(form).parents('.page');
    ApiClient.getServerConfiguration().then(function (config) {
        config.ServerName = $('#txtServerName', form).val();
        config.UICulture = $('#selectLocalizationLanguage', form).val();
        config.CachePath = form.querySelector('#txtCachePath').value;
        config.MetadataPath = $('#txtMetadataPath', form).val();
        config.MetadataNetworkPath = $('#txtMetadataNetworkPath', form).val();
        config.QuickConnectAvailable = form.querySelector('#chkQuickConnectAvailable').checked;
        config.ParallelImageEncodingLimit = parseInt(form.querySelector('#txtParallelImageEncodingLimit').value || '0', 10);

        ApiClient.updateServerConfiguration(config).then(function() {
            ApiClient.getNamedConfiguration(brandingConfigKey).then(function(brandingConfig) {
                brandingConfig.LoginDisclaimer = form.querySelector('#txtLoginDisclaimer').value;
                brandingConfig.CustomCss = form.querySelector('#txtCustomCss').value;
                brandingConfig.SplashscreenEnabled = form.querySelector('#chkSplashScreenAvailable').checked;

                ApiClient.updateNamedConfiguration(brandingConfigKey, brandingConfig).then(function () {
                    Dashboard.processServerConfigurationUpdateResult();
                });
            });
        }, function () {
            alert(globalize.translate('ErrorDefault'));
            Dashboard.processServerConfigurationUpdateResult();
        });
    });
    return false;
}

const brandingConfigKey = 'branding';
export default function (view) {
    $('#btnSelectCachePath', view).on('click.selectDirectory', function () {
        import('../../components/directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
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
        import('../../components/directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
            const picker = new DirectoryBrowser();
            picker.show({
                path: $('#txtMetadataPath', view).val(),
                networkSharePath: $('#txtMetadataNetworkPath', view).val(),
                callback: function (path, networkPath) {
                    if (path) {
                        $('#txtMetadataPath', view).val(path);
                    }

                    if (networkPath) {
                        $('#txtMetadataNetworkPath', view).val(networkPath);
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
        ApiClient.getNamedConfiguration(brandingConfigKey).then(function (config) {
            view.querySelector('#txtLoginDisclaimer').value = config.LoginDisclaimer || '';
            view.querySelector('#txtCustomCss').value = config.CustomCss || '';
            view.querySelector('#chkSplashScreenAvailable').checked = config.SplashscreenEnabled === true;
        });
    });
}

