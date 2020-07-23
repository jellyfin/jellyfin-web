define(['require', 'datetime', 'itemHelper', 'events', 'browser', 'imageLoader', 'layoutManager', 'playbackManager', 'nowPlayingHelper', 'apphost', 'dom', 'connectionManager', 'itemContextMenu', 'paper-icon-button-light', 'emby-ratingbutton'], function (require, datetime, itemHelper, events, browser, imageLoader, layoutManager, playbackManager, nowPlayingHelper, appHost, dom, connectionManager, itemContextMenu) {
    'use strict';

    var currentPlayer;
    var currentPlayerSupportedCommands = [];

    var currentTimeElement;
    var nowPlayingImageElement;
    var nowPlayingTextElement;
    var nowPlayingUserData;
    var muteButton;
    var volumeSlider;
    var volumeSliderContainer;
    var playPauseButtons;
    var positionSlider;
    var toggleRepeatButton;
    var toggleRepeatButtonIcon;

    var lastUpdateTime = 0;
    var lastPlayerState = {};
    var isEnabled;
    var currentRuntimeTicks = 0;

    var isVisibilityAllowed = true;

    function getNowPlayingBarHtml() {

        var html = '';

        html += '<div class="nowPlayingBar hide nowPlayingBar-hidden">';

        html += '<div class="nowPlayingBarTop">';
        html += '<div class="nowPlayingBarPositionContainer sliderContainer">';
        html += '<input type="range" is="emby-slider" pin step=".01" min="0" max="100" value="0" class="slider-medium-thumb nowPlayingBarPositionSlider" data-slider-keep-progress="true"/>';
        html += '</div>';

        html += '<div class="nowPlayingBarInfoContainer">';
        html += '<div class="nowPlayingImage"></div>';
        html += '<div class="nowPlayingBarText"></div>';
        html += '</div>';

        // The onclicks are needed due to the return false above
        html += '<div class="nowPlayingBarCenter">';

        html += '<button is="paper-icon-button-light" class="previousTrackButton mediaButton"><span class="material-icons skip_previous"></span></button>';

        html += '<button is="paper-icon-button-light" class="playPauseButton mediaButton"><span class="material-icons pause"></span></button>';

        html += '<button is="paper-icon-button-light" class="stopButton mediaButton"><span class="material-icons stop"></span></button>';
        if (!layoutManager.mobile) {
            html += '<button is="paper-icon-button-light" class="nextTrackButton mediaButton"><span class="material-icons skip_next"></span></button>';
        }

        html += '<div class="nowPlayingBarCurrentTime"></div>';
        html += '</div>';

        html += '<div class="nowPlayingBarRight">';

        html += '<button is="paper-icon-button-light" class="muteButton mediaButton"><span class="material-icons volume_up"></span></button>';

        html += '<div class="sliderContainer nowPlayingBarVolumeSliderContainer hide" style="width:9em;vertical-align:middle;display:inline-flex;">';
        html += '<input type="range" is="emby-slider" pin step="1" min="0" max="100" value="0" class="slider-medium-thumb nowPlayingBarVolumeSlider"/>';
        html += '</div>';

        html += '<button is="paper-icon-button-light" class="toggleRepeatButton mediaButton"><span class="material-icons repeat"></span></button>';
        html += '<button is="paper-icon-button-light" class="btnShuffleQueue mediaButton"><span class="material-icons shuffle"></span></button>';

        html += '<div class="nowPlayingBarUserDataButtons">';
        html += '</div>';

        html += '<button is="paper-icon-button-light" class="playPauseButton mediaButton"><span class="material-icons pause"></span></button>';
        if (layoutManager.mobile) {
            html += '<button is="paper-icon-button-light" class="nextTrackButton mediaButton"><span class="material-icons skip_next"></span></button>';
        } else {
            html += '<button is="paper-icon-button-light" class="btnToggleContextMenu mediaButton"><span class="material-icons more_vert"></span></button>';
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
                if (lastPlayerState.NowPlayingItem.MediaType === 'Audio' && (currentPlayer._currentTime >= 5 || !playbackManager.previousTrack(currentPlayer))) {
                    // Cancel this event if doubleclick is fired
                    if (e.detail > 1 && playbackManager.previousTrack(currentPlayer)) {
                        return;
                    }
                    playbackManager.seekPercent(0, currentPlayer);
                    // This is done automatically by playbackManager, however, setting this here gives instant visual feedback.
                    // TODO: Check why seekPercentage doesn't reflect the changes inmmediately, so we can remove this workaround.
                    positionSlider.value = 0;
                } else {
                    playbackManager.previousTrack(currentPlayer);
                }
            }
        });

        elem.querySelector('.previousTrackButton').addEventListener('dblclick', function () {
            if (currentPlayer) {
                playbackManager.previousTrack(currentPlayer);
            }
        });

        elem.querySelector('.btnShuffleQueue').addEventListener('click', function () {
            if (currentPlayer) {
                playbackManager.toggleQueueShuffleMode();
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

                var newPercent = parseFloat(this.value);

                playbackManager.seekPercent(newPercent, currentPlayer);
            }

        });

        positionSlider.getBubbleText = function (value) {

            var state = lastPlayerState;

            if (!state || !state.NowPlayingItem || !currentRuntimeTicks) {
                return '--:--';
            }

            var ticks = currentRuntimeTicks;
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

        require(['appRouter'], function (appRouter) {
            appRouter.showNowPlaying();
        });
    }

    var nowPlayingBarElement;
    function getNowPlayingBar() {

        if (nowPlayingBarElement) {
            return Promise.resolve(nowPlayingBarElement);
        }

        return new Promise(function (resolve, reject) {

            require(['appFooter-shared', 'itemShortcuts', 'css!./nowPlayingBar.css', 'emby-slider'], function (appfooter, itemShortcuts) {

                var parentContainer = appfooter.element;
                nowPlayingBarElement = parentContainer.querySelector('.nowPlayingBar');

                if (nowPlayingBarElement) {
                    resolve(nowPlayingBarElement);
                    return;
                }

                parentContainer.insertAdjacentHTML('afterbegin', getNowPlayingBarHtml());
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
                resolve(nowPlayingBarElement);
            });
        });
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
            });
        }
    }

    function updatePlayerStateInternal(event, state, player) {

        showNowPlayingBar();

        lastPlayerState = state;

        var playerInfo = playbackManager.getPlayerInfo();

        var playState = state.PlayState || {};

        updatePlayPauseState(playState.IsPaused);

        var supportedCommands = playerInfo.supportedCommands;
        currentPlayerSupportedCommands = supportedCommands;

        if (supportedCommands.indexOf('SetRepeatMode') === -1) {
            toggleRepeatButton.classList.add('hide');
        } else {
            toggleRepeatButton.classList.remove('hide');
        }

        updateRepeatModeDisplay(playbackManager.getRepeatMode());
        onQueueShuffleModeChange();

        updatePlayerVolumeState(playState.IsMuted, playState.VolumeLevel);

        if (positionSlider && !positionSlider.dragging) {
            positionSlider.disabled = !playState.CanSeek;

            // determines if both forward and backward buffer progress will be visible
            var isProgressClear = state.MediaSource && state.MediaSource.RunTimeTicks == null;
            positionSlider.setIsClear(isProgressClear);
        }

        var nowPlayingItem = state.NowPlayingItem || {};
        updateTimeDisplay(playState.PositionTicks, nowPlayingItem.RunTimeTicks, playbackManager.getBufferedRanges(player));

        updateNowPlayingInfo(state);
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
                var pct = positionTicks / runtimeTicks;
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
            var timeText = positionTicks == null ? '--:--' : datetime.getDisplayRunningTime(positionTicks);
            if (runtimeTicks) {
                timeText += ' / ' + datetime.getDisplayRunningTime(runtimeTicks);
            }

            currentTimeElement.innerHTML = timeText;
        }
    }

    function updatePlayerVolumeState(isMuted, volumeLevel) {

        var supportedCommands = currentPlayerSupportedCommands;

        var showMuteButton = true;
        var showVolumeSlider = true;

        if (supportedCommands.indexOf('ToggleMute') === -1) {
            showMuteButton = false;
        }

        const muteButtonIcon = muteButton.querySelector('.material-icons');
        muteButtonIcon.classList.remove('volume_off', 'volume_up');
        muteButtonIcon.classList.add(isMuted ? 'volume_off' : 'volume_up');

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

    function seriesImageUrl(item, options) {

        if (!item) {
            throw new Error('item cannot be null!');
        }

        if (item.Type !== 'Episode') {
            return null;
        }

        options = options || {};
        options.type = options.type || 'Primary';

        if (options.type === 'Primary') {

            if (item.SeriesPrimaryImageTag) {

                options.tag = item.SeriesPrimaryImageTag;

                return connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId, options);
            }
        }

        if (options.type === 'Thumb') {

            if (item.SeriesThumbImageTag) {

                options.tag = item.SeriesThumbImageTag;

                return connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId, options);
            }
            if (item.ParentThumbImageTag) {

                options.tag = item.ParentThumbImageTag;

                return connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.ParentThumbItemId, options);
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

        if (item.ImageTags && item.ImageTags[options.type]) {

            options.tag = item.ImageTags[options.type];
            return connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.PrimaryImageItemId || item.Id, options);
        }

        if (item.AlbumId && item.AlbumPrimaryImageTag) {

            options.tag = item.AlbumPrimaryImageTag;
            return connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.AlbumId, options);
        }

        return null;
    }

    var currentImgUrl;
    function updateNowPlayingInfo(state) {

        var nowPlayingItem = state.NowPlayingItem;

        var textLines = nowPlayingItem ? nowPlayingHelper.getNowPlayingNames(nowPlayingItem) : [];
        nowPlayingTextElement.innerHTML = '';
        if (textLines) {
            let itemText = document.createElement('div');
            let secondaryText = document.createElement('div');
            secondaryText.classList.add('nowPlayingBarSecondaryText');
            if (textLines.length > 1) {
                textLines[1].secondary = true;
                if (textLines[1].text) {
                    let text = document.createElement('a');
                    text.innerHTML = textLines[1].text;
                    secondaryText.appendChild(text);
                }
            }

            if (textLines[0].text) {
                let text = document.createElement('a');
                text.innerHTML = textLines[0].text;
                itemText.appendChild(text);
            }
            nowPlayingTextElement.appendChild(itemText);
            nowPlayingTextElement.appendChild(secondaryText);
        }

        var imgHeight = 70;

        var url = nowPlayingItem ? (seriesImageUrl(nowPlayingItem, {
            height: imgHeight
        }) || imageUrl(nowPlayingItem, {
            height: imgHeight
        })) : null;

        var isRefreshing = false;

        if (url !== currentImgUrl) {
            currentImgUrl = url;
            isRefreshing = true;

            if (url) {
                imageLoader.lazyImage(nowPlayingImageElement, url);
                nowPlayingImageElement.style.display = null;
                nowPlayingTextElement.style.marginLeft = null;
            } else {
                nowPlayingImageElement.style.backgroundImage = '';
                nowPlayingImageElement.style.display = 'none';
                nowPlayingTextElement.style.marginLeft = '1em';
            }
        }

        if (nowPlayingItem.Id) {
            if (isRefreshing) {

                var apiClient = connectionManager.getApiClient(nowPlayingItem.ServerId);
                apiClient.getItem(apiClient.getCurrentUserId(), nowPlayingItem.Id).then(function (item) {
                    var userData = item.UserData || {};
                    var likes = userData.Likes == null ? '' : userData.Likes;
                    if (!layoutManager.mobile) {
                        let contextButton = nowPlayingBarElement.querySelector('.btnToggleContextMenu');
                        // We remove the previous event listener by replacing the item in each update event
                        let contextButtonClone = contextButton.cloneNode(true);
                        contextButton.parentNode.replaceChild(contextButtonClone, contextButton);
                        contextButton = nowPlayingBarElement.querySelector('.btnToggleContextMenu');
                        let options = {
                            play: false,
                            queue: false,
                            clearQueue: true,
                            positionTo: contextButton
                        };
                        apiClient.getCurrentUser().then(function (user) {
                            contextButton.addEventListener('click', function () {
                                itemContextMenu.show(Object.assign({
                                    item: item,
                                    user: user
                                }, options));
                            });
                        });
                    }
                    nowPlayingUserData.innerHTML = '<button is="emby-ratingbutton" type="button" class="listItemButton mediaButton paper-icon-button-light" data-id="' + item.Id + '" data-serverid="' + item.ServerId + '" data-itemtype="' + item.Type + '" data-likes="' + likes + '" data-isfavorite="' + (userData.IsFavorite) + '"><span class="material-icons favorite"></span></button>';
                });
            }
        } else {
            nowPlayingUserData.innerHTML = '';
        }
    }

    function onPlaybackStart(e, state) {
        console.debug('nowplaying event: ' + e.type);
        var player = this;
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

        let shuffleMode = playbackManager.getQueueShuffleMode();
        let context = nowPlayingBarElement;
        const cssClass = 'buttonActive';
        let toggleShuffleButton = context.querySelector('.btnShuffleQueue');
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

        getNowPlayingBar().then(slideUp);
    }

    function hideNowPlayingBar() {

        isEnabled = false;

        // Use a timeout to prevent the bar from hiding and showing quickly
        // in the event of a stop->play command

        // Don't call getNowPlayingBar here because we don't want to end up creating it just to hide it
        var elem = document.getElementsByClassName('nowPlayingBar')[0];
        if (elem) {

            slideDown(elem);
        }
    }

    function onPlaybackStopped(e, state) {

        console.debug('nowplaying event: ' + e.type);
        var player = this;

        if (player.isLocalPlayer) {
            if (state.NextMediaType !== 'Audio') {
                hideNowPlayingBar();
            }
        } else {
            if (!state.NextMediaType) {
                hideNowPlayingBar();
            }
        }
    }

    function onPlayPauseStateChanged(e) {

        if (!isEnabled) {
            return;
        }

        var player = this;
        updatePlayPauseState(player.paused());
    }

    function onStateChanged(event, state) {

        console.debug('nowplaying event: ' + event.type);
        var player = this;

        if (!state.NowPlayingItem || layoutManager.tv) {
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

        getNowPlayingBar().then(function () {
            updatePlayerStateInternal(event, state, player);
        });
    }

    function onTimeUpdate(e) {

        if (!isEnabled) {
            return;
        }

        // Try to avoid hammering the document with changes
        var now = new Date().getTime();
        if ((now - lastUpdateTime) < 700) {

            return;
        }
        lastUpdateTime = now;

        var player = this;
        currentRuntimeTicks = playbackManager.duration(player);
        updateTimeDisplay(playbackManager.currentTime(player), currentRuntimeTicks, playbackManager.getBufferedRanges(player));
    }

    function releaseCurrentPlayer() {

        var player = currentPlayer;

        if (player) {
            events.off(player, 'playbackstart', onPlaybackStart);
            events.off(player, 'statechange', onPlaybackStart);
            events.off(player, 'repeatmodechange', onRepeatModeChange);
            events.off(player, 'shufflequeuemodechange', onQueueShuffleModeChange);
            events.off(player, 'playbackstop', onPlaybackStopped);
            events.off(player, 'volumechange', onVolumeChanged);
            events.off(player, 'pause', onPlayPauseStateChanged);
            events.off(player, 'unpause', onPlayPauseStateChanged);
            events.off(player, 'timeupdate', onTimeUpdate);

            currentPlayer = null;
            hideNowPlayingBar();
        }
    }

    function onVolumeChanged(e) {

        if (!isEnabled) {
            return;
        }

        var player = this;

        updatePlayerVolumeState(player.isMuted(), player.getVolume());
    }

    function refreshFromPlayer(player) {

        var state = playbackManager.getPlayerState(player);

        onStateChanged.call(player, { type: 'init' }, state);
    }

    function bindToPlayer(player) {

        if (player === currentPlayer) {
            return;
        }

        releaseCurrentPlayer();

        currentPlayer = player;

        if (!player) {
            return;
        }

        refreshFromPlayer(player);

        events.on(player, 'playbackstart', onPlaybackStart);
        events.on(player, 'statechange', onPlaybackStart);
        events.on(player, 'repeatmodechange', onRepeatModeChange);
        events.on(player, 'shufflequeuemodechange', onQueueShuffleModeChange);
        events.on(player, 'playbackstop', onPlaybackStopped);
        events.on(player, 'volumechange', onVolumeChanged);
        events.on(player, 'pause', onPlayPauseStateChanged);
        events.on(player, 'unpause', onPlayPauseStateChanged);
        events.on(player, 'timeupdate', onTimeUpdate);
    }

    events.on(playbackManager, 'playerchange', function () {
        bindToPlayer(playbackManager.getCurrentPlayer());
    });

    bindToPlayer(playbackManager.getCurrentPlayer());

    document.addEventListener('viewbeforeshow', function (e) {

        if (!e.detail.options.enableMediaControl) {

            if (isVisibilityAllowed) {
                isVisibilityAllowed = false;
                hideNowPlayingBar();
            }

        } else if (!isVisibilityAllowed) {

            isVisibilityAllowed = true;
            if (currentPlayer) {
                refreshFromPlayer(currentPlayer);
            } else {
                hideNowPlayingBar();
            }
        }
    });
});
