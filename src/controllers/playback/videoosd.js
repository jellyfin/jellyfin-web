define(["playbackManager", "dom", "inputManager", "datetime", "itemHelper", "mediaInfo", "focusManager", "imageLoader", "scrollHelper", "events", "connectionManager", "browser", "globalize", "apphost", "layoutManager", "userSettings", "keyboardnavigation", "scrollStyles", "emby-slider", "paper-icon-button-light", "css!assets/css/videoosd"], function (playbackManager, dom, inputManager, datetime, itemHelper, mediaInfo, focusManager, imageLoader, scrollHelper, events, connectionManager, browser, globalize, appHost, layoutManager, userSettings, keyboardnavigation) {
    "use strict";

    function seriesImageUrl(item, options) {
        if ("Episode" !== item.Type) {
            return null;
        }

        options = options || {};
        options.type = options.type || "Primary";
        if ("Primary" === options.type && item.SeriesPrimaryImageTag) {
            options.tag = item.SeriesPrimaryImageTag;
            return connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId, options);
        }

        if ("Thumb" === options.type) {
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
        options = options || {};
        options.type = options.type || "Primary";

        if (item.ImageTags && item.ImageTags[options.type]) {
            options.tag = item.ImageTags[options.type];
            return connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.PrimaryImageItemId || item.Id, options);
        }

        if ("Primary" === options.type && item.AlbumId && item.AlbumPrimaryImageTag) {
            options.tag = item.AlbumPrimaryImageTag;
            return connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.AlbumId, options);
        }

        return null;
    }

    function logoImageUrl(item, apiClient, options) {
        options = options || {};
        options.type = "Logo";

        if (item.ImageTags && item.ImageTags.Logo) {
            options.tag = item.ImageTags.Logo;
            return apiClient.getScaledImageUrl(item.Id, options);
        }

        if (item.ParentLogoImageTag) {
            options.tag = item.ParentLogoImageTag;
            return apiClient.getScaledImageUrl(item.ParentLogoItemId, options);
        }

        return null;
    }

    return function (view, params) {
        function onVerticalSwipe(e, elem, data) {
            var player = currentPlayer;

            if (player) {
                var deltaY = data.currentDeltaY;
                var windowSize = dom.getWindowSize();

                if (supportsBrightnessChange && data.clientX < windowSize.innerWidth / 2) {
                    return void doBrightnessTouch(deltaY, player, windowSize.innerHeight);
                }

                doVolumeTouch(deltaY, player, windowSize.innerHeight);
            }
        }

        function doBrightnessTouch(deltaY, player, viewHeight) {
            var delta = -deltaY / viewHeight * 100;
            var newValue = playbackManager.getBrightness(player) + delta;
            newValue = Math.min(newValue, 100);
            newValue = Math.max(newValue, 0);
            playbackManager.setBrightness(newValue, player);
        }

        function doVolumeTouch(deltaY, player, viewHeight) {
            var delta = -deltaY / viewHeight * 100;
            var newValue = playbackManager.getVolume(player) + delta;
            newValue = Math.min(newValue, 100);
            newValue = Math.max(newValue, 0);
            playbackManager.setVolume(newValue, player);
        }

        function onDoubleClick(e) {
            var clientX = e.clientX;

            if (null != clientX) {
                if (clientX < dom.getWindowSize().innerWidth / 2) {
                    playbackManager.rewind(currentPlayer);
                } else {
                    playbackManager.fastForward(currentPlayer);
                }

                e.preventDefault();
                e.stopPropagation();
            }
        }

        function getDisplayItem(item) {
            if ("TvChannel" === item.Type) {
                var apiClient = connectionManager.getApiClient(item.ServerId);
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
            if (!item || "Program" !== item.Type) {
                if (recordingButtonManager) {
                    recordingButtonManager.destroy();
                    recordingButtonManager = null;
                }

                return void view.querySelector(".btnRecord").classList.add("hide");
            }

            connectionManager.getApiClient(item.ServerId).getCurrentUser().then(function (user) {
                if (user.Policy.EnableLiveTvManagement) {
                    require(["recordingButton"], function (RecordingButton) {
                        if (recordingButtonManager) {
                            return void recordingButtonManager.refreshItem(item);
                        }

                        recordingButtonManager = new RecordingButton({
                            item: item,
                            button: view.querySelector(".btnRecord")
                        });
                        view.querySelector(".btnRecord").classList.remove("hide");
                    });
                }
            });
        }

        function updateDisplayItem(itemInfo) {
            var item = itemInfo.originalItem;
            currentItem = item;
            var displayItem = itemInfo.displayItem || item;
            updateRecordingButton(displayItem);
            setPoster(displayItem, item);
            var parentName = displayItem.SeriesName || displayItem.Album;

            if (displayItem.EpisodeTitle || displayItem.IsSeries) {
                parentName = displayItem.Name;
            }

            setTitle(displayItem, parentName);
            var titleElement;
            var osdTitle = view.querySelector(".osdTitle");
            titleElement = osdTitle;
            var displayName = itemHelper.getDisplayName(displayItem, {
                includeParentInfo: "Program" !== displayItem.Type,
                includeIndexNumber: "Program" !== displayItem.Type
            });

            if (!displayName) {
                displayItem.Type;
            }

            titleElement.innerHTML = displayName;

            if (displayName) {
                titleElement.classList.remove("hide");
            } else {
                titleElement.classList.add("hide");
            }

            var mediaInfoHtml = mediaInfo.getPrimaryMediaInfoHtml(displayItem, {
                runtime: false,
                subtitles: false,
                tomatoes: false,
                endsAt: false,
                episodeTitle: false,
                originalAirDate: "Program" !== displayItem.Type,
                episodeTitleIndexNumber: "Program" !== displayItem.Type,
                programIndicator: false
            });
            var osdMediaInfo = view.querySelector(".osdMediaInfo");
            osdMediaInfo.innerHTML = mediaInfoHtml;

            if (mediaInfoHtml) {
                osdMediaInfo.classList.remove("hide");
            } else {
                osdMediaInfo.classList.add("hide");
            }

            var secondaryMediaInfo = view.querySelector(".osdSecondaryMediaInfo");
            var secondaryMediaInfoHtml = mediaInfo.getSecondaryMediaInfoHtml(displayItem, {
                startDate: false,
                programTime: false
            });
            secondaryMediaInfo.innerHTML = secondaryMediaInfoHtml;

            if (secondaryMediaInfoHtml) {
                secondaryMediaInfo.classList.remove("hide");
            } else {
                secondaryMediaInfo.classList.add("hide");
            }

            if (displayName) {
                view.querySelector(".osdMainTextContainer").classList.remove("hide");
            } else {
                view.querySelector(".osdMainTextContainer").classList.add("hide");
            }

            if (enableProgressByTimeOfDay) {
                setDisplayTime(startTimeText, displayItem.StartDate);
                setDisplayTime(endTimeText, displayItem.EndDate);
                startTimeText.classList.remove("hide");
                endTimeText.classList.remove("hide");
                programStartDateMs = displayItem.StartDate ? datetime.parseISO8601Date(displayItem.StartDate).getTime() : 0;
                programEndDateMs = displayItem.EndDate ? datetime.parseISO8601Date(displayItem.EndDate).getTime() : 0;
            } else {
                startTimeText.classList.add("hide");
                endTimeText.classList.add("hide");
                startTimeText.innerHTML = "";
                endTimeText.innerHTML = "";
                programStartDateMs = 0;
                programEndDateMs = 0;
            }
        }

        function getDisplayTimeWithoutAmPm(date, showSeconds) {
            if (showSeconds) {
                return datetime.toLocaleTimeString(date, {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit"
                }).toLowerCase().replace("am", "").replace("pm", "").trim();
            }

            return datetime.getDisplayTime(date).toLowerCase().replace("am", "").replace("pm", "").trim();
        }

        function setDisplayTime(elem, date) {
            var html;

            if (date) {
                date = datetime.parseISO8601Date(date);
                html = getDisplayTimeWithoutAmPm(date);
            }

            elem.innerHTML = html || "";
        }

        function shouldEnableProgressByTimeOfDay(item) {
            return !("TvChannel" !== item.Type || !item.CurrentProgram);
        }

        function updateNowPlayingInfo(player, state) {
            var item = state.NowPlayingItem;

            currentItem = item;
            if (!item) {
                setPoster(null);
                updateRecordingButton(null);
                Emby.Page.setTitle("");
                nowPlayingVolumeSlider.disabled = true;
                nowPlayingPositionSlider.disabled = true;
                btnFastForward.disabled = true;
                btnRewind.disabled = true;
                view.querySelector(".btnSubtitles").classList.add("hide");
                view.querySelector(".btnAudio").classList.add("hide");
                view.querySelector(".osdTitle").innerHTML = "";
                view.querySelector(".osdMediaInfo").innerHTML = "";
                return;
            }

            enableProgressByTimeOfDay = shouldEnableProgressByTimeOfDay(item);
            getDisplayItem(item).then(updateDisplayItem);
            nowPlayingVolumeSlider.disabled = false;
            nowPlayingPositionSlider.disabled = false;
            btnFastForward.disabled = false;
            btnRewind.disabled = false;

            if (playbackManager.subtitleTracks(player).length) {
                view.querySelector(".btnSubtitles").classList.remove("hide");
                toggleSubtitleSync();
            } else {
                view.querySelector(".btnSubtitles").classList.add("hide");
                toggleSubtitleSync("forceToHide");
            }

            if (playbackManager.audioTracks(player).length > 1) {
                view.querySelector(".btnAudio").classList.remove("hide");
            } else {
                view.querySelector(".btnAudio").classList.add("hide");
            }
        }

        function setTitle(item, parentName) {
            var url = logoImageUrl(item, connectionManager.getApiClient(item.ServerId), {});

            if (url) {
                Emby.Page.setTitle("");
                var pageTitle = document.querySelector(".pageTitle");
                pageTitle.style.backgroundImage = "url('" + url + "')";
                pageTitle.classList.add("pageTitleWithLogo");
                pageTitle.classList.remove("pageTitleWithDefaultLogo");
                pageTitle.innerHTML = "";
            } else {
                Emby.Page.setTitle(parentName || "");
            }

            var documentTitle = parentName || (item ? item.Name : null);

            if (documentTitle) {
                document.title = documentTitle;
            }
        }

        function setPoster(item, secondaryItem) {
            var osdPoster = view.querySelector(".osdPoster");

            if (item) {
                var imgUrl = seriesImageUrl(item, {
                    maxWidth: osdPoster.clientWidth * 2,
                    type: "Primary"
                }) || seriesImageUrl(item, {
                    maxWidth: osdPoster.clientWidth * 2,
                    type: "Thumb"
                }) || imageUrl(item, {
                    maxWidth: osdPoster.clientWidth * 2,
                    type: "Primary"
                });

                if (!imgUrl && secondaryItem && (imgUrl = seriesImageUrl(secondaryItem, {
                    maxWidth: osdPoster.clientWidth * 2,
                    type: "Primary"
                }) || seriesImageUrl(secondaryItem, {
                    maxWidth: osdPoster.clientWidth * 2,
                    type: "Thumb"
                }) || imageUrl(secondaryItem, {
                    maxWidth: osdPoster.clientWidth * 2,
                    type: "Primary"
                })), imgUrl) {
                    return void (osdPoster.innerHTML = '<img src="' + imgUrl + '" />');
                }
            }

            osdPoster.innerHTML = "";
        }

        function showOsd() {
            slideDownToShow(headerElement);
            showMainOsdControls();
            startOsdHideTimer();
        }

        function hideOsd() {
            slideUpToHide(headerElement);
            hideMainOsdControls();
        }

        function toggleOsd() {
            if ("osd" === currentVisibleMenu) {
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
            elem.classList.remove("osdHeader-hidden");
        }

        function slideUpToHide(elem) {
            elem.classList.add("osdHeader-hidden");
        }

        function clearHideAnimationEventListeners(elem) {
            dom.removeEventListener(elem, transitionEndEventName, onHideAnimationComplete, {
                once: true
            });
        }

        function onHideAnimationComplete(e) {
            var elem = e.target;
            if (elem != osdBottomElement)
                return;
            elem.classList.add("hide");
            dom.removeEventListener(elem, transitionEndEventName, onHideAnimationComplete, {
                once: true
            });
        }

        function showMainOsdControls() {
            if (!currentVisibleMenu) {
                var elem = osdBottomElement;
                currentVisibleMenu = "osd";
                clearHideAnimationEventListeners(elem);
                elem.classList.remove("hide");
                elem.classList.remove("videoOsdBottom-hidden");

                if (!layoutManager.mobile) {
                    setTimeout(function () {
                        focusManager.focus(elem.querySelector(".btnPause"));
                    }, 50);
                }
                toggleSubtitleSync();
            }
        }

        function hideMainOsdControls() {
            if ("osd" === currentVisibleMenu) {
                var elem = osdBottomElement;
                clearHideAnimationEventListeners(elem);
                elem.classList.add("videoOsdBottom-hidden");
                dom.addEventListener(elem, transitionEndEventName, onHideAnimationComplete, {
                    once: true
                });
                currentVisibleMenu = null;
                toggleSubtitleSync("hide");

                // Firefox does not blur by itself
                if (document.activeElement) {
                    document.activeElement.blur();
                }
            }
        }

        function onPointerMove(e) {
            if ("mouse" === (e.pointerType || (layoutManager.mobile ? "touch" : "mouse"))) {
                var eventX = e.screenX || 0;
                var eventY = e.screenY || 0;
                var obj = lastPointerMoveData;

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
            var player = currentPlayer;

            switch (e.detail.command) {
                case "left":
                    if ("osd" === currentVisibleMenu) {
                        showOsd();
                    } else {
                        if (!currentVisibleMenu) {
                            e.preventDefault();
                            playbackManager.rewind(player);
                        }
                    }

                    break;

                case "right":
                    if ("osd" === currentVisibleMenu) {
                        showOsd();
                    } else if (!currentVisibleMenu) {
                        e.preventDefault();
                        playbackManager.fastForward(player);
                    }

                    break;

                case "pageup":
                    playbackManager.nextChapter(player);
                    break;

                case "pagedown":
                    playbackManager.previousChapter(player);
                    break;

                case "up":
                case "down":
                case "select":
                case "menu":
                case "info":
                case "play":
                case "playpause":
                case "pause":
                case "fastforward":
                case "rewind":
                case "next":
                case "previous":
                    showOsd();
                    break;

                case "record":
                    onRecordingCommand();
                    showOsd();
                    break;

                case "togglestats":
                    toggleStats();
            }
        }

        function onRecordingCommand() {
            var btnRecord = view.querySelector(".btnRecord");

            if (!btnRecord.classList.contains("hide")) {
                btnRecord.click();
            }
        }

        function updateFullscreenIcon() {
            if (playbackManager.isFullscreen(currentPlayer)) {
                view.querySelector(".btnFullscreen").setAttribute("title", globalize.translate("ExitFullscreen"));
                view.querySelector(".btnFullscreen i").innerHTML = "&#xE5D1;";
            } else {
                view.querySelector(".btnFullscreen").setAttribute("title", globalize.translate("Fullscreen") + " (f)");
                view.querySelector(".btnFullscreen i").innerHTML = "fullscreen";
            }
        }

        function onPlayerChange() {
            bindToPlayer(playbackManager.getCurrentPlayer());
        }

        function onStateChanged(event, state) {
            var player = this;

            if (state.NowPlayingItem) {
                isEnabled = true;
                updatePlayerStateInternal(event, player, state);
                updatePlaylist(player);
                enableStopOnBack(true);
            }
        }

        function onPlayPauseStateChanged(e) {
            if (isEnabled) {
                updatePlayPauseState(this.paused());
            }
        }

        function onVolumeChanged(e) {
            if (isEnabled) {
                var player = this;
                updatePlayerVolumeState(player, player.isMuted(), player.getVolume());
            }
        }

        function onPlaybackStart(e, state) {
            console.debug("nowplaying event: " + e.type);
            var player = this;
            onStateChanged.call(player, e, state);
            resetUpNextDialog();
        }

        function resetUpNextDialog() {
            comingUpNextDisplayed = false;
            var dlg = currentUpNextDialog;

            if (dlg) {
                dlg.destroy();
                currentUpNextDialog = null;
            }
        }

        function onPlaybackStopped(e, state) {
            currentRuntimeTicks = null;
            resetUpNextDialog();
            console.debug("nowplaying event: " + e.type);

            if ("Video" !== state.NextMediaType) {
                view.removeEventListener("viewbeforehide", onViewHideStopPlayback);
                Emby.Page.back();
            }
        }

        function onMediaStreamsChanged(e) {
            var player = this;
            var state = playbackManager.getPlayerState(player);
            onStateChanged.call(player, {
                type: "init"
            }, state);
        }

        function onBeginFetch() {
            document.querySelector(".osdMediaStatus").classList.remove("hide");
        }

        function onEndFetch() {
            document.querySelector(".osdMediaStatus").classList.add("hide");
        }

        function bindToPlayer(player) {
            if (player !== currentPlayer) {
                releaseCurrentPlayer();
                currentPlayer = player;
                if (!player) return;
            }
            var state = playbackManager.getPlayerState(player);
            onStateChanged.call(player, {
                type: "init"
            }, state);
            events.on(player, "playbackstart", onPlaybackStart);
            events.on(player, "playbackstop", onPlaybackStopped);
            events.on(player, "volumechange", onVolumeChanged);
            events.on(player, "pause", onPlayPauseStateChanged);
            events.on(player, "unpause", onPlayPauseStateChanged);
            events.on(player, "timeupdate", onTimeUpdate);
            events.on(player, "fullscreenchange", updateFullscreenIcon);
            events.on(player, "mediastreamschange", onMediaStreamsChanged);
            events.on(player, "beginFetch", onBeginFetch);
            events.on(player, "endFetch", onEndFetch);
            resetUpNextDialog();

            if (player.isFetching) {
                onBeginFetch();
            }
        }

        function releaseCurrentPlayer() {
            destroyStats();
            destroySubtitleSync();
            resetUpNextDialog();
            var player = currentPlayer;

            if (player) {
                events.off(player, "playbackstart", onPlaybackStart);
                events.off(player, "playbackstop", onPlaybackStopped);
                events.off(player, "volumechange", onVolumeChanged);
                events.off(player, "pause", onPlayPauseStateChanged);
                events.off(player, "unpause", onPlayPauseStateChanged);
                events.off(player, "timeupdate", onTimeUpdate);
                events.off(player, "fullscreenchange", updateFullscreenIcon);
                events.off(player, "mediastreamschange", onMediaStreamsChanged);
                currentPlayer = null;
            }
        }

        function onTimeUpdate(e) {
            // Test for 'currentItem' is required for Firefox since its player spams 'timeupdate' events even being at breakpoint
            if (isEnabled && currentItem) {
                var now = new Date().getTime();

                if (!(now - lastUpdateTime < 700)) {
                    lastUpdateTime = now;
                    var player = this;
                    currentRuntimeTicks = playbackManager.duration(player);
                    var currentTime = playbackManager.currentTime(player);
                    updateTimeDisplay(currentTime, currentRuntimeTicks, playbackManager.playbackStartTime(player), playbackManager.getBufferedRanges(player));
                    var item = currentItem;
                    refreshProgramInfoIfNeeded(player, item);
                    showComingUpNextIfNeeded(player, item, currentTime, currentRuntimeTicks);
                }
            }
        }

        function showComingUpNextIfNeeded(player, currentItem, currentTimeTicks, runtimeTicks) {
            if (runtimeTicks && currentTimeTicks && !comingUpNextDisplayed && !currentVisibleMenu && "Episode" === currentItem.Type && userSettings.enableNextVideoInfoOverlay()) {
                var showAtSecondsLeft = runtimeTicks >= 3e10 ? 40 : runtimeTicks >= 24e9 ? 35 : 30;
                var showAtTicks = runtimeTicks - 1e3 * showAtSecondsLeft * 1e4;
                var timeRemainingTicks = runtimeTicks - currentTimeTicks;

                if (currentTimeTicks >= showAtTicks && runtimeTicks >= 6e9 && timeRemainingTicks >= 2e8) {
                    showComingUpNext(player);
                }
            }
        }

        function onUpNextHidden() {
            if ("upnext" === currentVisibleMenu) {
                currentVisibleMenu = null;
            }
        }

        function showComingUpNext(player) {
            require(["upNextDialog"], function (UpNextDialog) {
                if (!(currentVisibleMenu || currentUpNextDialog)) {
                    currentVisibleMenu = "upnext";
                    comingUpNextDisplayed = true;
                    playbackManager.nextItem(player).then(function (nextItem) {
                        currentUpNextDialog = new UpNextDialog({
                            parent: view.querySelector(".upNextContainer"),
                            player: player,
                            nextItem: nextItem
                        });
                        events.on(currentUpNextDialog, "hide", onUpNextHidden);
                    }, onUpNextHidden);
                }
            });
        }

        function refreshProgramInfoIfNeeded(player, item) {
            if ("TvChannel" === item.Type) {
                var program = item.CurrentProgram;

                if (program && program.EndDate) {
                    try {
                        var endDate = datetime.parseISO8601Date(program.EndDate);

                        if (new Date().getTime() >= endDate.getTime()) {
                            console.debug("program info needs to be refreshed");
                            var state = playbackManager.getPlayerState(player);
                            onStateChanged.call(player, {
                                type: "init"
                            }, state);
                        }
                    } catch (e) {
                        console.error("error parsing date: " + program.EndDate);
                    }
                }
            }
        }

        function updatePlayPauseState(isPaused) {
            var button = view.querySelector(".btnPause i");
            if (isPaused) {
                button.innerHTML = "&#xE037;";
                button.setAttribute("title", globalize.translate("ButtonPlay") + " (k)");
            } else {
                button.innerHTML = "pause";
                button.setAttribute("title", globalize.translate("ButtonPause") + " (k)");
            }
        }

        function updatePlayerStateInternal(event, player, state) {
            var playState = state.PlayState || {};
            updatePlayPauseState(playState.IsPaused);
            var supportedCommands = playbackManager.getSupportedCommands(player);
            currentPlayerSupportedCommands = supportedCommands;
            supportsBrightnessChange = -1 !== supportedCommands.indexOf("SetBrightness");
            updatePlayerVolumeState(player, playState.IsMuted, playState.VolumeLevel);

            if (nowPlayingPositionSlider && !nowPlayingPositionSlider.dragging) {
                nowPlayingPositionSlider.disabled = !playState.CanSeek;
            }

            btnFastForward.disabled = !playState.CanSeek;
            btnRewind.disabled = !playState.CanSeek;
            var nowPlayingItem = state.NowPlayingItem || {};
            playbackStartTimeTicks = playState.PlaybackStartTimeTicks;
            updateTimeDisplay(playState.PositionTicks, nowPlayingItem.RunTimeTicks, playState.PlaybackStartTimeTicks, playState.BufferedRanges || []);
            updateNowPlayingInfo(player, state);

            if (state.MediaSource && state.MediaSource.SupportsTranscoding && -1 !== supportedCommands.indexOf("SetMaxStreamingBitrate")) {
                view.querySelector(".btnVideoOsdSettings").classList.remove("hide");
            } else {
                view.querySelector(".btnVideoOsdSettings").classList.add("hide");
            }

            var isProgressClear = state.MediaSource && null == state.MediaSource.RunTimeTicks;
            nowPlayingPositionSlider.setIsClear(isProgressClear);

            if (nowPlayingItem.RunTimeTicks) {
                nowPlayingPositionSlider.setKeyboardSteps(userSettings.skipBackLength() * 1000000 / nowPlayingItem.RunTimeTicks,
                    userSettings.skipForwardLength() * 1000000 / nowPlayingItem.RunTimeTicks);
            }

            if (-1 === supportedCommands.indexOf("ToggleFullscreen") || player.isLocalPlayer && layoutManager.tv && playbackManager.isFullscreen(player)) {
                view.querySelector(".btnFullscreen").classList.add("hide");
            } else {
                view.querySelector(".btnFullscreen").classList.remove("hide");
            }

            if (-1 === supportedCommands.indexOf("PictureInPicture")) {
                view.querySelector(".btnPip").classList.add("hide");
            } else {
                view.querySelector(".btnPip").classList.remove("hide");
            }

            if (-1 === supportedCommands.indexOf("AirPlay")) {
                view.querySelector(".btnAirPlay").classList.add("hide");
            } else {
                view.querySelector(".btnAirPlay").classList.remove("hide");
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
                        var currentTimeMs = (playbackStartTimeTicks + (positionTicks || 0)) / 1e4;
                        var programRuntimeMs = programEndDateMs - programStartDateMs;

                        if (nowPlayingPositionSlider.value = getDisplayPercentByTimeOfDay(programStartDateMs, programRuntimeMs, currentTimeMs), bufferedRanges.length) {
                            var rangeStart = getDisplayPercentByTimeOfDay(programStartDateMs, programRuntimeMs, (playbackStartTimeTicks + (bufferedRanges[0].start || 0)) / 1e4);
                            var rangeEnd = getDisplayPercentByTimeOfDay(programStartDateMs, programRuntimeMs, (playbackStartTimeTicks + (bufferedRanges[0].end || 0)) / 1e4);
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

                nowPlayingPositionText.innerHTML = "";
                nowPlayingDurationText.innerHTML = "";
            } else {
                if (nowPlayingPositionSlider && !nowPlayingPositionSlider.dragging) {
                    if (runtimeTicks) {
                        var pct = positionTicks / runtimeTicks;
                        pct *= 100;
                        nowPlayingPositionSlider.value = pct;
                    } else {
                        nowPlayingPositionSlider.value = 0;
                    }

                    if (runtimeTicks && null != positionTicks && currentRuntimeTicks && !enableProgressByTimeOfDay && currentItem.RunTimeTicks && "Recording" !== currentItem.Type) {
                        endsAtText.innerHTML = "&nbsp;&nbsp;-&nbsp;&nbsp;" + mediaInfo.getEndsAtFromPosition(runtimeTicks, positionTicks, true);
                    } else {
                        endsAtText.innerHTML = "";
                    }
                }

                if (nowPlayingPositionSlider) {
                    nowPlayingPositionSlider.setBufferedRanges(bufferedRanges, runtimeTicks, positionTicks);
                }

                updateTimeText(nowPlayingPositionText, positionTicks);
                updateTimeText(nowPlayingDurationText, runtimeTicks, true);
            }
        }

        function updatePlayerVolumeState(player, isMuted, volumeLevel) {
            var supportedCommands = currentPlayerSupportedCommands;
            var showMuteButton = true;
            var showVolumeSlider = true;

            if (-1 === supportedCommands.indexOf("Mute")) {
                showMuteButton = false;
            }

            if (-1 === supportedCommands.indexOf("SetVolume")) {
                showVolumeSlider = false;
            }

            if (player.isLocalPlayer && appHost.supports("physicalvolumecontrol")) {
                showMuteButton = false;
                showVolumeSlider = false;
            }

            if (isMuted) {
                view.querySelector(".buttonMute").setAttribute("title", globalize.translate("Unmute") + " (m)");
                view.querySelector(".buttonMute i").innerHTML = "&#xE04F;";
            } else {
                view.querySelector(".buttonMute").setAttribute("title", globalize.translate("Mute") + " (m)");
                view.querySelector(".buttonMute i").innerHTML = "&#xE050;";
            }

            if (showMuteButton) {
                view.querySelector(".buttonMute").classList.remove("hide");
            } else {
                view.querySelector(".buttonMute").classList.add("hide");
            }

            if (nowPlayingVolumeSlider) {
                if (showVolumeSlider) {
                    nowPlayingVolumeSliderContainer.classList.remove("hide");
                } else {
                    nowPlayingVolumeSliderContainer.classList.add("hide");
                }

                if (!nowPlayingVolumeSlider.dragging) {
                    nowPlayingVolumeSlider.value = volumeLevel || 0;
                }
            }
        }

        function updatePlaylist(player) {
            var btnPreviousTrack = view.querySelector(".btnPreviousTrack");
            var btnNextTrack = view.querySelector(".btnNextTrack");
            btnPreviousTrack.classList.remove("hide");
            btnNextTrack.classList.remove("hide");
            btnNextTrack.disabled = false;
            btnPreviousTrack.disabled = false;
        }

        function updateTimeText(elem, ticks, divider) {
            if (null == ticks) {
                elem.innerHTML = "";
                return;
            }

            var html = datetime.getDisplayRunningTime(ticks);

            if (divider) {
                html = "&nbsp;/&nbsp;" + html;
            }

            elem.innerHTML = html;
        }

        function onSettingsButtonClick(e) {
            var btn = this;

            require(["playerSettingsMenu"], function (playerSettingsMenu) {
                var player = currentPlayer;

                if (player) {

                    // show subtitle offset feature only if player and media support it
                    var showSubOffset = playbackManager.supportSubtitleOffset(player) &&
                        playbackManager.canHandleOffsetOnCurrentSubtitle(player);

                    playerSettingsMenu.show({
                        mediaType: "Video",
                        player: player,
                        positionTo: btn,
                        stats: true,
                        suboffset: showSubOffset,
                        onOption: onSettingsOption
                    });
                }
            });
        }

        function onSettingsOption(selectedOption) {
            if ("stats" === selectedOption) {
                toggleStats();
            } else if ("suboffset" === selectedOption) {
                var player = currentPlayer;
                if (player) {
                    playbackManager.enableShowingSubtitleOffset(player);
                    toggleSubtitleSync();
                }
            }
        }

        function toggleStats() {
            require(["playerStats"], function (PlayerStats) {
                var player = currentPlayer;

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
            var player = currentPlayer;
            var audioTracks = playbackManager.audioTracks(player);
            var currentIndex = playbackManager.getAudioStreamIndex(player);
            var menuItems = audioTracks.map(function (stream) {
                var opt = {
                    name: stream.DisplayTitle,
                    id: stream.Index
                };

                if (stream.Index === currentIndex) {
                    opt.selected = true;
                }

                return opt;
            });
            var positionTo = this;

            require(["actionsheet"], function (actionsheet) {
                actionsheet.show({
                    items: menuItems,
                    title: globalize.translate("Audio"),
                    positionTo: positionTo
                }).then(function (id) {
                    var index = parseInt(id);

                    if (index !== currentIndex) {
                        playbackManager.setAudioStreamIndex(index, player);
                    }
                });
            });
        }

        function showSubtitleTrackSelection() {
            var player = currentPlayer;
            var streams = playbackManager.subtitleTracks(player);
            var currentIndex = playbackManager.getSubtitleStreamIndex(player);

            if (null == currentIndex) {
                currentIndex = -1;
            }

            streams.unshift({
                Index: -1,
                DisplayTitle: globalize.translate("Off")
            });
            var menuItems = streams.map(function (stream) {
                var opt = {
                    name: stream.DisplayTitle,
                    id: stream.Index
                };

                if (stream.Index === currentIndex) {
                    opt.selected = true;
                }

                return opt;
            });
            var positionTo = this;

            require(["actionsheet"], function (actionsheet) {
                actionsheet.show({
                    title: globalize.translate("Subtitles"),
                    items: menuItems,
                    positionTo: positionTo
                }).then(function (id) {
                    var index = parseInt(id);

                    if (index !== currentIndex) {
                        playbackManager.setSubtitleStreamIndex(index, player);
                    }

                    toggleSubtitleSync();
                });
            });
        }

        function toggleSubtitleSync(action) {
            require(["subtitleSync"], function (SubtitleSync) {
                var player = currentPlayer;
                if (subtitleSyncOverlay) {
                    subtitleSyncOverlay.toggle(action);
                } else if (player) {
                    subtitleSyncOverlay = new SubtitleSync(player);
                }
            });
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
        var clickedElement;

        function onWindowKeyDown(e) {
            clickedElement = e.srcElement;

            var key = keyboardnavigation.getKeyName(e);

            if (!currentVisibleMenu && 32 === e.keyCode) {
                playbackManager.playPause(currentPlayer);
                showOsd();
                return;
            }

            if (layoutManager.tv && keyboardnavigation.isNavigationKey(key)) {
                showOsd();
                return;
            }

            switch (key) {
                case "Enter":
                    showOsd();
                    break;
                case "Escape":
                case "Back":
                    // Ignore key when some dialog is opened
                    if (currentVisibleMenu === "osd" && !document.querySelector(".dialogContainer")) {
                        hideOsd();
                        e.stopPropagation();
                    }
                    break;
                case "k":
                    playbackManager.playPause(currentPlayer);
                    showOsd();
                    break;
                case "l":
                case "ArrowRight":
                case "Right":
                    playbackManager.fastForward(currentPlayer);
                    showOsd();
                    break;
                case "j":
                case "ArrowLeft":
                case "Left":
                    playbackManager.rewind(currentPlayer);
                    showOsd();
                    break;
                case "f":
                    if (!e.ctrlKey && !e.metaKey) {
                        playbackManager.toggleFullscreen(currentPlayer);
                        showOsd();
                    }
                    break;
                case "m":
                    playbackManager.toggleMute(currentPlayer);
                    showOsd();
                    break;
                case "NavigationLeft":
                case "GamepadDPadLeft":
                case "GamepadLeftThumbstickLeft":
                    // Ignores gamepad events that are always triggered, even when not focused.
                    if (document.hasFocus()) {
                        playbackManager.rewind(currentPlayer);
                        showOsd();
                    }
                    break;
                case "NavigationRight":
                case "GamepadDPadRight":
                case "GamepadLeftThumbstickRight":
                    // Ignores gamepad events that are always triggered, even when not focused.
                    if (document.hasFocus()) {
                        playbackManager.fastForward(currentPlayer);
                        showOsd();
                    }
            }
        }

        function onWindowMouseDown(e) {
            clickedElement = e.srcElement;
        }

        function onWindowTouchStart(e) {
            clickedElement = e.srcElement;
        }

        function getImgUrl(item, chapter, index, maxWidth, apiClient) {
            if (chapter.ImageTag) {
                return apiClient.getScaledImageUrl(item.Id, {
                    maxWidth: maxWidth,
                    tag: chapter.ImageTag,
                    type: "Chapter",
                    index: index
                });
            }

            return null;
        }

        function getChapterBubbleHtml(apiClient, item, chapters, positionTicks) {
            var chapter;
            var index = -1;

            for (var i = 0, length = chapters.length; i < length; i++) {
                var currentChapter = chapters[i];

                if (positionTicks >= currentChapter.StartPositionTicks) {
                    chapter = currentChapter;
                    index = i;
                }
            }

            if (!chapter) {
                return null;
            }

            var src = getImgUrl(item, chapter, index, 400, apiClient);

            if (src) {
                var html = '<div class="chapterThumbContainer">';
                html += '<img class="chapterThumb" src="' + src + '" />';
                html += '<div class="chapterThumbTextContainer">';
                html += '<div class="chapterThumbText chapterThumbText-dim">';
                html += chapter.Name;
                html += "</div>";
                html += '<h2 class="chapterThumbText">';
                html += datetime.getDisplayRunningTime(positionTicks);
                html += "</h2>";
                html += "</div>";
                return html + "</div>";
            }

            return null;
        }

        var playPauseClickTimeout;
        function onViewHideStopPlayback() {
            if (playbackManager.isPlayingVideo()) {
                require(['shell'], function (shell) {
                    shell.disableFullscreen();
                });

                clearTimeout(playPauseClickTimeout);
                var player = currentPlayer;
                view.removeEventListener("viewbeforehide", onViewHideStopPlayback);
                releaseCurrentPlayer();
                playbackManager.stop(player);
            }
        }

        function enableStopOnBack(enabled) {
            view.removeEventListener("viewbeforehide", onViewHideStopPlayback);

            if (enabled && playbackManager.isPlayingVideo(currentPlayer)) {
                view.addEventListener("viewbeforehide", onViewHideStopPlayback);
            }
        }

        require(['shell'], function (shell) {
            shell.enableFullscreen();
        });

        var currentPlayer;
        var comingUpNextDisplayed;
        var currentUpNextDialog;
        var isEnabled;
        var currentItem;
        var recordingButtonManager;
        var enableProgressByTimeOfDay;
        var supportsBrightnessChange;
        var currentVisibleMenu;
        var statsOverlay;
        var osdHideTimeout;
        var lastPointerMoveData;
        var self = this;
        var currentPlayerSupportedCommands = [];
        var currentRuntimeTicks = 0;
        var lastUpdateTime = 0;
        var programStartDateMs = 0;
        var programEndDateMs = 0;
        var playbackStartTimeTicks = 0;
        var subtitleSyncOverlay;
        var nowPlayingVolumeSlider = view.querySelector(".osdVolumeSlider");
        var nowPlayingVolumeSliderContainer = view.querySelector(".osdVolumeSliderContainer");
        var nowPlayingPositionSlider = view.querySelector(".osdPositionSlider");
        var nowPlayingPositionText = view.querySelector(".osdPositionText");
        var nowPlayingDurationText = view.querySelector(".osdDurationText");
        var startTimeText = view.querySelector(".startTimeText");
        var endTimeText = view.querySelector(".endTimeText");
        var endsAtText = view.querySelector(".endsAtText");
        var btnRewind = view.querySelector(".btnRewind");
        var btnFastForward = view.querySelector(".btnFastForward");
        var transitionEndEventName = dom.whichTransitionEvent();
        var headerElement = document.querySelector(".skinHeader");
        var osdBottomElement = document.querySelector(".videoOsdBottom-maincontrols");

        if (layoutManager.tv) {
            nowPlayingPositionSlider.classList.add("focusable");
            nowPlayingPositionSlider.enableKeyboardDragging();
        }

        view.addEventListener("viewbeforeshow", function (e) {
            headerElement.classList.add("osdHeader");
            Emby.Page.setTransparency("full");
        });
        view.addEventListener("viewshow", function (e) {
            try {
                events.on(playbackManager, "playerchange", onPlayerChange);
                bindToPlayer(playbackManager.getCurrentPlayer());
                dom.addEventListener(document, window.PointerEvent ? "pointermove" : "mousemove", onPointerMove, {
                    passive: true
                });
                showOsd();
                inputManager.on(window, onInputCommand);
                dom.addEventListener(window, "keydown", onWindowKeyDown, {
                    capture: true
                });
                dom.addEventListener(window, window.PointerEvent ? "pointerdown" : "mousedown", onWindowMouseDown, {
                    passive: true
                });
                dom.addEventListener(window, "touchstart", onWindowTouchStart, {
                    passive: true
                });
            } catch (e) {
                require(['appRouter'], function(appRouter) {
                    appRouter.showDirect('/');
                });
            }
        });
        view.addEventListener("viewbeforehide", function () {
            if (statsOverlay) {
                statsOverlay.enabled(false);
            }

            dom.removeEventListener(window, "keydown", onWindowKeyDown, {
                capture: true
            });
            dom.removeEventListener(window, window.PointerEvent ? "pointerdown" : "mousedown", onWindowMouseDown, {
                passive: true
            });
            dom.removeEventListener(window, "touchstart", onWindowTouchStart, {
                passive: true
            });
            stopOsdHideTimer();
            headerElement.classList.remove("osdHeader");
            headerElement.classList.remove("osdHeader-hidden");
            dom.removeEventListener(document, window.PointerEvent ? "pointermove" : "mousemove", onPointerMove, {
                passive: true
            });
            inputManager.off(window, onInputCommand);
            events.off(playbackManager, "playerchange", onPlayerChange);
            releaseCurrentPlayer();
        });
        view.querySelector(".btnFullscreen").addEventListener("click", function () {
            playbackManager.toggleFullscreen(currentPlayer);
        });
        view.querySelector(".btnPip").addEventListener("click", function () {
            playbackManager.togglePictureInPicture(currentPlayer);
        });
        view.querySelector(".btnAirPlay").addEventListener("click", function () {
            playbackManager.toggleAirPlay(currentPlayer);
        });
        view.querySelector(".btnVideoOsdSettings").addEventListener("click", onSettingsButtonClick);
        view.addEventListener("viewhide", function () {
            headerElement.classList.remove("hide");
        });
        view.addEventListener("viewdestroy", function () {
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
        var lastPointerDown = 0;
        dom.addEventListener(view, window.PointerEvent ? "pointerdown" : "click", function (e) {
            if (dom.parentWithClass(e.target, ["videoOsdBottom", "upNextContainer"])) {
                return void showOsd();
            }

            var pointerType = e.pointerType || (layoutManager.mobile ? "touch" : "mouse");
            var now = new Date().getTime();

            switch (pointerType) {
                case "touch":
                    if (now - lastPointerDown > 300) {
                        lastPointerDown = now;
                        toggleOsd();
                    }

                    break;

                case "mouse":
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

        if (browser.touch) {
            dom.addEventListener(view, "dblclick", onDoubleClick, {});
        } else {
            var options = { passive: true };
            dom.addEventListener(view, "dblclick", function () {
                playbackManager.toggleFullscreen(currentPlayer);
            }, options);
        }

        function setVolume() {
            playbackManager.setVolume(this.value, currentPlayer);
        }

        view.querySelector(".buttonMute").addEventListener("click", function () {
            playbackManager.toggleMute(currentPlayer);
        });
        nowPlayingVolumeSlider.addEventListener("change", setVolume);
        nowPlayingVolumeSlider.addEventListener("mousemove", setVolume);
        nowPlayingVolumeSlider.addEventListener("touchmove", setVolume);

        nowPlayingPositionSlider.addEventListener("change", function () {
            var player = currentPlayer;

            if (player) {
                var newPercent = parseFloat(this.value);

                if (enableProgressByTimeOfDay) {
                    var seekAirTimeTicks = newPercent / 100 * (programEndDateMs - programStartDateMs) * 1e4;
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
                    var ms = programEndDateMs - programStartDateMs;
                    ms /= 100;
                    ms *= value;
                    ms += programStartDateMs;
                    return '<h1 class="sliderBubbleText">' + getDisplayTimeWithoutAmPm(new Date(parseInt(ms)), true) + "</h1>";
                }

                return "--:--";
            }

            if (!currentRuntimeTicks) {
                return "--:--";
            }

            var ticks = currentRuntimeTicks;
            ticks /= 100;
            ticks *= value;
            var item = currentItem;

            if (item && item.Chapters && item.Chapters.length && item.Chapters[0].ImageTag) {
                var html = getChapterBubbleHtml(connectionManager.getApiClient(item.ServerId), item, item.Chapters, ticks);

                if (html) {
                    return html;
                }
            }

            return '<h1 class="sliderBubbleText">' + datetime.getDisplayRunningTime(ticks) + "</h1>";
        };

        view.querySelector(".btnPreviousTrack").addEventListener("click", function () {
            playbackManager.previousTrack(currentPlayer);
        });
        view.querySelector(".btnPause").addEventListener("click", function () {
            // Ignore 'click' if another element was originally clicked (Firefox/Edge issue)
            if (this.contains(clickedElement)) {
                playbackManager.playPause(currentPlayer);
            }
        });
        view.querySelector(".btnNextTrack").addEventListener("click", function () {
            playbackManager.nextTrack(currentPlayer);
        });
        btnRewind.addEventListener("click", function () {
            playbackManager.rewind(currentPlayer);
        });
        btnFastForward.addEventListener("click", function () {
            playbackManager.fastForward(currentPlayer);
        });
        view.querySelector(".btnAudio").addEventListener("click", showAudioTrackSelection);
        view.querySelector(".btnSubtitles").addEventListener("click", showSubtitleTrackSelection);

        if (browser.touch) {
            (function () {
                require(["touchHelper"], function (TouchHelper) {
                    self.touchHelper = new TouchHelper(view, {
                        swipeYThreshold: 30,
                        triggerOnMove: true,
                        preventDefaultOnMove: true,
                        ignoreTagNames: ["BUTTON", "INPUT", "TEXTAREA"]
                    });
                    events.on(self.touchHelper, "swipeup", onVerticalSwipe);
                    events.on(self.touchHelper, "swipedown", onVerticalSwipe);
                });
            })();
        }
    };
});
