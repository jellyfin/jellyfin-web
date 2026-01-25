/**
 * @deprecated This module is deprecated in favor of React components.
 *
 * Migration:
 *     - Image editor → React with canvas and state
 *     - Template-based → React rendering
 *     - Dialog helpers → ui-primitives/Dialog
 *
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import type { ImageInfo, ImageProviderInfo } from '@jellyfin/sdk/lib/generated-client';
import type { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import type { ApiClient } from 'jellyfin-apiclient';
import type { ConnectionManager } from 'jellyfin-apiclient';

import { AppFeature } from 'constants/appFeature';
import dialogHelper, { DialogOptions } from '../dialogHelper/dialogHelper';
import loading from '../loading/loading';
import dom from '../../utils/dom';
import layoutManager from '../layoutManager';
import focusManager from '../focusManager';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import scrollHelper from '../../scripts/scrollHelper';
import imageLoader from '../images/imageLoader';
import browser from '../../scripts/browser';
import { safeAppHost } from '../apphost';
import '../cardbuilder/card.scss';
import '../formdialog.scss';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import './imageeditor.scss';
import alert from '../alert';
import confirm from '../confirm/confirm';
import template from './imageeditor.template.html?raw';

interface CropCoordinates {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ImageEditorOptions {
    itemId: string;
    serverId: string;
    theme?: string;
}

interface ImageCardOptions {
    index: number;
    numImages: number;
    imageProviders: ImageProviderInfo[];
    imageSize: number;
    tagName: string;
    enableFooterButtons: boolean;
}

interface RemoteImageOptions {
    itemId: string;
}

interface ImageActionCommand {
    name: string;
    id: string;
}

interface WindowSize {
    innerWidth: number;
    innerHeight: number;
}

const enableFocusTransform = !(browser as { slow?: boolean }).slow && !browser.edge;

let currentItem: BaseItemDto | null = null;
let hasChanges = false;

function getBaseRemoteOptions(): RemoteImageOptions {
    return { itemId: currentItem?.Id ?? '' };
}

function reload(page: HTMLElement, item?: BaseItemDto, focusContext?: HTMLElement): void {
    loading.show();

    let apiClient: ApiClient;

    if (item) {
        apiClient = ServerConnections.getApiClient(item.ServerId ?? '');
        reloadItem(page, item, apiClient, focusContext);
    } else if (currentItem) {
        apiClient = ServerConnections.getApiClient(currentItem.ServerId ?? '');
        apiClient.getItem(apiClient.getCurrentUserId(), currentItem.Id ?? '').then(itemToReload => {
            reloadItem(page, itemToReload, apiClient, focusContext);
        });
    }
}

function addListeners(
    container: HTMLElement,
    className: string,
    eventName: string,
    fn: (this: HTMLElement, e: Event) => void
): void {
    container.addEventListener(eventName, e => {
        const elem = dom.parentWithClass(e.target as HTMLElement, className);
        if (elem) {
            fn.call(elem, e);
        }
    });
}

function reloadItem(page: HTMLElement, item: BaseItemDto, apiClient: ApiClient, focusContext?: HTMLElement): void {
    currentItem = item;

    apiClient.getRemoteImageProviders(getBaseRemoteOptions()).then(providers => {
        const btnBrowseAllImages = page.querySelectorAll('.btnBrowseAllImages');
        for (let i = 0, length = btnBrowseAllImages.length; i < length; i++) {
            if (providers.length) {
                btnBrowseAllImages[i].classList.remove('hide');
            } else {
                btnBrowseAllImages[i].classList.add('hide');
            }
        }

        apiClient.getItemImageInfos(item.Id ?? '').then(imageInfos => {
            renderStandardImages(page, apiClient, item, imageInfos, providers);
            renderBackdrops(page, apiClient, item, imageInfos, providers);
            loading.hide();

            if (layoutManager.tv) {
                focusManager.autoFocus((focusContext || page) as HTMLElement);
            }
        });
    });
}

function getImageUrl(
    item: BaseItemDto,
    apiClient: ApiClient,
    type: string,
    index: number,
    options?: Record<string, unknown>
): string {
    options = options || {};
    options.type = type;
    options.index = index;

    let tag: string | undefined;

    if (type === 'Backdrop') {
        const backdropTags = item.BackdropImageTags;
        if (backdropTags && backdropTags[index] !== undefined) {
            tag = backdropTags[index];
        }
    } else if (type === 'Primary') {
        tag =
            ((item as unknown as Record<string, unknown>).PrimaryImageTag as string | undefined) ||
            (item.ImageTags ? item.ImageTags[type] : undefined);
    } else {
        tag = item.ImageTags ? item.ImageTags[type] : undefined;
    }

    options.tag = tag;

    return apiClient.getScaledImageUrl(
        ((item.Id || (item as unknown as Record<string, unknown>).ItemId) as string) || '',
        options
    );
}

function getCardHtml(image: ImageInfo, apiClient: ApiClient, options: ImageCardOptions): string {
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

    const currentId = currentItem?.Id ?? '';
    const serverId = apiClient.serverId();
    const imageIndex = image.ImageIndex ?? 0;
    const imageType = image.ImageType ?? '';

    html +=
        ' data-id="' +
        currentId +
        '" data-serverid="' +
        serverId +
        '" data-index="' +
        options.index +
        '" data-numimages="' +
        options.numImages +
        '" data-imagetype="' +
        imageType +
        '" data-providers="' +
        options.imageProviders.length +
        '"';

    html += '>';

    html += '<div class="' + cardBoxCssClass + '">';
    html += '<div class="cardScalable visualCardBox-cardScalable" style="background-color:transparent;">';
    html += '<div class="cardPadder-backdrop"></div>';

    html += '<div class="cardContent">';

    const imageUrl = getImageUrl(currentItem!, apiClient, image.ImageType ?? '', image.ImageIndex ?? 0, {
        maxWidth: options.imageSize
    });

    html +=
        '<div class="cardImageContainer" style="background-image:url(\'' +
        imageUrl +
        '\');background-position:center center;background-size:contain;"></div>';

    html += '</div>';
    html += '</div>';

    html += '<div class="cardFooter visualCardBox-cardFooter">';

    const translatedType = globalize.translate('' + (image.ImageType ?? ''));
    html += '<h3 class="cardText cardTextCentered" style="margin:0;">' + translatedType + '</h3>';

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
                html +=
                    '<button type="button" is="paper-icon-button-light" class="btnMoveImage autoSize" data-imagetype="' +
                    imageType +
                    '" data-index="' +
                    imageIndex +
                    '" data-newindex="' +
                    (imageIndex - 1) +
                    '" title="' +
                    globalize.translate('MoveLeft') +
                    '"><span class="material-icons chevron_left"></span></button>';
            } else {
                html +=
                    '<button type="button" is="paper-icon-button-light" class="autoSize" disabled title="' +
                    globalize.translate('MoveLeft') +
                    '"><span class="material-icons chevron_left" aria-hidden="true"></span></button>';
            }

            if (options.index < options.numImages - 1) {
                html +=
                    '<button type="button" is="paper-icon-button-light" class="btnMoveImage autoSize" data-imagetype="' +
                    imageType +
                    '" data-index="' +
                    imageIndex +
                    '" data-newindex="' +
                    (imageIndex + 1) +
                    '" title="' +
                    globalize.translate('MoveRight') +
                    '"><span class="material-icons chevron_right" aria-hidden="true"></span></button>';
            } else {
                html +=
                    '<button type="button" is="paper-icon-button-light" class="autoSize" disabled title="' +
                    globalize.translate('MoveRight') +
                    '"><span class="material-icons chevron_right" aria-hidden="true"></span></button>';
            }
        } else if (options.imageProviders.length) {
            html +=
                '<button type="button" is="paper-icon-button-light" data-imagetype="' +
                imageType +
                '" class="btnSearchImages autoSize" title="' +
                globalize.translate('Search') +
                '"><span class="material-icons search" aria-hidden="true"></span></button>';
        }

        const indexValue = image.ImageIndex != null ? image.ImageIndex : 'null';
        html +=
            '<button type="button" is="paper-icon-button-light" data-imagetype="' +
            imageType +
            '" data-index="' +
            indexValue +
            '" class="btnDeleteImage autoSize" title="' +
            globalize.translate('Delete') +
            '"><span class="material-icons delete" aria-hidden="true"></span></button>';
        html += '</div>';
    }

    html += '</div>';
    html += '</div>';
    html += '</' + options.tagName + '>';

    return html;
}

function deleteImage(
    context: HTMLElement,
    itemId: string,
    type: string,
    index: number | null,
    apiClient: ApiClient,
    enableConfirmation: boolean
): void {
    const afterConfirm = function () {
        const typeValue: ImageType = type as ImageType;
        apiClient.deleteItemImage(itemId, typeValue, index ?? 0).then(() => {
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

function moveImage(
    context: HTMLElement,
    apiClient: ApiClient,
    itemId: string,
    type: string,
    index: number | null,
    newIndex: number | null,
    focusContext: HTMLElement | null
): void {
    const typeValue: ImageType = type as ImageType;
    apiClient.updateItemImageIndex(itemId, typeValue, index ?? 0, newIndex ?? 0).then(
        () => {
            hasChanges = true;
            reload(context, undefined, focusContext ?? undefined);
        },
        () => {
            alert(globalize.translate('ErrorDefault'));
        }
    );
}

function renderImages(
    page: HTMLElement,
    item: BaseItemDto,
    apiClient: ApiClient,
    images: ImageInfo[],
    imageProviders: ImageProviderInfo[],
    elem: HTMLElement
): void {
    let html = '';

    let imageSize = 1000;
    const windowSize: WindowSize = dom.getWindowSize() as WindowSize;
    if (windowSize.innerWidth >= 1280) {
        imageSize = Math.round(windowSize.innerWidth / 3);
    }

    const tagName = layoutManager.tv ? 'button' : 'div';
    const enableFooterButtons = !layoutManager.tv;

    for (let i = 0, length = images.length; i < length; i++) {
        const image = images[i];
        const options: ImageCardOptions = {
            index: i,
            numImages: length,
            imageProviders,
            imageSize,
            tagName,
            enableFooterButtons
        };
        html += getCardHtml(image, apiClient, options);
    }

    elem.innerHTML = html;
    imageLoader.lazyChildren(elem);
}

function renderStandardImages(
    page: HTMLElement,
    apiClient: ApiClient,
    item: BaseItemDto,
    imageInfos: ImageInfo[],
    imageProviders: ImageProviderInfo[]
): void {
    const images = imageInfos.filter(i => {
        return i.ImageType !== 'Backdrop' && i.ImageType !== 'Chapter';
    });

    const imagesContainer = page.querySelector('#images') as HTMLElement;
    if (imagesContainer) {
        renderImages(page, item, apiClient, images, imageProviders, imagesContainer);
    }
}

function renderBackdrops(
    page: HTMLElement,
    apiClient: ApiClient,
    item: BaseItemDto,
    imageInfos: ImageInfo[],
    imageProviders: ImageProviderInfo[]
): void {
    const images = imageInfos
        .filter(i => {
            return i.ImageType === 'Backdrop';
        })
        .sort((a, b) => {
            return (a.ImageIndex ?? 0) - (b.ImageIndex ?? 0);
        });

    const backdropsContainer = page.querySelector('#backdropsContainer') as HTMLElement;
    const backdropsElem = page.querySelector('#backdrops') as HTMLElement;

    if (images.length) {
        if (backdropsContainer) backdropsContainer.classList.remove('hide');
        if (backdropsElem) {
            renderImages(page, item, apiClient, images, imageProviders, backdropsElem);
        }
    } else {
        if (backdropsContainer) backdropsContainer.classList.add('hide');
    }
}

function showImageDownloader(page: HTMLElement, imageType: string): void {
    import('../imageDownloader/imageDownloader').then(ImageDownloader => {
        const item = currentItem;
        if (!item) return;

        ImageDownloader.show(
            item.Id ?? '',
            item.ServerId ?? '',
            item.Type ?? '',
            imageType,
            item.Type === 'Season' ? item.ParentId : null
        )
            .then(() => {
                hasChanges = true;
                reload(page);
            })
            .catch(() => {
                // image downloader closed
            });
    });
}

function showActionSheet(context: HTMLElement, imageCard: HTMLElement): void {
    const itemId = imageCard.getAttribute('data-id') ?? '';
    const serverId = imageCard.getAttribute('data-serverid') ?? '';
    const apiClient = ServerConnections.getApiClient(serverId);

    const type = imageCard.getAttribute('data-imagetype') ?? '';
    const index = parseInt(imageCard.getAttribute('data-index') ?? '0', 10);
    const providerCount = parseInt(imageCard.getAttribute('data-providers') ?? '0', 10);
    const numImages = parseInt(imageCard.getAttribute('data-numimages') ?? '0', 10);

    import('../actionSheet/actionSheet').then(({ default: actionSheet }) => {
        const commands: ImageActionCommand[] = [];

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

        actionSheet
            .show({
                items: commands,
                positionTo: imageCard
            })
            .then(id => {
                switch (id) {
                    case 'delete':
                        deleteImage(context, itemId, type, index, apiClient, false);
                        break;
                    case 'search':
                        showImageDownloader(context, type);
                        break;
                    case 'moveleft':
                        moveImage(
                            context,
                            apiClient,
                            itemId,
                            type,
                            index,
                            index - 1,
                            dom.parentWithClass(imageCard, 'itemsContainer')
                        );
                        break;
                    case 'moveright':
                        moveImage(
                            context,
                            apiClient,
                            itemId,
                            type,
                            index,
                            index + 1,
                            dom.parentWithClass(imageCard, 'itemsContainer')
                        );
                        break;
                    default:
                        break;
                }
            });
    });
}

function initEditor(context: HTMLElement, options: ImageEditorOptions): void {
    const uploadButtons = context.querySelectorAll('.btnOpenUploadMenu');
    const isFileInputSupported = safeAppHost.supports(AppFeature.FileInput);
    for (let i = 0, length = uploadButtons.length; i < length; i++) {
        if (isFileInputSupported) {
            uploadButtons[i].classList.remove('hide');
        } else {
            uploadButtons[i].classList.add('hide');
        }
    }

    addListeners(context, 'btnOpenUploadMenu', 'click', function () {
        const imageType = this.getAttribute('data-imagetype') ?? '';

        import('../imageUploader/imageUploader').then(({ default: imageUploader }) => {
            const item = currentItem;
            if (!item) return;

            imageUploader
                .show({
                    theme: options.theme,
                    imageType: imageType,
                    itemId: item.Id ?? '',
                    serverId: item.ServerId ?? ''
                })
                .then(hasChanged => {
                    if (hasChanged) {
                        hasChanges = true;
                        reload(context);
                    }
                });
        });
    });

    addListeners(context, 'btnSearchImages', 'click', function () {
        showImageDownloader(context, this.getAttribute('data-imagetype') ?? '');
    });

    addListeners(context, 'btnBrowseAllImages', 'click', function () {
        showImageDownloader(context, this.getAttribute('data-imagetype') || 'Primary');
    });

    addListeners(context, 'btnImageCard', 'click', function () {
        showActionSheet(context, this);
    });

    addListeners(context, 'btnDeleteImage', 'click', function () {
        const type = this.getAttribute('data-imagetype') ?? '';
        let indexAttr = this.getAttribute('data-index');
        const index = indexAttr === 'null' ? null : parseInt(indexAttr ?? '0', 10);
        const apiClient = ServerConnections.getApiClient(currentItem?.ServerId ?? '');
        deleteImage(context, currentItem?.Id ?? '', type, index, apiClient, true);
    });

    addListeners(context, 'btnMoveImage', 'click', function () {
        const type = this.getAttribute('data-imagetype') ?? '';
        const indexAttr = this.getAttribute('data-index');
        const newIndexAttr = this.getAttribute('data-newindex');
        const index = indexAttr ? parseInt(indexAttr, 10) : null;
        const newIndex = newIndexAttr ? parseInt(newIndexAttr, 10) : null;
        const apiClient = ServerConnections.getApiClient(currentItem?.ServerId ?? '');
        moveImage(
            context,
            apiClient,
            currentItem?.Id ?? '',
            type,
            index,
            newIndex,
            dom.parentWithClass(this, 'itemsContainer')
        );
    });
}

function showEditor(
    options: ImageEditorOptions,
    resolve: (value?: void) => void,
    reject: (reason?: unknown) => void
): void {
    const itemId = options.itemId;
    const serverId = options.serverId;

    loading.show();

    const apiClient = ServerConnections.getApiClient(serverId);
    apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(item => {
        const dialogOptions: DialogOptions = {
            removeOnClose: true,
            size: layoutManager.tv ? 'fullscreen' : 'small'
        };

        const dlg = dialogHelper.createDialog(dialogOptions);

        dlg.classList.add('formDialog');

        dlg.innerHTML = globalize.translateHtml(template, 'core');

        if (layoutManager.tv) {
            scrollHelper.centerFocus.on(dlg, false);
        }

        initEditor(dlg, options);

        dlg.addEventListener('close', () => {
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

        const cancelBtn = dlg.querySelector('.btnCancel') as HTMLButtonElement;
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                dialogHelper.close(dlg);
            });
        }
    });
}

export function show(options: ImageEditorOptions): Promise<void> {
    return new Promise((resolve, reject) => {
        hasChanges = false;
        showEditor(options, resolve, reject);
    });
}

export default {
    show
};
