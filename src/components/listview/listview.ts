import DOMPurify from 'dompurify';
import escapeHtml from 'escape-html';
import markdownIt from 'markdown-it';
import { ItemAction } from '../../constants/itemAction';
import { getDefaultBackgroundClass } from '../cardbuilder/cardBuilderUtils';
import itemHelper from '../itemHelper';
import mediainfo from '../mediainfo/mediainfo';
import indicators from '../indicators/indicators';
import layoutManager from '../layoutManager';
import globalize from '../../lib/globalize';
import { ServerConnections } from '../../lib/jellyfin-apiclient';
import datetime from '../../scripts/datetime';
import cardBuilder from '../cardbuilder/cardBuilder';

import './listview.scss';

export interface ListViewOptions {
    items: any[];
    action?: string;
    imageSize?: 'large' | 'small';
    enableOverview?: boolean;
    enableSideMediaInfo?: boolean;
    showIndex?: boolean;
    sortBy?: string;
    index?: string;
    border?: boolean;
    highlight?: boolean;
    dragHandle?: boolean;
    image?: boolean;
    imageSource?: 'channel' | 'primary';
    imagePlayButton?: boolean;
    disableIndicators?: boolean;
    showIndexNumberLeft?: boolean;
    showProgramDateTime?: boolean;
    showProgramTime?: boolean;
    showChannel?: boolean;
    showParentTitle?: boolean;
    includeParentInfoInTitle?: boolean;
    showIndexNumber?: boolean;
    parentTitleWithTitle?: boolean;
    artist?: boolean;
    mediaInfo?: boolean;
    recordButton?: boolean;
    addToListButton?: boolean;
    infoButton?: boolean;
    rightButtons?: any[];
    enableUserDataButtons?: boolean;
    enablePlayedButton?: boolean;
    enableRatingButton?: boolean;
    moreButton?: boolean;
    playlistId?: string;
    collectionId?: string;
}

function getIndex(item: any, options: ListViewOptions): string {
    if (options.index === 'disc') return item.ParentIndexNumber == null ? '' : globalize.translate('ValueDiscNumber', item.ParentIndexNumber);
    const sortBy = (options.sortBy || '').toLowerCase();
    let name: string = '';
    if (sortBy.startsWith('sortname')) {
        if (item.Type === 'Episode') return '';
        name = (item.SortName || item.Name || '?')[0].toUpperCase();
        const code = name.charCodeAt(0);
        return (code < 65 || code > 90) ? '#' : name;
    }
    if (sortBy.startsWith('officialrating')) return item.OfficialRating || globalize.translate('Unrated');
    return '';
}

function getImageUrl(item: any, size: number): string | null {
    const apiClient = ServerConnections.getApiClient(item.ServerId);
    let itemId = item.Id;
    let tag = item.ImageTags?.Primary;
    if (!tag && item.AlbumId) { tag = item.AlbumPrimaryImageTag; itemId = item.AlbumId; }
    return tag ? apiClient.getScaledImageUrl(itemId, { fillWidth: size, fillHeight: size, type: 'Primary', tag }) : null;
}

export function getListViewHtml(options: ListViewOptions): string {
    const items = options.items;
    let groupTitle = '';
    const action = options.action || ItemAction.Link;
    const isLarge = options.imageSize === 'large';
    const outerTagName = layoutManager.tv ? 'button' : 'div';
    let outerHtml = '';

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let html = '';

        if (options.showIndex) {
            const itemGroupTitle = getIndex(item, options);
            if (itemGroupTitle !== groupTitle) {
                html += `<h2 class="listGroupHeader ${i === 0 ? 'listGroupHeader-first' : ''}">${escapeHtml(itemGroupTitle)}</h2><div>`;
                groupTitle = itemGroupTitle;
            }
        }

        const cssClass = `listItem ${options.border ? 'listItem-border' : ''} ${layoutManager.tv ? 'itemAction listItem-button listItem-focusscale' : ''} ${isLarge ? 'listItem-largeImage' : ''}`;
        const dataAttrs = `data-action="${action}" data-isfolder="${item.IsFolder}" data-id="${item.Id}" data-serverid="${item.ServerId}" data-type="${item.Type}"`;

        html += `<${outerTagName} class="${cssClass}" ${dataAttrs}>`;
        
        if (options.image !== false) {
            const imgUrl = getImageUrl(item, isLarge ? 500 : 80);
            const imageClass = `listItemImage ${isLarge ? 'listItemImage-large' : ''}`;
            if (imgUrl) html += `<div class="${imageClass} lazy" data-src="${imgUrl}"></div>`;
            else html += `<div class="${imageClass} cardImageContainer ${getDefaultBackgroundClass(item.Name)}">${(cardBuilder as any).getDefaultText(item, options)}</div>`;
        }

        html += `<div class="listItemBody"><div class="listItemBodyText">${escapeHtml((itemHelper as any).getDisplayName(item))}</div></div>`;
        html += `</${outerTagName}>`;
        outerHtml += html;
    }

    return outerHtml;
}

const listView = { getListViewHtml };
export default listView;
