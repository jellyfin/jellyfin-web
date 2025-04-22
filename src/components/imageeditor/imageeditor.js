import dialogHelper from '../dialogHelper/dialogHelper';
import loading from '../loading/loading';
import dom from '../../scripts/dom';
import layoutManager from '../layoutManager';
import focusManager from '../focusManager';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import scrollHelper from '../../scripts/scrollHelper';
import imageLoader from '../images/imageLoader';
import browser from '../../scripts/browser';
import { appHost } from '../apphost';
import '../cardbuilder/card.scss';
import '../formdialog.scss';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import './imageeditor.scss';
import alert from '../alert';
import confirm from '../confirm/confirm';
import template from './imageeditor.template.html';

const enableFocusTransform = !browser.slow && !browser.edge;

let currentItem;
let hasChanges = false;

function getBaseRemoteOptions() {
    return { itemId: currentItem.Id };
}

function reload(page, item, focusContext) {
    loading.show();

    let apiClient;

    if (item) {
        apiClient = ServerConnections.getApiClient(item.ServerId);
        reloadItem(page, item, apiClient, focusContext);
    } else {
        apiClient = ServerConnections.getApiClient(currentItem.ServerId);
        apiClient.getItem(apiClient.getCurrentUserId(), currentItem.Id).then(function (itemToReload) {
            reloadItem(page, itemToReload, apiClient, focusContext);
        });
    }
}

function addListeners(container, className, eventName, fn) {
    container.addEventListener(eventName, function (e) {
        const elem = dom.parentWithClass(e.target, className);
        if (elem) {
            fn.call(elem, e);
        }
    });
}

function reloadItem(page, item, apiClient, focusContext) {
    currentItem = item;

    apiClient.getRemoteImageProviders(getBaseRemoteOptions()).then(function (providers) {
        const btnBrowseAllImages = page.querySelectorAll('.btnBrowseAllImages');
        for (let i = 0, length = btnBrowseAllImages.length; i < length; i++) {
            if (providers.length) {
                btnBrowseAllImages[i].classList.remove('hide');
            } else {
                btnBrowseAllImages[i].classList.add('hide');
            }
        }

        apiClient.getItemImageInfos(currentItem.Id).then(function (imageInfos) {
            renderStandardImages(page, apiClient, item, imageInfos, providers);
            renderBackdrops(page, apiClient, item, imageInfos, providers);
            loading.hide();

            if (layoutManager.tv) {
                focusManager.autoFocus((focusContext || page));
            }
        });
    });
}

function getImageUrl(item, apiClient, type, index, options) {
    options = options || {};
    options.type = type;
    options.index = index;

    if (type === 'Backdrop') {
        options.tag = item.BackdropImageTags[index];
    } else if (type === 'Primary') {
        options.tag = item.PrimaryImageTag || item.ImageTags[type];
    } else {
        options.tag = item.ImageTags[type];
    }

    // For search hints
    return apiClient.getScaledImageUrl(item.Id || item.ItemId, options);
}

function getCardHtml(image, apiClient, options) {
    // TODO move card creation code to Card component

    let html = '';

    let cssClass = 'card scalableCard imageEditorCard';
    const cardBoxCssClass = 'cardBox visualCardBox';

    cssClass += ' backdropCard backdropCard-scalable';

    if (options.tagName === 'button') {
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

    html += ' data-id="' + currentItem.Id + '" data-serverid="' + apiClient.serverId() + '" data-index="' + options.index + '" data-numimages="' + options.numImages + '" data-imagetype="' + image.ImageType + '" data-providers="' + options.imageProviders.length + '"';

    html += '>';

    html += '<div class="' + cardBoxCssClass + '">';
    html += '<div class="cardScalable visualCardBox-cardScalable" style="background-color:transparent;">';
    html += '<div class="cardPadder-backdrop"></div>';

    html += '<div class="cardContent">';

    const imageUrl = getImageUrl(currentItem, apiClient, image.ImageType, image.ImageIndex, { maxWidth: options.imageSize });

    html += '<div class="cardImageContainer" style="background-image:url(\'' + imageUrl + '\');background-position:center center;background-size:contain;"></div>';

    html += '</div>';
    html += '</div>';

    html += '<div class="cardFooter visualCardBox-cardFooter">';

    html += '<h3 class="cardText cardTextCentered" style="margin:0;">' + globalize.translate('' + image.ImageType) + '</h3>';

    html += '<div class="cardText cardText-secondary cardTextCentered">';
    if (image.Width && image.Height) {
        html += image.Width + ' X ' + image.Height;
    } else {
        html += '&nbsp;';
    }
    html += '</div>';

    if (options.enableFooterButtons) {
        html += '<div class="cardText cardTextCentered">';

        if (image.ImageType === 'Backdrop') {
            if (options.index > 0) {
                html += '<button type="button" is="paper-icon-button-light" class="btnMoveImage autoSize" data-imagetype="' + image.ImageType + '" data-index="' + image.ImageIndex + '" data-newindex="' + (image.ImageIndex - 1) + '" title="' + globalize.translate('MoveLeft') + '"><span class="material-icons chevron_left"></span></button>';
            } else {
                html += '<button type="button" is="paper-icon-button-light" class="autoSize" disabled title="' + globalize.translate('MoveLeft') + '"><span class="material-icons chevron_left" aria-hidden="true"></span></button>';
            }

            if (options.index < options.numImages - 1) {
                html += '<button type="button" is="paper-icon-button-light" class="btnMoveImage autoSize" data-imagetype="' + image.ImageType + '" data-index="' + image.ImageIndex + '" data-newindex="' + (image.ImageIndex + 1) + '" title="' + globalize.translate('MoveRight') + '"><span class="material-icons chevron_right" aria-hidden="true"></span></button>';
            } else {
                html += '<button type="button" is="paper-icon-button-light" class="autoSize" disabled title="' + globalize.translate('MoveRight') + '"><span class="material-icons chevron_right" aria-hidden="true"></span></button>';
            }
        } else if (options.imageProviders.length) {
            html += '<button type="button" is="paper-icon-button-light" data-imagetype="' + image.ImageType + '" class="btnSearchImages autoSize" title="' + globalize.translate('Search') + '"><span class="material-icons search" aria-hidden="true"></span></button>';
        }

        html += '<button type="button" is="paper-icon-button-light" data-imagetype="' + image.ImageType + '" data-index="' + (image.ImageIndex != null ? image.ImageIndex : 'null') + '" class="btnDeleteImage autoSize" title="' + globalize.translate('Delete') + '"><span class="material-icons delete" aria-hidden="true"></span></button>';
        html += '</div>';
    }

    html += '</div>';
    html += '</div>';
    html += '</' + options.tagName + '>';

    return html;
}

function deleteImage(context, itemId, type, index, apiClient, enableConfirmation) {
    const afterConfirm = function () {
        apiClient.deleteItemImage(itemId, type, index).then(function () {
            hasChanges = true;
            reload(context);
        });
    };

    if (!enableConfirmation) {
        afterConfirm();
        return;
    }

    confirm({
        text: globalize.translate('ConfirmDeleteImage'),
        confirmText: globalize.translate('Delete'),
        primary: 'delete'
    }).then(afterConfirm);
}

function moveImage(context, apiClient, itemId, type, index, newIndex, focusContext) {
    apiClient.updateItemImageIndex(itemId, type, index, newIndex).then(function () {
        hasChanges = true;
        reload(context, null, focusContext);
    }, function () {
        alert(globalize.translate('ErrorDefault'));
    });
}

function renderImages(page, item, apiClient, images, imageProviders, elem) {
    let html = '';

    let imageSize = 300;
    const windowSize = dom.getWindowSize();
    if (windowSize.innerWidth >= 1280) {
        imageSize = Math.round(windowSize.innerWidth / 4);
    }

    const tagName = layoutManager.tv ? 'button' : 'div';
    const enableFooterButtons = !layoutManager.tv;

    for (let i = 0, length = images.length; i < length; i++) {
        const image = images[i];
        const options = { index: i, numImages: length, imageProviders, imageSize, tagName, enableFooterButtons };
        html += getCardHtml(image, apiClient, options);
    }

    elem.innerHTML = html;
    imageLoader.lazyChildren(elem);
}

function renderStandardImages(page, apiClient, item, imageInfos, imageProviders) {
    const images = imageInfos.filter(function (i) {
        return i.ImageType !== 'Backdrop' && i.ImageType !== 'Chapter';
    });

    renderImages(page, item, apiClient, images, imageProviders, page.querySelector('#images'));
}

function renderBackdrops(page, apiClient, item, imageInfos, imageProviders) {
    const images = imageInfos.filter(function (i) {
        return i.ImageType === 'Backdrop';
    }).sort(function (a, b) {
        return a.ImageIndex - b.ImageIndex;
    });

    if (images.length) {
        page.querySelector('#backdropsContainer', page).classList.remove('hide');
        renderImages(page, item, apiClient, images, imageProviders, page.querySelector('#backdrops'));
    } else {
        page.querySelector('#backdropsContainer', page).classList.add('hide');
    }
}

function showImageDownloader(page, imageType) {
    import('../imageDownloader/imageDownloader').then((ImageDownloader) => {
        ImageDownloader.show(
            currentItem.Id,
            currentItem.ServerId,
            currentItem.Type,
            imageType,
            currentItem.Type == 'Season' ? currentItem.ParentId : null
        ).then(function () {
            hasChanges = true;
            reload(page);
        }).catch(function () {
            // image downloader closed
        });
    });
}

function showActionSheet(context, imageCard) {
    const itemId = imageCard.getAttribute('data-id');
    const serverId = imageCard.getAttribute('data-serverid');
    const apiClient = ServerConnections.getApiClient(serverId);

    const type = imageCard.getAttribute('data-imagetype');
    const index = parseInt(imageCard.getAttribute('data-index'), 10);
    const providerCount = parseInt(imageCard.getAttribute('data-providers'), 10);
    const numImages = parseInt(imageCard.getAttribute('data-numimages'), 10);

    import('../actionSheet/actionSheet').then(({ default: actionSheet }) => {
        const commands = [];

        commands.push({
            name: globalize.translate('Delete'),
            id: 'delete'
        });

        if (type === 'Backdrop') {
            if (index > 0) {
                commands.push({
                    name: globalize.translate('MoveLeft'),
                    id: 'moveleft'
                });
            }

            if (index < numImages - 1) {
                commands.push({
                    name: globalize.translate('MoveRight'),
                    id: 'moveright'
                });
            }
        }

        if (providerCount) {
            commands.push({
                name: globalize.translate('Search'),
                id: 'search'
            });
        }

        actionSheet.show({

            items: commands,
            positionTo: imageCard

        }).then(function (id) {
            switch (id) {
                case 'delete':
                    deleteImage(context, itemId, type, index, apiClient, false);
                    break;
                case 'search':
                    showImageDownloader(context, type);
                    break;
                case 'moveleft':
                    moveImage(context, apiClient, itemId, type, index, index - 1, dom.parentWithClass(imageCard, 'itemsContainer'));
                    break;
                case 'moveright':
                    moveImage(context, apiClient, itemId, type, index, index + 1, dom.parentWithClass(imageCard, 'itemsContainer'));
                    break;
                default:
                    break;
            }
        });
    });
}

function initEditor(context, options) {
    const uploadButtons = context.querySelectorAll('.btnOpenUploadMenu');
    const isFileInputSupported = appHost.supports('fileinput');
    for (let i = 0, length = uploadButtons.length; i < length; i++) {
        if (isFileInputSupported) {
            uploadButtons[i].classList.remove('hide');
        } else {
            uploadButtons[i].classList.add('hide');
        }
    }

    addListeners(context, 'btnOpenUploadMenu', 'click', function () {
        const imageType = this.getAttribute('data-imagetype');

        import('../imageUploader/imageUploader').then(({ default: imageUploader }) => {
            imageUploader.show({

                theme: options.theme,
                imageType: imageType,
                itemId: currentItem.Id,
                serverId: currentItem.ServerId

            }).then(function (hasChanged) {
                if (hasChanged) {
                    hasChanges = true;
                    reload(context);
                }
            });
        });
    });

    addListeners(context, 'btnSearchImages', 'click', function () {
        showImageDownloader(context, this.getAttribute('data-imagetype'));
    });

    addListeners(context, 'btnBrowseAllImages', 'click', function () {
        showImageDownloader(context, this.getAttribute('data-imagetype') || 'Primary');
    });

    addListeners(context, 'btnImageCard', 'click', function () {
        showActionSheet(context, this);
    });

    addListeners(context, 'btnDeleteImage', 'click', function () {
        const type = this.getAttribute('data-imagetype');
        let index = this.getAttribute('data-index');
        index = index === 'null' ? null : parseInt(index, 10);
        const apiClient = ServerConnections.getApiClient(currentItem.ServerId);
        deleteImage(context, currentItem.Id, type, index, apiClient, true);
    });

    addListeners(context, 'btnMoveImage', 'click', function () {
        const type = this.getAttribute('data-imagetype');
        const index = this.getAttribute('data-index');
        const newIndex = this.getAttribute('data-newindex');
        const apiClient = ServerConnections.getApiClient(currentItem.ServerId);
        moveImage(context, apiClient, currentItem.Id, type, index, newIndex, dom.parentWithClass(this, 'itemsContainer'));
    });
}

function showEditor(options, resolve, reject) {
    const itemId = options.itemId;
    const serverId = options.serverId;

    loading.show();

    const apiClient = ServerConnections.getApiClient(serverId);
    apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(function (item) {
        const dialogOptions = {
            removeOnClose: true
        };

        if (layoutManager.tv) {
            dialogOptions.size = 'fullscreen';
        } else {
            dialogOptions.size = 'small';
        }

        const dlg = dialogHelper.createDialog(dialogOptions);

        dlg.classList.add('formDialog');

        dlg.innerHTML = globalize.translateHtml(template, 'core');

        if (layoutManager.tv) {
            scrollHelper.centerFocus.on(dlg, false);
        }

        initEditor(dlg, options);

        // Has to be assigned a z-index after the call to .open()
        dlg.addEventListener('close', function () {
            if (layoutManager.tv) {
                scrollHelper.centerFocus.off(dlg, false);
            }

            loading.hide();

            if (hasChanges) {
                resolve();
            } else {
                reject();
            }
        });

        dialogHelper.open(dlg);

        reload(dlg, item);

        dlg.querySelector('.btnCancel').addEventListener('click', function () {
            dialogHelper.close(dlg);
        });
    });
}

export function show (options) {
    return new Promise(function (resolve, reject) {
        hasChanges = false;
        showEditor(options, resolve, reject);
    });
}

export default {
    show
};

