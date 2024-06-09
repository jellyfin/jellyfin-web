import loading from '../components/loading/loading';
import globalize from '../scripts/globalize';
import Dashboard, { pageIdOn } from '../utils/dashboard';
import { getParameterByName } from '../utils/url.ts';
import Events from '../utils/events.ts';

function onListingsSubmitted() {
    Dashboard.navigate('dashboard/livetv');
}

function init(page, type, providerId) {
    import(`../components/tvproviders/${type}`).then(({ default: ProviderFactory }) => {
        const instance = new ProviderFactory(page, providerId, {});
        Events.on(instance, 'submitted', onListingsSubmitted);
        instance.init();
    });
}

function loadTemplate(page, type, providerId) {
    import(`../components/tvproviders/${type}.template.html`).then(({ default: html }) => {
        page.querySelector('.providerTemplate').innerHTML = globalize.translateHtml(html);
        init(page, type, providerId);
    });
}

pageIdOn('pageshow', 'liveTvGuideProviderPage', function () {
    loading.show();
    const providerId = getParameterByName('id');
    loadTemplate(this, getParameterByName('type'), providerId);
});
