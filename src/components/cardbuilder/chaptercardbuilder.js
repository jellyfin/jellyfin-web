/* eslint-disable indent */

/**
 * Module for building cards from item data.
 * @module components/cardBuilder/chaptercardbuilder
 */

import datetime from 'datetime';
import imageLoader from 'imageLoader';
import connectionManager from 'connectionManager';
import layoutManager from 'layoutManager';
import browser from 'browser';

    const enableFocusTransform = !browser.slow && !browser.edge;

     function buildChapterCardsHtml(item, chapters, options) {

        // TODO move card creation code to Card component

        let className = 'card itemAction chapterCard';

        if (layoutManager.tv) {
            className += ' show-focus';

            if (enableFocusTransform) {
                className += ' show-animation';
            }
        }

        const mediaStreams = ((item.MediaSources || [])[0] || {}).MediaStreams || [];
        const videoStream = mediaStreams.filter(({Type}) => {
            return Type === 'Video';
        })[0] || {};

        let shape = (options.backdropShape || 'backdrop');

        if (videoStream.Width && videoStream.Height) {

            if ((videoStream.Width / videoStream.Height) <= 1.2) {
                shape = (options.squareShape || 'square');
            }
        }

        className += ` ${shape}Card`;

        if (options.block || options.rows) {
            className += ' block';
        }

        let html = '';
        let itemsInRow = 0;

        const apiClient = connectionManager.getApiClient(item.ServerId);

        for (let i = 0, length = chapters.length; i < length; i++) {

            if (options.rows && itemsInRow === 0) {
                html += '<div class="cardColumn">';
            }

            const chapter = chapters[i];

            html += buildChapterCard(item, apiClient, chapter, i, options, className, shape);
            itemsInRow++;

            if (options.rows && itemsInRow >= options.rows) {
                itemsInRow = 0;
                html += '</div>';
            }
        }

        return html;
    }

    function getImgUrl({Id}, {ImageTag}, index, maxWidth, apiClient) {

        if (ImageTag) {

            return apiClient.getScaledImageUrl(Id, {

                maxWidth: maxWidth * 2,
                tag: ImageTag,
                type: 'Chapter',
                index
            });
        }

        return null;
    }

    function buildChapterCard(item, apiClient, chapter, index, {width, coverImage}, className, shape) {

        const imgUrl = getImgUrl(item, chapter, index, width || 400, apiClient);

        let cardImageContainerClass = 'cardContent cardContent-shadow cardImageContainer chapterCardImageContainer';
        if (coverImage) {
            cardImageContainerClass += ' coveredImage';
        }
        const dataAttributes = ` data-action="play" data-isfolder="${item.IsFolder}" data-id="${item.Id}" data-serverid="${item.ServerId}" data-type="${item.Type}" data-mediatype="${item.MediaType}" data-positionticks="${chapter.StartPositionTicks}"`;
        let cardImageContainer = imgUrl ? (`<div class="${cardImageContainerClass} lazy" data-src="${imgUrl}">`) : (`<div class="${cardImageContainerClass}">`);

        if (!imgUrl) {
            cardImageContainer += '<span class="material-icons cardImageIcon local_movies"></span>';
        }

        let nameHtml = '';
        nameHtml += `<div class="cardText">${chapter.Name}</div>`;
        nameHtml += `<div class="cardText">${datetime.getDisplayRunningTime(chapter.StartPositionTicks)}</div>`;

        const cardBoxCssClass = 'cardBox';
        const cardScalableClass = 'cardScalable';

        const html = `<button type="button" class="${className}"${dataAttributes}><div class="${cardBoxCssClass}"><div class="${cardScalableClass}"><div class="cardPadder-${shape}"></div>${cardImageContainer}</div><div class="innerCardFooter">${nameHtml}</div></div></div></button>`;

        return html;
    }

    export function buildChapterCards(item, chapters, options) {

        if (options.parentContainer) {
            // Abort if the container has been disposed
            if (!document.body.contains(options.parentContainer)) {
                return;
            }

            if (chapters.length) {
                options.parentContainer.classList.remove('hide');
            } else {
                options.parentContainer.classList.add('hide');
                return;
            }
        }

        const html = buildChapterCardsHtml(item, chapters, options);

        options.itemsContainer.innerHTML = html;

        imageLoader.lazyChildren(options.itemsContainer);
    }

/* eslint-enable indent */

export default {
    buildChapterCards: buildChapterCards
};

