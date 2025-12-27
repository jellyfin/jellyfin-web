import cardBuilder from '@/components/cardbuilder/cardBuilder';
import imageLoader from '@/components/images/imageLoader';
import loading from '@/components/loading/loading';
import '@/elements/emby-button/paper-icon-button-light';
import '@/elements/emby-button/emby-button';

function renderTimers(context, timers) {
    const html = cardBuilder.getCardsHtml({
        items: timers,
        shape: 'auto',
        defaultShape: 'portrait',
        showTitle: true,
        cardLayout: false,
        preferThumb: 'auto',
        coverImage: true,
        overlayText: false,
        showSeriesTimerTime: true,
        showSeriesTimerChannel: true,
        centerText: true,
        overlayMoreButton: true,
        lines: 3
    });
    const elem = context.querySelector('#items');
    elem.innerHTML = html;
    imageLoader.lazyChildren(elem);
    loading.hide();
}

function reload(context, promise) {
    loading.show();
    promise.then(function (result) {
        renderTimers(context, result.Items);
    });
}

const query = {
    SortBy: 'SortName',
    SortOrder: 'Ascending'
};

export default function (view, params, tabContent) {
    let timersPromise;
    const self = this;

    self.preRender = function () {
        timersPromise = ApiClient.getLiveTvSeriesTimers(query);
    };

    self.renderTab = function () {
        reload(tabContent, timersPromise);
    };
}
