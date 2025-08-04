import cardBuilder from 'components/cardbuilder/cardBuilder';
import imageLoader from 'components/images/imageLoader';
import loading from 'components/loading/loading';
import { getBackdropShape } from 'utils/card';
import Dashboard from 'utils/dashboard';

import 'scripts/livetvcomponents';
import 'components/listview/listview.scss';
import 'elements/emby-itemscontainer/emby-itemscontainer';

function renderRecordings(elem, recordings, cardOptions, scrollX) {
    if (!elem) {
        return;
    }

    if (recordings.length) {
        elem.classList.remove('hide');
    } else {
        elem.classList.add('hide');
    }

    const recordingItems = elem.querySelector('.recordingItems');

    if (scrollX) {
        recordingItems.classList.add('scrollX');
        recordingItems.classList.add('hiddenScrollX');
        recordingItems.classList.remove('vertical-wrap');
    } else {
        recordingItems.classList.remove('scrollX');
        recordingItems.classList.remove('hiddenScrollX');
        recordingItems.classList.add('vertical-wrap');
    }

    recordingItems.innerHTML = cardBuilder.getCardsHtml(
        Object.assign(
            {
                items: recordings,
                shape: scrollX ? 'autooverflow' : 'auto',
                defaultShape: getBackdropShape(scrollX),
                showTitle: true,
                showParentTitle: true,
                coverImage: true,
                cardLayout: false,
                centerText: true,
                allowBottomPadding: !scrollX,
                preferThumb: 'auto',
                overlayText: false
            },
            cardOptions || {}
        )
    );
    imageLoader.lazyChildren(recordingItems);
}

function renderLatestRecordings(context, promise) {
    promise.then(function (result) {
        renderRecordings(
            context.querySelector('#latestRecordings'),
            result.Items,
            {
                showYear: true,
                lines: 2
            },
            false
        );
        loading.hide();
    });
}

function renderRecordingFolders(context, promise) {
    promise.then(function (result) {
        renderRecordings(
            context.querySelector('#recordingFolders'),
            result.Items,
            {
                showYear: false,
                showParentTitle: false
            },
            false
        );
    });
}

function onMoreClick() {
    const type = this.getAttribute('data-type');

    if (type === 'latest') {
        Dashboard.navigate(
            'list?type=Recordings&serverId=' + ApiClient.serverId()
        );
    }
}

export default function (view, params, tabContent) {
    function enableFullRender() {
        return new Date().getTime() - lastFullRender > 300000;
    }

    let foldersPromise;
    let latestPromise;
    const self = this;
    let lastFullRender = 0;
    const moreButtons = tabContent.querySelectorAll('.more');

    for (let i = 0, length = moreButtons.length; i < length; i++) {
        moreButtons[i].addEventListener('click', onMoreClick);
    }

    self.preRender = function () {
        if (enableFullRender()) {
            latestPromise = ApiClient.getLiveTvRecordings({
                UserId: Dashboard.getCurrentUserId(),
                Limit: 12,
                Fields: 'CanDelete,PrimaryImageAspectRatio',
                EnableTotalRecordCount: false,
                EnableImageTypes: 'Primary,Thumb,Backdrop'
            });
            foldersPromise = ApiClient.getRecordingFolders(
                Dashboard.getCurrentUserId()
            );
        }
    };

    self.renderTab = function () {
        if (enableFullRender()) {
            loading.show();
            renderLatestRecordings(tabContent, latestPromise);
            renderRecordingFolders(tabContent, foldersPromise);
            lastFullRender = new Date().getTime();
        }
    };
}
