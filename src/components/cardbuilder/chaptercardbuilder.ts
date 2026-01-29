import { escapeHtml } from 'utils/html';
import { ServerConnections } from '../../lib/jellyfin-apiclient';
import browser from '../../scripts/browser';
import datetime from '../../scripts/datetime';
import imageLoader from '../images/imageLoader';
import layoutManager from '../layoutManager';

const enableFocusTransform = !browser.mobile && !browser.edge;

export interface ChapterOptions {
    backdropShape?: string;
    squareShape?: string;
    block?: boolean;
    rows?: number;
    width?: number;
    coverImage?: boolean;
    parentContainer?: HTMLElement;
    itemsContainer: HTMLElement;
}

function buildChapterCardsHtml(item: any, chapters: any[], options: ChapterOptions): string {
    let className = 'card itemAction chapterCard';
    if (layoutManager.tv) {
        className += ' show-focus';
        if (enableFocusTransform) className += ' show-animation';
    }

    const mediaStreams = (item.MediaSources || [])[0]?.MediaStreams || [];
    const videoStream = mediaStreams.find((s: any) => s.Type === 'Video') || {};
    let shape = options.backdropShape || 'backdrop';
    if (videoStream.Width && videoStream.Height && videoStream.Width / videoStream.Height <= 1.2) {
        shape = options.squareShape || 'square';
    }

    className += ` ${shape}Card`;
    if (options.block || options.rows) className += ' block';

    let html = '';
    let itemsInRow = 0;
    const apiClient = ServerConnections.getApiClient(item.ServerId);

    for (let i = 0; i < chapters.length; i++) {
        if (options.rows && itemsInRow === 0) html += '<div class="cardColumn">';
        html += buildChapterCard(item, apiClient, chapters[i], i, options, className, shape);
        itemsInRow++;
        if (options.rows && itemsInRow >= options.rows) {
            itemsInRow = 0;
            html += '</div>';
        }
    }
    return html;
}

function buildChapterCard(
    item: any,
    apiClient: any,
    chapter: any,
    index: number,
    options: ChapterOptions,
    className: string,
    shape: string
): string {
    const imgUrl = chapter.ImageTag
        ? apiClient.getScaledImageUrl(item.Id, {
              maxWidth: options.width || 400,
              tag: chapter.ImageTag,
              type: 'Chapter',
              index
          })
        : null;

    let cardImageContainerClass =
        'cardContent cardContent-shadow cardImageContainer chapterCardImageContainer';
    if (options.coverImage) cardImageContainerClass += ' coveredImage';
    const dataAttributes = ` data-action="play" data-isfolder="${item.IsFolder}" data-id="${item.Id}" data-serverid="${item.ServerId}" data-type="${item.Type}" data-mediatype="${item.MediaType}" data-positionticks="${chapter.StartPositionTicks}"`;
    let cardImageContainer = imgUrl
        ? `<div class="${cardImageContainerClass} lazy" data-src="${imgUrl}">`
        : `<div class="${cardImageContainerClass}">`;

    if (!imgUrl)
        cardImageContainer +=
            '<span class="material-icons cardImageIcon local_movies" aria-hidden="true"></span>';

    const nameHtml = `<div class="cardText">${escapeHtml(chapter.Name)}</div><div class="cardText">${datetime.getDisplayRunningTime(chapter.StartPositionTicks)}</div>`;
    return `<button type="button" class="${className}"${dataAttributes}><div class="cardBox"><div class="cardScalable"><div class="cardPadder-${shape}"></div>${cardImageContainer}</div><div class="innerCardFooter">${nameHtml}</div></div></div></button>`;
}

export function buildChapterCards(item: any, chapters: any[], options: ChapterOptions): void {
    if (options.parentContainer) {
        if (!document.body.contains(options.parentContainer)) return;
        if (chapters.length) options.parentContainer.classList.remove('hide');
        else {
            options.parentContainer.classList.add('hide');
            return;
        }
    }
    options.itemsContainer.innerHTML = buildChapterCardsHtml(item, chapters, options);
    imageLoader.lazyChildren(options.itemsContainer);
}

const chapterCardBuilder = { buildChapterCards };
export default chapterCardBuilder;
