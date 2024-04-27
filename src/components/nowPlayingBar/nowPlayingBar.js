import datetime from '../../scripts/datetime';
import Events from '../../utils/events.ts';
import browser from '../../scripts/browser';
import imageLoader from '../images/imageLoader';
import layoutManager from '../layoutManager';
import { playbackManager } from '../playback/playbackmanager';
import nowPlayingHelper from '../playback/nowplayinghelper';
import { appHost } from '../apphost';
import dom from '../../scripts/dom';
import globalize from 'scripts/globalize';
import itemContextMenu from '../itemContextMenu';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-ratingbutton/emby-ratingbutton';
import ServerConnections from '../ServerConnections';
import appFooter from '../appFooter/appFooter';
import itemShortcuts from '../shortcuts';
import './nowPlayingBar.scss';
import '../../elements/emby-slider/emby-slider';
import { appRouter } from '../router/appRouter';

let currentPlayer;
let currentPlayerSupportedCommands = [];

let currentTimeElement;
let nowPlayingImageElement;
let nowPlayingImageUrl;
let nowPlayingTextElement;
let nowPlayingUserData;
let muteButton;
let volumeSlider;
let volumeSliderContainer;
let playPauseButtons;
let positionSlider;
let toggleAirPlayButton;
let toggleRepeatButton;
let toggleRepeatButtonIcon;
let lyricButton;

let lastUpdateTime = 0;
let lastPlayerState = {};
let isEnabled;
let currentRuntimeTicks = 0;

let isVisibilityAllowed = true;

let lyricPageActive = false;
let isAudio = false;

function getNowPlayingBarHtml() {
    let html = '';

    html += '<div class="nowPlayingBar hide nowPlayingBar-hidden">';

    html += '<div class="nowPlayingBarTop">';
    html += '<div class="nowPlayingBarPositionContainer sliderContainer" dir="ltr">';
    html += '<input type="range" is="emby-slider" pin step=".01" min="0" max="100" value="0" class="slider-medium-thumb nowPlayingBarPositionSlider" data-slider-keep-progress="true"/>';
    html += '</div>';

    html += '<div class="nowPlayingBarInfoContainer">';
    html += '<div class="nowPlayingImage"></div>';
    html += '<div class="nowPlayingBarText"></div>';
    html += '</div>';

    // The onclicks are needed due to the return false above
    html += '<div class="nowPlayingBarCenter" dir="ltr">';

    html += `<button is="paper-icon-button-light" class="previousTrackButton mediaButton" title="${globalize.translate('ButtonPreviousTrack')}"><span class="material-icons skip_previous" aria-hidden="true"></span></button>`;

    html += `<button is="paper-icon-button-light" class="playPauseButton mediaButton" title="${globalize.translate('ButtonPause')}"><span class="material-icons pause" aria-hidden="true"></span></button>`;

    html += `<button is="paper-icon-button-light" class="stopButton mediaButton" title="${globalize.translate('ButtonStop')}"><span class="material-icons stop" aria-hidden="true"></span></button>`;
    if (!layoutManager.mobile) {
        html += `<button is="paper-icon-button-light" class="nextTrackButton mediaButton" title="${globalize.translate('ButtonNextTrack')}"><span class="material-icons skip_next" aria-hidden="true"></span></button>`;
    }

    html += '<div class="nowPlayingBarCurrentTime"></div>';
    html += '</div>';

    html += '<div class="nowPlayingBarRight">';

    html += `<button is="paper-icon-button-light" class="muteButton mediaButton" title="${globalize.translate('Mute')}"><span class="material-icons volume_up" aria-hidden="true"></span></button>`;

    html += '<div class="sliderContainer nowPlayingBarVolumeSliderContainer hide" style="width:9em;vertical-align:middle;display:inline-flex;">';
    html += '<input type="range" is="emby-slider" pin step="1" min="0" max="100" value="0" class="slider-medium-thumb nowPlayingBarVolumeSlider"/>';
    html += '</div>';

    html += `<button is="paper-icon-button-light" class="btnAirPlay mediaButton" title="${globalize.translate('AirPlay')}"><span class="material-icons airplay" aria-hidden="true"></span></button>`;

    html += `<button is="paper-icon-button-light" class="openLyricsButton mediaButton" title="${globalize.translate('Lyrics')}"><span class="material-icons lyrics" style="top:0.1em" aria-hidden="true"></span></button>`;

    html += `<button is="paper-icon-button-light" class="toggleRepeatButton mediaButton" title="${globalize.translate('Repeat')}"><span class="material-icons repeat" aria-hidden="true"></span></button>`;
    html += `<button is="paper-icon-button-light" class="btnShuffleQueue mediaButton" title="${globalize.translate('Shuffle')}"><span class="material-icons shuffle" aria-hidden="true"></span></button>`;

    html += '<div class="nowPlayingBarUserDataButtons">';
    html += '</div>';

    html += `<button is="paper-icon-button-light" class="playPauseButton mediaButton" title="${globalize.translate('ButtonPause')}"><span class="material-icons pause" aria-hidden="true"></span></button>`;
    if (layoutManager.mobile) {
        html += `<button is="paper-icon-button-light" class="nextTrackButton mediaButton" title="${globalize.translate('ButtonNextTrack')}"><span class="material-icons skip_next" aria-hidden="true"></span></button>`;
    } else {
        html += `<button is="paper-icon-button-light" class="btnToggleContextMenu mediaButton" title="${globalize.translate('ButtonMore')}"><span class="material-icons more_vert" aria-hidden="true"></span></button>`;
    }

    html += '</div>';
    html += '</div>';

    html += '</div>';

    return html;
}

function onSlideDownComplete() {
    this.classList.add('hide');
}

function slideDown(elem) {
    // trigger reflow
    void elem.offsetWidth;

    elem.classList.add('nowPlayingBar-hidden');

    dom.addEventListener(elem, dom.whichTransitionEvent(), onSlideDownComplete, {
        once: true
    });
}

function slideUp(elem) {
    dom.removeEventListener(elem, dom.whichTransitionEvent(), onSlideDownComplete, {
        once: true
    });

    elem.classList.remove('hide');

    // trigger reflow
    void elem.offsetWidth;

    elem.classList.remove('nowPlayingBar-hidden');
}

function onPlayPauseClick() {
    playbackManager.playPause(currentPlayer);
}

function bindEvents(elem) {
    currentTimeElement = elem.querySelector('.nowPlayingBarCurrentTime');
    nowPlayingImageElement = elem.querySelector('.nowPlayingImage');
    nowPlayingTextElement = elem.querySelector('.nowPlayingBarText');
    nowPlayingUserData = elem.querySelector('.nowPlayingBarUserDataButtons');
    positionSlider = elem.querySelector('.nowPlayingBarPositionSlider');
    muteButton = elem.querySelector('.muteButton');
    playPauseButtons = elem.querySelectorAll('.playPauseButton');
    toggleRepeatButton = elem.querySelector('.toggleRepeatButton');
    volumeSlider = elem.querySelector('.nowPlayingBarVolumeSlider');
    volumeSliderContainer = elem.querySelector('.nowPlayingBarVolumeSliderContainer');
    lyricButton = nowPlayingBarElement.querySelector('.openLyricsButton');

    muteButton.addEventListener('click', function () {
        if (currentPlayer) {
            playbackManager.toggleMute(currentPlayer);
        }
    });

    elem.querySelector('.stopButton').addEventListener('click', function () {
        if (currentPlayer) {
            playbackManager.stop(currentPlayer);
        }
    });

    playPauseButtons.forEach((button) => {
        button.addEventListener('click', onPlayPauseClick);
    });

    elem.querySelector('.nextTrackButton').addEventListener('click', function () {
        if (currentPlayer) {
            playbackManager.nextTrack(currentPlayer);
        }
    });

    elem.querySelector('.previousTrackButton').addEventListener('click', function (e) {
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

    elem.querySelector('.previousTrackButton').addEventListener('dblclick', function () {
        if (currentPlayer) {
            playbackManager.previousTrack(currentPlayer);
        }
    });

    toggleAirPlayButton = elem.querySelector('.btnAirPlay');
    toggleAirPlayButton.addEventListener('click', function () {
        if (currentPlayer) {
            playbackManager.toggleAirPlay(currentPlayer);
        }
    });

    elem.querySelector('.btnShuffleQueue').addEventListener('click', function () {
        if (currentPlayer) {
            playbackManager.toggleQueueShuffleMode();
        }
    });

    lyricButton.addEventListener('click', function() {
        if (lyricPageActive) {
            appRouter.back();
        } else {
            appRouter.show('lyrics');
        }
    });

    toggleRepeatButton = elem.querySelector('.toggleRepeatButton');
    toggleRepeatButton.addEventListener('click', function () {
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
    });

    toggleRepeatButtonIcon = toggleRepeatButton.querySelector('.material-icons');

    volumeSliderContainer.classList.toggle('hide', appHost.supports('physicalvolumecontrol'));

    volumeSlider.addEventListener('input', (e) => {
        if (currentPlayer) {
            currentPlayer.setVolume(e.target.value);
        }
    });

    positionSlider.addEventListener('change', function () {
        if (currentPlayer) {
            const newPercent = parseFloat(this.value);

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

    elem.addEventListener('click', function (e) {
        if (!dom.parentWithTag(e.target, ['BUTTON', 'INPUT'])) {
            showRemoteControl();
        }
    });
}

function showRemoteControl() {
    appRouter.showNowPlaying();
}

let nowPlayingBarElement;
function getNowPlayingBar() {
    if (nowPlayingBarElement) {
        return nowPlayingBarElement;
    }

    const parentContainer = appFooter.element;
    nowPlayingBarElement = parentContainer.querySelector('.nowPlayingBar');

    if (nowPlayingBarElement) {
        return nowPlayingBarElement;
    }

    parentContainer.insertAdjacentHTML('afterbegin', getNowPlayingBarHtml());
    window.CustomElements.upgradeSubtree(parentContainer);

    nowPlayingBarElement = parentContainer.querySelector('.nowPlayingBar');

    if (layoutManager.mobile) {
        hideButton(nowPlayingBarElement.querySelector('.btnShuffleQueue'));
        hideButton(nowPlayingBarElement.querySelector('.nowPlayingBarCenter'));
    }

    if (browser.safari && browser.slow) {
        // Not handled well here. The wrong elements receive events, bar doesn't update quickly enough, etc.
        nowPlayingBarElement.classList.add('noMediaProgress');
    }

    itemShortcuts.on(nowPlayingBarElement);

    bindEvents(nowPlayingBarElement);

    return nowPlayingBarElement;
}

function showButton(button) {
    button.classList.remove('hide');
}

function hideButton(button) {
    button.classList.add('hide');
}

function updatePlayPauseState(isPaused) {
    if (playPauseButtons) {
        playPauseButtons.forEach((button) => {
            const icon = button.querySelector('.material-icons');
            icon.classList.remove('play_arrow', 'pause');
            icon.classList.add(isPaused ? 'play_arrow' : 'pause');
            button.title = globalize.translate(isPaused ? 'Play' : 'ButtonPause');
        });
    }
}

function updatePlayerStateInternal(event, state, player) {
    showNowPlayingBar();

    lastPlayerState = state;

    const playerInfo = playbackManager.getPlayerInfo();

    const playState = state.PlayState || {};

    updatePlayPauseState(playState.IsPaused);

    const supportedCommands = playerInfo.supportedCommands;
    currentPlayerSupportedCommands = supportedCommands;

    if (supportedCommands.indexOf('SetRepeatMode') === -1) {
        toggleRepeatButton.classList.add('hide');
    } else {
        toggleRepeatButton.classList.remove('hide');
    }

    const hideAirPlayButton = supportedCommands.indexOf('AirPlay') === -1;
    toggleAirPlayButton.classList.toggle('hide', hideAirPlayButton);

    updateRepeatModeDisplay(playbackManager.getRepeatMode());
    onQueueShuffleModeChange();

    updatePlayerVolumeState(playState.IsMuted, playState.VolumeLevel);

    if (positionSlider && !positionSlider.dragging) {
        positionSlider.disabled = !playState.CanSeek;

        // determines if both forward and backward buffer progress will be visible
        const isProgressClear = state.MediaSource && state.MediaSource.RunTimeTicks == null;
        positionSlider.setIsClear(isProgressClear);
    }

    const nowPlayingItem = state.NowPlayingItem || {};
    updateTimeDisplay(playState.PositionTicks, nowPlayingItem.RunTimeTicks, playbackManager.getBufferedRanges(player));

    updateNowPlayingInfo(state);
    updateLyricButton();
}

function updateRepeatModeDisplay(repeatMode) {
    toggleRepeatButtonIcon.classList.remove('repeat', 'repeat_one');
    const cssClass = 'buttonActive';

    switch (repeatMode) {
        case 'RepeatAll':
            toggleRepeatButtonIcon.classList.add('repeat');
            toggleRepeatButton.classList.add(cssClass);
            break;
        case 'RepeatOne':
            toggleRepeatButtonIcon.classList.add('repeat_one');
            toggleRepeatButton.classList.add(cssClass);
            break;
        case 'RepeatNone':
        default:
            toggleRepeatButtonIcon.classList.add('repeat');
            toggleRepeatButton.classList.remove(cssClass);
            break;
    }
}

function updateTimeDisplay(positionTicks, runtimeTicks, bufferedRanges) {
    // See bindEvents for why this is necessary
    if (positionSlider && !positionSlider.dragging) {
        if (runtimeTicks) {
            let pct = positionTicks / runtimeTicks;
            pct *= 100;

            positionSlider.value = pct;
        } else {
            positionSlider.value = 0;
        }
    }

    if (positionSlider) {
        positionSlider.setBufferedRanges(bufferedRanges, runtimeTicks, positionTicks);
    }

    if (currentTimeElement) {
        let timeText = positionTicks == null ? '--:--' : datetime.getDisplayRunningTime(positionTicks);
        if (runtimeTicks) {
            timeText += ' / ' + datetime.getDisplayRunningTime(runtimeTicks);
        }

        currentTimeElement.innerHTML = timeText;
    }
}

function updatePlayerVolumeState(isMuted, volumeLevel) {
    const supportedCommands = currentPlayerSupportedCommands;

    let showMuteButton = true;
    let showVolumeSlider = true;

    if (supportedCommands.indexOf('ToggleMute') === -1) {
        showMuteButton = false;
    }

    const muteButtonIcon = muteButton.querySelector('.material-icons');
    muteButtonIcon.classList.remove('volume_off', 'volume_up');
    muteButtonIcon.classList.add(isMuted ? 'volume_off' : 'volume_up');
    muteButton.title = globalize.translate(isMuted ? 'Unmute' : 'Mute');

    if (supportedCommands.indexOf('SetVolume') === -1) {
        showVolumeSlider = false;
    }

    if (currentPlayer.isLocalPlayer && appHost.supports('physicalvolumecontrol')) {
        showMuteButton = false;
        showVolumeSlider = false;
    }

    if (showMuteButton) {
        showButton(muteButton);
    } else {
        hideButton(muteButton);
    }

    // See bindEvents for why this is necessary
    if (volumeSlider) {
        volumeSliderContainer.classList.toggle('hide', !showVolumeSlider);

        if (!volumeSlider.dragging) {
            volumeSlider.value = volumeLevel || 0;
        }
    }
}

function updateLyricButton() {
    if (!isEnabled) {
        return;
    }

    isAudio ? showButton(lyricButton) : hideButton(lyricButton);
    setLyricButtonActiveStatus();
}

function setLyricButtonActiveStatus() {
    if (!isEnabled) {
        return;
    }
    lyricButton.classList.toggle('buttonActive', lyricPageActive);
}

function seriesImageUrl(item, options) {
    if (!item) {
        throw new Error('item cannot be null!');
    }

    if (item.Type !== 'Episode') {
        return null;
    }

    options = options || {};
    options.type = options.type || 'Primary';

    if (options.type === 'Primary' && item.SeriesPrimaryImageTag) {
        options.tag = item.SeriesPrimaryImageTag;

        return ServerConnections.getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId, options);
    }

    if (options.type === 'Thumb') {
        if (item.SeriesThumbImageTag) {
            options.tag = item.SeriesThumbImageTag;

            return ServerConnections.getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId, options);
        }
        if (item.ParentThumbImageTag) {
            options.tag = item.ParentThumbImageTag;

            return ServerConnections.getApiClient(item.ServerId).getScaledImageUrl(item.ParentThumbItemId, options);
        }
    }

    return null;
}

function imageUrl(item, options) {
    if (!item) {
        throw new Error('item cannot be null!');
    }

    options = options || {};
    options.type = options.type || 'Primary';

    if (item.ImageTags?.[options.type]) {
        options.tag = item.ImageTags[options.type];
        return ServerConnections.getApiClient(item.ServerId).getScaledImageUrl(item.PrimaryImageItemId || item.Id, options);
    }

    if (item.AlbumId && item.AlbumPrimaryImageTag) {
        options.tag = item.AlbumPrimaryImageTag;
        return ServerConnections.getApiClient(item.ServerId).getScaledImageUrl(item.AlbumId, options);
    }

    return null;
}

function updateNowPlayingInfo(state) {
    const nowPlayingItem = state.NowPlayingItem;

    const textLines = nowPlayingItem ? nowPlayingHelper.getNowPlayingNames(nowPlayingItem) : [];
    nowPlayingTextElement.innerHTML = '';
    if (textLines) {
        const itemText = document.createElement('div');
        const secondaryText = document.createElement('div');
        secondaryText.classList.add('nowPlayingBarSecondaryText');
        if (textLines.length > 1) {
            textLines[1].secondary = true;
            if (textLines[1].text) {
                const text = document.createElement('a');
                text.innerText = textLines[1].text;
                secondaryText.appendChild(text);
            }
        }

        if (textLines[0].text) {
            const text = document.createElement('a');
            text.innerText = textLines[0].text;
            itemText.appendChild(text);
        }
        nowPlayingTextElement.appendChild(itemText);
        nowPlayingTextElement.appendChild(secondaryText);
    }

    const imgHeight = 70;

    const url = nowPlayingItem ? (seriesImageUrl(nowPlayingItem, {
        height: imgHeight
    }) || imageUrl(nowPlayingItem, {
        height: imgHeight
    })) : null;

    if (url !== nowPlayingImageUrl) {
        if (url) {
            nowPlayingImageUrl = url;
            imageLoader.lazyImage(nowPlayingImageElement, nowPlayingImageUrl);
            nowPlayingImageElement.style.display = null;
            nowPlayingTextElement.style.marginLeft = null;
        } else {
            nowPlayingImageUrl = null;
            nowPlayingImageElement.style.backgroundImage = '';
            nowPlayingImageElement.style.display = 'none';
            nowPlayingTextElement.style.marginLeft = '1em';
        }
    }

    if (nowPlayingItem.Id) {
        const apiClient = ServerConnections.getApiClient(nowPlayingItem.ServerId);
        apiClient.getItem(apiClient.getCurrentUserId(), nowPlayingItem.Id).then(function (item) {
            const userData = item.UserData || {};
            const likes = userData.Likes == null ? '' : userData.Likes;
            if (!layoutManager.mobile) {
                let contextButton = nowPlayingBarElement.querySelector('.btnToggleContextMenu');
                // We remove the previous event listener by replacing the item in each update event
                const contextButtonClone = contextButton.cloneNode(true);
                contextButton.parentNode.replaceChild(contextButtonClone, contextButton);
                contextButton = nowPlayingBarElement.querySelector('.btnToggleContextMenu');
                const options = {
                    play: false,
                    queue: false,
                    stopPlayback: true,
                    clearQueue: true,
                    positionTo: contextButton
                };
                apiClient.getCurrentUser().then(function (user) {
                    contextButton.addEventListener('click', function () {
                        itemContextMenu.show(Object.assign({
                            item: item,
                            user: user
                        }, options))
                            .catch(() => { /* no-op */ });
                    });
                });
            }
            nowPlayingUserData.innerHTML = '<button is="emby-ratingbutton" type="button" class="mediaButton paper-icon-button-light" data-id="' + item.Id + '" data-serverid="' + item.ServerId + '" data-itemtype="' + item.Type + '" data-likes="' + likes + '" data-isfavorite="' + (userData.IsFavorite) + '"><span class="material-icons favorite" aria-hidden="true"></span></button>';
        });
    } else {
        nowPlayingUserData.innerHTML = '';
    }
}

function onPlaybackStart(e, state) {
    console.debug('nowplaying event: ' + e.type);
    const player = this;

    isAudio = state.NowPlayingItem.Type === 'Audio';

    onStateChanged.call(player, e, state);
}

function onRepeatModeChange() {
    if (!isEnabled) {
        return;
    }

    updateRepeatModeDisplay(playbackManager.getRepeatMode());
}

function onQueueShuffleModeChange() {
    if (!isEnabled) {
        return;
    }

    const shuffleMode = playbackManager.getQueueShuffleMode();
    const context = nowPlayingBarElement;
    const cssClass = 'buttonActive';
    const toggleShuffleButton = context.querySelector('.btnShuffleQueue');
    switch (shuffleMode) {
        case 'Shuffle':
            toggleShuffleButton.classList.add(cssClass);
            break;
        case 'Sorted':
        default:
            toggleShuffleButton.classList.remove(cssClass);
            break;
    }
}

function showNowPlayingBar() {
    if (!isVisibilityAllowed) {
        hideNowPlayingBar();
        return;
    }

    slideUp(getNowPlayingBar());
}

function hideNowPlayingBar() {
    isEnabled = false;

    // Use a timeout to prevent the bar from hiding and showing quickly
    // in the event of a stop->play command

    // Don't call getNowPlayingBar here because we don't want to end up creating it just to hide it
    const elem = document.getElementsByClassName('nowPlayingBar')[0];
    if (elem) {
        slideDown(elem);
    }
}

function onPlaybackStopped(e, state) {
    console.debug('[nowPlayingBar:onPlaybackStopped] event: ' + e.type);

    const player = this;

    if (player.isLocalPlayer) {
        if (state.NextMediaType !== 'Audio') {
            hideNowPlayingBar();
        }
    } else if (!state.NextMediaType) {
        hideNowPlayingBar();
    }
}

function onPlayPauseStateChanged() {
    if (!isEnabled) {
        return;
    }

    const player = this;
    updatePlayPauseState(player.paused());
}

function onStateChanged(event, state) {
    if (event.type === 'init') {
        // skip non-ready state
        return;
    }

    console.debug('[nowPlayingBar:onStateChanged] event: ' + event.type);
    const player = this;

    if (!state.NowPlayingItem || layoutManager.tv || state.IsFullscreen === false) {
        hideNowPlayingBar();
        return;
    }

    if (player.isLocalPlayer && state.NowPlayingItem && state.NowPlayingItem.MediaType === 'Video') {
        hideNowPlayingBar();
        return;
    }

    isEnabled = true;

    if (nowPlayingBarElement) {
        updatePlayerStateInternal(event, state, player);
        return;
    }

    getNowPlayingBar();
    updateLyricButton();
    updatePlayerStateInternal(event, state, player);
}

function onTimeUpdate() {
    if (!isEnabled) {
        return;
    }

    // Try to avoid hammering the document with changes
    const now = new Date().getTime();
    if ((now - lastUpdateTime) < 700) {
        return;
    }
    lastUpdateTime = now;

    const player = this;
    currentRuntimeTicks = playbackManager.duration(player);
    updateTimeDisplay(playbackManager.currentTime(player) * 10000, currentRuntimeTicks, playbackManager.getBufferedRanges(player));
}

function releaseCurrentPlayer() {
    const player = currentPlayer;

    if (player) {
        Events.off(player, 'playbackstart', onPlaybackStart);
        Events.off(player, 'statechange', onPlaybackStart);
        Events.off(player, 'repeatmodechange', onRepeatModeChange);
        Events.off(player, 'shufflequeuemodechange', onQueueShuffleModeChange);
        Events.off(player, 'playbackstop', onPlaybackStopped);
        Events.off(player, 'volumechange', onVolumeChanged);
        Events.off(player, 'pause', onPlayPauseStateChanged);
        Events.off(player, 'unpause', onPlayPauseStateChanged);
        Events.off(player, 'timeupdate', onTimeUpdate);

        currentPlayer = null;
        hideNowPlayingBar();
    }
}

function onVolumeChanged() {
    if (!isEnabled) {
        return;
    }

    const player = this;

    updatePlayerVolumeState(player.isMuted(), player.getVolume());
}

function refreshFromPlayer(player, type) {
    const state = playbackManager.getPlayerState(player);

    onStateChanged.call(player, { type }, state);
}

function bindToPlayer(player) {
    lyricPageActive = appRouter.currentRouteInfo.path.toLowerCase() === '/lyrics';
    if (player === currentPlayer) {
        return;
    }

    releaseCurrentPlayer();

    currentPlayer = player;

    if (!player) {
        return;
    }

    refreshFromPlayer(player, 'init');

    Events.on(player, 'playbackstart', onPlaybackStart);
    Events.on(player, 'statechange', onPlaybackStart);
    Events.on(player, 'repeatmodechange', onRepeatModeChange);
    Events.on(player, 'shufflequeuemodechange', onQueueShuffleModeChange);
    Events.on(player, 'playbackstop', onPlaybackStopped);
    Events.on(player, 'volumechange', onVolumeChanged);
    Events.on(player, 'pause', onPlayPauseStateChanged);
    Events.on(player, 'unpause', onPlayPauseStateChanged);
    Events.on(player, 'timeupdate', onTimeUpdate);
}

Events.on(playbackManager, 'playerchange', function () {
    bindToPlayer(playbackManager.getCurrentPlayer());
});

bindToPlayer(playbackManager.getCurrentPlayer());

document.addEventListener('viewbeforeshow', function (e) {
    lyricPageActive = appRouter.currentRouteInfo.path.toLowerCase() === '/lyrics';
    setLyricButtonActiveStatus();
    if (!e.detail.options.enableMediaControl) {
        if (isVisibilityAllowed) {
            isVisibilityAllowed = false;
            hideNowPlayingBar();
        }
    } else if (!isVisibilityAllowed) {
        isVisibilityAllowed = true;
        if (currentPlayer) {
            refreshFromPlayer(currentPlayer, 'refresh');
        } else {
            hideNowPlayingBar();
        }
    }
});
