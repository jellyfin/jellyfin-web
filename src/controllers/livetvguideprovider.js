define(['events', 'loading', 'globalize', 'dom'], function (events, loading, globalize, dom) {
    'use strict';

    function onListingsSubmitted() {
        Dashboard.navigate('livetvstatus.html');
    }

    function init(page, type, providerId) {
        var url = 'components/tvproviders/' + type + '.js';

        require([url], function (factory) {
            var instance = new factory(page, providerId, {});
            events.on(instance, 'submitted', onListingsSubmitted);
            instance.init();
        });
    }

    function loadTemplate(page, type, providerId) {
        require(['text!./components/tvproviders/' + type + '.template.html'], function (html) {
            page.querySelector('.providerTemplate').innerHTML = globalize.translateDocument(html);
            init(page, type, providerId);
        });
    }

    dom.pageIdOn('pageshow', 'liveTvGuideProviderPage', function () {
        loading.show();
        var providerId = dom.getParameterByName('id');
        loadTemplate(this, dom.getParameterByName('type'), providerId);
    });
});
