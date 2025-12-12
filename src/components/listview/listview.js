
/**
 * Module for display list view.
 * @module components/listview/listview
 */

import DOMPurify from 'dompurify';
import escapeHtml from 'escape-html';
import markdownIt from 'markdown-it';

import { ItemAction } from '@/constants/itemAction';

import { getDefaultBackgroundClass } from '@/components/cardbuilder/cardBuilderUtils';
import itemHelper from '@/components/itemHelper';
import mediaInfo from '@/components/mediainfo/mediainfo';
import indicators from '@/components/indicators/indicators';
import layoutManager from '@/components/layoutManager';
import globalize from '@/lib/globalize';
import { ServerConnections } from '@/lib/jellyfin-apiclient';
import datetime from '@/scripts/datetime';
import cardBuilder from '@/components/cardbuilder/cardBuilder';

import './listview.scss';
import '@/elements/emby-ratingbutton/emby-ratingbutton';
import '@/elements/emby-playstatebutton/emby-playstatebutton';

function getIndex(item, options) {
    if (options.index === 'disc') {
        return item.ParentIndexNumber == null ? '' : globalize.translate('ValueDiscNumber', item.ParentIndexNumber);
    }

    const sortBy = (options.sortBy || '').toLowerCase();
    let code;
    let name;

    if (sortBy.indexOf('sortname') === 0) {
        if (item.Type === 'Episode') {
            return '';
        }

        // SortName
        name = (item.SortName || item.Name || '?')[0].toUpperCase();

        code = name.charCodeAt(0);
        if (code < 65 || code > 90) {
            return '#';
        }

        return name.toUpperCase();
    }
    if (sortBy.indexOf('officialrating') === 0) {
        return item.OfficialRating || globalize.translate('Unrated');
    }
    if (sortBy.indexOf('communityrating') === 0) {
        if (item.CommunityRating == null) {
            return globalize.translate('Unrated');
        }

        return Math.floor(item.CommunityRating);
    }
    if (sortBy.indexOf('criticrating') === 0) {
        if (item.CriticRating == null) {
            return globalize.translate('Unrated');
        }

        return Math.floor(item.CriticRating);
    }
    if (sortBy.indexOf('albumartist') === 0) {
        // SortName
        if (!item.AlbumArtist) {
            return '';
        }

        name = item.AlbumArtist[0].toUpperCase();

        code = name.charCodeAt(0);
        if (code < 65 || code > 90) {
            return '#';
        }

        return name.toUpperCase();
    }
    return '';
}

function getImageUrl(item, size) {
    const apiClient = ServerConnections.getApiClient(item.ServerId);
    let itemId;

    const options = {
        fillWidth: size,
        fillHeight: size,
        type: 'Primary'
    };

    if (item.ImageTags?.Primary) {
        options.tag = item.ImageTags.Primary;
        itemId = item.Id;
    } else if (item.AlbumId && item.AlbumPrimaryImageTag) {
        options.tag = item.AlbumPrimaryImageTag;
        itemId = item.AlbumId;
    } else if (item.SeriesId && item.SeriesPrimaryImageTag) {
        options.tag = item.SeriesPrimaryImageTag;
        itemId = item.SeriesId;
    } else if (item.ParentPrimaryImageTag) {
        options.tag = item.ParentPrimaryImageTag;
        itemId = item.ParentPrimaryImageItemId;
    }

    if (itemId) {
        return apiClient.getScaledImageUrl(itemId, options);
    }
    return null;
}

function getChannelImageUrl(item, size) {
    const apiClient = ServerConnections.getApiClient(item.ServerId);
    const options = {
        fillWidth: size,
        fillHeight: size,
        type: 'Primary'
    };

    if (item.ChannelId && item.ChannelPrimaryImageTag) {
        options.tag = item.ChannelPrimaryImageTag;
    }

    if (item.ChannelId) {
        return apiClient.getScaledImageUrl(item.ChannelId, options);
    }
}

function getTextLinesHtml(textlines, isLargeStyle) {
    let html = '';

    const largeTitleTagName = layoutManager.tv ? 'h2' : 'div';

    for (const [i, text] of textlines.entries()) {
        if (!text) {
            continue;
        }

        let elem;

        if (i === 0) {
            if (isLargeStyle) {
                elem = document.createElement(largeTitleTagName);
            } else {
                elem = document.createElement('div');
            }
        } else {
            elem = document.createElement('div');
            elem.classList.add('secondary');
        }

        elem.classList.add('listItemBodyText');

        elem.innerHTML = '<bdi>' + escapeHtml(text) + '</bdi>';

        html += elem.outerHTML;
    }

    return html;
}

function getRightButtonsHtml(options) {
    let html = '';

    for (let i = 0, length = options.rightButtons.length; i < length; i++) {
        const button = options.rightButtons[i];

        html += `<button is="paper-icon-button-light" class="listItemButton itemAction" data-action="${ItemAction.Custom}" data-customaction="${button.id}" title="${button.title}"><span class="material-icons ${button.icon}" aria-hidden="true"></span></button>`;
    }

    return html;
}

export function getListViewHtml(options) {
    const items = options.items;

    let groupTitle = '';
    const action = options.action || ItemAction.Link;

    const isLargeStyle = options.imageSize === 'large';
    const enableOverview = options.enableOverview;

    const clickEntireItem = layoutManager.tv;
    const outerTagName = clickEntireItem ? 'button' : 'div';
    const enableSideMediaInfo = options.enableSideMediaInfo != null ? options.enableSideMediaInfo : true;

    let outerHtml = '';

    const enableContentWrapper = options.enableOverview && !layoutManager.tv;

    for (let i = 0, length = items.length; i < length; i++) {
        const item = items[i];

        let html = '';

        if (options.showIndex) {
            const itemGroupTitle = getIndex(item, options);

            if (itemGroupTitle !== groupTitle) {
                if (html) {
                    html += '</div>';
                }

                if (i === 0) {
                    html += '<h2 class="listGroupHeader listGroupHeader-first">';
                } else {
                    html += '<h2 class="listGroupHeader">';
                }
                html += escapeHtml(itemGroupTitle);
                html += '</h2>';

                html += '<div>';

                groupTitle = itemGroupTitle;
            }
        }

        let cssClass = 'listItem';

        if (options.border || (options.highlight !== false && !layoutManager.tv)) {
            cssClass += ' listItem-border';
        }

        if (clickEntireItem) {
            cssClass += ' itemAction listItem-button';
        }

        if (layoutManager.tv) {
            cssClass += ' listItem-focusscale';
        }

        let downloadWidth = 80;

        if (isLargeStyle) {
            cssClass += ' listItem-largeImage';
            downloadWidth = 500;
        }

        const playlistItemId = item.PlaylistItemId ? (` data-playlistitemid="${item.PlaylistItemId}"`) : '';

        const positionTicksData = item.UserData?.PlaybackPositionTicks ? (` data-positionticks="${item.UserData.PlaybackPositionTicks}"`) : '';
        const collectionIdData = options.collectionId ? (` data-collectionid="${options.collectionId}"`) : '';
        const playlistIdData = options.playlistId ? (` data-playlistid="${options.playlistId}"`) : '';
        const mediaTypeData = item.MediaType ? (` data-mediatype="${item.MediaType}"`) : '';
        const collectionTypeData = item.CollectionType ? (` data-collectiontype="${item.CollectionType}"`) : '';
        const channelIdData = item.ChannelId ? (` data-channelid="${item.ChannelId}"`) : '';

        if (enableContentWrapper) {
            cssClass += ' listItem-withContentWrapper';
        }

        html += `<${outerTagName} class="${cssClass}"${playlistItemId} data-action="${action}" data-isfolder="${item.IsFolder}" data-id="${item.Id}" data-serverid="${item.ServerId}" data-type="${item.Type}"${mediaTypeData}${collectionTypeData}${channelIdData}${positionTicksData}${collectionIdData}${playlistIdData}>`;

        if (enableContentWrapper) {
            html += '<div class="listItem-content">';
        }

        if (!clickEntireItem && options.dragHandle) {
            html += '<span class="listViewDragHandle material-icons listItemIcon listItemIcon-transparent drag_handle" aria-hidden="true"></span>';
        }

        if (options.image !== false) {
            const imgUrl = options.imageSource === 'channel' ? getChannelImageUrl(item, downloadWidth) : getImageUrl(item, downloadWidth);
            let imageClass = isLargeStyle ? 'listItemImage listItemImage-large' : 'listItemImage';

            if (options.imageSource === 'channel') {
                imageClass += ' listItemImage-channel';
            }

            if (isLargeStyle && layoutManager.tv) {
                imageClass += ' listItemImage-large-tv';
            }

            const playOnImageClick = options.imagePlayButton && !layoutManager.tv;

            if (!clickEntireItem) {
                imageClass += ' itemAction';
            }

            const imageAction = playOnImageClick ? ItemAction.Link : action;

            if (imgUrl) {
                html += '<div data-action="' + imageAction + '" class="' + imageClass + ' lazy" data-src="' + imgUrl + '" item-icon>';
            } else {
                html += '<div class="' + imageClass + ' cardImageContainer ' + getDefaultBackgroundClass(item.Name) + '">' + cardBuilder.getDefaultText(item, options);
            }

            const mediaSourceCount = item.MediaSourceCount || 1;
            if (mediaSourceCount > 1 && options.disableIndicators !== true) {
                html += '<div class="mediaSourceIndicator">' + mediaSourceCount + '</div>';
            }

            let indicatorsHtml = '';
            indicatorsHtml += indicators.getPlayedIndicatorHtml(item);

            if (indicatorsHtml) {
                html += `<div class="indicators listItemIndicators">${indicatorsHtml}</div>`;
            }

            if (playOnImageClick) {
                html += `<button is="paper-icon-button-light" class="listItemImageButton itemAction" data-action="${ItemAction.Resume}"><span class="material-icons listItemImageButton-icon play_arrow" aria-hidden="true"></span></button>`;
            }

            const progressHtml = indicators.getProgressBarHtml(item, {
                containerClass: 'listItemProgressBar'
            });

            if (progressHtml) {
                html += progressHtml;
            }
            html += '</div>';
        }

        if (options.showIndexNumberLeft) {
            html += '<div class="listItem-indexnumberleft">';
            html += (item.IndexNumber || '&nbsp;');
            html += '</div>';
        }

        const textlines = [];

        if (options.showProgramDateTime) {
            textlines.push(datetime.toLocaleString(datetime.parseISO8601Date(item.StartDate), {

                weekday: 'long',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            }));
        }

        if (options.showProgramTime) {
            textlines.push(datetime.getDisplayTime(datetime.parseISO8601Date(item.StartDate)));
        }

        if (options.showChannel && item.ChannelName) {
            textlines.push(item.ChannelName);
        }

        let parentTitle = null;

        if (options.showParentTitle) {
            if (item.Type === 'Episode') {
                parentTitle = item.SeriesName;
            } else if (item.IsSeries || (item.EpisodeTitle && item.Name)) {
                parentTitle = item.Name;
            }
        }

        let displayName = itemHelper.getDisplayName(item, {
            includeParentInfo: options.includeParentInfoInTitle
        });

        if (options.showIndexNumber && item.IndexNumber != null) {
            displayName = `${item.IndexNumber}. ${displayName}`;
        }

        if (options.showParentTitle && options.parentTitleWithTitle) {
            if (displayName) {
                if (parentTitle) {
                    parentTitle += ' - ';
                }
                parentTitle = (parentTitle || '') + displayName;
            }

            textlines.push(parentTitle || '');
        } else if (options.showParentTitle) {
            textlines.push(parentTitle || '');
        }

        if (displayName && !options.parentTitleWithTitle) {
            textlines.push(displayName);
        }

        if (item.IsFolder) {
            if (options.artist !== false && item.AlbumArtist && item.Type === 'MusicAlbum') {
                textlines.push(item.AlbumArtist);
            }
        } else if (options.artist) {
            const artistItems = item.ArtistItems;
            if (artistItems && item.Type !== 'MusicAlbum') {
                textlines.push(artistItems.map(a => {
                    return a.Name;
                }).join(', '));
            }
        }

        if (item.Type === 'TvChannel' && item.CurrentProgram) {
            textlines.push(itemHelper.getDisplayName(item.CurrentProgram));
        }

        cssClass = 'listItemBody';
        if (!clickEntireItem) {
            cssClass += ' itemAction';
        }

        if (options.image === false) {
            cssClass += ' listItemBody-noleftpadding';
        }

        html += `<div class="${cssClass}">`;

        html += getTextLinesHtml(textlines, isLargeStyle);

        if (options.mediaInfo !== false && !enableSideMediaInfo) {
            const mediaInfoClass = 'secondary listItemMediaInfo listItemBodyText';

            html += `<div class="${mediaInfoClass}">`;
            html += mediaInfo.getPrimaryMediaInfoHtml(item, {
                episodeTitle: false,
                originalAirDate: false,
                subtitles: false

            });
            html += '</div>';
        }

        if (enableOverview && item.Overview) {
            // eslint-disable-next-line sonarjs/disabled-auto-escaping
            const overview = DOMPurify.sanitize(markdownIt({ html: true }).render(item.Overview || ''));
            html += '<div class="secondary listItem-overview listItemBodyText">';
            html += '<bdi>' + overview + '</bdi>';
            html += '</div>';
        }

        html += '</div>';

        if (options.mediaInfo !== false && enableSideMediaInfo) {
            html += '<div class="secondary listItemMediaInfo">';
            html += mediaInfo.getPrimaryMediaInfoHtml(item, {

                year: false,
                container: false,
                episodeTitle: false,
                criticRating: false,
                officialRating: false,
                endsAt: false

            });
            html += '</div>';
        }

        if (!options.recordButton && (item.Type === 'Timer' || item.Type === 'Program')) {
            html += indicators.getTimerIndicator(item).replace('indicatorIcon', 'indicatorIcon listItemAside');
        }

        html += '<div class="listViewUserDataButtons">';

        if (!clickEntireItem) {
            if (options.addToListButton) {
                html += `<button is="paper-icon-button-light" class="listItemButton itemAction" data-action="${ItemAction.AddToPlaylist}"><span class="material-icons playlist_add" aria-hidden="true"></span></button>`;
            }

            if (options.infoButton) {
                html += `<button is="paper-icon-button-light" class="listItemButton itemAction" data-action="${ItemAction.Link}"><span class="material-icons info_outline" aria-hidden="true"></span></button>`;
            }

            if (options.rightButtons) {
                html += getRightButtonsHtml(options);
            }

            if (options.enableUserDataButtons !== false) {
                const userData = item.UserData || {};
                const likes = userData.Likes == null ? '' : userData.Likes;

                if (itemHelper.canMarkPlayed(item) && options.enablePlayedButton !== false) {
                    html += '<button is="emby-playstatebutton" type="button" class="listItemButton paper-icon-button-light" data-id="' + item.Id + '" data-serverid="' + item.ServerId + '" data-itemtype="' + item.Type + '" data-played="' + (userData.Played) + '"><span class="material-icons check" aria-hidden="true"></span></button>';
                }

                if (itemHelper.canRate(item) && options.enableRatingButton !== false) {
                    html += '<button is="emby-ratingbutton" type="button" class="listItemButton paper-icon-button-light" data-id="' + item.Id + '" data-serverid="' + item.ServerId + '" data-itemtype="' + item.Type + '" data-likes="' + likes + '" data-isfavorite="' + (userData.IsFavorite) + '"><span class="material-icons favorite" aria-hidden="true"></span></button>';
                }
            }

            if (options.moreButton !== false) {
                html += `<button is="paper-icon-button-light" class="listItemButton itemAction" data-action="${ItemAction.Menu}"><span class="material-icons more_vert" aria-hidden="true"></span></button>`;
            }
        }
        html += '</div>';

        if (enableContentWrapper) {
            html += '</div>';

            if (enableOverview && item.Overview) {
                html += '<div class="listItem-bottomoverview secondary">';
                html += '<bdi>' + item.Overview + '</bdi>';
                html += '</div>';
            }
        }

        html += `</${outerTagName}>`;

        outerHtml += html;
    }

    return outerHtml;
}

export default {
    getListViewHtml: getListViewHtml
};
