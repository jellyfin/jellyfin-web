
/**
 * Module for building cards from item data.
 * @module components/cardBuilder/cardBuilder
 */

import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import escapeHtml from 'escape-html';

import browser from 'scripts/browser';
import datetime from 'scripts/datetime';
import dom from 'scripts/dom';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getBackdropShape, getPortraitShape, getSquareShape } from 'utils/card';
import { getItemTypeIcon, getLibraryIcon } from 'utils/image';

import focusManager from '../focusManager';
import imageLoader from '../images/imageLoader';
import indicators from '../indicators/indicators';
import itemHelper from '../itemHelper';
import layoutManager from '../layoutManager';
import { playbackManager } from '../playback/playbackmanager';
import { appRouter } from '../router/appRouter';
import itemShortcuts from '../shortcuts';

import 'elements/emby-button/paper-icon-button-light';

import './card.scss';
import '../guide/programs.scss';
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

const enableFocusTransform = !browser.slow && !browser.edge;

/**
 * Generate the HTML markup for cards for a set of items.
 * @param items - The items used to generate cards.
 * @param [options] - The options of the cards.
 * @returns {string} The HTML markup for the cards.
 */
export function getCardsHtml(items, options) {
    if (arguments.length === 1) {
        options = arguments[0];
        items = options.items;
    }

    return buildCardsHtmlInternal(items, options);
}

/**
 * Gets the width of a card's image according to the shape and amount of cards per row.
 * @param {string} shape - Shape of the card.
 * @param {number} screenWidth - Width of the screen.
 * @param {boolean} isOrientationLandscape - Flag for the orientation of the screen.
 * @returns {number} Width of the image for a card.
 */
function getImageWidth(shape, screenWidth, isOrientationLandscape) {
    const imagesPerRow = getPostersPerRow(shape, screenWidth, isOrientationLandscape, layoutManager.tv);
    return Math.round(screenWidth / imagesPerRow);
}

/**
 * Normalizes the options for a card.
 * @param {Object} items - A set of items.
 * @param {Object} options - Options for handling the items.
 */
export function setCardData(items, options) {
    options.shape = options.shape || 'auto';

    const primaryImageAspectRatio = imageLoader.getPrimaryImageAspectRatio(items);

    if (['auto', 'autohome', 'autooverflow', 'autoVertical'].includes(options.shape)) {
        const requestedShape = options.shape;
        options.shape = null;

        if (primaryImageAspectRatio) {
            if (primaryImageAspectRatio >= 3) {
                options.shape = 'banner';
                options.coverImage = true;
            } else if (primaryImageAspectRatio >= 1.33) {
                options.shape = getBackdropShape(requestedShape === 'autooverflow');
            } else if (primaryImageAspectRatio > 0.8) {
                options.shape = getSquareShape(requestedShape === 'autooverflow');
            } else {
                options.shape = getPortraitShape(requestedShape === 'autooverflow');
            }
        }

        if (!options.shape) {
            options.shape = options.defaultShape || getSquareShape(requestedShape === 'autooverflow');
        }
    }

    if (options.preferThumb === 'auto') {
        options.preferThumb = options.shape === 'backdrop' || options.shape === 'overflowBackdrop';
    }

    options.uiAspect = getDesiredAspect(options.shape);
    options.primaryImageAspectRatio = primaryImageAspectRatio;

    if (!options.width && options.widths) {
        options.width = options.widths[options.shape];
    }

    if (options.rows && typeof (options.rows) !== 'number') {
        options.rows = options.rows[options.shape];
    }

    if (!options.width) {
        let screenWidth = dom.getWindowSize().innerWidth;
        const screenHeight = dom.getWindowSize().innerHeight;

        if (isResizable(screenWidth)) {
            const roundScreenTo = 100;
            screenWidth = Math.floor(screenWidth / roundScreenTo) * roundScreenTo;
        }

        options.width = getImageWidth(options.shape, screenWidth, screenWidth > (screenHeight * 1.3));
    }
}

/**
 * Generates the internal HTML markup for cards.
 * @param {Object} items - Items for which to generate the markup.
 * @param {Object} options - Options for generating the markup.
 * @returns {string} The internal HTML markup of the cards.
 */
function buildCardsHtmlInternal(items, options) {
    let isVertical = false;

    if (options.shape === 'autoVertical') {
        isVertical = true;
    }

    setCardData(items, options);

    let html = '';
    let itemsInRow = 0;

    let currentIndexValue;
    let hasOpenRow;
    let hasOpenSection;

    const sectionTitleTagName = options.sectionTitleTagName || 'div';
    let apiClient;
    let lastServerId;

    for (const [i, item] of items.entries()) {
        const serverId = item.ServerId || options.serverId;

        if (serverId !== lastServerId) {
            lastServerId = serverId;
            apiClient = ServerConnections.getApiClient(lastServerId);
        }

        if (options.indexBy) {
            let newIndexValue = '';

            if (options.indexBy === 'PremiereDate') {
                if (item.PremiereDate) {
                    try {
                        newIndexValue = datetime.toLocaleDateString(datetime.parseISO8601Date(item.PremiereDate), { weekday: 'long', month: 'long', day: 'numeric' });
                    } catch (error) {
                        console.error('error parsing timestamp for premiere date', error);
                    }
                }
            } else if (options.indexBy === 'ProductionYear') {
                newIndexValue = item.ProductionYear;
            } else if (options.indexBy === 'CommunityRating') {
                const roundedRatingDecimal = item.CommunityRating % 1 >= 0.5 ? 0.5 : 0;
                newIndexValue = item.CommunityRating ? (Math.floor(item.CommunityRating) + roundedRatingDecimal) + '+' : null;
            }

            if (newIndexValue !== currentIndexValue) {
                if (hasOpenRow) {
                    html += '</div>';
                    hasOpenRow = false;
                    itemsInRow = 0;
                }

                if (hasOpenSection) {
                    html += '</div>';

                    if (isVertical) {
                        html += '</div>';
                    }
                    // eslint-disable-next-line sonarjs/no-dead-store
                    hasOpenSection = false;
                }

                if (isVertical) {
                    html += '<div class="verticalSection">';
                } else {
                    html += '<div class="horizontalSection">';
                }
                html += '<' + sectionTitleTagName + ' class="sectionTitle">' + newIndexValue + '</' + sectionTitleTagName + '>';
                if (isVertical) {
                    html += '<div class="itemsContainer vertical-wrap">';
                }
                currentIndexValue = newIndexValue;
                hasOpenSection = true;
            }
        }

        if (options.rows && itemsInRow === 0) {
            if (hasOpenRow) {
                html += '</div>';
                // eslint-disable-next-line sonarjs/no-dead-store
                hasOpenRow = false;
            }

            html += '<div class="cardColumn">';
            hasOpenRow = true;
        }

        html += buildCard(i, item, apiClient, options);

        itemsInRow++;

        if (options.rows && itemsInRow >= options.rows) {
            html += '</div>';
            hasOpenRow = false;
            itemsInRow = 0;
        }
    }

    if (hasOpenRow) {
        html += '</div>';
    }

    if (hasOpenSection) {
        html += '</div>';

        if (isVertical) {
            html += '</div>';
        }
    }

    return html;
}

/**
 * @typedef {Object} CardImageUrl
 * @property {string} imgUrl - Image URL.
 * @property {string} blurhash - Image blurhash.
 * @property {boolean} forceName - Force name.
 * @property {boolean} coverImage - Use cover style.
 */

/** Get the URL of the card's image.
 * @param {Object} item - Item for which to generate a card.
 * @param {Object} apiClient - API client object.
 * @param {Object} options - Options of the card.
 * @param {string} shape - Shape of the desired image.
 * @returns {CardImageUrl} Object representing the URL of the card's image.
 */
export function getCardImageUrl(item, apiClient, options, shape) {
    item = item.ProgramInfo || item;

    const width = options.width;
    let height = null;
    const primaryImageAspectRatio = item.PrimaryImageAspectRatio;
    let forceName = false;
    let imgUrl = null;
    let imgTag = null;
    let coverImage = false;
    const uiAspect = getDesiredAspect(shape);
    let imgType = null;
    let itemId = null;

    /* eslint-disable sonarjs/no-duplicated-branches */
    if (options.preferThumb && item.ImageTags?.Thumb) {
        imgType = 'Thumb';
        imgTag = item.ImageTags.Thumb;
    } else if ((options.preferBanner || shape === 'banner') && item.ImageTags?.Banner) {
        imgType = 'Banner';
        imgTag = item.ImageTags.Banner;
    } else if (options.preferDisc && item.ImageTags?.Disc) {
        imgType = 'Disc';
        imgTag = item.ImageTags.Disc;
    } else if (options.preferLogo && item.ImageTags?.Logo) {
        imgType = 'Logo';
        imgTag = item.ImageTags.Logo;
    } else if (options.preferLogo && item.ParentLogoImageTag && item.ParentLogoItemId) {
        imgType = 'Logo';
        imgTag = item.ParentLogoImageTag;
        itemId = item.ParentLogoItemId;
    } else if (options.preferThumb && item.SeriesThumbImageTag && options.inheritThumb !== false) {
        imgType = 'Thumb';
        imgTag = item.SeriesThumbImageTag;
        itemId = item.SeriesId;
    } else if (options.preferThumb && item.ParentThumbItemId && options.inheritThumb !== false && item.MediaType !== 'Photo') {
        imgType = 'Thumb';
        imgTag = item.ParentThumbImageTag;
        itemId = item.ParentThumbItemId;
    } else if (options.preferThumb && item.BackdropImageTags?.length) {
        imgType = 'Backdrop';
        imgTag = item.BackdropImageTags[0];
        forceName = true;
    } else if (options.preferThumb && item.ParentBackdropImageTags?.length && options.inheritThumb !== false && item.Type === 'Episode') {
        imgType = 'Backdrop';
        imgTag = item.ParentBackdropImageTags[0];
        itemId = item.ParentBackdropItemId;
    } else if (item.ImageTags?.Primary && (item.Type !== 'Episode' || item.ChildCount !== 0)) {
        imgType = 'Primary';
        imgTag = item.ImageTags.Primary;
        height = width && primaryImageAspectRatio ? Math.round(width / primaryImageAspectRatio) : null;

        if (options.preferThumb && options.showTitle !== false) {
            forceName = true;
        }

        if (primaryImageAspectRatio && uiAspect) {
            coverImage = (Math.abs(primaryImageAspectRatio - uiAspect) / uiAspect) <= 0.2;
        }
    } else if (item.SeriesPrimaryImageTag) {
        imgType = 'Primary';
        imgTag = item.SeriesPrimaryImageTag;
        itemId = item.SeriesId;
    } else if (item.PrimaryImageTag) {
        imgType = 'Primary';
        imgTag = item.PrimaryImageTag;
        itemId = item.PrimaryImageItemId;
        height = width && primaryImageAspectRatio ? Math.round(width / primaryImageAspectRatio) : null;

        if (options.preferThumb && options.showTitle !== false) {
            forceName = true;
        }

        if (primaryImageAspectRatio && uiAspect) {
            coverImage = (Math.abs(primaryImageAspectRatio - uiAspect) / uiAspect) <= 0.2;
        }
    } else if (item.ParentPrimaryImageTag) {
        imgType = 'Primary';
        imgTag = item.ParentPrimaryImageTag;
        itemId = item.ParentPrimaryImageItemId;
    } else if (item.AlbumId && item.AlbumPrimaryImageTag) {
        imgType = 'Primary';
        imgTag = item.AlbumPrimaryImageTag;
        itemId = item.AlbumId;
        height = width && primaryImageAspectRatio ? Math.round(width / primaryImageAspectRatio) : null;

        if (primaryImageAspectRatio && uiAspect) {
            coverImage = (Math.abs(primaryImageAspectRatio - uiAspect) / uiAspect) <= 0.2;
        }
    } else if (item.Type === 'Season' && item.ImageTags?.Thumb) {
        imgType = 'Thumb';
        imgTag = item.ImageTags.Thumb;
    } else if (item.BackdropImageTags?.length) {
        imgType = 'Backdrop';
        imgTag = item.BackdropImageTags[0];
    } else if (item.ImageTags?.Thumb) {
        imgType = 'Thumb';
        imgTag = item.ImageTags.Thumb;
    } else if (item.SeriesThumbImageTag && options.inheritThumb !== false) {
        imgType = 'Thumb';
        imgTag = item.SeriesThumbImageTag;
        itemId = item.SeriesId;
    } else if (item.ParentThumbItemId && options.inheritThumb !== false) {
        imgType = 'Thumb';
        imgTag = item.ParentThumbImageTag;
        itemId = item.ParentThumbItemId;
    } else if (item.ParentBackdropImageTags?.length && options.inheritThumb !== false) {
        imgType = 'Backdrop';
        imgTag = item.ParentBackdropImageTags[0];
        itemId = item.ParentBackdropItemId;
    }
    /* eslint-enable sonarjs/no-duplicated-branches */

    if (!itemId) {
        itemId = item.Id;
    }

    if (imgTag && imgType) {
        // TODO: This place is a mess. Could do with a good spring cleaning.
        if (!height && width && uiAspect) {
            height = width / uiAspect;
        }
        imgUrl = apiClient.getScaledImageUrl(itemId, {
            type: imgType,
            fillHeight: height,
            fillWidth: width,
            quality: 96,
            tag: imgTag
        });
    }

    const blurHashes = options.imageBlurhashes || item.ImageBlurHashes || {};

    return {
        imgUrl: imgUrl,
        blurhash: blurHashes[imgType]?.[imgTag],
        forceName: forceName,
        coverImage: coverImage
    };
}

/**
 * Generates the HTML markup for a card's text.
 * @param {Array} lines - Array containing the text lines.
 * @param {string} cssClass - Base CSS class to use for the lines.
 * @param {boolean} forceLines - Flag to force the rendering of all lines.
 * @param {boolean} isOuterFooter - Flag to mark the text lines as outer footer.
 * @param {string} cardLayout - DEPRECATED
 * @param {boolean} addRightMargin - Flag to add a right margin to the text.
 * @param {number} maxLines - Maximum number of lines to render.
 * @returns {string} HTML markup for the card's text.
 */
function getCardTextLines(lines, cssClass, forceLines, isOuterFooter, cardLayout, addRightMargin, maxLines) {
    let html = '';

    let valid = 0;

    for (const text of lines) {
        let currentCssClass = cssClass;

        if (valid > 0 && isOuterFooter) {
            currentCssClass += ' cardText-secondary';
        } else if (valid === 0 && isOuterFooter) {
            currentCssClass += ' cardText-first';
        }

        if (addRightMargin) {
            currentCssClass += ' cardText-rightmargin';
        }

        if (text) {
            html += "<div class='" + currentCssClass + "'>";
            html += '<bdi>' + text + '</bdi>';
            html += '</div>';
            valid++;

            if (maxLines && valid >= maxLines) {
                break;
            }
        }
    }

    if (forceLines) {
        const linesLength = maxLines || Math.min(lines.length, maxLines || lines.length);

        while (valid < linesLength) {
            html += "<div class='" + cssClass + "'>&nbsp;</div>";
            valid++;
        }
    }

    return html;
}

/**
 * Returns the air time text for the item based on the given times.
 * @param {object} item - Item used to generate the air time text.
 * @param {boolean} showAirDateTime - ISO8601 date for the start of the show.
 * @param {boolean} showAirEndTime - ISO8601 date for the end of the show.
 * @returns {string} The air time text for the item based on the given dates.
 */
function getAirTimeText(item, showAirDateTime, showAirEndTime) {
    let airTimeText = '';

    if (item.StartDate) {
        try {
            let date = datetime.parseISO8601Date(item.StartDate);

            if (showAirDateTime) {
                airTimeText += datetime.toLocaleDateString(date, { weekday: 'short', month: 'short', day: 'numeric' }) + ' ';
            }

            airTimeText += datetime.getDisplayTime(date);

            if (item.EndDate && showAirEndTime) {
                date = datetime.parseISO8601Date(item.EndDate);
                airTimeText += ' - ' + datetime.getDisplayTime(date);
            }
        } catch (e) {
            console.error('error parsing date: ' + item.StartDate, e);
        }
    }

    return airTimeText;
}

/**
 * Generates the HTML markup for the card's footer text.
 * @param {Object} item - Item used to generate the footer text.
 * @param {Object} apiClient - API client instance.
 * @param {Object} options - Options used to generate the footer text.
 * @param {string} footerClass - CSS classes of the footer element.
 * @param {string} progressHtml - HTML markup of the progress bar element.
 * @param {Object} flags - Various flags for the footer
 * @param {Object} urls - Various urls for the footer
 * @returns {string} HTML markup of the card's footer text element.
 */
function getCardFooterText(item, apiClient, options, footerClass, progressHtml, flags, urls) {
    item = item.ProgramInfo || item;
    let html = '';

    if (urls.logoUrl) {
        html += '<div class="lazy cardFooterLogo" data-src="' + urls.logoUrl + '"></div>';
    }

    const showTitle = options.showTitle === 'auto' ? true : (options.showTitle || item.Type === 'PhotoAlbum' || item.Type === 'Folder');
    const showOtherText = flags.isOuterFooter ? !flags.overlayText : flags.overlayText;

    if (flags.isOuterFooter && options.cardLayout && layoutManager.mobile && options.cardFooterAside !== 'none') {
        html += `<button is="paper-icon-button-light" class="itemAction btnCardOptions cardText-secondary" data-action="menu" title="${globalize.translate('ButtonMore')}"><span class="material-icons more_vert" aria-hidden="true"></span></button>`;
    }

    const cssClass = options.centerText ? 'cardText cardTextCentered' : 'cardText';
    const serverId = item.ServerId || options.serverId;

    let lines = [];
    const parentTitleUnderneath = item.Type === 'MusicAlbum' || item.Type === 'Audio' || item.Type === 'MusicVideo';
    let titleAdded;

    if (showOtherText && (options.showParentTitle || options.showParentTitleOrTitle) && !parentTitleUnderneath) {
        if (flags.isOuterFooter && item.Type === 'Episode' && item.SeriesName) {
            if (item.SeriesId) {
                lines.push(getTextActionButton({
                    Id: item.SeriesId,
                    ServerId: serverId,
                    Name: item.SeriesName,
                    Type: 'Series',
                    IsFolder: true
                }));
            } else {
                lines.push(escapeHtml(item.SeriesName));
            }
        } else if (isUsingLiveTvNaming(item.Type)) {
            lines.push(escapeHtml(item.Name));

            if (!item.EpisodeTitle && !item.IndexNumber) {
                titleAdded = true;
            }
        } else {
            const parentTitle = item.SeriesName || item.Series || item.Album || item.AlbumArtist || '';

            if (parentTitle || showTitle) {
                lines.push(escapeHtml(parentTitle));
            }
        }
    }

    let showMediaTitle = (showTitle && !titleAdded) || (options.showParentTitleOrTitle && !lines.length);
    if (!showMediaTitle && !titleAdded && (showTitle || flags.forceName)) {
        showMediaTitle = true;
    }

    if (showMediaTitle) {
        const name = options.showTitle === 'auto' && !item.IsFolder && item.MediaType === 'Photo' ? '' : itemHelper.getDisplayName(item, {
            includeParentInfo: options.includeParentInfoInTitle
        });

        lines.push(getTextActionButton({
            Id: item.Id,
            ServerId: serverId,
            Name: name,
            Type: item.Type,
            CollectionType: item.CollectionType,
            IsFolder: item.IsFolder
        }));
    }

    if (showOtherText) {
        if (options.showParentTitle && parentTitleUnderneath) {
            if (flags.isOuterFooter && item.AlbumArtists?.length) {
                item.AlbumArtists[0].Type = 'MusicArtist';
                item.AlbumArtists[0].IsFolder = true;
                lines.push(getTextActionButton(item.AlbumArtists[0], null, serverId));
            } else {
                lines.push(escapeHtml(isUsingLiveTvNaming(item.Type) ? item.Name : (item.SeriesName || item.Series || item.Album || item.AlbumArtist || '')));
            }
        }

        if (item.ExtraType && item.ExtraType !== 'Unknown') {
            lines.push(globalize.translate(item.ExtraType));
        }

        if (options.showItemCounts) {
            lines.push(getItemCountsHtml(options, item));
        }

        if (options.textLines) {
            const additionalLines = options.textLines(item);
            for (const additionalLine of additionalLines) {
                lines.push(additionalLine);
            }
        }

        if (options.showSongCount) {
            let songLine = '';

            if (item.SongCount) {
                songLine = item.SongCount === 1 ?
                    globalize.translate('ValueOneSong') :
                    globalize.translate('ValueSongCount', item.SongCount);
            }

            lines.push(songLine);
        }

        if (options.showPremiereDate) {
            if (item.PremiereDate) {
                try {
                    lines.push(datetime.toLocaleDateString(
                        datetime.parseISO8601Date(item.PremiereDate),
                        { weekday: 'long', month: 'long', day: 'numeric' }
                    ));
                } catch {
                    lines.push('');
                }
            } else {
                lines.push('');
            }
        }

        if (options.showYear || options.showSeriesYear) {
            const productionYear = item.ProductionYear && datetime.toLocaleString(item.ProductionYear, { useGrouping: false });
            if (item.Type === 'Series') {
                if (item.Status === 'Continuing') {
                    lines.push(globalize.translate('SeriesYearToPresent', productionYear || ''));
                } else if (item.EndDate && item.ProductionYear) {
                    const endYear = datetime.toLocaleString(datetime.parseISO8601Date(item.EndDate).getFullYear(), { useGrouping: false });
                    lines.push(productionYear + ((endYear === productionYear) ? '' : (' - ' + endYear)));
                } else {
                    lines.push(productionYear || '');
                }
            } else {
                lines.push(productionYear || '');
            }
        }

        if (options.showRuntime) {
            if (item.RunTimeTicks) {
                lines.push(datetime.getDisplayRunningTime(item.RunTimeTicks));
            } else {
                lines.push('');
            }
        }

        if (options.showAirTime) {
            lines.push(getAirTimeText(item, options.showAirDateTime, options.showAirEndTime) || '');
        }

        if (options.showChannelName) {
            if (item.ChannelId) {
                lines.push(getTextActionButton({

                    Id: item.ChannelId,
                    ServerId: serverId,
                    Name: item.ChannelName,
                    Type: 'TvChannel',
                    MediaType: item.MediaType,
                    IsFolder: false

                }, item.ChannelName));
            } else {
                lines.push(escapeHtml(item.ChannelName || '') || '&nbsp;');
            }
        }

        if (options.showCurrentProgram && item.Type === 'TvChannel') {
            if (item.CurrentProgram) {
                lines.push(escapeHtml(item.CurrentProgram.Name));
            } else {
                lines.push('');
            }
        }

        if (options.showCurrentProgramTime && item.Type === 'TvChannel') {
            if (item.CurrentProgram) {
                lines.push(getAirTimeText(item.CurrentProgram, false, true) || '');
            } else {
                lines.push('');
            }
        }

        if (options.showSeriesTimerTime) {
            if (item.RecordAnyTime) {
                lines.push(globalize.translate('Anytime'));
            } else {
                lines.push(datetime.getDisplayTime(item.StartDate));
            }
        }

        if (options.showSeriesTimerChannel) {
            if (item.RecordAnyChannel) {
                lines.push(globalize.translate('AllChannels'));
            } else {
                lines.push(escapeHtml(item.ChannelName || '') || globalize.translate('OneChannel'));
            }
        }

        if (options.showPersonRoleOrType && item.Type) {
            if (item.Role) {
                if ([ PersonKind.Actor, PersonKind.GuestStar ].includes(item.Type)) {
                    // List actor roles formatted like "as Character Name"
                    const roleText = globalize.translate('PersonRole', escapeHtml(item.Role));
                    lines.push(`<span title="${roleText}">${roleText}</span>`);
                } else if (item.Role.toLowerCase() === item.Type.toLowerCase()) {
                    // Role and Type are the same so use the localized Type
                    lines.push(escapeHtml(globalize.translate(item.Type)));
                } else if (item.Role.toLowerCase().includes(item.Type.toLowerCase())) {
                    // Avoid duplication if the Role includes the Type (i.e. Executive Producer)
                    lines.push(escapeHtml(item.Role));
                } else {
                    // Type and Role are unique so list both (i.e. Writer | Novel)
                    lines.push(escapeHtml(globalize.translate(item.Type)));
                    lines.push(escapeHtml(item.Role));
                }
            } else {
                // No Role so use the localized Type
                lines.push(escapeHtml(globalize.translate(item.Type)));
            }
        }
    }

    if ((showTitle || !urls.imgUrl) && flags.forceName && flags.overlayText && lines.length === 1) {
        lines = [];
    }

    if (flags.overlayText && showTitle) {
        lines = [escapeHtml(item.Name)];
    }

    const addRightTextMargin = flags.isOuterFooter && options.cardLayout && !options.centerText && options.cardFooterAside !== 'none' && layoutManager.mobile;

    html += getCardTextLines(lines, cssClass, !options.overlayText, flags.isOuterFooter, options.cardLayout, addRightTextMargin, options.lines);

    if (progressHtml) {
        html += progressHtml;
    }

    if (html && (!flags.isOuterFooter || urls.logoUrl || options.cardLayout)) {
        html = '<div class="' + footerClass + '">' + html;

        //cardFooter
        html += '</div>';
    }

    return html;
}

/**
 * Generates the HTML markup for the action button.
 * @param {Object} item - Item used to generate the action button.
 * @param {string} text - Text of the action button.
 * @param {string} serverId - ID of the server.
 * @returns {string} HTML markup of the action button.
 */
function getTextActionButton(item, text, serverId) {
    if (!text) {
        text = itemHelper.getDisplayName(item);
    }

    text = escapeHtml(text);

    if (layoutManager.tv) {
        return text;
    }

    const url = appRouter.getRouteUrl(item);
    let html = '<a href="' + url + '" ' + itemShortcuts.getShortcutAttributesHtml(item, serverId) + ' class="itemAction textActionButton" title="' + text + '" data-action="link">';
    html += text;
    html += '</a>';

    return html;
}

/**
 * Generates HTML markup for the item count indicator.
 * @param {Object} options - Options used to generate the item count.
 * @param {Object} item - Item used to generate the item count.
 * @returns {string} HTML markup for the item count indicator.
 */
function getItemCountsHtml(options, item) {
    const counts = [];
    let childText;

    if (item.Type === 'Playlist') {
        childText = '';

        if (item.RunTimeTicks) {
            let minutes = item.RunTimeTicks / 600000000;

            minutes = minutes || 1;

            childText += globalize.translate('ValueMinutes', Math.round(minutes));
        } else {
            childText += globalize.translate('ValueMinutes', 0);
        }

        counts.push(childText);
    } else if (item.Type === 'Genre' || item.Type === 'Studio') {
        if (item.MovieCount) {
            childText = item.MovieCount === 1 ?
                globalize.translate('ValueOneMovie') :
                globalize.translate('ValueMovieCount', item.MovieCount);

            counts.push(childText);
        }

        if (item.SeriesCount) {
            childText = item.SeriesCount === 1 ?
                globalize.translate('ValueOneSeries') :
                globalize.translate('ValueSeriesCount', item.SeriesCount);

            counts.push(childText);
        }
        if (item.EpisodeCount) {
            childText = item.EpisodeCount === 1 ?
                globalize.translate('ValueOneEpisode') :
                globalize.translate('ValueEpisodeCount', item.EpisodeCount);

            counts.push(childText);
        }
    } else if (item.Type === 'MusicGenre' || options.context === 'MusicArtist') {
        if (item.AlbumCount) {
            childText = item.AlbumCount === 1 ?
                globalize.translate('ValueOneAlbum') :
                globalize.translate('ValueAlbumCount', item.AlbumCount);

            counts.push(childText);
        }
        if (item.SongCount) {
            childText = item.SongCount === 1 ?
                globalize.translate('ValueOneSong') :
                globalize.translate('ValueSongCount', item.SongCount);

            counts.push(childText);
        }
        if (item.MusicVideoCount) {
            childText = item.MusicVideoCount === 1 ?
                globalize.translate('ValueOneMusicVideo') :
                globalize.translate('ValueMusicVideoCount', item.MusicVideoCount);

            counts.push(childText);
        }
    } else if (item.Type === 'Series') {
        childText = item.RecursiveItemCount === 1 ?
            globalize.translate('ValueOneEpisode') :
            globalize.translate('ValueEpisodeCount', item.RecursiveItemCount);

        counts.push(childText);
    }

    return counts.join(', ');
}

let refreshIndicatorLoaded;

/**
 * Imports the refresh indicator element.
 */
function importRefreshIndicator() {
    if (!refreshIndicatorLoaded) {
        refreshIndicatorLoaded = true;
        import('../../elements/emby-itemrefreshindicator/emby-itemrefreshindicator');
    }
}

/**
 * Builds the HTML markup for an individual card.
 * @param {number} index - Index of the card
 * @param {object} item - Item used to generate the card.
 * @param {object} apiClient - API client instance.
 * @param {object} options - Options used to generate the card.
 * @returns {string} HTML markup for the generated card.
 */
function buildCard(index, item, apiClient, options) {
    const action = resolveAction({
        defaultAction: options.action || 'link',
        isFolder: item.IsFolder,
        isPhoto: item.MediaType === 'Photo'
    });

    let shape = options.shape;

    if (shape === 'mixed') {
        shape = resolveMixedShapeByAspectRatio(item.PrimaryImageAspectRatio);
    }

    // TODO move card creation code to Card component

    const imgInfo = getCardImageUrl(item, apiClient, options, shape);
    const imgUrl = imgInfo.imgUrl;
    const blurhash = imgInfo.blurhash;
    const forceName = imgInfo.forceName;
    const overlayText = options.overlayText;

    const cardImageContainerClasses = resolveCardImageContainerCssClasses({
        itemType: item.Type,
        itemName: item.Name,
        hasCoverImage: options.coverImage || imgInfo.coverImage,
        imgUrl
    });

    let footerCssClass;
    let progressHtml = indicators.getProgressBarHtml(item);

    let innerCardFooter = '';

    let footerOverlayed = false;

    let logoUrl;
    const logoHeight = 40;

    if (options.showChannelLogo && item.ChannelPrimaryImageTag) {
        logoUrl = apiClient.getScaledImageUrl(item.ChannelId, {
            type: 'Primary',
            height: logoHeight,
            tag: item.ChannelPrimaryImageTag
        });
    } else if (options.showLogo && item.ParentLogoImageTag) {
        logoUrl = apiClient.getScaledImageUrl(item.ParentLogoItemId, {
            type: 'Logo',
            height: logoHeight,
            tag: item.ParentLogoImageTag
        });
    }

    if (overlayText) {
        logoUrl = null;

        footerCssClass = progressHtml ? 'innerCardFooter fullInnerCardFooter' : 'innerCardFooter';
        innerCardFooter += getCardFooterText(item, apiClient, options, footerCssClass, progressHtml, { forceName, overlayText, isOuterFooter: false }, { imgUrl, logoUrl });
        footerOverlayed = true;
    } else if (progressHtml) {
        innerCardFooter += '<div class="innerCardFooter fullInnerCardFooter innerCardFooterClear">';
        innerCardFooter += progressHtml;
        innerCardFooter += '</div>';

        progressHtml = '';
    }

    const mediaSourceCount = item.MediaSourceCount || 1;
    if (mediaSourceCount > 1 && options.disableIndicators !== true) {
        innerCardFooter += '<div class="mediaSourceIndicator">' + mediaSourceCount + '</div>';
    }

    let outerCardFooter = '';
    if (!overlayText && !footerOverlayed) {
        footerCssClass = options.cardLayout ? 'cardFooter' : 'cardFooter cardFooter-transparent';

        if (logoUrl) {
            footerCssClass += ' cardFooter-withlogo';
        }

        if (!options.cardLayout) {
            logoUrl = null;
        }

        outerCardFooter = getCardFooterText(item, apiClient, options, footerCssClass, progressHtml, { forceName, overlayText, isOuterFooter: true }, { imgUrl, logoUrl });
    }

    const cardBoxClass = resolveCardBoxCssClasses({
        hasOuterCardFooter: outerCardFooter.length > 0,
        cardLayout: options.cardLayout
    });

    let overlayButtons = '';
    if (layoutManager.mobile) {
        let overlayPlayButton = options.overlayPlayButton;

        if (overlayPlayButton == null && !options.overlayMoreButton && !options.overlayInfoButton && !options.cardLayout) {
            overlayPlayButton = item.MediaType === 'Video';
        }

        const btnCssClass = 'cardOverlayButton cardOverlayButton-br itemAction';

        if (options.centerPlayButton) {
            overlayButtons += `<button is="paper-icon-button-light" class="${btnCssClass} cardOverlayButton-centered" data-action="play" title="${globalize.translate('Play')}"><span class="material-icons cardOverlayButtonIcon play_arrow" aria-hidden="true"></span></button>`;
        }

        if (overlayPlayButton && !item.IsPlaceHolder && (item.LocationType !== 'Virtual' || !item.MediaType || item.Type === 'Program') && item.Type !== 'Person') {
            overlayButtons += `<button is="paper-icon-button-light" class="${btnCssClass}" data-action="play" title="${globalize.translate('Play')}"><span class="material-icons cardOverlayButtonIcon play_arrow" aria-hidden="true"></span></button>`;
        }

        if (options.overlayMoreButton) {
            overlayButtons += `<button is="paper-icon-button-light" class="${btnCssClass}" data-action="menu" title="${globalize.translate('ButtonMore')}"><span class="material-icons cardOverlayButtonIcon more_vert" aria-hidden="true"></span></button>`;
        }
    }

    // cardBox can be it's own separate element if an outer footer is ever needed
    let cardImageContainerOpen;
    let cardImageContainerClose = '';
    let cardBoxClose = '';
    let cardScalableClose = '';

    const cardContentClass = 'cardContent';

    let blurhashAttrib = '';
    if (blurhash && blurhash.length > 0) {
        blurhashAttrib = 'data-blurhash="' + blurhash + '"';
    }

    if (layoutManager.tv) {
        // Don't use the IMG tag with safari because it puts a white border around it
        cardImageContainerOpen = imgUrl ? ('<div class="' + cardImageContainerClasses + ' ' + cardContentClass + ' lazy" data-src="' + imgUrl + '" ' + blurhashAttrib + '>') : ('<div class="' + cardImageContainerClasses + ' ' + cardContentClass + '">');

        cardImageContainerClose = '</div>';
    } else {
        const cardImageContainerAriaLabelAttribute = ` aria-label="${escapeHtml(item.Name)}"`;

        const url = appRouter.getRouteUrl(item);
        // Don't use the IMG tag with safari because it puts a white border around it
        cardImageContainerOpen = imgUrl ? ('<a href="' + url + '" data-action="' + action + '" class="' + cardImageContainerClasses + ' ' + cardContentClass + ' itemAction lazy" data-src="' + imgUrl + '" ' + blurhashAttrib + cardImageContainerAriaLabelAttribute + '>') : ('<a href="' + url + '" data-action="' + action + '" class="' + cardImageContainerClasses + ' ' + cardContentClass + ' itemAction"' + cardImageContainerAriaLabelAttribute + '>');

        cardImageContainerClose = '</a>';
    }

    const cardScalableClass = 'cardScalable';

    let cardPadderIcon = '';

    // TV Channel logos are transparent so skip the placeholder to avoid overlapping
    if (imgUrl && item.Type !== 'TvChannel') {
        cardPadderIcon = getDefaultText(item, {
            // Always use an icon
            defaultCardImageIcon: 'folder',
            ...options
        });
    }

    cardImageContainerOpen = `<div class="${cardBoxClass}"><div class="${cardScalableClass}"><div class="cardPadder cardPadder-${shape}">${cardPadderIcon}</div>${cardImageContainerOpen}`;
    cardBoxClose = '</div>';
    cardScalableClose = '</div>';

    if (options.disableIndicators !== true) {
        let indicatorsHtml = '';

        if (options.missingIndicator !== false) {
            indicatorsHtml += indicators.getMissingIndicator(item);
        }

        indicatorsHtml += indicators.getSyncIndicator(item);
        indicatorsHtml += indicators.getTimerIndicator(item);

        indicatorsHtml += indicators.getTypeIndicator(item);

        if (options.showGroupCount) {
            indicatorsHtml += indicators.getChildCountIndicatorHtml(item, {
                minCount: 1
            });
        } else {
            indicatorsHtml += indicators.getPlayedIndicatorHtml(item);
        }

        if (item.Type === BaseItemKind.CollectionFolder || item.CollectionType) {
            const refreshClass = item.RefreshProgress ? '' : ' class="hide"';
            indicatorsHtml += '<div is="emby-itemrefreshindicator"' + refreshClass + ' data-progress="' + (item.RefreshProgress || 0) + '" data-status="' + item.RefreshStatus + '"></div>';
            importRefreshIndicator();
        }

        if (indicatorsHtml) {
            cardImageContainerOpen += '<div class="cardIndicators">' + indicatorsHtml + '</div>';
        }
    }

    if (!imgUrl) {
        cardImageContainerOpen += getDefaultText(item, options);
    }

    const tagName = layoutManager.tv && !overlayButtons ? 'button' : 'div';

    const nameWithPrefix = (item.SortName || item.Name || '');
    let prefix = nameWithPrefix.substring(0, Math.min(3, nameWithPrefix.length));

    if (prefix) {
        prefix = prefix.toUpperCase();
    }

    let timerAttributes = '';
    if (item.TimerId) {
        timerAttributes += ' data-timerid="' + item.TimerId + '"';
    }
    if (item.SeriesTimerId) {
        timerAttributes += ' data-seriestimerid="' + item.SeriesTimerId + '"';
    }

    let actionAttribute;
    let ariaLabelAttribute = '';

    if (tagName === 'button') {
        actionAttribute = ' data-action="' + action + '"';
        ariaLabelAttribute = ` aria-label="${escapeHtml(item.Name)}"`;
    } else {
        actionAttribute = '';
    }

    const className = resolveCardCssClasses({
        shape: shape,
        cardCssClass: options.cardCssClass,
        cardClass: options.cardClass,
        isTV: layoutManager.tv,
        enableFocusTransform: enableFocusTransform,
        isDesktop: layoutManager.desktop,
        showChildCountIndicator: options.showChildCountIndicator,
        childCount: item.ChildCount,
        tagName: tagName,
        itemType: item.Type
    });

    const positionTicksData = item.UserData?.PlaybackPositionTicks ? (' data-positionticks="' + item.UserData.PlaybackPositionTicks + '"') : '';
    const collectionIdData = options.collectionId ? (' data-collectionid="' + options.collectionId + '"') : '';
    const playlistIdData = options.playlistId ? (' data-playlistid="' + options.playlistId + '"') : '';
    const mediaTypeData = item.MediaType ? (' data-mediatype="' + item.MediaType + '"') : '';
    const collectionTypeData = item.CollectionType ? (' data-collectiontype="' + item.CollectionType + '"') : '';
    const channelIdData = item.ChannelId ? (' data-channelid="' + item.ChannelId + '"') : '';
    const pathData = item.Path ? (' data-path="' + escapeHtml(item.Path) + '"') : '';
    const contextData = options.context ? (' data-context="' + options.context + '"') : '';
    const parentIdData = options.parentId ? (' data-parentid="' + options.parentId + '"') : '';
    const startDate = item.StartDate ? (' data-startdate="' + item.StartDate.toString() + '"') : '';
    const endDate = item.EndDate ? (' data-enddate="' + item.EndDate.toString() + '"') : '';

    let additionalCardContent = '';

    if (layoutManager.desktop && !options.disableHoverMenu) {
        additionalCardContent += getHoverMenuHtml(item, action);
    }

    return '<' + tagName + ' data-index="' + index + '"' + timerAttributes + actionAttribute + ' data-isfolder="' + (item.IsFolder || false) + '" data-serverid="' + (item.ServerId || options.serverId) + '" data-id="' + (item.Id || item.ItemId) + '" data-type="' + item.Type + '"' + mediaTypeData + collectionTypeData + channelIdData + pathData + positionTicksData + collectionIdData + playlistIdData + contextData + parentIdData + startDate + endDate + ' data-prefix="' + escapeHtml(prefix) + '" class="' + className + '"' + ariaLabelAttribute + '>' + cardImageContainerOpen + innerCardFooter + cardImageContainerClose + overlayButtons + additionalCardContent + cardScalableClose + outerCardFooter + cardBoxClose + '</' + tagName + '>';
}

/**
 * Generates HTML markup for the card overlay.
 * @param {object} item - Item used to generate the card overlay.
 * @param {string} action - Action assigned to the overlay.
 * @returns {string} HTML markup of the card overlay.
 */
function getHoverMenuHtml(item, action) {
    let html = '';

    html += '<div class="cardOverlayContainer itemAction" data-action="' + action + '">';
    const url = appRouter.getRouteUrl(item, {
        serverId: item.ServerId || ServerConnections.currentApiClient().serverId()
    });
    html += '<a href="' + url + '" class="cardImageContainer"></a>';

    const btnCssClass = 'cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light';

    if (playbackManager.canPlay(item)) {
        html += '<button is="paper-icon-button-light" class="' + btnCssClass + ' cardOverlayFab-primary" data-action="resume"><span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover play_arrow" aria-hidden="true"></span></button>';
    }

    html += '<div class="cardOverlayButton-br flex">';

    const userData = item.UserData || {};

    if (itemHelper.canMarkPlayed(item)) {
        import('../../elements/emby-playstatebutton/emby-playstatebutton');
        html += '<button is="emby-playstatebutton" type="button" data-action="none" class="' + btnCssClass + '" data-id="' + item.Id + '" data-serverid="' + item.ServerId + '" data-itemtype="' + item.Type + '" data-played="' + (userData.Played) + '"><span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover check" aria-hidden="true"></span></button>';
    }

    if (itemHelper.canRate(item)) {
        const likes = userData.Likes == null ? '' : userData.Likes;

        import('../../elements/emby-ratingbutton/emby-ratingbutton');
        html += '<button is="emby-ratingbutton" type="button" data-action="none" class="' + btnCssClass + '" data-id="' + item.Id + '" data-serverid="' + item.ServerId + '" data-itemtype="' + item.Type + '" data-likes="' + likes + '" data-isfavorite="' + (userData.IsFavorite) + '"><span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover favorite" aria-hidden="true"></span></button>';
    }

    html += `<button is="paper-icon-button-light" class="${btnCssClass}" data-action="menu" title="${globalize.translate('ButtonMore')}"><span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover more_vert" aria-hidden="true"></span></button>`;
    html += '</div>';
    html += '</div>';

    return html;
}

/**
 * Generates the text or icon used for default card backgrounds.
 * @param {object} item - Item used to generate the card overlay.
 * @param {object} options - Options used to generate the card overlay.
 * @returns {string} HTML markup of the card overlay.
 */
export function getDefaultText(item, options) {
    let icon;

    if (item.Type === BaseItemKind.CollectionFolder || item.CollectionType) {
        icon = getLibraryIcon(item.CollectionType);
    }

    if (!icon) {
        icon = getItemTypeIcon(item.Type, options?.defaultCardImageIcon);
    }

    if (icon) {
        return `<span class="cardImageIcon material-icons ${icon}" aria-hidden="true"></span>`;
    }

    const defaultName = isUsingLiveTvNaming(item.Type) ? item.Name : itemHelper.getDisplayName(item);
    return '<div class="cardText cardDefaultText">' + escapeHtml(defaultName) + '</div>';
}

/**
 * Builds a set of cards and inserts them into the page.
 * @param {Array} items - Array of items used to build the cards.
 * @param {options} options - Options of the cards to build.
 */
export function buildCards(items, options) {
    // Abort if the container has been disposed
    if (!document.body.contains(options.itemsContainer)) {
        return;
    }

    if (options.parentContainer) {
        if (items.length) {
            options.parentContainer.classList.remove('hide');
        } else {
            options.parentContainer.classList.add('hide');
            return;
        }
    }

    const html = buildCardsHtmlInternal(items, options);

    if (html) {
        if (options.itemsContainer.cardBuilderHtml !== html) {
            options.itemsContainer.innerHTML = html;
            options.itemsContainer.cardBuilderHtml = html;
        }

        imageLoader.lazyChildren(options.itemsContainer);
    } else {
        options.itemsContainer.innerHTML = html;
        options.itemsContainer.cardBuilderHtml = null;
    }

    if (options.autoFocus) {
        focusManager.autoFocus(options.itemsContainer, true);
    }
}

/**
 * Ensures the indicators for a card exist and creates them if they don't exist.
 * @param {HTMLDivElement} card - DOM element of the card.
 * @param {HTMLDivElement} indicatorsElem - DOM element of the indicators.
 * @returns {HTMLDivElement} - DOM element of the indicators.
 */
function ensureIndicators(card, indicatorsElem) {
    if (indicatorsElem) {
        return indicatorsElem;
    }

    indicatorsElem = card.querySelector('.cardIndicators');

    if (!indicatorsElem) {
        const cardImageContainer = card.querySelector('.cardImageContainer');
        indicatorsElem = document.createElement('div');
        indicatorsElem.classList.add('cardIndicators');
        cardImageContainer.appendChild(indicatorsElem);
    }

    return indicatorsElem;
}

/**
 * Adds user data to the card such as progress indicators and played status.
 * @param {HTMLDivElement} card - DOM element of the card.
 * @param {Object} userData - User data to apply to the card.
 */
function updateUserData(card, userData) {
    const type = card.getAttribute('data-type');
    const enableCountIndicator = type === 'Series' || type === 'BoxSet' || type === 'Season';
    let indicatorsElem = null;
    let playedIndicator = null;
    let countIndicator = null;
    let itemProgressBar = null;

    if (userData.Played) {
        playedIndicator = card.querySelector('.playedIndicator');

        if (!playedIndicator) {
            playedIndicator = document.createElement('div');
            playedIndicator.classList.add('playedIndicator', 'indicator');
            indicatorsElem = ensureIndicators(card, indicatorsElem);
            indicatorsElem.appendChild(playedIndicator);
        }
        playedIndicator.innerHTML = '<span class="material-icons indicatorIcon check" aria-hidden="true"></span>';
    } else {
        playedIndicator = card.querySelector('.playedIndicator');
        if (playedIndicator) {
            playedIndicator.parentNode.removeChild(playedIndicator);
        }
    }
    if (userData.UnplayedItemCount) {
        countIndicator = card.querySelector('.countIndicator');

        if (!countIndicator) {
            countIndicator = document.createElement('div');
            countIndicator.classList.add('countIndicator', 'indicator');
            indicatorsElem = ensureIndicators(card, indicatorsElem);
            indicatorsElem.appendChild(countIndicator);
        }
        countIndicator.innerHTML = userData.UnplayedItemCount;
    } else if (enableCountIndicator) {
        countIndicator = card.querySelector('.countIndicator');
        if (countIndicator) {
            countIndicator.parentNode.removeChild(countIndicator);
        }
    }

    const progressHtml = indicators.getProgressBarHtml({
        Type: type,
        UserData: userData,
        MediaType: 'Video'
    });

    if (progressHtml) {
        itemProgressBar = card.querySelector('.itemProgressBar');

        if (!itemProgressBar) {
            itemProgressBar = document.createElement('div');
            itemProgressBar.classList.add('itemProgressBar');

            let innerCardFooter = card.querySelector('.innerCardFooter');
            if (!innerCardFooter) {
                innerCardFooter = document.createElement('div');
                innerCardFooter.classList.add('innerCardFooter');
                const cardImageContainer = card.querySelector('.cardImageContainer');
                cardImageContainer.appendChild(innerCardFooter);
            }
            innerCardFooter.appendChild(itemProgressBar);
        }

        itemProgressBar.innerHTML = progressHtml;
    } else {
        itemProgressBar = card.querySelector('.itemProgressBar');
        if (itemProgressBar) {
            itemProgressBar.parentNode.removeChild(itemProgressBar);
        }
    }
}

/**
 * Handles when user data has changed.
 * @param {Object} userData - User data to apply to the card.
 * @param {HTMLElement} scope - DOM element to use as a scope when selecting cards.
 */
export function onUserDataChanged(userData, scope) {
    const cards = (scope || document.body).querySelectorAll('.card-withuserdata[data-id="' + userData.ItemId + '"]');

    for (let i = 0, length = cards.length; i < length; i++) {
        updateUserData(cards[i], userData);
    }
}

/**
 * Handles when a timer has been created.
 * @param {string} programId - ID of the program.
 * @param {string} newTimerId - ID of the new timer.
 * @param {HTMLElement} itemsContainer - DOM element of the itemsContainer.
 */
export function onTimerCreated(programId, newTimerId, itemsContainer) {
    const cells = itemsContainer.querySelectorAll('.card[data-id="' + programId + '"]');

    for (let i = 0, length = cells.length; i < length; i++) {
        const cell = cells[i];
        const icon = cell.querySelector('.timerIndicator');
        if (!icon) {
            const indicatorsElem = ensureIndicators(cell);
            indicatorsElem.insertAdjacentHTML('beforeend', '<span class="material-icons timerIndicator indicatorIcon fiber_manual_record" aria-hidden="true"></span>');
        }
        cell.setAttribute('data-timerid', newTimerId);
    }
}

/**
 * Handles when a timer has been cancelled.
 * @param {string} timerId - ID of the cancelled timer.
 * @param {HTMLElement} itemsContainer - DOM element of the itemsContainer.
 */
export function onTimerCancelled(timerId, itemsContainer) {
    const cells = itemsContainer.querySelectorAll('.card[data-timerid="' + timerId + '"]');

    for (const cell of cells) {
        const icon = cell.querySelector('.timerIndicator');
        if (icon) {
            icon.parentNode.removeChild(icon);
        }
        cell.removeAttribute('data-timerid');
    }
}

/**
 * Handles when a series timer has been cancelled.
 * @param {string} cancelledTimerId - ID of the cancelled timer.
 * @param {HTMLElement} itemsContainer - DOM element of the itemsContainer.
 */
export function onSeriesTimerCancelled(cancelledTimerId, itemsContainer) {
    const cells = itemsContainer.querySelectorAll('.card[data-seriestimerid="' + cancelledTimerId + '"]');

    for (const cell of cells) {
        const icon = cell.querySelector('.timerIndicator');
        if (icon) {
            icon.parentNode.removeChild(icon);
        }
        cell.removeAttribute('data-seriestimerid');
    }
}

export default {
    getCardsHtml: getCardsHtml,
    getDefaultText: getDefaultText,
    buildCards: buildCards,
    onUserDataChanged: onUserDataChanged,
    onTimerCreated: onTimerCreated,
    onTimerCancelled: onTimerCancelled,
    onSeriesTimerCancelled: onSeriesTimerCancelled
};
