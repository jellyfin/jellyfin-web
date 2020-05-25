define(['jQuery', 'loading', 'globalize', 'emby-checkbox', 'emby-textarea', 'emby-input', 'emby-select', 'emby-button'], function ($, loading, globalize) {
    'use strict';

    function loadPage(page, config, languageOptions, systemInfo) {
        page.querySelector('#txtServerName').value = systemInfo.ServerName;
        page.querySelector('#txtCachePath').value = systemInfo.CachePath || '';
        $('#txtMetadataPath', page).val(systemInfo.InternalMetadataPath || '');
        $('#txtMetadataNetworkPath', page).val(systemInfo.MetadataNetworkPath || '');
        $('#selectLocalizationLanguage', page).html(languageOptions.map(function (language) {
            return '<option value="' + language.Value + '">' + language.Name + '</option>';
        })).val(config.UICulture);
        currentLanguage = config.UICulture;

        loading.hide();
    }

    function onSubmit() {
        loading.show();
        var form = this;
        $(form).parents('.page');
        ApiClient.getServerConfiguration().then(function (config) {
            config.ServerName = $('#txtServerName', form).val();
            config.UICulture = $('#selectLocalizationLanguage', form).val();
            config.CachePath = form.querySelector('#txtCachePath').value;
            config.MetadataPath = $('#txtMetadataPath', form).val();
            config.MetadataNetworkPath = $('#txtMetadataNetworkPath', form).val();
            var requiresReload = config.UICulture !== currentLanguage;
            ApiClient.updateServerConfiguration(config).then(function() {
                ApiClient.getNamedConfiguration(brandingConfigKey).then(function(brandingConfig) {
                    brandingConfig.LoginDisclaimer = form.querySelector('#txtLoginDisclaimer').value;
                    brandingConfig.CustomCss = form.querySelector('#txtCustomCss').value;

                    if (currentBrandingOptions && brandingConfig.CustomCss !== currentBrandingOptions.CustomCss) {
                        requiresReload = true;
                    }

                    ApiClient.updateNamedConfiguration(brandingConfigKey, brandingConfig).then(function () {
                        Dashboard.processServerConfigurationUpdateResult();

                        if (requiresReload && !AppInfo.isNativeApp) {
                            window.location.reload(true);
                        }
                    });
                });
            }, function () {
                require(['alert'], function (alert) {
                    alert(globalize.translate('DefaultErrorMessage'));
                });

                Dashboard.processServerConfigurationUpdateResult();
            });
        });
        return false;
    }

    var currentBrandingOptions;
    var currentLanguage;
    var brandingConfigKey = 'branding';
    return function (view, params) {
        $('#btnSelectCachePath', view).on('click.selectDirectory', function () {
            require(['directorybrowser'], function (directoryBrowser) {
                var picker = new directoryBrowser();
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
            require(['directorybrowser'], function (directoryBrowser) {
                var picker = new directoryBrowser();
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
                    instruction: globalize.translate('HeaderSelectMetadataPathHelp'),
                    enableNetworkSharePath: true
                });
            });
        });
        $('.dashboardGeneralForm', view).off('submit', onSubmit).on('submit', onSubmit);
        view.addEventListener('viewshow', function () {
            var promiseConfig = ApiClient.getServerConfiguration();
            var promiseLanguageOptions = ApiClient.getJSON(ApiClient.getUrl('Localization/Options'));
            var promiseSystemInfo = ApiClient.getSystemInfo();
            Promise.all([promiseConfig, promiseLanguageOptions, promiseSystemInfo]).then(function (responses) {
                loadPage(view, responses[0], responses[1], responses[2]);
            });
            ApiClient.getNamedConfiguration(brandingConfigKey).then(function (config) {
                currentBrandingOptions = config;
                view.querySelector('#txtLoginDisclaimer').value = config.LoginDisclaimer || '';
                view.querySelector('#txtCustomCss').value = config.CustomCss || '';
            });
        });
    };
});
