import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import { intervalToDuration } from 'date-fns';
import DOMPurify from 'dompurify';
import escapeHtml from 'escape-html';
import markdownIt from 'markdown-it';
import isEqual from 'lodash-es/isEqual';

import { appHost } from 'components/apphost';
import { clearBackdrop, setBackdrops } from 'components/backdrop/backdrop';
import cardBuilder from 'components/cardbuilder/cardBuilder';
import { buildCardImage } from 'components/cardbuilder/cardImage';
import confirm from 'components/confirm/confirm';
import imageLoader from 'components/images/imageLoader';
import itemContextMenu from 'components/itemContextMenu';
import itemHelper from 'components/itemHelper';
import mediaInfo from 'components/mediainfo/mediainfo';
import layoutManager from 'components/layoutManager';
import listView from 'components/listview/listview';
import loading from 'components/loading/loading';
import { playbackManager } from 'components/playback/playbackmanager';
import { appRouter } from 'components/router/appRouter';
import itemShortcuts from 'components/shortcuts';
import { AppFeature } from 'constants/appFeature';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import browser from 'scripts/browser';
import datetime from 'scripts/datetime';
import dom from 'scripts/dom';
import { download } from 'scripts/fileDownloader';
import libraryMenu from 'scripts/libraryMenu';
import * as userSettings from 'scripts/settings/userSettings';
import { getPortraitShape, getSquareShape } from 'utils/card';
import Dashboard from 'utils/dashboard';
import Events from 'utils/events';
import { getItemBackdropImageUrl } from 'utils/jellyfin-apiclient/backdropImage';

import 'elements/emby-itemscontainer/emby-itemscontainer';
import 'elements/emby-checkbox/emby-checkbox';
import 'elements/emby-button/emby-button';
import 'elements/emby-playstatebutton/emby-playstatebutton';
import 'elements/emby-ratingbutton/emby-ratingbutton';
import 'elements/emby-scroller/emby-scroller';
import 'elements/emby-select/emby-select';

import 'styles/scrollstyles.scss';

function autoFocus(container) {
    import('../../components/autoFocuser').then(({ default: autoFocuser }) => {
        autoFocuser.autoFocus(container);
    });
}

function getPromise(apiClient, params) {
    const id = params.id;

    if (id) {
        return apiClient.getItem(apiClient.getCurrentUserId(), id);
    }

    if (params.seriesTimerId) {
        return apiClient.getLiveTvSeriesTimer(params.seriesTimerId);
    }

    if (params.genre) {
        return apiClient.getGenre(params.genre, apiClient.getCurrentUserId());
    }

    if (params.musicgenre) {
        return apiClient.getMusicGenre(params.musicgenre, apiClient.getCurrentUserId());
    }

    if (params.musicartist) {
        return apiClient.getArtist(params.musicartist, apiClient.getCurrentUserId());
    }

    throw new Error('Invalid request');
}

function hideAll(page, className, show) {
    for (const elem of page.querySelectorAll('.' + className)) {
        if (show) {
            elem.classList.remove('hide');
        } else {
            elem.classList.add('hide');
        }
    }
}

function getContextMenuOptions(item, user, button) {
    return {
        item: item,
        open: false,
        play: false,
        playAllFromHere: false,
        queueAllFromHere: false,
        positionTo: button,
        cancelTimer: false,
        record: false,
        deleteItem: item.CanDelete === true,
        shuffle: false,
        instantMix: false,
        user: user,
        share: true
    };
}

function getProgramScheduleHtml(items, action = 'none') {
    return listView.getListViewHtml({
        items: items,
        enableUserDataButtons: false,
        image: true,
        imageSource: 'channel',
        showProgramDateTime: true,
        showChannel: false,
        mediaInfo: true,
        runtime: false,
        action,
        moreButton: false,
        recordButton: false
    });
}

function getSelectedMediaSource(page, mediaSources) {
    const mediaSourceId = page.querySelector('.selectSource').value;
    return mediaSources.filter(m => m.Id === mediaSourceId)[0];
}

function renderSeriesTimerSchedule(page, apiClient, seriesTimerId) {
    apiClient.getLiveTvTimers({
        UserId: apiClient.getCurrentUserId(),
        ImageTypeLimit: 1,
        SortBy: 'StartDate',
        EnableTotalRecordCount: false,
        EnableUserData: false,
        SeriesTimerId: seriesTimerId,
        Fields: 'ChannelInfo,ChannelImage'
    }).then(function (result) {
        if (result.Items.length && result.Items[0].SeriesTimerId != seriesTimerId) {
            result.Items = [];
        }

        const html = getProgramScheduleHtml(result.Items);
        const scheduleTab = page.querySelector('#seriesTimerSchedule');
        scheduleTab.innerHTML = html;
        imageLoader.lazyChildren(scheduleTab);
    });
}

function renderTimerEditor(page, item, apiClient, user) {
    if (item.Type !== 'Recording' || !user.Policy.EnableLiveTvManagement || !item.TimerId || item.Status !== 'InProgress') {
        hideAll(page, 'btnCancelTimer');
        return;
    }

    hideAll(page, 'btnCancelTimer', true);
}

function renderSeriesTimerEditor(page, item, apiClient, user) {
    if (item.Type !== 'SeriesTimer') {
        hideAll(page, 'btnCancelSeriesTimer');
        return;
    }

    if (user.Policy.EnableLiveTvManagement) {
        import('../../components/recordingcreator/seriesrecordingeditor').then(({ default: seriesRecordingEditor }) => {
            seriesRecordingEditor.embed(item, apiClient.serverId(), {
                context: page.querySelector('.seriesRecordingEditor')
            });
        });

        page.querySelector('#seriesTimerScheduleSection').classList.remove('hide');
        hideAll(page, 'btnCancelSeriesTimer', true);
        renderSeriesTimerSchedule(page, apiClient, item.Id);
        return;
    }

    page.querySelector('#seriesTimerScheduleSection').classList.add('hide');
    hideAll(page, 'btnCancelSeriesTimer');
}

function renderTrackSelections(page, instance, item, forceReload) {
    const select = page.querySelector('.selectSource');

    if (!item.MediaSources || !itemHelper.supportsMediaSourceSelection(item) || playbackManager.getSupportedCommands().indexOf('PlayMediaSource') === -1 || !playbackManager.canPlay(item)) {
        page.querySelector('.trackSelections').classList.add('hide');
        select.innerHTML = '';
        page.querySelector('.selectVideo').innerHTML = '';
        page.querySelector('.selectAudio').innerHTML = '';
        page.querySelector('.selectSubtitles').innerHTML = '';
        return;
    }

    const mediaSources = item.MediaSources;
    instance._currentPlaybackMediaSources = mediaSources;

    page.querySelector('.trackSelections').classList.remove('hide');
    select.setLabel(globalize.translate('LabelVersion'));

    const currentValue = select.value;

    const selectedId = mediaSources[0].Id;
    select.innerHTML = mediaSources.map(function (v) {
        const selected = v.Id === selectedId ? ' selected' : '';
        return '<option value="' + v.Id + '"' + selected + '>' + escapeHtml(v.Name) + '</option>';
    }).join('');

    if (mediaSources.length > 1) {
        page.querySelector('.selectSourceContainer').classList.remove('hide');
    } else {
        page.querySelector('.selectSourceContainer').classList.add('hide');
    }

    if (select.value !== currentValue || forceReload) {
        renderVideoSelections(page, mediaSources);
        renderAudioSelections(page, mediaSources);
        renderSubtitleSelections(page, mediaSources);
    }
}

function renderVideoSelections(page, mediaSources) {
    const mediaSource = getSelectedMediaSource(page, mediaSources);

    const tracks = mediaSource.MediaStreams.filter(function (m) {
        return m.Type === 'Video';
    });

    const select = page.querySelector('.selectVideo');
    select.setLabel(globalize.translate('Video'));
    const selectedId = tracks.length ? tracks[0].Index : -1;
    select.innerHTML = tracks.map(function (v) {
        const selected = v.Index === selectedId ? ' selected' : '';
        const titleParts = [];
        const resolutionText = mediaInfo.getResolutionText(v);

        if (resolutionText) {
            titleParts.push(resolutionText);
        }

        if (v.Codec) {
            titleParts.push(v.Codec.toUpperCase());
        }

        return '<option value="' + v.Index + '" ' + selected + '>' + (v.DisplayTitle || titleParts.join(' ')) + '</option>';
    }).join('');
    select.setAttribute('disabled', 'disabled');

    if (tracks.length) {
        page.querySelector('.selectVideoContainer').classList.remove('hide');
    } else {
        page.querySelector('.selectVideoContainer').classList.add('hide');
    }
}

function renderAudioSelections(page, mediaSources) {
    const mediaSource = getSelectedMediaSource(page, mediaSources);

    const tracks = mediaSource.MediaStreams.filter(function (m) {
        return m.Type === 'Audio';
    });
    tracks.sort(itemHelper.sortTracks);
    const select = page.querySelector('.selectAudio');
    select.setLabel(globalize.translate('Audio'));
    const selectedId = mediaSource.DefaultAudioStreamIndex;
    select.innerHTML = tracks.map(function (v) {
        const selected = v.Index === selectedId ? ' selected' : '';
        return '<option value="' + v.Index + '" ' + selected + '>' + v.DisplayTitle + '</option>';
    }).join('');

    if (tracks.length > 1) {
        select.removeAttribute('disabled');
    } else {
        select.setAttribute('disabled', 'disabled');
    }

    if (tracks.length) {
        page.querySelector('.selectAudioContainer').classList.remove('hide');
    } else {
        page.querySelector('.selectAudioContainer').classList.add('hide');
    }
}

function renderSubtitleSelections(page, mediaSources) {
    const mediaSource = getSelectedMediaSource(page, mediaSources);

    const tracks = mediaSource.MediaStreams.filter(function (m) {
        return m.Type === 'Subtitle';
    });
    tracks.sort(itemHelper.sortTracks);
    const select = page.querySelector('.selectSubtitles');
    select.setLabel(globalize.translate('Subtitles'));
    const selectedId = mediaSource.DefaultSubtitleStreamIndex == null ? -1 : mediaSource.DefaultSubtitleStreamIndex;

    let selected = selectedId === -1 ? ' selected' : '';
    select.innerHTML = '<option value="-1">' + globalize.translate('Off') + '</option>' + tracks.map(function (v) {
        selected = v.Index === selectedId ? ' selected' : '';
        return '<option value="' + v.Index + '" ' + selected + '>' + v.DisplayTitle + '</option>';
    }).join('');

    if (tracks.length > 0) {
        select.removeAttribute('disabled');
    } else {
        select.setAttribute('disabled', 'disabled');
    }

    if (tracks.length) {
        page.querySelector('.selectSubtitlesContainer').classList.remove('hide');
    } else {
        page.querySelector('.selectSubtitlesContainer').classList.add('hide');
    }
}

function reloadPlayButtons(page, item) {
    let canPlay = false;

    if (item.Type == 'Program') {
        const now = new Date();

        if (now >= datetime.parseISO8601Date(item.StartDate, true) && now < datetime.parseISO8601Date(item.EndDate, true)) {
            hideAll(page, 'btnPlay', true);
            canPlay = true;
        } else {
            hideAll(page, 'btnPlay');
        }

        hideAll(page, 'btnReplay');
        hideAll(page, 'btnInstantMix');
        hideAll(page, 'btnShuffle');
    } else if (playbackManager.canPlay(item)) {
        hideAll(page, 'btnPlay', true);
        const enableInstantMix = ['Audio', 'MusicAlbum', 'MusicGenre', 'MusicArtist'].indexOf(item.Type) !== -1;
        hideAll(page, 'btnInstantMix', enableInstantMix);
        const enableShuffle = item.IsFolder || ['MusicAlbum', 'MusicGenre', 'MusicArtist'].indexOf(item.Type) !== -1;
        hideAll(page, 'btnShuffle', enableShuffle);
        canPlay = true;

        const isResumable = item.UserData && item.UserData.PlaybackPositionTicks > 0;
        hideAll(page, 'btnReplay', isResumable);

        for (const btnPlay of page.querySelectorAll('.btnPlay')) {
            if (isResumable) {
                btnPlay.title = globalize.translate('ButtonResume');
            } else {
                btnPlay.title = globalize.translate('Play');
            }
        }
    } else {
        hideAll(page, 'btnPlay');
        hideAll(page, 'btnReplay');
        hideAll(page, 'btnInstantMix');
        hideAll(page, 'btnShuffle');
    }

    return canPlay;
}

function reloadUserDataButtons(page, item) {
    let i;
    let length;
    const btnPlaystates = page.querySelectorAll('.btnPlaystate');

    for (i = 0, length = btnPlaystates.length; i < length; i++) {
        const btnPlaystate = btnPlaystates[i];

        if (itemHelper.canMarkPlayed(item)) {
            btnPlaystate.classList.remove('hide');
            btnPlaystate.setItem(item);
        } else {
            btnPlaystate.classList.add('hide');
            btnPlaystate.setItem(null);
        }
    }

    const btnUserRatings = page.querySelectorAll('.btnUserRating');

    for (i = 0, length = btnUserRatings.length; i < length; i++) {
        const btnUserRating = btnUserRatings[i];

        if (itemHelper.canRate(item)) {
            btnUserRating.classList.remove('hide');
            btnUserRating.setItem(item);
        } else {
            btnUserRating.classList.add('hide');
            btnUserRating.setItem(null);
        }
    }
}

function getArtistLinksHtml(artists, serverId, context) {
    const html = [];
    const numberOfArtists = artists.length;

    for (let i = 0; i < Math.min(numberOfArtists, 10); i++) {
        const artist = artists[i];
        const href = appRouter.getRouteUrl(artist, {
            context,
            itemType: 'MusicArtist',
            serverId
        });
        html.push('<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + href + '">' + escapeHtml(artist.Name) + '</a>');
    }

    let fullHtml = html.join(' / ');

    if (numberOfArtists > 10) {
        fullHtml = globalize.translate('AndOtherArtists', fullHtml, numberOfArtists - 10);
    }

    return fullHtml;
}

/**
 * Renders the item's name block
 * @param {Object} item - Item used to render the name.
 * @param {HTMLDivElement} container - Container to render the information into.
 * @param {Object} context - Application context.
 */
function renderName(item, container, context) {
    const parentNameHtml = [];
    let parentNameLast = false;

    if (item.AlbumArtists) {
        parentNameHtml.push(getArtistLinksHtml(item.AlbumArtists, item.ServerId, context));
        parentNameLast = true;
    } else if (item.ArtistItems?.length && item.Type === 'MusicVideo') {
        parentNameHtml.push(getArtistLinksHtml(item.ArtistItems, item.ServerId, context));
        parentNameLast = true;
    } else if (item.SeriesName && item.Type === 'Episode') {
        parentNameHtml.push(`<a style="color:inherit;" class="button-link itemAction" is="emby-linkbutton" href="#" data-action="link" data-id="${item.SeriesId}" data-serverid="${item.ServerId}" data-type="Series" data-isfolder="true">${escapeHtml(item.SeriesName)}</a>`);
    } else if (item.IsSeries || item.EpisodeTitle) {
        parentNameHtml.push(escapeHtml(item.Name));
    }

    if (item.SeriesName && item.Type === 'Season') {
        parentNameHtml.push(`<a style="color:inherit;" class="button-link itemAction" is="emby-linkbutton" href="#" data-action="link" data-id="${item.SeriesId}" data-serverid="${item.ServerId}" data-type="Series" data-isfolder="true">${escapeHtml(item.SeriesName)}</a>`);
    } else if (item.ParentIndexNumber != null && item.Type === 'Episode') {
        parentNameHtml.push(`<a style="color:inherit;" class="button-link itemAction" is="emby-linkbutton" href="#" data-action="link" data-id="${item.SeasonId}" data-serverid="${item.ServerId}" data-type="Season" data-isfolder="true">${escapeHtml(item.SeasonName)}</a>`);
    } else if (item.ParentIndexNumber != null && item.IsSeries) {
        parentNameHtml.push(escapeHtml(item.SeasonName || 'S' + item.ParentIndexNumber));
    } else if (item.Album && item.AlbumId && (item.Type === 'MusicVideo' || item.Type === 'Audio')) {
        parentNameHtml.push(`<a style="color:inherit;" class="button-link itemAction" is="emby-linkbutton" href="#" data-action="link" data-id="${item.AlbumId}" data-serverid="${item.ServerId}" data-type="MusicAlbum" data-isfolder="true">${escapeHtml(item.Album)}</a>`);
    } else if (item.Album) {
        parentNameHtml.push(escapeHtml(item.Album));
    }

    // FIXME: This whole section needs some refactoring, so it becames easier to scale across all form factors. See GH #1022
    let html = '';
    const tvShowHtml = parentNameHtml[0];
    const tvSeasonHtml = parentNameHtml[1];

    if (parentNameHtml.length) {
        if (parentNameLast) {
            // Music
            if (layoutManager.mobile) {
                html = '<h3 class="parentName musicParentName">' + parentNameHtml.join('</br>') + '</h3>';
            } else {
                html = '<h3 class="parentName musicParentName focuscontainer-x">' + parentNameHtml.join(' - ') + '</h3>';
            }
        } else {
            html = '<h1 class="parentName focuscontainer-x"><bdi>' + tvShowHtml + '</bdi></h1>';
        }
    }

    const name = escapeHtml(itemHelper.getDisplayName(item, {
        includeParentInfo: false
    }));

    if (html && !parentNameLast) {
        if (tvSeasonHtml) {
            html += '<h3 class="itemName infoText subtitle focuscontainer-x"><bdi>' + tvSeasonHtml + ' - ' + name + '</bdi></h3>';
        } else {
            html += '<h3 class="itemName infoText subtitle"><bdi>' + name + '</bdi></h3>';
        }
    } else if (item.OriginalTitle && item.OriginalTitle != item.Name) {
        html = '<h1 class="itemName infoText parentNameLast withOriginalTitle"><bdi>' + name + '</bdi></h1>' + html;
    } else {
        html = '<h1 class="itemName infoText parentNameLast"><bdi>' + name + '</bdi></h1>' + html;
    }

    if (item.OriginalTitle && item.OriginalTitle != item.Name) {
        html += '<h4 class="itemName infoText originalTitle">' + escapeHtml(item.OriginalTitle) + '</h4>';
    }

    container.innerHTML = html;

    if (html.length) {
        container.classList.remove('hide');
    } else {
        container.classList.add('hide');
    }
}

function setTrailerButtonVisibility(page, item) {
    if ((item.LocalTrailerCount || item.RemoteTrailers?.length) && playbackManager.getSupportedCommands().indexOf('PlayTrailers') !== -1) {
        hideAll(page, 'btnPlayTrailer', true);
    } else {
        hideAll(page, 'btnPlayTrailer');
    }
}

function renderBackdrop(page, item) {
    if (!layoutManager.mobile && dom.getWindowSize().innerWidth >= 1000) {
        const isBannerEnabled = !layoutManager.tv && userSettings.detailsBanner();
        // If backdrops are disabled, but the header banner is enabled, add a class to the page to disable the transparency
        page.classList.toggle('noBackdropTransparency', isBannerEnabled && !userSettings.enableBackdrops());

        setBackdrops([item], null, isBannerEnabled);
    } else {
        clearBackdrop();
    }
}

function renderHeaderBackdrop(page, item, apiClient) {
    // Details banner is disabled in user settings
    if (!userSettings.detailsBanner()) {
        return false;
    }

    // Disable item backdrop for books and people because they only have primary images
    if (item.Type === 'Person' || item.Type === 'Book') {
        return false;
    }

    let hasbackdrop = false;
    const itemBackdropElement = page.querySelector('#itemBackdrop');

    const imgUrl = getItemBackdropImageUrl(apiClient, item, { maxWidth: dom.getScreenWidth() }, false);

    if (imgUrl) {
        imageLoader.lazyImage(itemBackdropElement, imgUrl);
        hasbackdrop = true;
    } else {
        itemBackdropElement.style.backgroundImage = '';
    }

    return hasbackdrop;
}

function reloadFromItem(instance, page, params, item, user) {
    const apiClient = ServerConnections.getApiClient(item.ServerId);

    libraryMenu.setTitle('');

    // Start rendering the artwork first
    renderImage(page, item, apiClient);

    renderLogo(page, item, apiClient);

    // Render the mobile header backdrop
    if (layoutManager.mobile) {
        renderHeaderBackdrop(page, item, apiClient);
    }

    renderBackdrop(page, item);

    // Render the main information for the item
    page.querySelector('.detailPagePrimaryContainer').classList.add('detailRibbon');
    renderName(item, page.querySelector('.nameContainer'), params.context);
    renderDetails(page, item, apiClient, params.context);
    renderTrackSelections(page, instance, item);

    renderSeriesTimerEditor(page, item, apiClient, user);
    renderTimerEditor(page, item, apiClient, user);
    setInitialCollapsibleState(page, item, apiClient, params.context, user);
    const canPlay = reloadPlayButtons(page, item);

    setTrailerButtonVisibility(page, item);

    if (item.Type !== 'Program' || canPlay) {
        hideAll(page, 'mainDetailButtons', true);
    } else {
        hideAll(page, 'mainDetailButtons');
    }

    showRecordingFields(instance, page, item, user);
    const groupedVersions = (item.MediaSources || []).filter(function (g) {
        return g.Type == 'Grouping';
    });

    if (user.Policy.IsAdministrator && groupedVersions.length) {
        page.querySelector('.btnSplitVersions').classList.remove('hide');
    } else {
        page.querySelector('.btnSplitVersions').classList.add('hide');
    }

    itemContextMenu.getCommands(getContextMenuOptions(item, user)).then(commands => {
        if (commands.length) {
            hideAll(page, 'btnMoreCommands', true);
        } else {
            hideAll(page, 'btnMoreCommands');
        }
    });

    const itemBirthday = page.querySelector('#itemBirthday');

    if (item.Type == 'Person' && item.PremiereDate) {
        try {
            const birthday = datetime.parseISO8601Date(item.PremiereDate, true);
            const durationSinceBorn = intervalToDuration({ start: birthday, end: Date.now() });
            itemBirthday.classList.remove('hide');
            if (item.EndDate) {
                itemBirthday.innerHTML = globalize.translate('BirthDateValue', birthday.toLocaleDateString());
            } else {
                itemBirthday.innerHTML = `${globalize.translate('BirthDateValue', birthday.toLocaleDateString())} ${globalize.translate('AgeValue', durationSinceBorn.years)}`;
            }
        } catch (err) {
            console.error(err);
            itemBirthday.classList.add('hide');
        }
    } else {
        itemBirthday.classList.add('hide');
    }

    const itemDeathDate = page.querySelector('#itemDeathDate');

    if (item.Type == 'Person' && item.EndDate) {
        try {
            const deathday = datetime.parseISO8601Date(item.EndDate, true);
            itemDeathDate.classList.remove('hide');
            if (item.PremiereDate) {
                const birthday = datetime.parseISO8601Date(item.PremiereDate, true);
                const durationSinceBorn = intervalToDuration({ start: birthday, end: deathday });

                itemDeathDate.innerHTML = `${globalize.translate('DeathDateValue', deathday.toLocaleDateString())} ${globalize.translate('AgeValue', durationSinceBorn.years)}`;
            } else {
                itemDeathDate.innerHTML = globalize.translate('DeathDateValue', deathday.toLocaleDateString());
            }
        } catch (err) {
            console.error(err);
            itemDeathDate.classList.add('hide');
        }
    } else {
        itemDeathDate.classList.add('hide');
    }

    const itemBirthLocation = page.querySelector('#itemBirthLocation');

    if (item.Type == 'Person' && item.ProductionLocations && item.ProductionLocations.length) {
        let location = item.ProductionLocations[0];
        if (!layoutManager.tv && appHost.supports(AppFeature.ExternalLinks)) {
            location = `<a is="emby-linkbutton" class="button-link textlink" target="_blank" href="https://www.openstreetmap.org/search?query=${encodeURIComponent(location)}">${escapeHtml(location)}</a>`;
        } else {
            location = escapeHtml(location);
        }
        itemBirthLocation.classList.remove('hide');
        itemBirthLocation.innerHTML = globalize.translate('BirthPlaceValue', location);
    } else {
        itemBirthLocation.classList.add('hide');
    }

    setPeopleHeader(page, item);
    loading.hide();

    if (item.Type === 'Book' && item.CanDownload && appHost.supports(AppFeature.FileDownload)) {
        hideAll(page, 'btnDownload', true);
    }

    autoFocus(page);
}

function logoImageUrl(item, apiClient, options) {
    options = options || {};
    options.type = 'Logo';

    if (item.ImageTags?.Logo) {
        options.tag = item.ImageTags.Logo;
        return apiClient.getScaledImageUrl(item.Id, options);
    }

    if (item.ParentLogoImageTag) {
        options.tag = item.ParentLogoImageTag;
        return apiClient.getScaledImageUrl(item.ParentLogoItemId, options);
    }

    return null;
}

function renderLogo(page, item, apiClient) {
    const detailLogo = page.querySelector('.detailLogo');

    const url = logoImageUrl(item, apiClient, {});

    if (url) {
        detailLogo.classList.remove('hide');
        imageLoader.setLazyImage(detailLogo, url);
    } else {
        detailLogo.classList.add('hide');
    }
}

function showRecordingFields(instance, page, item, user) {
    if (!instance.currentRecordingFields) {
        const recordingFieldsElement = page.querySelector('.recordingFields');

        if (item.Type == 'Program' && user.Policy.EnableLiveTvManagement) {
            import('../../components/recordingcreator/recordingfields').then(({ default: RecordingFields }) => {
                instance.currentRecordingFields = new RecordingFields({
                    parent: recordingFieldsElement,
                    programId: item.Id,
                    serverId: item.ServerId
                });
                recordingFieldsElement.classList.remove('hide');
            });
        } else {
            recordingFieldsElement.classList.add('hide');
            recordingFieldsElement.innerHTML = '';
        }
    }
}

function renderLinks(page, item) {
    const externalLinksElem = page.querySelector('.itemExternalLinks');

    const links = [];

    if (!layoutManager.tv && item.HomePageUrl) {
        links.push(`<a is="emby-linkbutton" class="button-link" href="${item.HomePageUrl}" target="_blank">${globalize.translate('ButtonWebsite')}</a>`);
    }

    if (item.ExternalUrls) {
        for (const url of item.ExternalUrls) {
            links.push(`<a is="emby-linkbutton" class="button-link" href="${url.Url}" target="_blank">${escapeHtml(url.Name)}</a>`);
        }
    }

    const html = [];
    if (links.length) {
        html.push(links.join(', '));
    }

    externalLinksElem.innerHTML = html.join(', ');

    if (html.length) {
        externalLinksElem.classList.remove('hide');
    } else {
        externalLinksElem.classList.add('hide');
    }
}

function renderDetailImage(apiClient, elem, item, loader) {
    const html = buildCardImage(
        apiClient,
        item,
        { width: dom.getWindowSize().innerWidth * 0.25 }
    );

    elem.innerHTML = html;
    loader.lazyChildren(elem);
}

function renderImage(page, item, apiClient) {
    renderDetailImage(
        apiClient,
        page.querySelector('.detailImageContainer'),
        item,
        imageLoader
    );
}

function setPeopleHeader(page, item) {
    if (item.MediaType == 'Audio' || item.Type == 'MusicAlbum' || item.MediaType == 'Book' || item.MediaType == 'Photo') {
        page.querySelector('#peopleHeader').innerHTML = globalize.translate('People');
    } else {
        page.querySelector('#peopleHeader').innerHTML = globalize.translate('HeaderCastAndCrew');
    }
}

function renderNextUp(page, item, user) {
    const section = page.querySelector('.nextUpSection');

    if (item.Type != 'Series') {
        section.classList.add('hide');
        return;
    }

    ServerConnections.getApiClient(item.ServerId).getNextUpEpisodes({
        SeriesId: item.Id,
        UserId: user.Id,
        Fields: 'MediaSourceCount'
    }).then(function (result) {
        if (result.Items.length) {
            section.classList.remove('hide');
        } else {
            section.classList.add('hide');
        }

        const html = cardBuilder.getCardsHtml({
            items: result.Items,
            shape: 'overflowBackdrop',
            showTitle: true,
            displayAsSpecial: item.Type == 'Season' && item.IndexNumber,
            overlayText: false,
            centerText: true,
            overlayPlayButton: true
        });
        const itemsContainer = section.querySelector('.nextUpItems');
        itemsContainer.innerHTML = html;
        imageLoader.lazyChildren(itemsContainer);
    });
}

function setInitialCollapsibleState(page, item, apiClient, context, user) {
    page.querySelector('.collectionItems').innerHTML = '';

    if (item.Type == 'Playlist') {
        page.querySelector('#childrenCollapsible').classList.remove('hide');
        renderPlaylistItems(page, item);
    } else if (item.Type == 'Studio' || item.Type == 'Person' || item.Type == 'Genre' || item.Type == 'MusicGenre' || item.Type == 'MusicArtist') {
        page.querySelector('#childrenCollapsible').classList.remove('hide');
        renderItemsByName(page, item);
    } else if (item.IsFolder) {
        if (item.Type == 'BoxSet') {
            page.querySelector('#childrenCollapsible').classList.add('hide');
        }

        renderChildren(page, item);
    } else {
        page.querySelector('#childrenCollapsible').classList.add('hide');
    }

    if (item.Type == 'Series') {
        renderSeriesSchedule(page, item);
        renderNextUp(page, item, user);
    } else {
        page.querySelector('.nextUpSection').classList.add('hide');
    }

    renderScenes(page, item);

    if (item.SpecialFeatureCount > 0) {
        page.querySelector('#specialsCollapsible').classList.remove('hide');
        renderSpecials(page, item, user);
    } else {
        page.querySelector('#specialsCollapsible').classList.add('hide');
    }

    const cast = [];
    const guestCast = [];
    (item.People || []).forEach(p => {
        if (p.Type === PersonKind.GuestStar) {
            guestCast.push(p);
        } else {
            cast.push(p);
        }
    });

    renderCast(page, item, cast);
    renderGuestCast(page, item, guestCast);

    if (item.PartCount && item.PartCount > 1) {
        page.querySelector('#additionalPartsCollapsible').classList.remove('hide');
        renderAdditionalParts(page, item, user);
    } else {
        page.querySelector('#additionalPartsCollapsible').classList.add('hide');
    }

    if (item.Type == 'MusicAlbum' || item.Type == 'MusicArtist') {
        renderMusicVideos(page, item, user);
    } else {
        page.querySelector('#musicVideosCollapsible').classList.add('hide');
    }
}

function toggleLineClamp(clampTarget, e) {
    const expandButton = e.target;
    const clampClassName = 'detail-clamp-text';

    if (clampTarget.classList.contains(clampClassName)) {
        clampTarget.classList.remove(clampClassName);
        expandButton.innerHTML = globalize.translate('ShowLess');
    } else {
        clampTarget.classList.add(clampClassName);
        expandButton.innerHTML = globalize.translate('ShowMore');
    }
}

function renderOverview(page, item) {
    const overviewElements = page.querySelectorAll('.overview');

    if (overviewElements.length > 0) {
        // eslint-disable-next-line sonarjs/disabled-auto-escaping
        const overview = DOMPurify.sanitize(markdownIt({ html: true }).render(item.Overview || ''));

        if (overview) {
            for (const overviewElemnt of overviewElements) {
                overviewElemnt.innerHTML = '<bdi>' + overview + '</bdi>';
                overviewElemnt.classList.remove('hide');
                overviewElemnt.classList.add('detail-clamp-text');

                // Grab the sibling element to control the expand state
                const expandButton = overviewElemnt.parentElement.querySelector('.overview-expand');

                // Detect if we have overflow of text. Based on this StackOverflow answer
                // https://stackoverflow.com/a/35157976
                if (Math.abs(overviewElemnt.scrollHeight - overviewElemnt.offsetHeight) > 2) {
                    expandButton.classList.remove('hide');
                } else {
                    expandButton.classList.add('hide');
                }

                expandButton.addEventListener('click', toggleLineClamp.bind(null, overviewElemnt));

                for (const anchor of overviewElemnt.querySelectorAll('a')) {
                    anchor.setAttribute('target', '_blank');
                }
            }
        } else {
            for (const overviewElemnt of overviewElements) {
                overviewElemnt.innerHTML = '';
                overviewElemnt.classList.add('hide');
            }
        }
    }
}

function renderGenres(page, item, context = inferContext(item)) {
    const genres = item.GenreItems || [];
    const type = context === 'music' ? 'MusicGenre' : 'Genre';

    const html = genres.map(function (p) {
        return '<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + appRouter.getRouteUrl({
            Name: p.Name,
            Type: type,
            ServerId: item.ServerId,
            Id: p.Id
        }, {
            context: context
        }) + '">' + escapeHtml(p.Name) + '</a>';
    }).join(', ');

    const genresLabel = page.querySelector('.genresLabel');
    genresLabel.innerHTML = globalize.translate(genres.length > 1 ? 'Genres' : 'Genre');
    const genresValue = page.querySelector('.genres');
    genresValue.innerHTML = html;

    const genresGroup = page.querySelector('.genresGroup');
    if (genres.length) {
        genresGroup.classList.remove('hide');
    } else {
        genresGroup.classList.add('hide');
    }
}

function renderWriter(page, item, context) {
    const writers = (item.People || []).filter(function (person) {
        return person.Type === 'Writer';
    });

    const html = writers.map(function (person) {
        return '<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + appRouter.getRouteUrl({
            Name: person.Name,
            Type: 'Person',
            ServerId: item.ServerId,
            Id: person.Id
        }, {
            context: context
        }) + '">' + escapeHtml(person.Name) + '</a>';
    }).join(', ');

    const writersLabel = page.querySelector('.writersLabel');
    writersLabel.innerHTML = globalize.translate(writers.length > 1 ? 'Writers' : 'Writer');
    const writersValue = page.querySelector('.writers');
    writersValue.innerHTML = html;

    const writersGroup = page.querySelector('.writersGroup');
    if (writers.length) {
        writersGroup.classList.remove('hide');
    } else {
        writersGroup.classList.add('hide');
    }
}

function renderDirector(page, item, context) {
    const directors = (item.People || []).filter(function (person) {
        return person.Type === 'Director';
    });

    const html = directors.map(function (person) {
        return '<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + appRouter.getRouteUrl({
            Name: person.Name,
            Type: 'Person',
            ServerId: item.ServerId,
            Id: person.Id
        }, {
            context: context
        }) + '">' + escapeHtml(person.Name) + '</a>';
    }).join(', ');

    const directorsLabel = page.querySelector('.directorsLabel');
    directorsLabel.innerHTML = globalize.translate(directors.length > 1 ? 'Directors' : 'Director');
    const directorsValue = page.querySelector('.directors');
    directorsValue.innerHTML = html;

    const directorsGroup = page.querySelector('.directorsGroup');
    if (directors.length) {
        directorsGroup.classList.remove('hide');
    } else {
        directorsGroup.classList.add('hide');
    }
}

function renderStudio(page, item, context) {
    // The list of studios can be massive for collections of items
    if ([BaseItemKind.BoxSet, BaseItemKind.Playlist].includes(item.Type)) return;

    const studios = item.Studios || [];

    const html = studios.map(function (studio) {
        return '<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + appRouter.getRouteUrl({
            Name: studio.Name,
            Type: 'Studio',
            ServerId: item.ServerId,
            Id: studio.Id
        }, {
            context: context
        }) + '">' + escapeHtml(studio.Name) + '</a>';
    }).join(', ');

    const studiosLabel = page.querySelector('.studiosLabel');
    studiosLabel.innerText = globalize.translate(studios.length > 1 ? 'Studios' : 'Studio');
    const studiosValue = page.querySelector('.studios');
    studiosValue.innerHTML = html;

    const studiosGroup = page.querySelector('.studiosGroup');
    studiosGroup.classList.toggle('hide', !studios.length);
}

function renderMiscInfo(page, item) {
    const primaryItemMiscInfo = page.querySelectorAll('.itemMiscInfo-primary');

    for (const miscInfo of primaryItemMiscInfo) {
        mediaInfo.fillPrimaryMediaInfo(miscInfo, item, {
            interactive: true,
            episodeTitle: false,
            subtitles: false
        });

        if (miscInfo.innerHTML && item.Type !== 'SeriesTimer') {
            miscInfo.classList.remove('hide');
        } else {
            miscInfo.classList.add('hide');
        }
    }

    const secondaryItemMiscInfo = page.querySelectorAll('.itemMiscInfo-secondary');

    for (const miscInfo of secondaryItemMiscInfo) {
        mediaInfo.fillSecondaryMediaInfo(miscInfo, item, {
            interactive: true
        });

        if (miscInfo.innerHTML && item.Type !== 'SeriesTimer') {
            miscInfo.classList.remove('hide');
        } else {
            miscInfo.classList.add('hide');
        }
    }
}

function renderTagline(page, item) {
    const taglineElement = page.querySelector('.tagline');

    if (item.Taglines?.length) {
        taglineElement.classList.remove('hide');
        taglineElement.innerHTML = '<bdi>' + escapeHtml(item.Taglines[0]) + '</bdi>';
    } else {
        taglineElement.classList.add('hide');
    }
}

function renderDetails(page, item, apiClient, context) {
    renderSimilarItems(page, item, context);
    renderMoreFromSeason(page, item, apiClient);
    renderMoreFromArtist(page, item, apiClient);
    renderDirector(page, item, context);
    renderStudio(page, item, context);
    renderWriter(page, item, context);
    renderGenres(page, item, context);
    renderChannelGuide(page, apiClient, item);
    renderTagline(page, item);
    renderOverview(page, item);
    renderMiscInfo(page, item);
    reloadUserDataButtons(page, item);
    renderLyricsContainer(page, item, apiClient);

    // Don't allow redirection to other websites from the TV layout
    if (!layoutManager.tv && appHost.supports(AppFeature.ExternalLinks)) {
        renderLinks(page, item);
    }

    renderTags(page, item);
    renderSeriesAirTime(page, item);
}

function enableScrollX() {
    return browser.mobile && window.screen.availWidth <= 1000;
}

function renderLyricsContainer(view, item, apiClient) {
    const lyricContainer = view.querySelector('.lyricsContainer');
    if (lyricContainer && item.HasLyrics) {
        if (item.Type !== 'Audio') {
            lyricContainer.classList.add('hide');
            return;
        }
        //get lyrics
        apiClient.ajax({
            url: apiClient.getUrl('Audio/' + item.Id + '/Lyrics'),
            type: 'GET',
            dataType: 'json'
        }).then((response) => {
            if (!response.Lyrics) {
                lyricContainer.classList.add('hide');
                return;
            }
            lyricContainer.classList.remove('hide');
            const itemsContainer = lyricContainer.querySelector('.itemsContainer');
            if (itemsContainer) {
                const html = response.Lyrics.reduce((htmlAccumulator, lyric) => {
                    htmlAccumulator += escapeHtml(lyric.Text) + '<br/>';
                    return htmlAccumulator;
                }, '');
                itemsContainer.innerHTML = html;
            }
        }).catch(() => {
            lyricContainer.classList.add('hide');
        });
    }
}

function renderMoreFromSeason(view, item, apiClient) {
    const section = view.querySelector('.moreFromSeasonSection');

    if (section) {
        if (item.Type !== 'Episode' || !item.SeasonId || !item.SeriesId) {
            section.classList.add('hide');
            return;
        }

        const userId = apiClient.getCurrentUserId();
        apiClient.getEpisodes(item.SeriesId, {
            SeasonId: item.SeasonId,
            UserId: userId,
            Fields: 'ItemCounts,PrimaryImageAspectRatio,CanDelete,MediaSourceCount'
        }).then(function (result) {
            if (result.Items.length < 2) {
                section.classList.add('hide');
                return;
            }

            section.classList.remove('hide');
            section.querySelector('h2').innerText = globalize.translate('MoreFromValue', item.SeasonName);
            const itemsContainer = section.querySelector('.itemsContainer');
            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: itemsContainer,
                shape: 'autooverflow',
                sectionTitleTagName: 'h2',
                scalable: true,
                showTitle: true,
                overlayText: false,
                centerText: true,
                includeParentInfoInTitle: false,
                allowBottomPadding: false
            });
            const card = itemsContainer.querySelector('.card[data-id="' + item.Id + '"]');

            if (card) {
                setTimeout(function () {
                    section.querySelector('.emby-scroller').toStart(card.previousSibling || card, true);
                }, 100);
            }
        });
    }
}

function renderMoreFromArtist(view, item, apiClient) {
    const section = view.querySelector('.moreFromArtistSection');

    if (section) {
        if (item.Type !== 'MusicArtist' && item.Type !== 'Audio' && (item.Type !== 'MusicAlbum' || !item.AlbumArtists || !item.AlbumArtists.length)) {
            section.classList.add('hide');
            return;
        }

        const query = {
            IncludeItemTypes: 'MusicAlbum',
            Recursive: true,
            ExcludeItemIds: item.Id,
            SortBy: 'PremiereDate,ProductionYear,SortName',
            SortOrder: 'Descending'
        };

        if (item.Type === 'MusicArtist') {
            query.ContributingArtistIds = item.Id;
        } else {
            query.ContributingArtistIds = item.AlbumArtists.map(artist => artist.Id).join(',');
        }

        apiClient.getItems(apiClient.getCurrentUserId(), query).then(function (result) {
            if (!result.Items.length) {
                section.classList.add('hide');
                return;
            }

            section.classList.remove('hide');

            if (item.Type === 'MusicArtist') {
                section.querySelector('h2').innerText = globalize.translate('HeaderAppearsOn');
            } else {
                section.querySelector('h2').innerText = globalize.translate('MoreFromValue', item.AlbumArtists[0].Name);
            }

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'autooverflow',
                sectionTitleTagName: 'h2',
                scalable: true,
                coverImage: item.Type === 'MusicArtist' || item.Type === 'MusicAlbum',
                showTitle: true,
                showParentTitle: false,
                centerText: true,
                overlayText: false,
                overlayPlayButton: true,
                showYear: true
            });
        });
    }
}

function renderSimilarItems(page, item, context) {
    const similarCollapsible = page.querySelector('#similarCollapsible');

    if (similarCollapsible) {
        if (item.Type != 'Movie' && item.Type != 'Trailer' && item.Type != 'Series' && item.Type != 'Program' && item.Type != 'Recording' && item.Type != 'MusicAlbum' && item.Type != 'MusicArtist' && item.Type != 'Playlist' && item.Type != 'Audio') {
            similarCollapsible.classList.add('hide');
            return;
        }

        similarCollapsible.classList.remove('hide');
        const apiClient = ServerConnections.getApiClient(item.ServerId);
        const options = {
            userId: apiClient.getCurrentUserId(),
            limit: 12,
            fields: 'PrimaryImageAspectRatio,CanDelete'
        };

        if (item.Type == 'MusicAlbum' && item.AlbumArtists && item.AlbumArtists.length) {
            options.ExcludeArtistIds = item.AlbumArtists[0].Id;
        }

        apiClient.getSimilarItems(item.Id, options).then(function (result) {
            if (!result.Items.length) {
                similarCollapsible.classList.add('hide');
                return;
            }

            similarCollapsible.classList.remove('hide');
            let html = '';
            html += cardBuilder.getCardsHtml({
                items: result.Items,
                shape: 'autooverflow',
                showParentTitle: item.Type == 'MusicAlbum',
                centerText: true,
                showTitle: true,
                context: context,
                lazy: true,
                showDetailsMenu: true,
                coverImage: item.Type == 'MusicAlbum' || item.Type == 'MusicArtist',
                overlayPlayButton: true,
                overlayText: false,
                showYear: item.Type === 'Movie' || item.Type === 'Trailer' || item.Type === 'Series'
            });
            const similarContent = similarCollapsible.querySelector('.similarContent');
            similarContent.innerHTML = html;
            imageLoader.lazyChildren(similarContent);
        });
    }
}

function renderSeriesAirTime(page, item) {
    const seriesAirTime = page.querySelector('#seriesAirTime');
    if (item.Type != 'Series') {
        seriesAirTime.classList.add('hide');
        return;
    }
    let html = '';
    if (item.AirDays?.length) {
        if (item.AirDays.length == 7) {
            html += 'daily';
        } else {
            html += item.AirDays.map(function (a) {
                return a + 's';
            }).join(',');
        }
    }
    if (item.AirTime) {
        html += ' at ' + item.AirTime;
    }
    if (html) {
        html = (item.Status == 'Ended' ? 'Aired ' : 'Airs ') + html;
        seriesAirTime.innerHTML = html;
        seriesAirTime.classList.remove('hide');
    } else {
        seriesAirTime.classList.add('hide');
    }
}

function renderTags(page, item) {
    const itemTags = page.querySelector('.itemTags');
    const tagElements = [];
    let tags = item.Tags || [];

    if (item.Type === 'Program') {
        tags = [];
    }

    tags.forEach(tag => {
        const href = appRouter.getRouteUrl('tag', {
            tag,
            serverId: item.ServerId
        });
        tagElements.push(
            `<a href="${href}" class="button-link" is="emby-linkbutton">`
            + escapeHtml(tag)
            + '</a>'
        );
    });

    if (tagElements.length) {
        itemTags.innerHTML = globalize.translate('TagsValue', tagElements.join(', '));
        itemTags.classList.remove('hide');
    } else {
        itemTags.innerHTML = '';
        itemTags.classList.add('hide');
    }
}

function renderChildren(page, item) {
    let fields = 'ItemCounts,PrimaryImageAspectRatio,CanDelete,MediaSourceCount';
    const query = {
        ParentId: item.Id,
        Fields: fields
    };

    if (item.Type == 'MusicAlbum') {
        query.SortBy = 'ParentIndexNumber,IndexNumber,SortName';
    } else if (item.Type !== 'BoxSet') {
        query.SortBy = 'SortName';
    }

    let promise;
    const apiClient = ServerConnections.getApiClient(item.ServerId);
    const userId = apiClient.getCurrentUserId();

    if (item.Type == 'Series') {
        promise = apiClient.getSeasons(item.Id, {
            userId: userId,
            Fields: fields
        });
    } else if (item.Type == 'Season') {
        fields += ',Overview';
        promise = apiClient.getEpisodes(item.SeriesId, {
            seasonId: item.Id,
            userId: userId,
            Fields: fields
        });
    } else if (item.Type == 'MusicArtist') {
        query.SortBy = 'PremiereDate,ProductionYear,SortName';
    }

    promise = promise || apiClient.getItems(apiClient.getCurrentUserId(), query);
    promise.then(function (result) {
        let html = '';
        let scrollX = false;
        let isList = false;
        const childrenItemsContainer = page.querySelector('.childrenItemsContainer');

        if (item.Type == 'MusicAlbum') {
            let showArtist = false;
            for (const track of result.Items) {
                if (!isEqual(track.ArtistItems.map(x => x.Id).sort(), track.AlbumArtists.map(x => x.Id).sort())) {
                    showArtist = true;
                    break;
                }
            }
            const discNumbers = result.Items.map(x => x.ParentIndexNumber);
            html = listView.getListViewHtml({
                items: result.Items,
                smallIcon: true,
                showIndex: new Set(discNumbers).size > 1 || (discNumbers.length >= 1 && discNumbers[0] > 1),
                index: 'disc',
                showIndexNumberLeft: true,
                playFromHere: true,
                action: 'playallfromhere',
                image: false,
                artist: showArtist,
                containerAlbumArtists: item.AlbumArtists
            });
            isList = true;
        } else if (item.Type == 'Series') {
            scrollX = enableScrollX();
            html = cardBuilder.getCardsHtml({
                items: result.Items,
                shape: 'overflowPortrait',
                showTitle: true,
                centerText: true,
                lazy: true,
                overlayPlayButton: true,
                allowBottomPadding: !scrollX
            });
        } else if (item.Type == 'Season' || item.Type == 'Episode') {
            if (item.Type !== 'Episode') {
                isList = true;
            }
            scrollX = item.Type == 'Episode';
            if (result.Items.length < 2 && item.Type === 'Episode') {
                return;
            }

            if (item.Type === 'Episode') {
                html = cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: 'overflowBackdrop',
                    showTitle: true,
                    displayAsSpecial: item.Type == 'Season' && item.IndexNumber,
                    playFromHere: true,
                    overlayText: true,
                    lazy: true,
                    showDetailsMenu: true,
                    overlayPlayButton: true,
                    allowBottomPadding: !scrollX,
                    includeParentInfoInTitle: false
                });
            } else if (item.Type === 'Season') {
                html = listView.getListViewHtml({
                    items: result.Items,
                    showIndexNumber: false,
                    enableOverview: true,
                    enablePlayedButton: !layoutManager.mobile,
                    infoButton: !layoutManager.mobile,
                    imageSize: 'large',
                    enableSideMediaInfo: false,
                    highlight: false,
                    action: !layoutManager.desktop ? 'link' : 'none',
                    imagePlayButton: true,
                    includeParentInfoInTitle: false
                });
            }
        }

        if (item.Type !== 'BoxSet') {
            page.querySelector('#childrenCollapsible').classList.remove('hide');
        }
        if (scrollX) {
            childrenItemsContainer.classList.add('scrollX');
            childrenItemsContainer.classList.add('hiddenScrollX');
            childrenItemsContainer.classList.remove('vertical-wrap');
            childrenItemsContainer.classList.remove('vertical-list');
        } else {
            childrenItemsContainer.classList.remove('scrollX');
            childrenItemsContainer.classList.remove('hiddenScrollX');
            childrenItemsContainer.classList.remove('smoothScrollX');
            if (isList) {
                childrenItemsContainer.classList.add('vertical-list');
                childrenItemsContainer.classList.remove('vertical-wrap');
            } else {
                childrenItemsContainer.classList.add('vertical-wrap');
                childrenItemsContainer.classList.remove('vertical-list');
            }
        }
        if (layoutManager.mobile) {
            childrenItemsContainer.classList.remove('padded-right');
        }
        childrenItemsContainer.innerHTML = html;
        imageLoader.lazyChildren(childrenItemsContainer);
        if (item.Type == 'BoxSet') {
            const collectionItemTypes = [{
                name: globalize.translate('Movies'),
                type: 'Movie'
            }, {
                name: globalize.translate('Series'),
                type: 'Series'
            }, {
                name: globalize.translate('Episodes'),
                type: 'Episode'
            }, {
                name: globalize.translate('HeaderVideos'),
                mediaType: 'Video'
            }, {
                name: globalize.translate('Albums'),
                type: 'MusicAlbum'
            }, {
                name: globalize.translate('Books'),
                type: 'Book'
            }, {
                name: globalize.translate('Collections'),
                type: 'BoxSet'
            }];
            renderCollectionItems(page, item, collectionItemTypes, result.Items);
        }
    });

    if (item.Type == 'Season') {
        page.querySelector('#childrenTitle').innerHTML = globalize.translate('Episodes');
    } else if (item.Type == 'Series') {
        page.querySelector('#childrenTitle').innerHTML = globalize.translate('HeaderSeasons');
    } else if (item.Type == 'MusicAlbum') {
        page.querySelector('#childrenTitle').innerHTML = globalize.translate('HeaderTracks');
    } else {
        page.querySelector('#childrenTitle').innerHTML = globalize.translate('Items');
    }

    if (item.Type == 'MusicAlbum' || item.Type == 'Season') {
        page.querySelector('.childrenSectionHeader').classList.add('hide');
        page.querySelector('#childrenCollapsible').classList.add('verticalSection-extrabottompadding');
    } else {
        page.querySelector('.childrenSectionHeader').classList.remove('hide');
    }
}

function renderItemsByName(page, item) {
    import('../../scripts/itemsByName').then(({ default: ItemsByName }) => {
        ItemsByName.renderItems(page, item);
    });
}

function renderPlaylistItems(page, item) {
    import('../../scripts/playlistViewer').then(({ default: PlaylistViewer }) => {
        PlaylistViewer.render(page, item);
    });
}

function renderProgramsForChannel(page, result) {
    let html = '';
    let currentItems = [];
    let currentStartDate = null;

    for (let i = 0, length = result.Items.length; i < length; i++) {
        const item = result.Items[i];
        const itemStartDate = datetime.parseISO8601Date(item.StartDate);

        if (!(currentStartDate && currentStartDate.toDateString() === itemStartDate.toDateString())) {
            if (currentItems.length) {
                html += '<div class="verticalSection verticalDetailSection">';
                html += '<h2 class="sectionTitle padded-left">' + datetime.toLocaleDateString(currentStartDate, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                }) + '</h2>';
                html += '<div is="emby-itemscontainer" class="vertical-list padded-left padded-right">' + listView.getListViewHtml({
                    items: currentItems,
                    enableUserDataButtons: false,
                    showParentTitle: true,
                    image: false,
                    showProgramTime: true,
                    mediaInfo: false,
                    parentTitleWithTitle: true
                }) + '</div></div>';
            }

            currentStartDate = itemStartDate;
            currentItems = [];
        }

        currentItems.push(item);
    }

    if (currentItems.length) {
        html += '<div class="verticalSection verticalDetailSection">';
        html += '<h2 class="sectionTitle padded-left">' + datetime.toLocaleDateString(currentStartDate, {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        }) + '</h2>';
        html += '<div is="emby-itemscontainer" class="vertical-list padded-left padded-right">' + listView.getListViewHtml({
            items: currentItems,
            enableUserDataButtons: false,
            showParentTitle: true,
            image: false,
            showProgramTime: true,
            mediaInfo: false,
            parentTitleWithTitle: true
        }) + '</div></div>';
    }

    page.querySelector('.programGuide').innerHTML = html;
}

function renderChannelGuide(page, apiClient, item) {
    if (item.Type === 'TvChannel') {
        page.querySelector('.programGuideSection').classList.remove('hide');
        apiClient.getLiveTvPrograms({
            ChannelIds: item.Id,
            UserId: apiClient.getCurrentUserId(),
            HasAired: false,
            SortBy: 'StartDate',
            EnableTotalRecordCount: false,
            EnableImages: false,
            ImageTypeLimit: 0,
            EnableUserData: false
        }).then(function (result) {
            renderProgramsForChannel(page, result);
        });
    }
}

function renderSeriesSchedule(page, item) {
    const apiClient = ServerConnections.getApiClient(item.ServerId);
    apiClient.getLiveTvPrograms({
        UserId: apiClient.getCurrentUserId(),
        ImageTypeLimit: 1,
        HasAired: false,
        SortBy: 'StartDate',
        EnableTotalRecordCount: false,
        Limit: 50,
        EnableUserData: false,
        Fields: 'ChannelInfo,ChannelImage',
        LibrarySeriesId: item.Id
    }).then(function (result) {
        if (result.Items.length) {
            page.querySelector('#seriesScheduleSection').classList.remove('hide');
        } else {
            page.querySelector('#seriesScheduleSection').classList.add('hide');
        }

        const html = getProgramScheduleHtml(result.Items, 'programdialog');
        const scheduleTab = page.querySelector('#seriesScheduleList');
        scheduleTab.innerHTML = html;
        imageLoader.lazyChildren(scheduleTab);

        loading.hide();
    }).catch(function (resp) {
        if(resp.status === 403) {
            page.querySelector('#seriesScheduleSection').classList.add('hide');
        }
    });
}

function inferContext(item) {
    if (item.Type === 'Movie' || item.Type === 'BoxSet') {
        return 'movies';
    }

    if (item.Type === 'Series' || item.Type === 'Season' || item.Type === 'Episode') {
        return 'tvshows';
    }

    if (item.Type === 'MusicArtist' || item.Type === 'MusicAlbum' || item.Type === 'Audio' || item.Type === 'AudioBook') {
        return 'music';
    }

    if (item.Type === 'Program') {
        return 'livetv';
    }

    return null;
}

function filterItemsByCollectionItemType(items, typeInfo) {
    const filteredItems = [];
    const leftoverItems = [];
    items.forEach(function(item) {
        if ((typeInfo.mediaType && item.MediaType == typeInfo.mediaType) || (item.Type == typeInfo.type)) {
            filteredItems.push(item);
        } else {
            leftoverItems.push(item);
        }
    });
    return [filteredItems, leftoverItems];
}

function canPlaySomeItemInCollection(items) {
    let i = 0;

    for (let length = items.length; i < length; i++) {
        if (playbackManager.canPlay(items[i])) {
            return true;
        }
    }

    return false;
}

function renderCollectionItems(page, parentItem, types, items) {
    page.querySelector('.collectionItems').classList.remove('hide');
    page.querySelector('.collectionItems').innerHTML = '';

    if (!items.length) {
        renderCollectionItemType(page, parentItem, {
            name: globalize.translate('Items')
        }, items);
    } else {
        let typeItems = [];
        let otherTypeItems = items;

        for (const type of types) {
            [typeItems, otherTypeItems] = filterItemsByCollectionItemType(otherTypeItems, type);

            if (typeItems.length) {
                renderCollectionItemType(page, parentItem, type, typeItems);
            }
        }

        if (otherTypeItems.length) {
            const otherType = {
                name: globalize.translate('HeaderOtherItems')
            };
            renderCollectionItemType(page, parentItem, otherType, otherTypeItems);
        }
    }

    const containers = page.querySelectorAll('.collectionItemsContainer');

    const notifyRefreshNeeded = function () {
        renderChildren(page, parentItem);
    };

    for (const container of containers) {
        container.notifyRefreshNeeded = notifyRefreshNeeded;
    }

    // if nothing in the collection can be played hide play and shuffle buttons
    if (!canPlaySomeItemInCollection(items)) {
        hideAll(page, 'btnPlay', false);
        hideAll(page, 'btnShuffle', false);
    }

    // HACK: Call autoFocuser again because btnPlay may be hidden, but focused by reloadFromItem
    // FIXME: Sometimes focus does not move until all (?) sections are loaded
    autoFocus(page);
}

function renderCollectionItemType(page, parentItem, type, items) {
    let html = '';
    html += '<div class="verticalSection">';
    html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
    html += '<h2 class="sectionTitle sectionTitle-cards">';
    html += '<span>' + type.name + '</span>';
    html += '</h2>';
    html += '</div>';
    html += '<div is="emby-itemscontainer" class="itemsContainer collectionItemsContainer vertical-wrap padded-left padded-right">';
    const shape = type.type == 'MusicAlbum' ? getSquareShape(false) : getPortraitShape(false);
    html += cardBuilder.getCardsHtml({
        items: items,
        shape: shape,
        showTitle: true,
        showYear: type.mediaType === 'Video' || type.type === 'Series' || type.type === 'Movie',
        centerText: true,
        lazy: true,
        showDetailsMenu: true,
        overlayMoreButton: true,
        showAddToCollection: false,
        showRemoveFromCollection: true,
        collectionId: parentItem.Id
    });
    html += '</div>';
    html += '</div>';
    const collectionItems = page.querySelector('.collectionItems');
    collectionItems.insertAdjacentHTML('beforeend', html);
    imageLoader.lazyChildren(collectionItems.lastChild);
}

function renderMusicVideos(page, item, user) {
    const request = {
        SortBy: 'SortName',
        SortOrder: 'Ascending',
        IncludeItemTypes: 'MusicVideo',
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio,CanDelete,MediaSourceCount'
    };

    if (item.Type == 'MusicAlbum') {
        request.AlbumIds = item.Id;
    } else {
        request.ArtistIds = item.Id;
    }

    ServerConnections.getApiClient(item.ServerId).getItems(user.Id, request).then(function (result) {
        if (result.Items.length) {
            page.querySelector('#musicVideosCollapsible').classList.remove('hide');
            const musicVideosContent = page.querySelector('#musicVideosContent');
            musicVideosContent.innerHTML = getVideosHtml(result.Items);
            imageLoader.lazyChildren(musicVideosContent);
        } else {
            page.querySelector('#musicVideosCollapsible').classList.add('hide');
        }
    });
}

function renderAdditionalParts(page, item, user) {
    ServerConnections.getApiClient(item.ServerId).getAdditionalVideoParts(user.Id, item.Id).then(function (result) {
        if (result.Items.length) {
            page.querySelector('#additionalPartsCollapsible').classList.remove('hide');
            const additionalPartsContent = page.querySelector('#additionalPartsContent');
            additionalPartsContent.innerHTML = getVideosHtml(result.Items);
            imageLoader.lazyChildren(additionalPartsContent);
        } else {
            page.querySelector('#additionalPartsCollapsible').classList.add('hide');
        }
    });
}

function renderScenes(page, item) {
    let chapters = item.Chapters || [];

    if (chapters.length && !chapters[0].ImageTag) {
        chapters = [];
    }

    if (chapters.length) {
        page.querySelector('#scenesCollapsible').classList.remove('hide');
        const scenesContent = page.querySelector('#scenesContent');

        import('../../components/cardbuilder/chaptercardbuilder').then(({ default: chaptercardbuilder }) => {
            chaptercardbuilder.buildChapterCards(item, chapters, {
                itemsContainer: scenesContent,
                backdropShape: 'overflowBackdrop',
                squareShape: 'overflowSquare',
                imageBlurhashes: item.ImageBlurHashes
            });
        });
    } else {
        page.querySelector('#scenesCollapsible').classList.add('hide');
    }
}

function getVideosHtml(items) {
    return cardBuilder.getCardsHtml({
        items: items,
        shape: 'autooverflow',
        showTitle: true,
        action: 'play',
        overlayText: false,
        centerText: true,
        showRuntime: true
    });
}

function renderSpecials(page, item, user) {
    ServerConnections.getApiClient(item.ServerId).getSpecialFeatures(user.Id, item.Id).then(function (specials) {
        const specialsContent = page.querySelector('#specialsContent');
        specialsContent.innerHTML = getVideosHtml(specials);
        imageLoader.lazyChildren(specialsContent);
    });
}

function renderCast(page, item, people) {
    if (!people.length) {
        page.querySelector('#castCollapsible').classList.add('hide');
        return;
    }

    page.querySelector('#castCollapsible').classList.remove('hide');
    const castContent = page.querySelector('#castContent');

    import('../../components/cardbuilder/peoplecardbuilder').then(({ default: peoplecardbuilder }) => {
        peoplecardbuilder.buildPeopleCards(people, {
            itemsContainer: castContent,
            coverImage: true,
            serverId: item.ServerId,
            shape: 'overflowPortrait',
            imageBlurhashes: item.ImageBlurHashes
        });
    });
}

function renderGuestCast(page, item, people) {
    if (!people.length) {
        page.querySelector('#guestCastCollapsible').classList.add('hide');
        return;
    }

    page.querySelector('#guestCastCollapsible').classList.remove('hide');
    const guestCastContent = page.querySelector('#guestCastContent');

    import('../../components/cardbuilder/peoplecardbuilder').then(({ default: peoplecardbuilder }) => {
        peoplecardbuilder.buildPeopleCards(people, {
            itemsContainer: guestCastContent,
            coverImage: true,
            serverId: item.ServerId,
            shape: 'overflowPortrait',
            imageBlurhashes: item.ImageBlurHashes
        });
    });
}

function ItemDetailPage() {
    const self = this;
    self.setInitialCollapsibleState = setInitialCollapsibleState;
    self.renderDetails = renderDetails;
    self.renderCast = renderCast;
    self.renderGuestCast = renderGuestCast;
}

function bindAll(view, selector, eventName, fn) {
    const elems = view.querySelectorAll(selector);

    for (const elem of elems) {
        elem.addEventListener(eventName, fn);
    }
}

function onTrackSelectionsSubmit(e) {
    e.preventDefault();
    return false;
}

window.ItemDetailPage = new ItemDetailPage();

export default function (view, params) {
    function getApiClient() {
        return params.serverId ? ServerConnections.getApiClient(params.serverId) : ApiClient;
    }

    function reload(instance, page, pageParams) {
        loading.show();

        const apiClient = getApiClient();

        Promise.all([getPromise(apiClient, pageParams), apiClient.getCurrentUser()]).then(([item, user]) => {
            currentItem = item;
            reloadFromItem(instance, page, pageParams, item, user);
        }).catch((error) => {
            console.error('failed to get item or current user: ', error);
        });
    }

    function splitVersions(instance, page, apiClient, pageParams) {
        confirm('Are you sure you wish to split the media sources into separate items?', 'Split Media Apart').then(function () {
            loading.show();
            apiClient.ajax({
                type: 'DELETE',
                url: apiClient.getUrl('Videos/' + pageParams.id + '/AlternateSources')
            }).then(function () {
                loading.hide();
                reload(instance, page, pageParams);
            });
        });
    }

    function getPlayOptions(startPosition) {
        const audioStreamIndex = view.querySelector('.selectAudio').value || null;
        return {
            startPositionTicks: startPosition,
            mediaSourceId: view.querySelector('.selectSource').value,
            audioStreamIndex: audioStreamIndex,
            subtitleStreamIndex: view.querySelector('.selectSubtitles').value
        };
    }

    function playItem(item, startPosition) {
        const playOptions = getPlayOptions(startPosition);
        playOptions.items = [item];
        playbackManager.play(playOptions);
    }

    function playTrailer() {
        playbackManager.playTrailers(currentItem);
    }

    function playCurrentItem(button, mode) {
        const item = currentItem;

        if (item.Type === 'Program') {
            const apiClient = ServerConnections.getApiClient(item.ServerId);
            apiClient.getLiveTvChannel(item.ChannelId, apiClient.getCurrentUserId()).then(function (channel) {
                playbackManager.play({
                    items: [channel]
                });
            });
            return;
        }

        playItem(item, item.UserData && mode === 'resume' ? item.UserData.PlaybackPositionTicks : 0);
    }

    function onPlayClick() {
        let actionElem = this;
        let action = actionElem.getAttribute('data-action');

        if (!action) {
            actionElem = actionElem.querySelector('[data-action]') || actionElem;
            action = actionElem.getAttribute('data-action');
        }

        playCurrentItem(actionElem, action);
    }

    function onInstantMixClick() {
        playbackManager.instantMix(currentItem);
    }

    function onShuffleClick() {
        playbackManager.shuffle(currentItem);
    }

    function onCancelSeriesTimerClick() {
        import('../../components/recordingcreator/recordinghelper').then(({ default: recordingHelper }) => {
            recordingHelper.cancelSeriesTimerWithConfirmation(currentItem.Id, currentItem.ServerId).then(function () {
                Dashboard.navigate('livetv');
            });
        });
    }

    function onCancelTimerClick() {
        import('../../components/recordingcreator/recordinghelper').then(({ default: recordingHelper }) => {
            recordingHelper.cancelTimer(ServerConnections.getApiClient(currentItem.ServerId), currentItem.TimerId).then(function () {
                reload(self, view, params);
            });
        });
    }

    function onPlayTrailerClick() {
        playTrailer();
    }

    function onDownloadClick() {
        const downloadHref = getApiClient().getItemDownloadUrl(currentItem.Id);
        download([{
            url: downloadHref,
            item: currentItem,
            itemId: currentItem.Id,
            serverId: currentItem.ServerId,
            title: currentItem.Name,
            filename: currentItem.Path.replace(/^.*[\\/]/, '')
        }]);
    }

    function onMoreCommandsClick() {
        const button = this;
        let selectedItem = view.querySelector('.selectSource').value || currentItem.Id;

        const apiClient = getApiClient();

        apiClient.getItem(apiClient.getCurrentUserId(), selectedItem).then(function (item) {
            selectedItem = item;

            apiClient.getCurrentUser().then(function (user) {
                itemContextMenu.show(getContextMenuOptions(selectedItem, user, button))
                    .then(function (result) {
                        if (result.deleted) {
                            const parentId = selectedItem.SeasonId || selectedItem.SeriesId || selectedItem.ParentId;

                            if (parentId) {
                                appRouter.showItem(parentId, item.ServerId);
                            } else {
                                appRouter.goHome();
                            }
                        } else if (result.updated) {
                            reload(self, view, params);
                        }
                    })
                    .catch(() => { /* no-op */ });
            });
        });
    }

    function onPlayerChange() {
        renderTrackSelections(view, self, currentItem);
        setTrailerButtonVisibility(view, currentItem);
    }

    function onWebSocketMessage(e, data) {
        const msg = data;
        const apiClient = getApiClient();

        if (msg.MessageType === 'UserDataChanged' && currentItem && msg.Data.UserId == apiClient.getCurrentUserId()) {
            const key = currentItem.UserData.Key;
            const userData = msg.Data.UserDataList.filter(function (u) {
                return u.Key == key;
            })[0];

            if (userData) {
                currentItem.UserData = userData;
                reloadPlayButtons(view, currentItem);
                autoFocus(view);
            }
        }
    }

    let currentItem;
    const self = this;

    function init() {
        const apiClient = getApiClient();

        bindAll(view, '.btnPlay', 'click', onPlayClick);
        bindAll(view, '.btnReplay', 'click', onPlayClick);
        bindAll(view, '.btnInstantMix', 'click', onInstantMixClick);
        bindAll(view, '.btnShuffle', 'click', onShuffleClick);
        bindAll(view, '.btnPlayTrailer', 'click', onPlayTrailerClick);
        bindAll(view, '.btnCancelSeriesTimer', 'click', onCancelSeriesTimerClick);
        bindAll(view, '.btnCancelTimer', 'click', onCancelTimerClick);
        bindAll(view, '.btnDownload', 'click', onDownloadClick);
        view.querySelector('.trackSelections').addEventListener('submit', onTrackSelectionsSubmit);
        view.querySelector('.btnSplitVersions').addEventListener('click', function () {
            splitVersions(self, view, apiClient, params);
        });
        bindAll(view, '.btnMoreCommands', 'click', onMoreCommandsClick);
        view.querySelector('.selectSource').addEventListener('change', function () {
            renderVideoSelections(view, self._currentPlaybackMediaSources);
            renderAudioSelections(view, self._currentPlaybackMediaSources);
            renderSubtitleSelections(view, self._currentPlaybackMediaSources);
            updateMiscInfo();
        });
        view.addEventListener('viewshow', function (e) {
            const page = this;

            libraryMenu.setTransparentMenu(!layoutManager.mobile);

            if (e.detail.isRestored) {
                if (currentItem) {
                    libraryMenu.setTitle('');
                    renderTrackSelections(page, self, currentItem, true);
                    renderBackdrop(page, currentItem);
                }
            } else {
                reload(self, page, params);
            }

            Events.on(apiClient, 'message', onWebSocketMessage);
            Events.on(playbackManager, 'playerchange', onPlayerChange);

            itemShortcuts.on(view.querySelector('.nameContainer'));
        });
        view.addEventListener('viewbeforehide', function () {
            itemShortcuts.off(view.querySelector('.nameContainer'));
            Events.off(apiClient, 'message', onWebSocketMessage);
            Events.off(playbackManager, 'playerchange', onPlayerChange);
            libraryMenu.setTransparentMenu(false);
        });
        view.addEventListener('viewdestroy', function () {
            currentItem = null;
            self._currentPlaybackMediaSources = null;
            self.currentRecordingFields = null;
        });
    }

    function updateMiscInfo() {
        const selectedMediaSource = getSelectedMediaSource(view, self._currentPlaybackMediaSources);
        renderMiscInfo(view, {
            // patch currentItem (primary item) with details from the selected MediaSource:
            ...currentItem,
            ...selectedMediaSource
        });
    }

    init();
}
