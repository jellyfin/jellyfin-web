import cardBuilder from 'cardBuilder';
import imageLoader from 'imageLoader';
import loading from 'loading';
import 'paper-icon-button-light';
import 'emby-button';

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
