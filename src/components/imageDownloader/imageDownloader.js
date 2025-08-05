import { AppFeature } from 'constants/appFeature';
import dom from '../../utils/dom';
import loading from '../loading/loading';
import { appHost } from '../apphost';
import dialogHelper from '../dialogHelper/dialogHelper';
import imageLoader from '../images/imageLoader';
import browser from '../../scripts/browser';
import layoutManager from '../layoutManager';
import scrollHelper from '../../scripts/scrollHelper';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-button/emby-button';
import '../formdialog.scss';
import '../cardbuilder/card.scss';
import template from './imageDownloader.template.html';

const enableFocusTransform = !browser.slow && !browser.edge;

let currentItemId;
let currentItemType;
let currentResolve;
let currentReject;
let hasChanges = false;

// These images can be large and we're seeing memory problems in safari
const browsableImagePageSize = browser.slow ? 6 : 30;

let browsableImageStartIndex = 0;
let browsableImageType = 'Primary';
let selectedProvider;
let browsableParentId;

function getBaseRemoteOptions(page, forceCurrentItemId = false) {
    const options = {};

    if (!forceCurrentItemId && page.querySelector('#chkShowParentImages').checked && browsableParentId) {
        options.itemId = browsableParentId;
    } else {
        options.itemId = currentItemId;
    }

    return options;
}

function reloadBrowsableImages(page, apiClient) {
    loading.show();

    const options = getBaseRemoteOptions(page);

    options.type = browsableImageType;
    options.startIndex = browsableImageStartIndex;
    options.limit = browsableImagePageSize;
    options.IncludeAllLanguages = page.querySelector('#chkAllLanguages').checked;

    const provider = selectedProvider || '';

    if (provider) {
        options.ProviderName = provider;
    }

    apiClient.getAvailableRemoteImages(options).then(function (result) {
        renderRemoteImages(page, apiClient, result, browsableImageType, options.startIndex, options.limit);

        page.querySelector('#selectBrowsableImageType').value = browsableImageType;

        const providersHtml = result.Providers.map(function (p) {
            return '<option value="' + p + '">' + p + '</option>';
        });

        const selectImageProvider = page.querySelector('#selectImageProvider');
        selectImageProvider.innerHTML = '<option value="">' + globalize.translate('All') + '</option>' + providersHtml;
        selectImageProvider.value = provider;

        loading.hide();
    });
}

function renderRemoteImages(page, apiClient, imagesResult, imageType, startIndex, limit) {
    page.querySelector('.availableImagesPaging').innerHTML = getPagingHtml(startIndex, limit, imagesResult.TotalRecordCount);

    let html = '';

    for (let i = 0, length = imagesResult.Images.length; i < length; i++) {
        html += getRemoteImageHtml(imagesResult.Images[i], imageType);
    }

    const availableImagesList = page.querySelector('.availableImagesList');
    availableImagesList.innerHTML = html;
    imageLoader.lazyChildren(availableImagesList);

    const btnNextPage = page.querySelector('.btnNextPage');
    const btnPreviousPage = page.querySelector('.btnPreviousPage');

    if (btnNextPage) {
        btnNextPage.addEventListener('click', function () {
            browsableImageStartIndex += browsableImagePageSize;
            reloadBrowsableImages(page, apiClient);
        });
    }

    if (btnPreviousPage) {
        btnPreviousPage.addEventListener('click', function () {
            browsableImageStartIndex -= browsableImagePageSize;
            reloadBrowsableImages(page, apiClient);
        });
    }
}

function getPagingHtml(startIndex, limit, totalRecordCount) {
    let html = '';

    const recordsEnd = Math.min(startIndex + limit, totalRecordCount);

    // 20 is the minimum page size
    const showControls = totalRecordCount > limit;

    html += '<div class="listPaging">';

    html += '<span style="margin-right: 10px;">';

    const startAtDisplay = totalRecordCount ? startIndex + 1 : 0;
    html += globalize.translate('ListPaging', startAtDisplay, recordsEnd, totalRecordCount);

    html += '</span>';

    if (showControls) {
        html += '<div data-role="controlgroup" data-type="horizontal" style="display:inline-block;">';

        html += `<button is="paper-icon-button-light" title="${globalize.translate('Previous')}" class="btnPreviousPage autoSize" ${(startIndex ? '' : 'disabled')}><span class="material-icons arrow_back" aria-hidden="true"></span></button>`;
        html += `<button is="paper-icon-button-light" title="${globalize.translate('Next')}" class="btnNextPage autoSize" ${(startIndex + limit >= totalRecordCount ? 'disabled' : '')}><span class="material-icons arrow_forward" aria-hidden="true"></span></button>`;
        html += '</div>';
    }

    html += '</div>';

    return html;
}

function downloadRemoteImage(page, apiClient, url, type, provider) {
    const options = getBaseRemoteOptions(page, true);

    options.Type = type;
    options.ImageUrl = url;
    options.ProviderName = provider;

    loading.show();

    apiClient.downloadRemoteImage(options).then(function () {
        hasChanges = true;
        const dlg = dom.parentWithClass(page, 'dialog');
        dialogHelper.close(dlg);
    });
}

function getRemoteImageHtml(image, imageType) {
    const tagName = layoutManager.tv ? 'button' : 'div';
    const enableFooterButtons = !layoutManager.tv;

    // TODO move card creation code to Card component

    let html = '';

    let cssClass = 'card scalableCard imageEditorCard';
    const cardBoxCssClass = 'cardBox visualCardBox';

    let shape;
    if (imageType === 'Backdrop' || imageType === 'Art' || imageType === 'Thumb' || imageType === 'Logo') {
        shape = 'backdrop';
    } else if (imageType === 'Banner') {
        shape = 'banner';
    } else if (imageType === 'Disc') {
        shape = 'square';
    } else if (currentItemType === 'Episode') {
        shape = 'backdrop';
    } else if (currentItemType === 'MusicAlbum' || currentItemType === 'MusicArtist') {
        shape = 'square';
    } else {
        shape = 'portrait';
    }

    cssClass += ' ' + shape + 'Card ' + shape + 'Card-scalable';
    if (tagName === 'button') {
        cssClass += ' btnImageCard';

        if (layoutManager.tv) {
            cssClass += ' show-focus';

            if (enableFocusTransform) {
                cssClass += ' show-animation';
            }
        }

        html += '<button type="button" class="' + cssClass + '"';
    } else {
        html += '<div class="' + cssClass + '"';
    }

    html += ' data-imageprovider="' + image.ProviderName + '" data-imageurl="' + image.Url + '" data-imagetype="' + image.Type + '"';

    html += '>';

    html += '<div class="' + cardBoxCssClass + '">';
    html += '<div class="cardScalable visualCardBox-cardScalable" style="background-color:transparent;">';
    html += '<div class="cardPadder-' + shape + '"></div>';
    html += '<div class="cardContent">';

    if (layoutManager.tv || !appHost.supports(AppFeature.ExternalLinks)) {
        html += '<div class="cardImageContainer lazy" data-src="' + image.Url + '" style="background-position:center center;background-size:contain;"></div>';
    } else {
        html += '<a is="emby-linkbutton" target="_blank" href="' + image.Url + '" class="button-link cardImageContainer lazy" data-src="' + image.Url + '" style="background-position:center center;background-size:contain"></a>';
    }

    html += '</div>';
    html += '</div>';

    // begin footer
    html += '<div class="cardFooter visualCardBox-cardFooter">';

    html += '<div class="cardText cardTextCentered">' + image.ProviderName + '</div>';

    if (image.Width || image.Height || image.Language) {
        html += '<div class="cardText cardText-secondary cardTextCentered">';

        if (image.Width && image.Height) {
            html += image.Width + ' x ' + image.Height;

            if (image.Language) {
                html += ' • ' + image.Language;
            }
        } else if (image.Language) {
            html += image.Language;
        }

        html += '</div>';
    }

    if (image.CommunityRating != null) {
        html += '<div class="cardText cardText-secondary cardTextCentered">';

        if (image.RatingType === 'Likes') {
            html += image.CommunityRating + (image.CommunityRating === 1 ? ' like' : ' likes');
        } else if (image.CommunityRating) {
            html += image.CommunityRating.toFixed(1);

            if (image.VoteCount) {
                html += ' • ' + image.VoteCount + (image.VoteCount === 1 ? ' vote' : ' votes');
            }
        } else {
            html += 'Unrated';
        }

        html += '</div>';
    }

    if (enableFooterButtons) {
        html += '<div class="cardText cardTextCentered">';

        html += `<button is="paper-icon-button-light" class="btnDownloadRemoteImage autoSize" raised" title="${globalize.translate('Download')}"><span class="material-icons cloud_download" aria-hidden="true"></span></button>`;
        html += '</div>';
    }

    html += '</div>';
    // end footer

    html += '</div>';

    html += '</' + tagName + '>';

    return html;
}

function reloadBrowsableImagesFirstPage(page, apiClient) {
    browsableImageStartIndex = 0;
    reloadBrowsableImages(page, apiClient);
}

function initEditor(page, apiClient) {
    page.querySelector('#selectBrowsableImageType').addEventListener('change', function () {
        browsableImageType = this.value;
        selectedProvider = null;

        reloadBrowsableImagesFirstPage(page, apiClient);
    });

    page.querySelector('#selectImageProvider').addEventListener('change', function () {
        selectedProvider = this.value;

        reloadBrowsableImagesFirstPage(page, apiClient);
    });

    page.querySelector('#chkAllLanguages').addEventListener('change', function () {
        reloadBrowsableImagesFirstPage(page, apiClient);
    });

    page.querySelector('#chkShowParentImages').addEventListener('change', function () {
        reloadBrowsableImagesFirstPage(page, apiClient);
    });

    page.addEventListener('click', function (e) {
        const btnDownloadRemoteImage = dom.parentWithClass(e.target, 'btnDownloadRemoteImage');
        if (btnDownloadRemoteImage) {
            const card = dom.parentWithClass(btnDownloadRemoteImage, 'card');
            downloadRemoteImage(page, apiClient, card.getAttribute('data-imageurl'), card.getAttribute('data-imagetype'), card.getAttribute('data-imageprovider'));
            return;
        }

        const btnImageCard = dom.parentWithClass(e.target, 'btnImageCard');
        if (btnImageCard) {
            downloadRemoteImage(page, apiClient, btnImageCard.getAttribute('data-imageurl'), btnImageCard.getAttribute('data-imagetype'), btnImageCard.getAttribute('data-imageprovider'));
        }
    });
}

function showEditor(itemId, serverId, itemType) {
    loading.show();

    const apiClient = ServerConnections.getApiClient(serverId);

    currentItemId = itemId;
    currentItemType = itemType;

    const dialogOptions = {
        removeOnClose: true
    };

    if (layoutManager.tv) {
        dialogOptions.size = 'fullscreen';
    } else {
        dialogOptions.size = 'small';
    }

    const dlg = dialogHelper.createDialog(dialogOptions);

    dlg.innerHTML = globalize.translateHtml(template, 'core');

    if (layoutManager.tv) {
        scrollHelper.centerFocus.on(dlg, false);
    }

    if (browsableParentId) {
        dlg.querySelector('#lblShowParentImages').classList.remove('hide');
    }

    // Has to be assigned a z-index after the call to .open()
    dlg.addEventListener('close', onDialogClosed);

    dialogHelper.open(dlg);

    const editorContent = dlg.querySelector('.formDialogContent');
    initEditor(editorContent, apiClient);

    dlg.querySelector('.btnCancel').addEventListener('click', function () {
        dialogHelper.close(dlg);
    });

    reloadBrowsableImages(editorContent, apiClient);
}

function onDialogClosed() {
    const dlg = this;

    if (layoutManager.tv) {
        scrollHelper.centerFocus.off(dlg, false);
    }

    loading.hide();
    if (hasChanges) {
        currentResolve();
    } else {
        currentReject(new Error('OnDialogClosedError'));
    }
}

export function show(itemId, serverId, itemType, imageType, parentId) {
    return new Promise(function (resolve, reject) {
        currentResolve = resolve;
        currentReject = reject;
        hasChanges = false;
        browsableImageStartIndex = 0;
        browsableImageType = imageType || 'Primary';
        selectedProvider = null;
        browsableParentId = parentId;
        showEditor(itemId, serverId, itemType);
    });
}

export default {
    show: show
};

