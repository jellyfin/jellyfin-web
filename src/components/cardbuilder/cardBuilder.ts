import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import { escapeHtml } from 'utils/html';

import { ItemAction } from '../../constants/itemAction';
import globalize from '../../lib/globalize';
import { ServerConnections } from '../../lib/jellyfin-apiclient';
import browser from '../../scripts/browser';
import datetime from '../../scripts/datetime';
import { getBackdropShape, getPortraitShape, getSquareShape } from '../../utils/card';
import dom from '../../utils/dom';
import { getItemTypeIcon, getLibraryIcon } from '../../utils/image';

import focusManager from '../focusManager';
import imageLoader from '../images/imageLoader';
import indicators from '../indicators/indicators';
import itemHelper from '../itemHelper';
import layoutManager from '../layoutManager';
import { playbackManager } from '../playback/playbackmanager';
import { appRouter } from '../router/appRouter';
import itemShortcuts from '../shortcuts';

import './card.scss';
import {
    getDesiredAspect,
    getPostersPerRow,
    isResizable,
    isUsingLiveTvNaming,
    resolveAction,
    resolveCardBoxCssClasses,
    resolveCardCssClasses,
    resolveCardImageContainerCssClasses,
    resolveMixedShapeByAspectRatio
} from './cardBuilderUtils';

const enableFocusTransform = !browser.mobile && !browser.edge;

export interface CardOptions {
    shape?: string;
    defaultShape?: string;
    preferThumb?: boolean | 'auto';
    preferBanner?: boolean;
    preferDisc?: boolean;
    preferLogo?: boolean;
    inheritThumb?: boolean;
    showTitle?: boolean | 'auto';
    centerText?: boolean;
    cardLayout?: boolean;
    cardFooterAside?: string;
    serverId?: string;
    width?: number;
    widths?: Record<string, number>;
    rows?: number | any;
    indexBy?: string;
    sectionTitleTagName?: string;
    imageBlurhashes?: any;
    includeParentInfoInTitle?: boolean;
    showParentTitle?: boolean;
    showParentTitleOrTitle?: boolean;
    showItemCounts?: boolean;
    showSongCount?: boolean;
    showPremiereDate?: boolean;
    showYear?: boolean;
    showSeriesYear?: boolean;
    showRuntime?: boolean;
    showAirTime?: boolean;
    showAirDateTime?: boolean;
    showAirEndTime?: boolean;
    showChannelName?: boolean;
    showCurrentProgram?: boolean;
    showCurrentProgramTime?: boolean;
    showSeriesTimerTime?: boolean;
    showSeriesTimerChannel?: boolean;
    showPersonRoleOrType?: boolean;
    textLines?: (item: any) => string[];
    lines?: number;
    overlayText?: boolean;
    overlayPlayButton?: boolean;
    overlayMoreButton?: boolean;
    overlayInfoButton?: boolean;
    centerPlayButton?: boolean;
    disableIndicators?: boolean;
    missingIndicator?: boolean;
    showGroupCount?: boolean;
    showChildCountIndicator?: boolean;
    disableHoverMenu?: boolean;
    cardCssClass?: string;
    cardClass?: string;
    context?: string;
    parentId?: string;
    collectionId?: string;
    playlistId?: string;
    itemsContainer?: HTMLElement | any;
    parentContainer?: HTMLElement;
    autoFocus?: boolean;
    action?: string;
    defaultCardImageIcon?: string;
}

export function setCardData(items: any[], options: CardOptions): void {
    options.shape = options.shape || 'auto';
    const primaryImageAspectRatio = imageLoader.getPrimaryImageAspectRatio(items);

    if (['auto', 'autohome', 'autooverflow', 'autoVertical'].includes(options.shape)) {
        const requestedShape = options.shape;
        options.shape = '';

        if (primaryImageAspectRatio) {
            if (primaryImageAspectRatio >= 3) {
                options.shape = 'banner';
            } else if (primaryImageAspectRatio >= 1.33) {
                options.shape = getBackdropShape(requestedShape === 'autooverflow');
            } else if (primaryImageAspectRatio > 0.8) {
                options.shape = getSquareShape(requestedShape === 'autooverflow');
            } else {
                options.shape = getPortraitShape(requestedShape === 'autooverflow');
            }
        }

        if (!options.shape) {
            options.shape =
                options.defaultShape || getSquareShape(requestedShape === 'autooverflow');
        }
    }

    if (options.preferThumb === 'auto') {
        options.preferThumb = options.shape === 'backdrop' || options.shape === 'overflowBackdrop';
    }

    if (!options.width && options.widths) {
        options.width = options.widths[options.shape];
    }

    if (!options.width) {
        let screenWidth = dom.getWindowSize().innerWidth;
        const screenHeight = dom.getWindowSize().innerHeight;

        if (isResizable(screenWidth)) {
            screenWidth = Math.floor(screenWidth / 100) * 100;
        }

        const imagesPerRow = getPostersPerRow(
            options.shape,
            screenWidth,
            screenWidth > screenHeight * 1.3,
            layoutManager.tv
        );
        options.width = Math.round(screenWidth / imagesPerRow);
    }
}

export function buildCard(index: number, item: any, apiClient: any, options: CardOptions): string {
    const action = resolveAction({
        defaultAction: (options.action as ItemAction) || ItemAction.Link,
        isFolder: item.IsFolder,
        isPhoto: item.MediaType === 'Photo'
    });

    let shape = options.shape || '';
    if (shape === 'mixed') {
        shape = resolveMixedShapeByAspectRatio(item.PrimaryImageAspectRatio);
    }

    const imgInfo = getCardImageUrl(item, apiClient, options, shape);
    const imgUrl = imgInfo.imgUrl;

    // Minimal card shell for now, expanding as needed
    const className = resolveCardCssClasses({
        shape: shape,
        cardCssClass: options.cardCssClass,
        cardClass: options.cardClass,
        isTV: layoutManager.tv,
        enableFocusTransform: enableFocusTransform,
        isDesktop: layoutManager.desktop,
        tagName: 'div',
        itemType: item.Type,
        childCount: item.ChildCount || 0,
        showChildCountIndicator: Boolean(item.ChildCount)
    });

    return `<div class="${className}" data-id="${item.Id}">${escapeHtml(item.Name)}</div>`;
}

export function getCardImageUrl(item: any, apiClient: any, options: CardOptions, shape: string) {
    const pInfo = item.ProgramInfo || item;
    const width = options.width;
    let height: number | null = null;
    const primaryImageAspectRatio = pInfo.PrimaryImageAspectRatio;
    const uiAspect = getDesiredAspect(shape);
    let imgType: string | null = null;
    let imgTag: string | null = null;
    let itemId: string | null = null;

    if (options.preferThumb && pInfo.ImageTags?.Thumb) {
        imgType = 'Thumb';
        imgTag = pInfo.ImageTags.Thumb;
    } else if (pInfo.ImageTags?.Primary) {
        imgType = 'Primary';
        imgTag = pInfo.ImageTags.Primary;
    }

    if (!itemId) itemId = pInfo.Id;

    let imgUrl: string | null = null;
    if (imgTag && imgType) {
        if (!height && width && uiAspect) height = width / uiAspect;
        imgUrl = apiClient.getScaledImageUrl(itemId, {
            type: imgType,
            fillHeight: height,
            fillWidth: width,
            quality: 96,
            tag: imgTag
        });
    }

    return {
        imgUrl: imgUrl,
        blurhash: (options.imageBlurhashes || pInfo.ImageBlurHashes || {})[imgType || '']?.[
            imgTag || ''
        ],
        forceName: false,
        coverImage: false
    };
}

export function getCardsHtml(items: any[], options: CardOptions = {}): string {
    setCardData(items, options);
    let html = '';
    let apiClient: any;
    let lastServerId: string | undefined;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const serverId = item.ServerId || options.serverId;
        if (serverId !== lastServerId) {
            lastServerId = serverId;
            apiClient = ServerConnections.getApiClient(lastServerId!);
        }
        html += buildCard(i, item, apiClient, options);
    }
    return html;
}

export function getDefaultText(item: any, options: CardOptions): string {
    const icon =
        item.Type === BaseItemKind.CollectionFolder || item.CollectionType
            ? getLibraryIcon(item.CollectionType)
            : getItemTypeIcon(item.Type, options.defaultCardImageIcon);
    if (icon)
        return `<span class="cardImageIcon material-icons ${icon}" aria-hidden="true"></span>`;
    return `<div class="cardText cardDefaultText">${escapeHtml(item.Name)}</div>`;
}

const cardBuilder = {
    getCardsHtml,
    getDefaultText,
    setCardData
};

export default cardBuilder;
