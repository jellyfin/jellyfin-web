define(['jQuery', 'loading', 'emby-button', 'emby-select'], function ($, loading) {
    'use strict';

    function loadPage(page, config, languageOptions) {
        const selectLocalizationLanguage = page.querySelector('#selectLocalizationLanguage');
        selectLocalizationLanguage.innerHtml = languageOptions.map(function (l) {
            return '<option value="' + l.Value + '">' + l.Name + '</option>';
        });
        selectLocalizationLanguage.val(config.UICulture);
        loading.hide();
    }

    function save(page) {
        loading.show();
        var apiClient = ApiClient;
        apiClient.getJSON(apiClient.getUrl('Startup/Configuration')).then(function (config) {
            config.UICulture = page.querySelector('#selectLocalizationLanguage').value;
            apiClient.ajax({
                type: 'POST',
                data: config,
                url: apiClient.getUrl('Startup/Configuration')
            }).then(function () {
                Dashboard.navigate('wizarduser.html');
            });
        });
    }

    function onSubmit() {
        save(this.closest('.page'));
        return false;
    }

    return function (view, params) {
        $('.wizardStartForm', view).on('submit', onSubmit);
        view.addEventListener('viewshow', function () {
            document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
            loading.show();
            var page = this;
            var apiClient = ApiClient;
            var promise1 = apiClient.getJSON(apiClient.getUrl('Startup/Configuration'));
            var promise2 = apiClient.getJSON(apiClient.getUrl('Localization/Options'));
            Promise.all([promise1, promise2]).then(function (responses) {
                loadPage(page, responses[0], responses[1]);
            });
        });
        view.addEventListener('viewhide', function () {
            document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
        });
    };
});
