import loading from 'loading';
import groupedcards from 'components/groupedcards';
import cardBuilder from 'cardBuilder';
import imageLoader from 'imageLoader';

/* eslint-disable indent */

    function getLatestPromise(context, params) {
        loading.show();
        const userId = ApiClient.getCurrentUserId();
        const parentId = params.topParentId;
        const options = {
            IncludeItemTypes: 'Episode',
            Limit: 30,
            Fields: 'PrimaryImageAspectRatio,BasicSyncInfo',
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Thumb'
        };
        return ApiClient.getJSON(ApiClient.getUrl('Users/' + userId + '/Items/Latest', options));
    }

    function loadLatest(context, params, promise) {
        promise.then(function (items) {
            var html = '';
            html += cardBuilder.getCardsHtml({
                items: items,
                shape: 'backdrop',
                preferThumb: true,
                showTitle: true,
                showSeriesYear: true,
                showParentTitle: true,
                overlayText: false,
                cardLayout: false,
                showUnplayedIndicator: false,
                showChildCountIndicator: true,
                centerText: true,
                lazy: true,
                overlayPlayButton: true,
                lines: 2
            });
            const elem = context.querySelector('#latestEpisodes');
            elem.innerHTML = html;
            imageLoader.lazyChildren(elem);
            loading.hide();

            import('autoFocuser').then(({default: autoFocuser}) => {
                autoFocuser.autoFocus(context);
            });
        });
    }

    export default function (view, params, tabContent) {
        const self = this;
        let latestPromise;

        self.preRender = function () {
            latestPromise = getLatestPromise(view, params);
        };

        self.renderTab = function () {
            loadLatest(tabContent, params, latestPromise);
        };

        tabContent.querySelector('#latestEpisodes').addEventListener('click', groupedcards);
    }

/* eslint-enable indent */
