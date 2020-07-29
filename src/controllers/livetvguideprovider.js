define(['events', 'loading', 'globalize'], function (events, loading, globalize) {
    'use strict';

    function onListingsSubmitted() {
        Dashboard.navigate('livetvstatus.html');
    }

    function init(page, type, providerId) {
        const url = 'components/tvproviders/' + type + '.js';

        require([url], function (factory) {
            const instance = new factory(page, providerId, {});
            events.on(instance, 'submitted', onListingsSubmitted);
            instance.init();
        });
    }

    function loadTemplate(page, type, providerId) {
        require(['text!./components/tvproviders/' + type + '.template.html'], function (html) {
            page.querySelector('.providerTemplate').innerHTML = globalize.translateHtml(html);
            init(page, type, providerId);
        });
    }

    pageIdOn('pageshow', 'liveTvGuideProviderPage', function () {
        loading.show();
        const providerId = getParameterByName('id');
        loadTemplate(this, getParameterByName('type'), providerId);
    });
});
