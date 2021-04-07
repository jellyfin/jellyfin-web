import { playbackManager } from '../../../components/playback/playbackmanager';
import SyncPlay from '../../../components/syncPlay/core';
import dom from '../../../scripts/dom';
import inputManager from '../../../scripts/inputManager';
import mouseManager from '../../../scripts/mouseManager';
import datetime from '../../../scripts/datetime';
import itemHelper from '../../../components/itemHelper';
import mediaInfo from '../../../components/mediainfo/mediainfo';
import focusManager from '../../../components/focusManager';
import { Events } from 'jellyfin-apiclient';
import globalize from '../../../scripts/globalize';
import { appHost } from '../../../components/apphost';
import layoutManager from '../../../components/layoutManager';
import * as userSettings from '../../../scripts/settings/userSettings';
import keyboardnavigation from '../../../scripts/keyboardNavigation';
import '../../../assets/css/scrollstyles.scss';
import '../../../elements/emby-slider/emby-slider';
import '../../../elements/emby-button/paper-icon-button-light';
import '../../../assets/css/videoosd.scss';
import ServerConnections from '../../../components/ServerConnections';
import shell from '../../../scripts/shell';
import SubtitleSync from '../../../components/subtitlesync/subtitlesync';
import { appRouter } from '../../../components/appRouter';

/* eslint-disable indent */

    function getOpenedDialog() {
        return document.querySelector('.dialogContainer .dialog.opened');
    }

    export default function (view) {
        function getDisplayItem(item) {
            if (item.Type === 'TvChannel') {
                const apiClient = ServerConnections.getApiClient(item.ServerId);
                return apiClient.getItem(apiClient.getCurrentUserId(), item.Id).then(function (refreshedItem) {
                    return {
                        originalItem: refreshedItem,
                        displayItem: refreshedItem.CurrentProgram
                    };
                });
            }

            return Promise.resolve({
                originalItem: item
            });
        }

        function updateRecordingButton(item) {
            if (!item || item.Type !== 'Program') {
                if (recordingButtonManager) {
                    recordingButtonManager.destroy();
                    recordingButtonManager = null;
                }

                return void view.querySelector('.btnRecord').classList.add('hide');
            }

            ServerConnections.getApiClient(item.ServerId).getCurrentUser().then(function (user) {
                if (user.Policy.EnableLiveTvManagement) {
                    import('../../../components/recordingcreator/recordingbutton').then(({default: RecordingButton}) => {
                        if (recordingButtonManager) {
                            return void recordingButtonManager.refreshItem(item);
                        }

                        recordingButtonManager = new RecordingButton({
                            item: item,
                            button: view.querySelector('.btnRecord')
                        });
                        view.querySelector('.btnRecord').classList.remove('hide');
                    });
                }
            });
        }

        function updateDisplayItem(itemInfo) {
            const item = itemInfo.originalItem;
            currentItem = item;
            const displayItem = itemInfo.displayItem || item;
            updateRecordingButton(displayItem);
            let parentName = displayItem.SeriesName || displayItem.Album;

            if (displayItem.EpisodeTitle || displayItem.IsSeries) {
                parentName = displayItem.Name;
            }

            setTitle(displayItem, parentName);

            const secondaryMediaInfo = view.querySelector('.osdSecondaryMediaInfo');
            const secondaryMediaInfoHtml = mediaInfo.getSecondaryMediaInfoHtml(displayItem, {
                startDate: false,
                programTime: false
            });
            secondaryMediaInfo.innerHTML = secondaryMediaInfoHtml;

            if (secondaryMediaInfoHtml) {
                secondaryMediaInfo.classList.remove('hide');
            } else {
                secondaryMediaInfo.classList.add('hide');
            }

            if (enableProgressByTimeOfDay) {
                setDisplayTime(startTimeText, displayItem.StartDate);
                setDisplayTime(endTimeText, displayItem.EndDate);
                startTimeText.classList.remove('hide');
                endTimeText.classList.remove('hide');
                programStartDateMs = displayItem.StartDate ? datetime.parseISO8601Date(displayItem.StartDate).getTime() : 0;
                programEndDateMs = displayItem.EndDate ? datetime.parseISO8601Date(displayItem.EndDate).getTime() : 0;
            } else {
                startTimeText.classList.add('hide');
                endTimeText.classList.add('hide');
                startTimeText.innerHTML = '';
                endTimeText.innerHTML = '';
                programStartDateMs = 0;
                programEndDateMs = 0;
            }
        }

        function getDisplayTimeWithoutAmPm(date, showSeconds) {
            if (showSeconds) {
                return datetime.toLocaleTimeString(date, {
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit'
                }).toLowerCase().replace('am', '').replace('pm', '').trim();
            }

            return datetime.getDisplayTime(date).toLowerCase().replace('am', '').replace('pm', '').trim();
        }

        function setDisplayTime(elem, date) {
            let html;

            if (date) {
                date = datetime.parseISO8601Date(date);
                html = getDisplayTimeWithoutAmPm(date);
            }

            elem.innerHTML = html || '';
        }

        function shouldEnableProgressByTimeOfDay(item) {
            return !(item.Type !== 'TvChannel' || !item.CurrentProgram);
        }

        function updateNowPlayingInfo(player, state) {
            const item = state.NowPlayingItem;

            currentItem = item;
            if (!item) {
                updateRecordingButton(null);
                appRouter.setTitle('');
                nowPlayingVolumeSlider.disabled = true;
                nowPlayingPositionSlider.disabled = true;
                btnFastForward.disabled = true;
                btnRewind.disabled = true;
                view.querySelector('.btnSubtitles').classList.add('hide');
                view.querySelector('.btnAudio').classList.add('hide');
                view.querySelector('.osdTitle').innerHTML = '';
                view.querySelector('.osdMediaInfo').innerHTML = '';
                return;
            }

            enableProgressByTimeOfDay = shouldEnableProgressByTimeOfDay(item);
            getDisplayItem(item).then(updateDisplayItem);
            nowPlayingVolumeSlider.disabled = false;
            nowPlayingPositionSlider.disabled = false;
            btnFastForward.disabled = false;
            btnRewind.disabled = false;

            if (playbackManager.subtitleTracks(player).length) {
                view.querySelector('.btnSubtitles').classList.remove('hide');
                toggleSubtitleSync();
            } else {
                view.querySelector('.btnSubtitles').classList.add('hide');
                toggleSubtitleSync('forceToHide');
            }

            if (playbackManager.audioTracks(player).length > 1) {
                view.querySelector('.btnAudio').classList.remove('hide');
            } else {
                view.querySelector('.btnAudio').classList.add('hide');
            }
        }

        function setTitle(item, parentName) {
            let itemName = itemHelper.getDisplayName(item, {
                includeParentInfo: item.Type !== 'Program',
                includeIndexNumber: item.Type !== 'Program'
            });

            if (itemName && parentName) {
                itemName = `${parentName} - ${itemName}`;
            }

            if (!itemName) {
                itemName = parentName || '';
            }

            appRouter.setTitle(itemName);

            const documentTitle = parentName || (item ? item.Name : null);

            if (documentTitle) {
                document.title = documentTitle;
            }
        }

        let mouseIsDown = false;

        function showOsd() {
            slideDownToShow(headerElement);
            showMainOsdControls();
            resetIdle();
        }

        function hideOsd() {
            slideUpToHide(headerElement);
            hideMainOsdControls();
            mouseManager.hideCursor();
        }

        function toggleOsd() {
            if (currentVisibleMenu === 'osd') {
                hideOsd();
            } else if (!currentVisibleMenu) {
                showOsd();
            }
        }

        function startOsdHideTimer() {
            stopOsdHideTimer();
            osdHideTimeout = setTimeout(hideOsd, 3e3);
        }

        function stopOsdHideTimer() {
            if (osdHideTimeout) {
                clearTimeout(osdHideTimeout);
                osdHideTimeout = null;
            }
        }

        function slideDownToShow(elem) {
            elem.classList.remove('osdHeader-hidden');
        }

        function slideUpToHide(elem) {
            elem.classList.add('osdHeader-hidden');
        }

        function clearHideAnimationEventListeners(elem) {
            dom.removeEventListener(elem, transitionEndEventName, onHideAnimationComplete, {
                once: true
            });
        }

        function onHideAnimationComplete(e) {
            const elem = e.target;
            if (elem != osdBottomElement)
                return;
            elem.classList.add('hide');
            dom.removeEventListener(elem, transitionEndEventName, onHideAnimationComplete, {
                once: true
            });
        }

        function showMainOsdControls() {
            if (!currentVisibleMenu) {
                const elem = osdBottomElement;
                currentVisibleMenu = 'osd';
                clearHideAnimationEventListeners(elem);
                elem.classList.remove('hide');
                elem.classList.remove('videoOsdBottom-hidden');

                if (!layoutManager.mobile) {
                    setTimeout(function () {
                        focusManager.focus(elem.querySelector('.btnPause'));
                    }, 50);
                }
                toggleSubtitleSync();
            }
        }

        function hideMainOsdControls() {
            if (currentVisibleMenu === 'osd') {
                const elem = osdBottomElement;
                clearHideAnimationEventListeners(elem);
                elem.classList.add('videoOsdBottom-hidden');

                dom.addEventListener(elem, transitionEndEventName, onHideAnimationComplete, {
                    once: true
                });
                currentVisibleMenu = null;
                toggleSubtitleSync('hide');

                // Firefox does not blur by itself
                if (document.activeElement) {
                    document.activeElement.blur();
                }
            }
        }

        // TODO: Move all idle-related code to `inputManager` or `idleManager` or `idleHelper` (per dialog thing) and listen event from there.

        function resetIdle() {
            // Restart hide timer if OSD is currently visible and there is no opened dialog
            if (currentVisibleMenu && !mouseIsDown && !getOpenedDialog()) {
                startOsdHideTimer();
            } else {
                stopOsdHideTimer();
            }
        }

        function onPointerMove(e) {
            if ((e.pointerType || (layoutManager.mobile ? 'touch' : 'mouse')) === 'mouse') {
                const eventX = e.screenX || 0;
                const eventY = e.screenY || 0;
                const obj = lastPointerMoveData;

                if (!obj) {
                    lastPointerMoveData = {
                        x: eventX,
                        y: eventY
                    };
                    return;
                }

                if (Math.abs(eventX - obj.x) < 10 && Math.abs(eventY - obj.y) < 10) {
                    return;
                }

                obj.x = eventX;
                obj.y = eventY;
                showOsd();
            }
        }

        function onInputCommand(e) {
            const player = currentPlayer;

            switch (e.detail.command) {
                case 'left':
                    if (currentVisibleMenu === 'osd') {
                        showOsd();
                    } else {
                        if (!currentVisibleMenu) {
                            e.preventDefault();
                            playbackManager.rewind(player);
                        }
                    }

                    break;

                case 'right':
                    if (currentVisibleMenu === 'osd') {
                        showOsd();
                    } else if (!currentVisibleMenu) {
                        e.preventDefault();
                        playbackManager.fastForward(player);
                    }

                    break;

                case 'pageup':
                    playbackManager.nextChapter(player);
                    break;

                case 'pagedown':
                    playbackManager.previousChapter(player);
                    break;

                case 'up':
                case 'down':
                case 'select':
                case 'menu':
                case 'info':
                case 'play':
                case 'playpause':
                case 'pause':
                case 'fastforward':
                case 'rewind':
                case 'next':
                case 'previous':
                    showOsd();
                    break;

                case 'record':
                    onRecordingCommand();
                    showOsd();
                    break;

                case 'togglestats':
                    toggleStats();
            }
        }

        function onRecordingCommand() {
            const btnRecord = view.querySelector('.btnRecord');

            if (!btnRecord.classList.contains('hide')) {
                btnRecord.click();
            }
        }

        function updateFullscreenIcon() {
            const button = view.querySelector('.btnFullscreen');
            const icon = button.querySelector('.material-icons');

            icon.classList.remove('fullscreen_exit', 'fullscreen');

            if (playbackManager.isFullscreen(currentPlayer)) {
                button.setAttribute('title', globalize.translate('ExitFullscreen') + ' (f)');
                icon.classList.add('fullscreen_exit');
            } else {
                button.setAttribute('title', globalize.translate('Fullscreen') + ' (f)');
                icon.classList.add('fullscreen');
            }
        }

        function onPlayerChange() {
            bindToPlayer(playbackManager.getCurrentPlayer());
        }

        function onStateChanged(event, state) {
            const player = this;

            if (state.NowPlayingItem) {
                isEnabled = true;
                updatePlayerStateInternal(event, player, state);
                updatePlaylist();
                enableStopOnBack(true);
            }
        }

        function onPlayPauseStateChanged() {
            if (isEnabled) {
                updatePlayPauseState(this.paused());
            }
        }

        function onVolumeChanged() {
            if (isEnabled) {
                const player = this;
                updatePlayerVolumeState(player, player.isMuted(), player.getVolume());
            }
        }

        function onPlaybackStart(e, state) {
            console.debug('nowplaying event: ' + e.type);
            const player = this;
            onStateChanged.call(player, e, state);
            resetUpNextDialog();
        }

        function resetUpNextDialog() {
            comingUpNextDisplayed = false;
            const dlg = currentUpNextDialog;

            if (dlg) {
                dlg.destroy();
                currentUpNextDialog = null;
            }
        }

        function onPlaybackStopped(e, state) {
            currentRuntimeTicks = null;
            resetUpNextDialog();
            console.debug('nowplaying event: ' + e.type);

            if (state.NextMediaType !== 'Video') {
                view.removeEventListener('viewbeforehide', onViewHideStopPlayback);
                appRouter.back();
            }
        }

        function onMediaStreamsChanged() {
            const player = this;
            const state = playbackManager.getPlayerState(player);
            onStateChanged.call(player, {
                type: 'init'
            }, state);
        }

        function onBeginFetch() {
            document.querySelector('.osdMediaStatus').classList.remove('hide');
        }

        function onEndFetch() {
            document.querySelector('.osdMediaStatus').classList.add('hide');
        }

        function bindToPlayer(player) {
            if (player !== currentPlayer) {
                releaseCurrentPlayer();
                currentPlayer = player;
                if (!player) return;
            }
            const state = playbackManager.getPlayerState(player);
            onStateChanged.call(player, {
                type: 'init'
            }, state);
            Events.on(player, 'playbackstart', onPlaybackStart);
            Events.on(player, 'playbackstop', onPlaybackStopped);
            Events.on(player, 'volumechange', onVolumeChanged);
            Events.on(player, 'pause', onPlayPauseStateChanged);
            Events.on(player, 'unpause', onPlayPauseStateChanged);
            Events.on(player, 'timeupdate', onTimeUpdate);
            Events.on(player, 'fullscreenchange', updateFullscreenIcon);
            Events.on(player, 'mediastreamschange', onMediaStreamsChanged);
            Events.on(player, 'beginFetch', onBeginFetch);
            Events.on(player, 'endFetch', onEndFetch);
            resetUpNextDialog();

            if (player.isFetching) {
                onBeginFetch();
            }
        }

        function releaseCurrentPlayer() {
            destroyStats();
            destroySubtitleSync();
            resetUpNextDialog();
            const player = currentPlayer;

            if (player) {
                Events.off(player, 'playbackstart', onPlaybackStart);
                Events.off(player, 'playbackstop', onPlaybackStopped);
                Events.off(player, 'volumechange', onVolumeChanged);
                Events.off(player, 'pause', onPlayPauseStateChanged);
                Events.off(player, 'unpause', onPlayPauseStateChanged);
                Events.off(player, 'timeupdate', onTimeUpdate);
                Events.off(player, 'fullscreenchange', updateFullscreenIcon);
                Events.off(player, 'mediastreamschange', onMediaStreamsChanged);
                currentPlayer = null;
            }
        }

        function onTimeUpdate() {
            // Test for 'currentItem' is required for Firefox since its player spams 'timeupdate' events even being at breakpoint
            if (isEnabled && currentItem) {
                const now = new Date().getTime();

                if (!(now - lastUpdateTime < 700)) {
                    lastUpdateTime = now;
                    const player = this;
                    currentRuntimeTicks = playbackManager.duration(player);
                    const currentTime = playbackManager.currentTime(player) * 10000;
                    updateTimeDisplay(currentTime, currentRuntimeTicks, playbackManager.playbackStartTime(player), playbackManager.getBufferedRanges(player));
                    const item = currentItem;
                    refreshProgramInfoIfNeeded(player, item);
                    showComingUpNextIfNeeded(player, item, currentTime, currentRuntimeTicks);
                }
            }
        }

        function showComingUpNextIfNeeded(player, currentItem, currentTimeTicks, runtimeTicks) {
            if (runtimeTicks && currentTimeTicks && !comingUpNextDisplayed && !currentVisibleMenu && currentItem.Type === 'Episode' && userSettings.enableNextVideoInfoOverlay()) {
                const showAtSecondsLeft = runtimeTicks >= 3e10 ? 40 : runtimeTicks >= 24e9 ? 35 : 30;
                const showAtTicks = runtimeTicks - 1e3 * showAtSecondsLeft * 1e4;
                const timeRemainingTicks = runtimeTicks - currentTimeTicks;

                if (currentTimeTicks >= showAtTicks && runtimeTicks >= 6e9 && timeRemainingTicks >= 2e8) {
                    showComingUpNext(player);
                }
            }
        }

        function onUpNextHidden() {
            if (currentVisibleMenu === 'upnext') {
                currentVisibleMenu = null;
            }
        }

        function showComingUpNext(player) {
            import('../../../components/upnextdialog/upnextdialog').then(({default: UpNextDialog}) => {
                if (!(currentVisibleMenu || currentUpNextDialog)) {
                    currentVisibleMenu = 'upnext';
                    comingUpNextDisplayed = true;
                    playbackManager.nextItem(player).then(function (nextItem) {
                        currentUpNextDialog = new UpNextDialog({
                            parent: view.querySelector('.upNextContainer'),
                            player: player,
                            nextItem: nextItem
                        });
                        Events.on(currentUpNextDialog, 'hide', onUpNextHidden);
                    }, onUpNextHidden);
                }
            });
        }

        function refreshProgramInfoIfNeeded(player, item) {
            if (item.Type === 'TvChannel') {
                const program = item.CurrentProgram;

                if (program && program.EndDate) {
                    try {
                        const endDate = datetime.parseISO8601Date(program.EndDate);

                        if (new Date().getTime() >= endDate.getTime()) {
                            console.debug('program info needs to be refreshed');
                            const state = playbackManager.getPlayerState(player);
                            onStateChanged.call(player, {
                                type: 'init'
                            }, state);
                        }
                    } catch (e) {
                        console.error('error parsing date: ' + program.EndDate);
                    }
                }
            }
        }

        function updatePlayPauseState(isPaused) {
            const btnPlayPause = view.querySelector('.btnPause');
            const btnPlayPauseIcon = btnPlayPause.querySelector('.material-icons');

            btnPlayPauseIcon.classList.remove('play_arrow', 'pause');

            if (isPaused) {
                btnPlayPauseIcon.classList.add('play_arrow');
                btnPlayPause.setAttribute('title', globalize.translate('Play') + ' (k)');
            } else {
                btnPlayPauseIcon.classList.add('pause');
                btnPlayPause.setAttribute('title', globalize.translate('ButtonPause') + ' (k)');
            }
        }

        function updatePlayerStateInternal(event, player, state) {
            const playState = state.PlayState || {};
            updatePlayPauseState(playState.IsPaused);
            const supportedCommands = playbackManager.getSupportedCommands(player);
            currentPlayerSupportedCommands = supportedCommands;
            updatePlayerVolumeState(player, playState.IsMuted, playState.VolumeLevel);

            if (nowPlayingPositionSlider && !nowPlayingPositionSlider.dragging) {
                nowPlayingPositionSlider.disabled = !playState.CanSeek;
            }

            btnFastForward.disabled = !playState.CanSeek;
            btnRewind.disabled = !playState.CanSeek;
            const nowPlayingItem = state.NowPlayingItem || {};
            playbackStartTimeTicks = playState.PlaybackStartTimeTicks;
            updateTimeDisplay(playState.PositionTicks, nowPlayingItem.RunTimeTicks, playState.PlaybackStartTimeTicks, playState.BufferedRanges || []);
            updateNowPlayingInfo(player, state);

            if (state.MediaSource && state.MediaSource.SupportsTranscoding && supportedCommands.indexOf('SetMaxStreamingBitrate') !== -1) {
                view.querySelector('.btnVideoOsdSettings').classList.remove('hide');
            } else {
                view.querySelector('.btnVideoOsdSettings').classList.add('hide');
            }

            const isProgressClear = state.MediaSource && state.MediaSource.RunTimeTicks == null;
            nowPlayingPositionSlider.setIsClear(isProgressClear);

            if (nowPlayingItem.RunTimeTicks) {
                nowPlayingPositionSlider.setKeyboardSteps(userSettings.skipBackLength() * 1000000 / nowPlayingItem.RunTimeTicks,
                    userSettings.skipForwardLength() * 1000000 / nowPlayingItem.RunTimeTicks);
            }

            if (supportedCommands.indexOf('ToggleFullscreen') === -1 || player.isLocalPlayer && layoutManager.tv && playbackManager.isFullscreen(player)) {
                view.querySelector('.btnFullscreen').classList.add('hide');
            } else {
                view.querySelector('.btnFullscreen').classList.remove('hide');
            }

            if (supportedCommands.indexOf('PictureInPicture') === -1) {
                view.querySelector('.btnPip').classList.add('hide');
            } else {
                view.querySelector('.btnPip').classList.remove('hide');
            }

            if (supportedCommands.indexOf('AirPlay') === -1) {
                view.querySelector('.btnAirPlay').classList.add('hide');
            } else {
                view.querySelector('.btnAirPlay').classList.remove('hide');
            }

            updateFullscreenIcon();
        }

        function getDisplayPercentByTimeOfDay(programStartDateMs, programRuntimeMs, currentTimeMs) {
            return (currentTimeMs - programStartDateMs) / programRuntimeMs * 100;
        }

        function updateTimeDisplay(positionTicks, runtimeTicks, playbackStartTimeTicks, bufferedRanges) {
            if (enableProgressByTimeOfDay) {
                if (nowPlayingPositionSlider && !nowPlayingPositionSlider.dragging) {
                    if (programStartDateMs && programEndDateMs) {
                        const currentTimeMs = (playbackStartTimeTicks + (positionTicks || 0)) / 1e4;
                        const programRuntimeMs = programEndDateMs - programStartDateMs;

                        if (nowPlayingPositionSlider.value = getDisplayPercentByTimeOfDay(programStartDateMs, programRuntimeMs, currentTimeMs), bufferedRanges.length) {
                            const rangeStart = getDisplayPercentByTimeOfDay(programStartDateMs, programRuntimeMs, (playbackStartTimeTicks + (bufferedRanges[0].start || 0)) / 1e4);
                            const rangeEnd = getDisplayPercentByTimeOfDay(programStartDateMs, programRuntimeMs, (playbackStartTimeTicks + (bufferedRanges[0].end || 0)) / 1e4);
                            nowPlayingPositionSlider.setBufferedRanges([{
                                start: rangeStart,
                                end: rangeEnd
                            }]);
                        } else {
                            nowPlayingPositionSlider.setBufferedRanges([]);
                        }
                    } else {
                        nowPlayingPositionSlider.value = 0;
                        nowPlayingPositionSlider.setBufferedRanges([]);
                    }
                }

                nowPlayingPositionText.innerHTML = '';
                nowPlayingDurationText.innerHTML = '';
            } else {
                if (nowPlayingPositionSlider && !nowPlayingPositionSlider.dragging) {
                    if (runtimeTicks) {
                        let pct = positionTicks / runtimeTicks;
                        pct *= 100;
                        nowPlayingPositionSlider.value = pct;
                    } else {
                        nowPlayingPositionSlider.value = 0;
                    }

                    if (runtimeTicks && positionTicks != null && currentRuntimeTicks && !enableProgressByTimeOfDay && currentItem.RunTimeTicks && currentItem.Type !== 'Recording') {
                        endsAtText.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;' + mediaInfo.getEndsAtFromPosition(runtimeTicks, positionTicks, true);
                    } else {
                        endsAtText.innerHTML = '';
                    }
                }

                if (nowPlayingPositionSlider) {
                    nowPlayingPositionSlider.setBufferedRanges(bufferedRanges, runtimeTicks, positionTicks);
                }

                if (positionTicks >= 0) {
                    updateTimeText(nowPlayingPositionText, positionTicks);
                    nowPlayingPositionText.classList.remove('hide');
                } else {
                    nowPlayingPositionText.classList.add('hide');
                }

                const leftTicks = runtimeTicks - positionTicks;
                if (leftTicks >= 0) {
                    updateTimeText(nowPlayingDurationText, leftTicks);
                    nowPlayingDurationText.classList.remove('hide');
                } else {
                    nowPlayingPositionText.classList.add('hide');
                }
            }
        }

        function updatePlayerVolumeState(player, isMuted, volumeLevel) {
            const supportedCommands = currentPlayerSupportedCommands;
            let showMuteButton = true;
            let showVolumeSlider = true;

            if (supportedCommands.indexOf('Mute') === -1) {
                showMuteButton = false;
            }

            if (supportedCommands.indexOf('SetVolume') === -1) {
                showVolumeSlider = false;
            }

            if (player.isLocalPlayer && appHost.supports('physicalvolumecontrol')) {
                showMuteButton = false;
                showVolumeSlider = false;
            }

            const buttonMute = view.querySelector('.buttonMute');
            const buttonMuteIcon = buttonMute.querySelector('.material-icons');

            buttonMuteIcon.classList.remove('volume_off', 'volume_up');

            if (isMuted) {
                buttonMute.setAttribute('title', globalize.translate('Unmute') + ' (m)');
                buttonMuteIcon.classList.add('volume_off');
            } else {
                buttonMute.setAttribute('title', globalize.translate('Mute') + ' (m)');
                buttonMuteIcon.classList.add('volume_up');
            }

            if (showMuteButton) {
                buttonMute.classList.remove('hide');
            } else {
                buttonMute.classList.add('hide');
            }

            if (nowPlayingVolumeSlider) {
                if (showVolumeSlider) {
                    nowPlayingVolumeSliderContainer.classList.remove('hide');
                } else {
                    nowPlayingVolumeSliderContainer.classList.add('hide');
                }

                if (!nowPlayingVolumeSlider.dragging) {
                    nowPlayingVolumeSlider.value = volumeLevel || 0;
                }
            }
        }

        function updatePlaylist() {
            const btnPreviousTrack = view.querySelector('.btnPreviousTrack');
            const btnNextTrack = view.querySelector('.btnNextTrack');
            btnPreviousTrack.classList.remove('hide');
            btnNextTrack.classList.remove('hide');
            btnNextTrack.disabled = false;
            btnPreviousTrack.disabled = false;
        }

        function updateTimeText(elem, ticks, divider) {
            if (ticks == null) {
                elem.innerHTML = '';
                return;
            }

            let html = datetime.getDisplayRunningTime(ticks);

            if (divider) {
                html = '&nbsp;/&nbsp;' + html;
            }

            elem.innerHTML = html;
        }

        function onSettingsButtonClick() {
            const btn = this;

            import('../../../components/playback/playersettingsmenu').then((playerSettingsMenu) => {
                const player = currentPlayer;

                if (player) {
                    // show subtitle offset feature only if player and media support it
                    const showSubOffset = playbackManager.supportSubtitleOffset(player) &&
                        playbackManager.canHandleOffsetOnCurrentSubtitle(player);

                    playerSettingsMenu.show({
                        mediaType: 'Video',
                        player: player,
                        positionTo: btn,
                        stats: true,
                        suboffset: showSubOffset,
                        onOption: onSettingsOption
                    }).finally(() => {
                        resetIdle();
                    });

                    setTimeout(resetIdle, 0);
                }
            });
        }

        function onSettingsOption(selectedOption) {
            if (selectedOption === 'stats') {
                toggleStats();
            } else if (selectedOption === 'suboffset') {
                const player = currentPlayer;
                if (player) {
                    playbackManager.enableShowingSubtitleOffset(player);
                    toggleSubtitleSync();
                }
            }
        }

        function toggleStats() {
            import('../../../components/playerstats/playerstats').then(({default: PlayerStats}) => {
                const player = currentPlayer;

                if (player) {
                    if (statsOverlay) {
                        statsOverlay.toggle();
                    } else {
                        statsOverlay = new PlayerStats({
                            player: player
                        });
                    }
                }
            });
        }

        function destroyStats() {
            if (statsOverlay) {
                statsOverlay.destroy();
                statsOverlay = null;
            }
        }

        function showAudioTrackSelection() {
            const player = currentPlayer;
            const audioTracks = playbackManager.audioTracks(player);
            const currentIndex = playbackManager.getAudioStreamIndex(player);
            const menuItems = audioTracks.map(function (stream) {
                const opt = {
                    name: stream.DisplayTitle,
                    id: stream.Index
                };

                if (stream.Index === currentIndex) {
                    opt.selected = true;
                }

                return opt;
            });
            const positionTo = this;

            import('../../../components/actionSheet/actionSheet').then(({default: actionsheet}) => {
                actionsheet.show({
                    items: menuItems,
                    title: globalize.translate('Audio'),
                    positionTo: positionTo
                }).then(function (id) {
                    const index = parseInt(id);

                    if (index !== currentIndex) {
                        playbackManager.setAudioStreamIndex(index, player);
                    }
                }).finally(() => {
                    resetIdle();
                });

                setTimeout(resetIdle, 0);
            });
        }

        function showSubtitleTrackSelection() {
            const player = currentPlayer;
            const streams = playbackManager.subtitleTracks(player);
            let currentIndex = playbackManager.getSubtitleStreamIndex(player);

            if (currentIndex == null) {
                currentIndex = -1;
            }

            streams.unshift({
                Index: -1,
                DisplayTitle: globalize.translate('Off')
            });
            const menuItems = streams.map(function (stream) {
                const opt = {
                    name: stream.DisplayTitle,
                    id: stream.Index
                };

                if (stream.Index === currentIndex) {
                    opt.selected = true;
                }

                return opt;
            });
            const positionTo = this;

            import('../../../components/actionSheet/actionSheet').then(({default: actionsheet}) => {
                actionsheet.show({
                    title: globalize.translate('Subtitles'),
                    items: menuItems,
                    positionTo: positionTo
                }).then(function (id) {
                    const index = parseInt(id);

                    if (index !== currentIndex) {
                        playbackManager.setSubtitleStreamIndex(index, player);
                    }

                    toggleSubtitleSync();
                }).finally(() => {
                    resetIdle();
                });

                setTimeout(resetIdle, 0);
            });
        }

        function toggleSubtitleSync(action) {
            const player = currentPlayer;
            if (subtitleSyncOverlay) {
                subtitleSyncOverlay.toggle(action);
            } else if (player) {
                subtitleSyncOverlay = new SubtitleSync(player);
            }
        }

        function destroySubtitleSync() {
            if (subtitleSyncOverlay) {
                subtitleSyncOverlay.destroy();
                subtitleSyncOverlay = null;
            }
        }

        /**
         * Clicked element.
         * To skip 'click' handling on Firefox/Edge.
         */
        let clickedElement;

        function onKeyDown(e) {
            clickedElement = e.target;

            const key = keyboardnavigation.getKeyName(e);
            const isKeyModified = e.ctrlKey || e.altKey || e.metaKey;

            if (!currentVisibleMenu && e.keyCode === 32) {
                playbackManager.playPause(currentPlayer);
                showOsd();
                return;
            }

            if (layoutManager.tv && keyboardnavigation.isNavigationKey(key)) {
                showOsd();
                return;
            }

            switch (key) {
                case 'Enter':
                    showOsd();
                    break;
                case 'Escape':
                case 'Back':
                    // Ignore key when some dialog is opened
                    if (currentVisibleMenu === 'osd' && !getOpenedDialog()) {
                        hideOsd();
                        e.stopPropagation();
                    }
                    break;
                case 'k':
                    playbackManager.playPause(currentPlayer);
                    showOsd();
                    break;
                case 'ArrowUp':
                case 'Up':
                    playbackManager.volumeUp(currentPlayer);
                    break;
                case 'ArrowDown':
                case 'Down':
                    playbackManager.volumeDown(currentPlayer);
                    break;
                case 'l':
                case 'ArrowRight':
                case 'Right':
                    playbackManager.fastForward(currentPlayer);
                    showOsd();
                    break;
                case 'j':
                case 'ArrowLeft':
                case 'Left':
                    playbackManager.rewind(currentPlayer);
                    showOsd();
                    break;
                case 'f':
                    if (!e.ctrlKey && !e.metaKey) {
                        playbackManager.toggleFullscreen(currentPlayer);
                        showOsd();
                    }
                    break;
                case 'm':
                    playbackManager.toggleMute(currentPlayer);
                    showOsd();
                    break;
                case 'p':
                case 'P':
                    if (e.shiftKey) {
                        playbackManager.previousTrack(currentPlayer);
                    }
                    break;
                case 'n':
                case 'N':
                    if (e.shiftKey) {
                        playbackManager.nextTrack(currentPlayer);
                    }
                    break;
                case 'NavigationLeft':
                case 'GamepadDPadLeft':
                case 'GamepadLeftThumbstickLeft':
                    // Ignores gamepad events that are always triggered, even when not focused.
                    if (document.hasFocus()) { /* eslint-disable-line compat/compat */
                        playbackManager.rewind(currentPlayer);
                        showOsd();
                    }
                    break;
                case 'NavigationRight':
                case 'GamepadDPadRight':
                case 'GamepadLeftThumbstickRight':
                    // Ignores gamepad events that are always triggered, even when not focused.
                    if (document.hasFocus()) { /* eslint-disable-line compat/compat */
                        playbackManager.fastForward(currentPlayer);
                        showOsd();
                    }
                    break;
                case 'Home':
                    playbackManager.seekPercent(0, currentPlayer);
                    break;
                case 'End':
                    playbackManager.seekPercent(100, currentPlayer);
                    break;
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9': {
                    if (!isKeyModified) {
                        const percent = parseInt(key, 10) * 10;
                        playbackManager.seekPercent(percent, currentPlayer);
                    }
                    break;
                }
                case '>':
                    playbackManager.increasePlaybackRate(currentPlayer);
                    break;
                case '<':
                    playbackManager.decreasePlaybackRate(currentPlayer);
                    break;
                case 'PageUp':
                    playbackManager.nextChapter(currentPlayer);
                    break;
                case 'PageDown':
                    playbackManager.previousChapter(currentPlayer);
                    break;
            }
        }

        function onKeyDownCapture() {
            resetIdle();
        }

        function onWindowMouseDown(e) {
            clickedElement = e.target;
            mouseIsDown = true;
            resetIdle();
        }

        function onWindowMouseUp() {
            mouseIsDown = false;
            resetIdle();
        }

        function onWindowTouchStart(e) {
            clickedElement = e.target;
            mouseIsDown = true;
            resetIdle();
        }

        function onWindowTouchEnd() {
            mouseIsDown = false;
            resetIdle();
        }

        function onWindowDragEnd() {
            // mousedown -> dragstart -> dragend !!! no mouseup :(
            mouseIsDown = false;
            resetIdle();
        }

        function getImgUrl(item, chapter, index, maxWidth, apiClient) {
            if (chapter.ImageTag) {
                return apiClient.getScaledImageUrl(item.Id, {
                    maxWidth: maxWidth,
                    tag: chapter.ImageTag,
                    type: 'Chapter',
                    index: index
                });
            }

            return null;
        }

        function getChapterBubbleHtml(apiClient, item, chapters, positionTicks) {
            let chapter;
            let index = -1;

            for (let i = 0, length = chapters.length; i < length; i++) {
                const currentChapter = chapters[i];

                if (positionTicks >= currentChapter.StartPositionTicks) {
                    chapter = currentChapter;
                    index = i;
                }
            }

            if (!chapter) {
                return null;
            }

            const src = getImgUrl(item, chapter, index, 400, apiClient);

            if (src) {
                let html = '<div class="chapterThumbContainer">';
                html += '<img class="chapterThumb" src="' + src + '" />';
                html += '<div class="chapterThumbTextContainer">';
                html += '<div class="chapterThumbText chapterThumbText-dim">';
                html += chapter.Name;
                html += '</div>';
                html += '<h2 class="chapterThumbText">';
                html += datetime.getDisplayRunningTime(positionTicks);
                html += '</h2>';
                html += '</div>';
                return html + '</div>';
            }

            return null;
        }

        let playPauseClickTimeout;
        function onViewHideStopPlayback() {
            if (playbackManager.isPlayingVideo()) {
                shell.disableFullscreen();

                clearTimeout(playPauseClickTimeout);
                const player = currentPlayer;
                view.removeEventListener('viewbeforehide', onViewHideStopPlayback);
                releaseCurrentPlayer();
                playbackManager.stop(player);
            }
        }

        function enableStopOnBack(enabled) {
            view.removeEventListener('viewbeforehide', onViewHideStopPlayback);

            if (enabled && playbackManager.isPlayingVideo(currentPlayer)) {
                view.addEventListener('viewbeforehide', onViewHideStopPlayback);
            }
        }

        shell.enableFullscreen();

        let currentPlayer;
        let comingUpNextDisplayed;
        let currentUpNextDialog;
        let isEnabled;
        let currentItem;
        let recordingButtonManager;
        let enableProgressByTimeOfDay;
        let currentVisibleMenu;
        let statsOverlay;
        let osdHideTimeout;
        let lastPointerMoveData;
        const self = this;
        let currentPlayerSupportedCommands = [];
        let currentRuntimeTicks = 0;
        let lastUpdateTime = 0;
        let programStartDateMs = 0;
        let programEndDateMs = 0;
        let playbackStartTimeTicks = 0;
        let subtitleSyncOverlay;
        const nowPlayingVolumeSlider = view.querySelector('.osdVolumeSlider');
        const nowPlayingVolumeSliderContainer = view.querySelector('.osdVolumeSliderContainer');
        const nowPlayingPositionSlider = view.querySelector('.osdPositionSlider');
        const nowPlayingPositionText = view.querySelector('.osdPositionText');
        const nowPlayingDurationText = view.querySelector('.osdDurationText');
        const startTimeText = view.querySelector('.startTimeText');
        const endTimeText = view.querySelector('.endTimeText');
        const endsAtText = view.querySelector('.endsAtText');
        const btnRewind = view.querySelector('.btnRewind');
        const btnFastForward = view.querySelector('.btnFastForward');
        const transitionEndEventName = dom.whichTransitionEvent();
        const headerElement = document.querySelector('.skinHeader');
        const osdBottomElement = document.querySelector('.videoOsdBottom-maincontrols');

        nowPlayingPositionSlider.enableKeyboardDragging();
        nowPlayingVolumeSlider.enableKeyboardDragging();

        if (layoutManager.tv) {
            nowPlayingPositionSlider.classList.add('focusable');
        }

        view.addEventListener('viewbeforeshow', function () {
            headerElement.classList.add('osdHeader');
            appRouter.setTransparency('full');
        });
        view.addEventListener('viewshow', function () {
            try {
                Events.on(playbackManager, 'playerchange', onPlayerChange);
                bindToPlayer(playbackManager.getCurrentPlayer());
                /* eslint-disable-next-line compat/compat */
                dom.addEventListener(document, window.PointerEvent ? 'pointermove' : 'mousemove', onPointerMove, {
                    passive: true
                });
                showOsd();
                inputManager.on(window, onInputCommand);
                document.addEventListener('keydown', onKeyDown);
                dom.addEventListener(document, 'keydown', onKeyDownCapture, {
                    capture: true,
                    passive: true
                });
                /* eslint-disable-next-line compat/compat */
                dom.addEventListener(window, window.PointerEvent ? 'pointerdown' : 'mousedown', onWindowMouseDown, {
                    capture: true,
                    passive: true
                });
                /* eslint-disable-next-line compat/compat */
                dom.addEventListener(window, window.PointerEvent ? 'pointerup' : 'mouseup', onWindowMouseUp, {
                    capture: true,
                    passive: true
                });
                dom.addEventListener(window, 'touchstart', onWindowTouchStart, {
                    capture: true,
                    passive: true
                });
                ['touchend', 'touchcancel'].forEach((event) => {
                    dom.addEventListener(window, event, onWindowTouchEnd, {
                        capture: true,
                        passive: true
                    });
                });
                dom.addEventListener(window, 'dragend', onWindowDragEnd, {
                    capture: true,
                    passive: true
                });
            } catch (e) {
                appRouter.goHome();
            }
        });
        view.addEventListener('viewbeforehide', function () {
            if (statsOverlay) {
                statsOverlay.enabled(false);
            }

            document.removeEventListener('keydown', onKeyDown);
            dom.removeEventListener(document, 'keydown', onKeyDownCapture, {
                capture: true,
                passive: true
            });
            /* eslint-disable-next-line compat/compat */
            dom.removeEventListener(window, window.PointerEvent ? 'pointerdown' : 'mousedown', onWindowMouseDown, {
                capture: true,
                passive: true
            });
            /* eslint-disable-next-line compat/compat */
            dom.removeEventListener(window, window.PointerEvent ? 'pointerup' : 'mouseup', onWindowMouseUp, {
                capture: true,
                passive: true
            });
            dom.removeEventListener(window, 'touchstart', onWindowTouchStart, {
                capture: true,
                passive: true
            });
            ['touchend', 'touchcancel'].forEach((event) => {
                dom.removeEventListener(window, event, onWindowTouchEnd, {
                    capture: true,
                    passive: true
                });
            });
            dom.removeEventListener(window, 'dragend', onWindowDragEnd, {
                capture: true,
                passive: true
            });
            stopOsdHideTimer();
            headerElement.classList.remove('osdHeader');
            headerElement.classList.remove('osdHeader-hidden');
            /* eslint-disable-next-line compat/compat */
            dom.removeEventListener(document, window.PointerEvent ? 'pointermove' : 'mousemove', onPointerMove, {
                passive: true
            });
            inputManager.off(window, onInputCommand);
            Events.off(playbackManager, 'playerchange', onPlayerChange);
            releaseCurrentPlayer();
        });
        view.querySelector('.btnFullscreen').addEventListener('click', function () {
            playbackManager.toggleFullscreen(currentPlayer);
        });
        view.querySelector('.btnPip').addEventListener('click', function () {
            playbackManager.togglePictureInPicture(currentPlayer);
        });
        view.querySelector('.btnAirPlay').addEventListener('click', function () {
            playbackManager.toggleAirPlay(currentPlayer);
        });
        view.querySelector('.btnVideoOsdSettings').addEventListener('click', onSettingsButtonClick);
        view.addEventListener('viewhide', function () {
            headerElement.classList.remove('hide');
        });
        view.addEventListener('viewdestroy', function () {
            if (self.touchHelper) {
                self.touchHelper.destroy();
                self.touchHelper = null;
            }

            if (recordingButtonManager) {
                recordingButtonManager.destroy();
                recordingButtonManager = null;
            }

            destroyStats();
            destroySubtitleSync();
        });
        let lastPointerDown = 0;
        /* eslint-disable-next-line compat/compat */
        dom.addEventListener(view, window.PointerEvent ? 'pointerdown' : 'click', function (e) {
            if (dom.parentWithClass(e.target, ['videoOsdBottom', 'upNextContainer'])) {
                return void showOsd();
            }

            const pointerType = e.pointerType || (layoutManager.mobile ? 'touch' : 'mouse');
            const now = new Date().getTime();

            switch (pointerType) {
                case 'touch':
                    if (now - lastPointerDown > 300) {
                        lastPointerDown = now;
                        toggleOsd();
                    }

                    break;

                case 'mouse':
                    if (!e.button) {
                        if (playPauseClickTimeout) {
                            clearTimeout(playPauseClickTimeout);
                            playPauseClickTimeout = 0;
                        } else {
                            playPauseClickTimeout = setTimeout(function() {
                                playbackManager.playPause(currentPlayer);
                                showOsd();
                                playPauseClickTimeout = 0;
                            }, 300);
                        }
                    }

                    break;

                default:
                    playbackManager.playPause(currentPlayer);
                    showOsd();
            }
        }, {
            passive: true
        });

        dom.addEventListener(view, 'dblclick', (e) => {
            if (e.target !== view) return;
            playbackManager.toggleFullscreen(currentPlayer);
        });

        view.querySelector('.buttonMute').addEventListener('click', function () {
            playbackManager.toggleMute(currentPlayer);
        });

        nowPlayingVolumeSlider.addEventListener('input', (e) => {
            playbackManager.setVolume(e.target.value, currentPlayer);
        });

        nowPlayingPositionSlider.addEventListener('change', function () {
            const player = currentPlayer;

            if (player) {
                const newPercent = parseFloat(this.value);

                if (enableProgressByTimeOfDay) {
                    let seekAirTimeTicks = newPercent / 100 * (programEndDateMs - programStartDateMs) * 1e4;
                    seekAirTimeTicks += 1e4 * programStartDateMs;
                    seekAirTimeTicks -= playbackStartTimeTicks;
                    playbackManager.seek(seekAirTimeTicks, player);
                } else {
                    playbackManager.seekPercent(newPercent, player);
                }
            }
        });

        nowPlayingPositionSlider.getBubbleHtml = function (value) {
            showOsd();
            if (enableProgressByTimeOfDay) {
                if (programStartDateMs && programEndDateMs) {
                    let ms = programEndDateMs - programStartDateMs;
                    ms /= 100;
                    ms *= value;
                    ms += programStartDateMs;
                    return '<h1 class="sliderBubbleText">' + getDisplayTimeWithoutAmPm(new Date(parseInt(ms)), true) + '</h1>';
                }

                return '--:--';
            }

            if (!currentRuntimeTicks) {
                return '--:--';
            }

            let ticks = currentRuntimeTicks;
            ticks /= 100;
            ticks *= value;
            const item = currentItem;

            if (item && item.Chapters && item.Chapters.length && item.Chapters[0].ImageTag) {
                const html = getChapterBubbleHtml(ServerConnections.getApiClient(item.ServerId), item, item.Chapters, ticks);

                if (html) {
                    return html;
                }
            }

            return '<h1 class="sliderBubbleText">' + datetime.getDisplayRunningTime(ticks) + '</h1>';
        };

        view.querySelector('.btnPreviousTrack').addEventListener('click', function () {
            playbackManager.previousTrack(currentPlayer);
        });
        view.querySelector('.btnPause').addEventListener('click', function () {
            // Ignore 'click' if another element was originally clicked (Firefox/Edge issue)
            if (this.contains(clickedElement)) {
                playbackManager.playPause(currentPlayer);
            }
        });
        view.querySelector('.btnNextTrack').addEventListener('click', function () {
            playbackManager.nextTrack(currentPlayer);
        });
        btnRewind.addEventListener('click', function () {
            playbackManager.rewind(currentPlayer);
        });
        btnFastForward.addEventListener('click', function () {
            playbackManager.fastForward(currentPlayer);
        });
        view.querySelector('.btnAudio').addEventListener('click', showAudioTrackSelection);
        view.querySelector('.btnSubtitles').addEventListener('click', showSubtitleTrackSelection);

        // Register to SyncPlay playback events and show big animated icon
        const showIcon = (action) => {
            let primary_icon_name = '';
            let secondary_icon_name = '';
            let animation_class = 'oneShotPulse';
            let iconVisibilityTime = 1500;
            const syncPlayIcon = view.querySelector('#syncPlayIcon');

            switch (action) {
                case 'schedule-play':
                    primary_icon_name = 'sync spin';
                    secondary_icon_name = 'play_arrow centered';
                    animation_class = 'infinitePulse';
                    iconVisibilityTime = -1;
                    hideOsd();
                    break;
                case 'unpause':
                    primary_icon_name = 'play_circle_outline';
                    break;
                case 'pause':
                    primary_icon_name = 'pause_circle_outline';
                    showOsd();
                    break;
                case 'seek':
                    primary_icon_name = 'update';
                    animation_class = 'infinitePulse';
                    iconVisibilityTime = -1;
                    break;
                case 'buffering':
                    primary_icon_name = 'schedule';
                    animation_class = 'infinitePulse';
                    iconVisibilityTime = -1;
                    break;
                case 'wait-pause':
                    primary_icon_name = 'schedule';
                    secondary_icon_name = 'pause shifted';
                    animation_class = 'infinitePulse';
                    iconVisibilityTime = -1;
                    break;
                case 'wait-unpause':
                    primary_icon_name = 'schedule';
                    secondary_icon_name = 'play_arrow shifted';
                    animation_class = 'infinitePulse';
                    iconVisibilityTime = -1;
                    break;
                default: {
                    syncPlayIcon.style.visibility = 'hidden';
                    return;
                }
            }

            syncPlayIcon.setAttribute('class', 'syncPlayIconCircle ' + animation_class);

            const primaryIcon = syncPlayIcon.querySelector('.primary-icon');
            primaryIcon.setAttribute('class', 'primary-icon material-icons ' + primary_icon_name);

            const secondaryIcon = syncPlayIcon.querySelector('.secondary-icon');
            secondaryIcon.setAttribute('class', 'secondary-icon material-icons ' + secondary_icon_name);

            const clone = syncPlayIcon.cloneNode(true);
            clone.style.visibility = 'visible';
            syncPlayIcon.parentNode.replaceChild(clone, syncPlayIcon);

            if (iconVisibilityTime < 0) {
                return;
            }

            setTimeout(() => {
                clone.style.visibility = 'hidden';
            }, iconVisibilityTime);
        };

        Events.on(SyncPlay.Manager, 'enabled', (event, enabled) => {
            if (enabled) {
                // SyncPlay enabled
            } else {
                const syncPlayIcon = view.querySelector('#syncPlayIcon');
                syncPlayIcon.style.visibility = 'hidden';
            }
        });

        Events.on(SyncPlay.Manager, 'notify-osd', (event, action) => {
            showIcon(action);
        });

        Events.on(SyncPlay.Manager, 'group-state-update', (event, state, reason) => {
            if (state === 'Playing' && reason === 'Unpause') {
                showIcon('schedule-play');
            } else if (state === 'Playing' && reason === 'Ready') {
                showIcon('schedule-play');
            } else if (state === 'Paused' && reason === 'Pause') {
                showIcon('pause');
            } else if (state === 'Paused' && reason === 'Ready') {
                showIcon('clear');
            } else if (state === 'Waiting' && reason === 'Seek') {
                showIcon('seek');
            } else if (state === 'Waiting' && reason === 'Buffer') {
                showIcon('buffering');
            } else if (state === 'Waiting' && reason === 'Pause') {
                showIcon('wait-pause');
            } else if (state === 'Waiting' && reason === 'Unpause') {
                showIcon('wait-unpause');
            }
        });
    }

/* eslint-enable indent */
