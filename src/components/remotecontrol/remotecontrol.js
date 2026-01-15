import escapeHtml from 'escape-html';

import { getImageUrl } from 'apps/stable/features/playback/utils/image';
import { getItemTextLines } from 'apps/stable/features/playback/utils/itemText';
import { AppFeature } from 'constants/appFeature';
import { ItemAction } from 'constants/itemAction';

import datetime from '../../scripts/datetime';
import { clearBackdrop, setBackdrops } from '../backdrop/backdrop';
import listView from '../listview/listview';
import imageLoader from '../images/imageLoader';
import { playbackManager } from '../playback/playbackmanager';
import Events from '../../utils/events.ts';
import { safeAppHost } from '../apphost';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import layoutManager from '../layoutManager';
import * as userSettings from '../../scripts/settings/userSettings';
import itemContextMenu from '../itemContextMenu';
import toast from '../toast/toast';
import { appRouter } from '../router/appRouter';
import { getDefaultBackgroundClass } from '../cardbuilder/cardBuilderUtils';
import { renderDiscImage, renderLogo, renderYear } from 'controllers/itemDetails';

import '../cardbuilder/card.scss';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-itemscontainer/emby-itemscontainer';
import './remotecontrol.scss';
import '../../elements/emby-ratingbutton/emby-ratingbutton';
import '../../elements/emby-slider/emby-slider';

let showMuteButton = true;
let showVolumeSlider = true;

function showAudioMenu(context, player, button) {
    const currentIndex = playbackManager.getAudioStreamIndex(player);
    const streams = playbackManager.audioTracks(player);
    const menuItems = streams.map(function (s) {
        const menuItem = {
            name: s.DisplayTitle,
            id: s.Index
        };

        if (s.Index == currentIndex) {
            menuItem.selected = true;
        }

        return menuItem;
    });

    import('../actionSheet/actionSheet').then((actionsheet) => {
        actionsheet.show({
            items: menuItems,
            positionTo: button,
            callback: function (id) {
                playbackManager.setAudioStreamIndex(parseInt(id, 10), player);
            }
        });
    });
}

function showSubtitleMenu(context, player, button) {
    const currentIndex = playbackManager.getSubtitleStreamIndex(player);
    const streams = playbackManager.subtitleTracks(player);
    const menuItems = streams.map(function (s) {
        const menuItem = {
            name: s.DisplayTitle,
            id: s.Index
        };

        if (s.Index == currentIndex) {
            menuItem.selected = true;
        }

        return menuItem;
    });
    menuItems.unshift({
        id: -1,
        name: globalize.translate('Off'),
        selected: currentIndex == null
    });

    import('../actionSheet/actionSheet').then((actionsheet) => {
        actionsheet.show({
            items: menuItems,
            positionTo: button,
            callback: function (id) {
                playbackManager.setSubtitleStreamIndex(parseInt(id, 10), player);
            }
        });
    });
}

function updateNowPlayingInfo(context, state, serverId) {
    const item = state.NowPlayingItem;
    const displayName = item ?
        getItemTextLines(item).map(escapeHtml).join(' - ') :
        '';
    if (item) {
        const nowPlayingServerId = (item.ServerId || serverId);
        if (item.Type == 'AudioBook' || item.Type == 'Audio' || item.MediaStreams[0].Type == 'Audio') {
            let artistsSeries = '';
            let albumName = '';
            if (item.Artists != null) {
                if (item.ArtistItems != null) {
                    for (const artist of item.ArtistItems) {
                        artistsSeries += `<a class="button-link" is="emby-linkbutton" href="#/details?id=${artist.Id}&serverId=${nowPlayingServerId}">${escapeHtml(artist.Name)}</a>`;
                        if (artist !== item.ArtistItems.slice(-1)[0]) {
                            artistsSeries += ', ';
                        }
                    }
                } else if (item.Artists) {
                    // For some reason, Chromecast Player doesn't return a item.ArtistItems object, so we need to fallback
                    // to normal item.Artists item.
                    // TODO: Normalise fields returned by all the players
                    for (const artist of item.Artists) {
                        artistsSeries += `<a>${escapeHtml(artist)}</a>`;
                        if (artist !== item.Artists.slice(-1)[0]) {
                            artistsSeries += ', ';
                        }
                    }
                }
            }
            if (item.Album != null) {
                albumName = '<a class="button-link" is="emby-linkbutton" href="#/details?id=' + item.AlbumId + `&serverId=${nowPlayingServerId}">` + escapeHtml(item.Album) + '</a>';
            }
            context.querySelector('.nowPlayingAlbum').innerHTML = albumName;
            context.querySelector('.nowPlayingArtist').innerHTML = artistsSeries;
            context.querySelector('.nowPlayingSongName').innerText = item.Name;
        } else if (item.Type == 'Episode') {
            if (item.SeasonName != null) {
                const seasonName = item.SeasonName;
                context.querySelector('.nowPlayingSeason').innerHTML = '<a class="button-link" is="emby-linkbutton" href="#/details?id=' + item.SeasonId + `&serverId=${nowPlayingServerId}">${escapeHtml(seasonName)}</a>`;
            }
            if (item.SeriesName != null) {
                const seriesName = item.SeriesName;
                if (item.SeriesId != null) {
                    context.querySelector('.nowPlayingSerie').innerHTML = '<a class="button-link" is="emby-linkbutton" href="#/details?id=' + item.SeriesId + `&serverId=${nowPlayingServerId}">${escapeHtml(seriesName)}</a>`;
                } else {
                    context.querySelector('.nowPlayingSerie').innerText = seriesName;
                }
            }
            context.querySelector('.nowPlayingEpisode').innerText = item.Name;
        } else {
            context.querySelector('.nowPlayingPageTitle').innerHTML = displayName;
        }

        if (displayName.length > 0 && item.Type != 'Audio' && item.Type != 'Episode') {
            context.querySelector('.nowPlayingPageTitle').classList.remove('hide');
        } else {
            context.querySelector('.nowPlayingPageTitle').classList.add('hide');
        }

        const url = getImageUrl(item, {
            maxHeight: 300
        });

        let contextButton = context.querySelector('.btnToggleContextMenu');
        // We remove the previous event listener by replacing the item in each update event
        const autoFocusContextButton = document.activeElement === contextButton;
        const contextButtonClone = contextButton.cloneNode(true);
        contextButton.parentNode.replaceChild(contextButtonClone, contextButton);
        contextButton = context.querySelector('.btnToggleContextMenu');
        if (autoFocusContextButton) {
            contextButton.focus();
        }
        const options = {
            play: false,
            queue: false,
            stopPlayback: true,
            clearQueue: true,
            openAlbum: false,
            positionTo: contextButton
        };
        const apiClient = ServerConnections.getApiClient(item.ServerId);
        apiClient.getItem(apiClient.getCurrentUserId(), item.Id).then(function (fullItem) {
            apiClient.getCurrentUser().then(function (user) {
                contextButton.addEventListener('click', function () {
                    itemContextMenu.show(Object.assign({
                        item: fullItem,
                        user: user,
                        isMobile: layoutManager.mobile
                    }, options))
                        .catch(() => { /* no-op */ });
                });
            });
        });
        setImageUrl(context, state, url);
        renderLogo(document.querySelector('#nowPlayingPage'), item, apiClient);
        renderYear(document.querySelector('#nowPlayingPage'), item, apiClient);
        renderDiscImage(document.querySelector('#nowPlayingPage'), item, apiClient);
        setBackdrops([item]);
        apiClient.getItem(apiClient.getCurrentUserId(), item.Id).then(function (fullItem) {
            const userData = fullItem.UserData || {};
            const likes = userData.Likes == null ? '' : userData.Likes;
            context.querySelector('.nowPlayingPageUserDataButtonsTitle').innerHTML = '<button is="emby-ratingbutton" type="button" class="paper-icon-button-light" data-id="' + fullItem.Id + '" data-serverid="' + fullItem.ServerId + '" data-itemtype="' + fullItem.Type + '" data-likes="' + likes + '" data-isfavorite="' + userData.IsFavorite + '"><span class="material-icons favorite" aria-hidden="true"></span></button>';
            context.querySelector('.nowPlayingPageUserDataButtons').innerHTML = '<button is="emby-ratingbutton" type="button" class="paper-icon-button-light" data-id="' + fullItem.Id + '" data-serverid="' + fullItem.ServerId + '" data-itemtype="' + fullItem.Type + '" data-likes="' + likes + '" data-isfavorite="' + userData.IsFavorite + '"><span class="material-icons favorite" aria-hidden="true"></span></button>';
        });
    } else {
        clearBackdrop();
        context.querySelector('.nowPlayingPageUserDataButtons').innerHTML = '';
    }
}

function setImageUrl(context, state, url) {
    const item = state.NowPlayingItem;
    const imgContainer = context.querySelector('.nowPlayingPageImageContainer');

    if (url) {
        imgContainer.innerHTML = '<img class="nowPlayingPageImage" src="' + url + '" />';

        context.querySelector('.nowPlayingPageImage').classList.toggle('nowPlayingPageImageAudio', item.Type === 'Audio');
        context.querySelector('.nowPlayingPageImage').classList.toggle('nowPlayingPageImagePoster', item.Type !== 'Audio');
    } else {
        imgContainer.innerHTML = `<div class="nowPlayingPageImageContainerNoAlbum"><button data-action="${ItemAction.Link}" class="cardImageContainer coveredImage ${getDefaultBackgroundClass(item.Name)} cardContent cardContent-shadow itemAction"><span class="cardImageIcon material-icons album" aria-hidden="true"></span></button></div>`;
    }
}

function buttonVisible(btn, enabled) {
    if (enabled) {
        btn.classList.remove('hide');
    } else {
        btn.classList.add('hide');
    }
}

function updateSupportedCommands(context, commands) {
    const all = context.querySelectorAll('.btnCommand');

    for (let i = 0, length = all.length; i < length; i++) {
        const enableButton = commands.indexOf(all[i].getAttribute('data-command')) !== -1;
        all[i].disabled = !enableButton;
    }
}

export default function () {
    function toggleRepeat() {
        switch (playbackManager.getRepeatMode()) {
            case 'RepeatAll':
                playbackManager.setRepeatMode('RepeatOne');
                break;
            case 'RepeatOne':
                playbackManager.setRepeatMode('RepeatNone');
                break;
            case 'RepeatNone':
                playbackManager.setRepeatMode('RepeatAll');
        }
    }

    function updatePlayerState(player, context, state) {
        lastPlayerState = state;
        const item = state.NowPlayingItem;
        const playerInfo = playbackManager.getPlayerInfo();
        const supportedCommands = playerInfo.supportedCommands;
        currentPlayerSupportedCommands = supportedCommands;
        const playState = state.PlayState || {};
        const isSupportedCommands = supportedCommands.includes('DisplayMessage') || supportedCommands.includes('SendString') || supportedCommands.includes('Select');
        buttonVisible(context.querySelector('.btnToggleFullscreen'), item && item.MediaType == 'Video' && supportedCommands.includes('ToggleFullscreen'));
        updateAudioTracksDisplay(player, context);
        updateSubtitleTracksDisplay(player, context);

        if (supportedCommands.includes('DisplayMessage') && !currentPlayer.isLocalPlayer) {
            context.querySelector('.sendMessageSection').classList.remove('hide');
        } else {
            context.querySelector('.sendMessageSection').classList.add('hide');
        }

        if (supportedCommands.includes('SendString') && !currentPlayer.isLocalPlayer) {
            context.querySelector('.sendTextSection').classList.remove('hide');
        } else {
            context.querySelector('.sendTextSection').classList.add('hide');
        }

        if (supportedCommands.includes('Select') && !currentPlayer.isLocalPlayer) {
            context.querySelector('.navigationSection').classList.remove('hide');
        } else {
            context.querySelector('.navigationSection').classList.add('hide');
        }

        if (isSupportedCommands && !currentPlayer.isLocalPlayer) {
            context.querySelector('.remoteControlSection').classList.remove('hide');
        } else {
            context.querySelector('.remoteControlSection').classList.add('hide');
        }

        buttonVisible(context.querySelector('.btnLyrics'), item?.Type === 'Audio' && !layoutManager.mobile);
        buttonVisible(context.querySelector('.btnStop'), item != null);
        buttonVisible(context.querySelector('.btnNextTrack'), item != null);
        buttonVisible(context.querySelector('.btnPreviousTrack'), item != null);
        if (layoutManager.mobile) {
            const playingVideo = playbackManager.isPlayingVideo() && item !== null;
            const playingAudio = !playbackManager.isPlayingVideo() && item !== null;
            const playingAudioBook = playingAudio && item.Type == 'AudioBook';
            buttonVisible(context.querySelector('.btnRepeat'), playingAudio && !playingAudioBook);
            buttonVisible(context.querySelector('.btnShuffleQueue'), playingAudio && !playingAudioBook);
            buttonVisible(context.querySelector('.btnRewind'), playingVideo || playingAudioBook);
            buttonVisible(context.querySelector('.btnFastForward'), playingVideo || playingAudioBook);
            buttonVisible(context.querySelector('.nowPlayingSecondaryButtons .btnShuffleQueue'), playingVideo);
            buttonVisible(context.querySelector('.nowPlayingSecondaryButtons .btnRepeat'), playingVideo);
        } else {
            buttonVisible(context.querySelector('.btnRewind'), item != null);
            buttonVisible(context.querySelector('.btnFastForward'), item != null);
        }
        const positionSlider = context.querySelector('.nowPlayingPositionSlider');

        if (positionSlider && item && item.RunTimeTicks) {
            positionSlider.setKeyboardSteps(userSettings.skipBackLength() * 1000000 / item.RunTimeTicks,
                userSettings.skipForwardLength() * 1000000 / item.RunTimeTicks);
        }

        if (positionSlider && !positionSlider.dragging) {
            positionSlider.disabled = !playState.CanSeek;
            const isProgressClear = state.MediaSource && state.MediaSource.RunTimeTicks == null;
            positionSlider.setIsClear(isProgressClear);
        }

        updatePlayPauseState(playState.IsPaused, item != null);
        updateTimeDisplay(playState.PositionTicks, item ? item.RunTimeTicks : null);
        updatePlayerVolumeState(context, playState.IsMuted, playState.VolumeLevel);

        if (item && item.MediaType == 'Video') {
            context.classList.remove('hideVideoButtons');
        } else {
            context.classList.add('hideVideoButtons');
        }

        updateRepeatModeDisplay(playbackManager.getRepeatMode());
        onShuffleQueueModeChange(false);
        updateNowPlayingInfo(context, state);
    }

    function updateAudioTracksDisplay(player, context) {
        const supportedCommands = currentPlayerSupportedCommands;
        buttonVisible(context.querySelector('.btnAudioTracks'), playbackManager.audioTracks(player).length > 1 && supportedCommands.indexOf('SetAudioStreamIndex') != -1);
    }

    function updateSubtitleTracksDisplay(player, context) {
        const supportedCommands = currentPlayerSupportedCommands;
        buttonVisible(context.querySelector('.btnSubtitles'), playbackManager.subtitleTracks(player).length && supportedCommands.indexOf('SetSubtitleStreamIndex') != -1);
    }

    function updateRepeatModeDisplay(repeatMode) {
        const context = dlg;
        const toggleRepeatButtons = context.querySelectorAll('.repeatToggleButton');
        const cssClass = 'buttonActive';
        let innHtml = '<span class="material-icons repeat" aria-hidden="true"></span>';
        let repeatOn = true;

        switch (repeatMode) {
            case 'RepeatAll':
                break;
            case 'RepeatOne':
                innHtml = '<span class="material-icons repeat_one" aria-hidden="true"></span>';
                break;
            case 'RepeatNone':
            default:
                repeatOn = false;
                break;
        }

        for (const toggleRepeatButton of toggleRepeatButtons) {
            toggleRepeatButton.classList.toggle(cssClass, repeatOn);
            toggleRepeatButton.innerHTML = innHtml;
        }
    }

    function updatePlayerVolumeState(context, isMuted, volumeLevel) {
        const view = context;
        const supportedCommands = currentPlayerSupportedCommands;

        if (supportedCommands.indexOf('Mute') === -1) {
            showMuteButton = false;
        }

        if (supportedCommands.indexOf('SetVolume') === -1) {
            showVolumeSlider = false;
        }

        if (currentPlayer.isLocalPlayer && safeAppHost.supports(AppFeature.PhysicalVolumeControl)) {
            showMuteButton = false;
            showVolumeSlider = false;
        }

        const buttonMute = view.querySelector('.buttonMute');
        const buttonMuteIcon = buttonMute.querySelector('.material-icons');

        buttonMuteIcon.classList.remove('volume_off', 'volume_up');

        if (isMuted) {
            buttonMute.setAttribute('title', globalize.translate('Unmute'));
            buttonMuteIcon.classList.add('volume_off');
        } else {
            buttonMute.setAttribute('title', globalize.translate('Mute'));
            buttonMuteIcon.classList.add('volume_up');
        }

        if (!showMuteButton && !showVolumeSlider) {
            context.querySelector('.volumecontrol').classList.add('hide');
        } else {
            buttonMute.classList.toggle('hide', !showMuteButton);

            const nowPlayingVolumeSlider = context.querySelector('.nowPlayingVolumeSlider');
            const nowPlayingVolumeSliderContainer = context.querySelector('.nowPlayingVolumeSliderContainer');

            if (nowPlayingVolumeSlider) {
                nowPlayingVolumeSliderContainer.classList.toggle('hide', !showVolumeSlider);

                if (!nowPlayingVolumeSlider.dragging) {
                    nowPlayingVolumeSlider.value = volumeLevel || 0;
                }
            }
        }
    }

    function updatePlayPauseState(isPaused, isActive) {
        const context = dlg;
        const btnPlayPause = context.querySelector('.btnPlayPause');
        const btnPlayPauseIcon = btnPlayPause.querySelector('.material-icons');

        btnPlayPauseIcon.classList.remove('play_circle_filled', 'pause_circle_filled');
        btnPlayPauseIcon.classList.add(isPaused ? 'play_circle_filled' : 'pause_circle_filled');

        const playlistIndicator = context.querySelector('.playlistIndexIndicatorImage');
        if (playlistIndicator) {
            playlistIndicator.classList.toggle('playlistIndexIndicatorPausedImage', isPaused);
        }

        buttonVisible(btnPlayPause, isActive);
    }

    function updateTimeDisplay(positionTicks, runtimeTicks) {
        const context = dlg;
        const positionSlider = context.querySelector('.nowPlayingPositionSlider');

        if (positionSlider && !positionSlider.dragging) {
            if (runtimeTicks) {
                let pct = positionTicks / runtimeTicks;
                pct *= 100;
                positionSlider.value = pct;
            } else {
                positionSlider.value = 0;
            }
        }

        context.querySelector('.positionTime').innerHTML = Number.isFinite(positionTicks) ? datetime.getDisplayRunningTime(positionTicks) : '--:--';
        context.querySelector('.runtime').innerHTML = Number.isFinite(runtimeTicks) ? datetime.getDisplayRunningTime(runtimeTicks) : '--:--';
    }

    function getPlaylistItems(player) {
        return playbackManager.getPlaylist(player);
    }

    function loadPlaylist(context, player) {
        getPlaylistItems(player).then(function (items) {
            if (items.length === 0) {
                return;
            }

            let html = '';
            let favoritesEnabled = true;
            if (layoutManager.mobile) {
                if (items.length > 0) {
                    context.querySelector('.btnTogglePlaylist').classList.remove('hide');
                } else {
                    context.querySelector('.btnTogglePlaylist').classList.add('hide');
                }
                favoritesEnabled = false;
            }

            html += listView.getListViewHtml({
                items: items,
                smallIcon: true,
                action: 'setplaylistindex',
                enableUserDataButtons: favoritesEnabled,
                rightButtons: [{
                    icon: 'remove_circle_outline',
                    title: globalize.translate('ButtonRemove'),
                    id: 'remove'
                }],
                dragHandle: true
            });

            const itemsContainer = context.querySelector('.playlist');
            let focusedItemPlaylistId = itemsContainer.querySelector('button:focus');
            itemsContainer.innerHTML = html;
            if (focusedItemPlaylistId !== null) {
                focusedItemPlaylistId = focusedItemPlaylistId.getAttribute('data-playlistitemid');
                const newFocusedItem = itemsContainer.querySelector(`button[data-playlistitemid="${focusedItemPlaylistId}"]`);
                if (newFocusedItem !== null) {
                    newFocusedItem.focus();
                }
            }

            const playlistItemId = playbackManager.getCurrentPlaylistItemId(player);

            if (playlistItemId) {
                const img = itemsContainer.querySelector(`.listItem[data-playlistItemId="${playlistItemId}"] .listItemImage`);

                if (img) {
                    img.classList.remove('lazy');
                    img.classList.add('playlistIndexIndicatorImage');
                    img.classList.toggle('playlistIndexIndicatorPausedImage', playbackManager.paused());
                }
            }

            imageLoader.lazyChildren(itemsContainer);
        });
    }

    function onPlaybackStart(e, state) {
        console.debug('remotecontrol event: ' + e.type);
        const player = this;
        onStateChanged.call(player, e, state);
    }

    function onRepeatModeChange() {
        updateRepeatModeDisplay(playbackManager.getRepeatMode());
    }

    function onShuffleQueueModeChange(updateView = true) {
        const shuffleMode = playbackManager.getQueueShuffleMode(this);
        const context = dlg;
        const cssClass = 'buttonActive';
        const shuffleButtons = context.querySelectorAll('.btnShuffleQueue');

        for (const shuffleButton of shuffleButtons) {
            switch (shuffleMode) {
                case 'Shuffle':
                    shuffleButton.classList.add(cssClass);
                    break;
                case 'Sorted':
                default:
                    shuffleButton.classList.remove(cssClass);
                    break;
            }
        }

        if (updateView) {
            onPlaylistUpdate();
        }
    }

    function onPlaylistUpdate() {
        loadPlaylist(dlg, this);
    }

    function onPlaylistItemRemoved(e, info) {
        const context = dlg;
        if (info !== undefined) {
            const playlistItemIds = info.playlistItemIds;

            for (let i = 0, length = playlistItemIds.length; i < length; i++) {
                const listItem = context.querySelector('.listItem[data-playlistItemId="' + playlistItemIds[i] + '"]');

                if (listItem) {
                    listItem.parentNode.removeChild(listItem);
                }
            }
        } else {
            onPlaylistUpdate();
        }
    }

    function onPlaybackStopped(e, state) {
        console.debug('remotecontrol event: ' + e.type);
        const player = this;

        if (!state.NextMediaType) {
            updatePlayerState(player, dlg, {});
            appRouter.back();
        }
    }

    function onPlayPauseStateChanged() {
        updatePlayPauseState(this.paused(), true);
    }

    function onStateChanged(event, state) {
        const player = this;
        updatePlayerState(player, dlg, state);
        onPlaylistUpdate();
    }

    function onTimeUpdate() {
        const now = new Date().getTime();

        if (now - lastUpdateTime >= 700) {
            lastUpdateTime = now;
            const player = this;
            currentRuntimeTicks = playbackManager.duration(player);
            updateTimeDisplay(playbackManager.currentTime(player) * 10000, currentRuntimeTicks);
        }
    }

    function onVolumeChanged() {
        const player = this;
        updatePlayerVolumeState(dlg, player.isMuted(), player.getVolume());
    }

    function releaseCurrentPlayer() {
        const player = currentPlayer;

        if (player) {
            Events.off(player, 'playbackstart', onPlaybackStart);
            Events.off(player, 'statechange', onStateChanged);
            Events.off(player, 'repeatmodechange', onRepeatModeChange);
            Events.off(player, 'shufflequeuemodechange', onShuffleQueueModeChange);
            Events.off(player, 'playlistitemremove', onPlaylistItemRemoved);
            Events.off(player, 'playlistitemmove', onPlaylistUpdate);
            Events.off(player, 'playlistitemadd', onPlaylistUpdate);
            Events.off(player, 'playbackstop', onPlaybackStopped);
            Events.off(player, 'volumechange', onVolumeChanged);
            Events.off(player, 'pause', onPlayPauseStateChanged);
            Events.off(player, 'unpause', onPlayPauseStateChanged);
            Events.off(player, 'timeupdate', onTimeUpdate);
            currentPlayer = null;
        }
    }

    function bindToPlayer(context, player) {
        releaseCurrentPlayer();
        currentPlayer = player;

        if (player) {
            const state = playbackManager.getPlayerState(player);
            onStateChanged.call(player, {
                type: 'init'
            }, state);
            Events.on(player, 'playbackstart', onPlaybackStart);
            Events.on(player, 'statechange', onStateChanged);
            Events.on(player, 'repeatmodechange', onRepeatModeChange);
            Events.on(player, 'shufflequeuemodechange', onShuffleQueueModeChange);
            Events.on(player, 'playlistitemremove', onPlaylistItemRemoved);
            Events.on(player, 'playlistitemmove', onPlaylistUpdate);
            Events.on(player, 'playlistitemadd', onPlaylistUpdate);
            Events.on(player, 'playbackstop', onPlaybackStopped);
            Events.on(player, 'volumechange', onVolumeChanged);
            Events.on(player, 'pause', onPlayPauseStateChanged);
            Events.on(player, 'unpause', onPlayPauseStateChanged);
            Events.on(player, 'timeupdate', onTimeUpdate);
            const playerInfo = playbackManager.getPlayerInfo();
            const supportedCommands = playerInfo.supportedCommands;
            currentPlayerSupportedCommands = supportedCommands;
            updateSupportedCommands(context, supportedCommands);
        }
    }

    function onBtnCommandClick() {
        if (currentPlayer) {
            if (this.classList.contains('repeatToggleButton')) {
                toggleRepeat();
            } else {
                playbackManager.sendCommand({
                    Name: this.getAttribute('data-command')
                }, currentPlayer);
            }
        }
    }

    function getSaveablePlaylistItems() {
        return getPlaylistItems(currentPlayer).then(function (items) {
            return items.filter(function (i) {
                return i.Id && i.ServerId;
            });
        });
    }

    function savePlaylist() {
        import('../playlisteditor/playlisteditor').then(({ default: PlaylistEditor }) => {
            getSaveablePlaylistItems().then(function (items) {
                const serverId = items.length ? items[0].ServerId : ApiClient.serverId();
                const playlistEditor = new PlaylistEditor();
                playlistEditor.show({
                    items: items.map(function (i) {
                        return i.Id;
                    }),
                    serverId: serverId,
                    enableAddToPlayQueue: false,
                    defaultValue: 'new'
                }).catch(() => {
                    // Dialog closed
                });
            });
        }).catch(err => {
            console.error('[savePlaylist] failed to load playlist editor', err);
        });
    }

    function bindEvents(context) {
        const btnCommand = context.querySelectorAll('.btnCommand');
        const positionSlider = context.querySelector('.nowPlayingPositionSlider');

        for (let i = 0, length = btnCommand.length; i < length; i++) {
            btnCommand[i].addEventListener('click', onBtnCommandClick);
        }

        context.querySelector('.btnToggleFullscreen').addEventListener('click', function () {
            if (currentPlayer) {
                playbackManager.toggleFullscreen(currentPlayer);
            }
        });
        context.querySelector('.btnAudioTracks').addEventListener('click', function (e) {
            if (currentPlayer && lastPlayerState?.NowPlayingItem) {
                showAudioMenu(context, currentPlayer, e.target);
            }
        });
        context.querySelector('.btnSubtitles').addEventListener('click', function (e) {
            if (currentPlayer && lastPlayerState?.NowPlayingItem) {
                showSubtitleMenu(context, currentPlayer, e.target);
            }
        });
        context.querySelector('.btnStop').addEventListener('click', function () {
            if (currentPlayer) {
                playbackManager.stop(currentPlayer);
            }
        });
        context.querySelector('.btnPlayPause').addEventListener('click', function () {
            if (currentPlayer) {
                playbackManager.playPause(currentPlayer);
            }
        });
        context.querySelector('.btnNextTrack').addEventListener('click', function () {
            if (currentPlayer) {
                playbackManager.nextTrack(currentPlayer);
            }
        });
        context.querySelector('.btnRewind').addEventListener('click', function () {
            if (currentPlayer) {
                playbackManager.rewind(currentPlayer);
            }
        });
        context.querySelector('.btnFastForward').addEventListener('click', function () {
            if (currentPlayer) {
                playbackManager.fastForward(currentPlayer);
            }
        });
        context.querySelector('.btnLyrics').addEventListener('click', function () {
            appRouter.show('lyrics');
        });

        for (const shuffleButton of context.querySelectorAll('.btnShuffleQueue')) {
            shuffleButton.addEventListener('click', function () {
                if (currentPlayer) {
                    playbackManager.toggleQueueShuffleMode(currentPlayer);
                }
            });
        }

        context.querySelector('.btnPreviousTrack').addEventListener('click', function (e) {
            if (currentPlayer) {
                if (playbackManager.isPlayingAudio(currentPlayer)) {
                    // Cancel this event if doubleclick is fired. The actual previousTrack will be processed by the 'dblclick' event
                    if (e.detail > 1 ) {
                        return;
                    }

                    // Return to start of track, unless we are already (almost) at the beginning. In the latter case, continue and move
                    // to the previous track, unless we are at the first track so no previous track exists.
                    // currentTime is in msec.

                    if (playbackManager.currentTime(currentPlayer) >= 5 * 1000 || playbackManager.getCurrentPlaylistIndex(currentPlayer) <= 0) {
                        playbackManager.seekPercent(0, currentPlayer);
                        // This is done automatically by playbackManager, however, setting this here gives instant visual feedback.
                        // TODO: Check why seekPercent doesn't reflect the changes inmmediately, so we can remove this workaround.
                        positionSlider.value = 0;
                        return;
                    }
                }
                playbackManager.previousTrack(currentPlayer);
            }
        });

        context.querySelector('.btnPreviousTrack').addEventListener('dblclick', function () {
            if (currentPlayer) {
                playbackManager.previousTrack(currentPlayer);
            }
        });
        positionSlider.addEventListener('change', function () {
            const value = this.value;

            if (currentPlayer) {
                const newPercent = parseFloat(value);
                playbackManager.seekPercent(newPercent, currentPlayer);
            }
        });

        positionSlider.getBubbleText = function (value) {
            const state = lastPlayerState;

            if (!state?.NowPlayingItem || !currentRuntimeTicks) {
                return '--:--';
            }

            let ticks = currentRuntimeTicks;
            ticks /= 100;
            ticks *= value;
            return datetime.getDisplayRunningTime(ticks);
        };

        context.querySelector('.nowPlayingVolumeSlider').addEventListener('input', (e) => {
            playbackManager.setVolume(e.target.value, currentPlayer);
        });

        context.querySelector('.buttonMute').addEventListener('click', function () {
            playbackManager.toggleMute(currentPlayer);
        });
        const playlistContainer = context.querySelector('.playlist');
        playlistContainer.addEventListener('action-remove', function (e) {
            playbackManager.removeFromPlaylist([e.detail.playlistItemId], currentPlayer);
        });
        playlistContainer.addEventListener('itemdrop', function (e) {
            const newIndex = e.detail.newIndex;
            const playlistItemId = e.detail.playlistItemId;
            playbackManager.movePlaylistItem(playlistItemId, newIndex, currentPlayer);
        });
        context.querySelector('.btnSavePlaylist').addEventListener('click', savePlaylist);
        context.querySelector('.btnTogglePlaylist').addEventListener('click', function () {
            if (context.querySelector('.playlist').classList.contains('hide')) {
                context.querySelector('.playlist').classList.remove('hide');
                context.querySelector('.btnSavePlaylist').classList.remove('hide');
                context.querySelector('.volumecontrol').classList.add('hide');
                if (layoutManager.mobile) {
                    context.querySelector('.playlistSectionButton').classList.remove('playlistSectionButtonTransparent');
                }
            } else {
                context.querySelector('.playlist').classList.add('hide');
                context.querySelector('.btnSavePlaylist').classList.add('hide');
                if (showMuteButton || showVolumeSlider) {
                    context.querySelector('.volumecontrol').classList.remove('hide');
                }
                if (layoutManager.mobile) {
                    context.querySelector('.playlistSectionButton').classList.add('playlistSectionButtonTransparent');
                }
            }
        });
    }

    function onPlayerChange() {
        bindToPlayer(dlg, playbackManager.getCurrentPlayer());
    }

    function onMessageSubmit(e) {
        const form = e.target;
        playbackManager.sendCommand({
            Name: 'DisplayMessage',
            Arguments: {
                Header: form.querySelector('#txtMessageTitle').value,
                Text: form.querySelector('#txtMessageText', form).value
            }
        }, currentPlayer);
        form.querySelector('input').value = '';

        toast(globalize.translate('MessageSent'));

        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    function onSendStringSubmit(e) {
        const form = e.target;
        playbackManager.sendCommand({
            Name: 'SendString',
            Arguments: {
                String: form.querySelector('#txtTypeText', form).value
            }
        }, currentPlayer);
        form.querySelector('input').value = '';

        toast(globalize.translate('TextSent'));

        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    function init(ownerView, context) {
        let volumecontrolHtml = '<div class="volumecontrol flex align-items-center flex-wrap-wrap justify-content-center">';
        volumecontrolHtml += `<button is="paper-icon-button-light" class="buttonMute autoSize" title=${globalize.translate('Mute')}><span class="xlargePaperIconButton material-icons volume_up" aria-hidden="true"></span></button>`;
        volumecontrolHtml += '<div class="sliderContainer nowPlayingVolumeSliderContainer"><input is="emby-slider" type="range" step="1" min="0" max="100" value="0" class="nowPlayingVolumeSlider"/></div>';
        volumecontrolHtml += '</div>';
        const optionsSection = context.querySelector('.playlistSectionButton');
        if (!layoutManager.mobile) {
            context.querySelector('.nowPlayingSecondaryButtons').insertAdjacentHTML('beforeend', volumecontrolHtml);
            optionsSection.classList.remove('align-items-center', 'justify-content-center');
            optionsSection.classList.add('align-items-right', 'justify-content-flex-end');
            context.querySelector('.playlist').classList.remove('hide');
            context.querySelector('.btnSavePlaylist').classList.remove('hide');
            context.classList.add('padded-bottom');
        } else {
            optionsSection.querySelector('.btnTogglePlaylist').insertAdjacentHTML('afterend', volumecontrolHtml);
            optionsSection.classList.add('playlistSectionButtonTransparent');
            context.querySelector('.btnTogglePlaylist').classList.remove('hide');
            context.querySelector('.playlistSectionButton').classList.remove('justify-content-center');
            context.querySelector('.playlistSectionButton').classList.add('justify-content-space-between');
        }

        bindEvents(context);
        context.querySelector('.sendMessageForm').addEventListener('submit', onMessageSubmit);
        context.querySelector('.typeTextForm').addEventListener('submit', onSendStringSubmit);
        Events.on(playbackManager, 'playerchange', onPlayerChange);

        if (layoutManager.tv) {
            const positionSlider = context.querySelector('.nowPlayingPositionSlider');
            positionSlider.classList.add('focusable');
            positionSlider.enableKeyboardDragging();
        }
    }

    function onDialogClosed() {
        releaseCurrentPlayer();
        Events.off(playbackManager, 'playerchange', onPlayerChange);
        lastPlayerState = null;
    }

    function onShow(context) {
        bindToPlayer(context, playbackManager.getCurrentPlayer());
    }

    let dlg;
    let currentPlayer;
    let lastPlayerState;
    let currentPlayerSupportedCommands = [];
    let lastUpdateTime = 0;
    let currentRuntimeTicks = 0;
    const self = this;

    self.init = function (ownerView, context) {
        dlg = context;
        init(ownerView, dlg);
    };

    self.onShow = function () {
        onShow(dlg);
    };

    self.destroy = function () {
        onDialogClosed();
    };
}
