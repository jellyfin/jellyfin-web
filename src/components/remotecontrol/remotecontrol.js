define(["browser", "datetime", "backdrop", "libraryBrowser", "listView", "imageLoader", "playbackManager", "nowPlayingHelper", "events", "connectionManager", "apphost", "globalize", "cardStyle", "emby-itemscontainer", "css!./remotecontrol.css", "emby-ratingbutton"], function (browser, datetime, backdrop, libraryBrowser, listView, imageLoader, playbackManager, nowPlayingHelper, events, connectionManager, appHost, globalize) {
    "use strict";

    function showAudioMenu(context, player, button, item) {
        var currentIndex = playbackManager.getAudioStreamIndex(player);
        var streams = playbackManager.audioTracks(player);
        var menuItems = streams.map(function (s) {
            var menuItem = {
                name: s.DisplayTitle,
                id: s.Index
            };

            if (s.Index == currentIndex) {
                menuItem.selected = true;
            }

            return menuItem;
        });

        require(["actionsheet"], function (actionsheet) {
            actionsheet.show({
                items: menuItems,
                positionTo: button,
                callback: function (id) {
                    playbackManager.setAudioStreamIndex(parseInt(id), player);
                }
            });
        });
    }

    function showSubtitleMenu(context, player, button, item) {
        var currentIndex = playbackManager.getSubtitleStreamIndex(player);
        var streams = playbackManager.subtitleTracks(player);
        var menuItems = streams.map(function (s) {
            var menuItem = {
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
            name: globalize.translate("ButtonOff"),
            selected: null == currentIndex
        });

        require(["actionsheet"], function (actionsheet) {
            actionsheet.show({
                items: menuItems,
                positionTo: button,
                callback: function (id) {
                    playbackManager.setSubtitleStreamIndex(parseInt(id), player);
                }
            });
        });
    }

    function getNowPlayingNameHtml(nowPlayingItem, includeNonNameInfo) {
        return nowPlayingHelper.getNowPlayingNames(nowPlayingItem, includeNonNameInfo).map(function (i) {
            return i.text;
        }).join("<br/>");
    }

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

        if (item.AlbumId && item.AlbumPrimaryImageTag) {
            options.tag = item.AlbumPrimaryImageTag;
            return connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.AlbumId, options);
        }

        return null;
    }

    function updateNowPlayingInfo(context, state) {
        var item = state.NowPlayingItem;
        var displayName = item ? getNowPlayingNameHtml(item).replace("<br/>", " - ") : "";
        context.querySelector(".nowPlayingPageTitle").innerHTML = displayName;

        if (displayName.length > 0) {
            context.querySelector(".nowPlayingPageTitle").classList.remove("hide");
        } else {
            context.querySelector(".nowPlayingPageTitle").classList.add("hide");
        }

        var url = item ? seriesImageUrl(item, {
            maxHeight: 300
        }) || imageUrl(item, {
            maxHeight: 300
        }) : null;

        console.log("updateNowPlayingInfo");
        setImageUrl(context, url);
        if (item) {
            backdrop.setBackdrops([item]);
            var apiClient = connectionManager.getApiClient(item.ServerId);
            apiClient.getItem(apiClient.getCurrentUserId(), item.Id).then(function (fullItem) {
                var userData = fullItem.UserData || {};
                var likes = null == userData.Likes ? "" : userData.Likes;
                context.querySelector(".nowPlayingPageUserDataButtons").innerHTML = '<button is="emby-ratingbutton" type="button" class="listItemButton paper-icon-button-light" data-id="' + fullItem.Id + '" data-serverid="' + fullItem.ServerId + '" data-itemtype="' + fullItem.Type + '" data-likes="' + likes + '" data-isfavorite="' + userData.IsFavorite + '"><i class="md-icon">&#xE87D;</i></button>';
            });
        } else {
            backdrop.clear();
            context.querySelector(".nowPlayingPageUserDataButtons").innerHTML = "";
        }
    }

    function setImageUrl(context, url) {
        currentImgUrl = url;
        var imgContainer = context.querySelector(".nowPlayingPageImageContainer");

        if (url) {
            imgContainer.innerHTML = '<img class="nowPlayingPageImage" src="' + url + '" />';
            imgContainer.classList.remove("hide");
        } else {
            imgContainer.classList.add("hide");
            imgContainer.innerHTML = "";
        }
    }

    function buttonVisible(btn, enabled) {
        if (enabled) {
            btn.classList.remove("hide");
        } else {
            btn.classList.add("hide");
        }
    }

    function updateSupportedCommands(context, commands) {
        var all = context.querySelectorAll(".btnCommand");

        for (var i = 0, length = all.length; i < length; i++) {
            var enableButton = -1 !== commands.indexOf(all[i].getAttribute("data-command"));
            all[i].disabled = !enableButton;
        }
    }

    var currentImgUrl;
    return function () {
        function toggleRepeat(player) {
            if (player) {
                switch (playbackManager.getRepeatMode(player)) {
                    case "RepeatNone":
                    playbackManager.setRepeatMode("RepeatAll", player);
                    break;

                    case "RepeatAll":
                    playbackManager.setRepeatMode("RepeatOne", player);
                    break;

                    case "RepeatOne":
                    playbackManager.setRepeatMode("RepeatNone", player);
                }
            }
        }

        function updatePlayerState(player, context, state) {
            lastPlayerState = state;
            var item = state.NowPlayingItem;
            var playerInfo = playbackManager.getPlayerInfo();
            var supportedCommands = playerInfo.supportedCommands;
            currentPlayerSupportedCommands = supportedCommands;
            var playState = state.PlayState || {};
            buttonVisible(context.querySelector(".btnToggleFullscreen"), item && "Video" == item.MediaType && -1 != supportedCommands.indexOf("ToggleFullscreen"));
            updateAudioTracksDisplay(player, context);
            updateSubtitleTracksDisplay(player, context);

            if (-1 != supportedCommands.indexOf("DisplayMessage")) {
                context.querySelector(".sendMessageSection").classList.remove("hide");
            } else {
                context.querySelector(".sendMessageSection").classList.add("hide");
            }

            if (-1 != supportedCommands.indexOf("SendString")) {
                context.querySelector(".sendTextSection").classList.remove("hide");
            } else {
                context.querySelector(".sendTextSection").classList.add("hide");
            }

            buttonVisible(context.querySelector(".btnStop"), null != item);
            buttonVisible(context.querySelector(".btnNextTrack"), null != item);
            buttonVisible(context.querySelector(".btnPreviousTrack"), null != item);
            buttonVisible(context.querySelector(".btnRewind"), null != item);
            buttonVisible(context.querySelector(".btnFastForward"), null != item);
            var positionSlider = context.querySelector(".nowPlayingPositionSlider");

            if (positionSlider && !positionSlider.dragging) {
                positionSlider.disabled = !playState.CanSeek;
                var isProgressClear = state.MediaSource && null == state.MediaSource.RunTimeTicks;
                positionSlider.setIsClear(isProgressClear);
            }

            updatePlayPauseState(playState.IsPaused, null != item);
            updateTimeDisplay(playState.PositionTicks, item ? item.RunTimeTicks : null);
            updatePlayerVolumeState(context, playState.IsMuted, playState.VolumeLevel);

            if (item && "Video" == item.MediaType) {
                context.classList.remove("hideVideoButtons");
            } else {
                context.classList.add("hideVideoButtons");
            }

            updateRepeatModeDisplay(playState.RepeatMode);
            updateNowPlayingInfo(context, state);
        }

        function updateAudioTracksDisplay(player, context) {
            var supportedCommands = currentPlayerSupportedCommands;
            buttonVisible(context.querySelector(".btnAudioTracks"), playbackManager.audioTracks(player).length > 1 && -1 != supportedCommands.indexOf("SetAudioStreamIndex"));
        }

        function updateSubtitleTracksDisplay(player, context) {
            var supportedCommands = currentPlayerSupportedCommands;
            buttonVisible(context.querySelector(".btnSubtitles"), playbackManager.subtitleTracks(player).length && -1 != supportedCommands.indexOf("SetSubtitleStreamIndex"));
        }

        function updateRepeatModeDisplay(repeatMode) {
            var context = dlg;
            var toggleRepeatButton = context.querySelector(".repeatToggleButton");

            if ("RepeatAll" == repeatMode) {
                toggleRepeatButton.innerHTML = "<i class='md-icon'>repeat</i>";
                toggleRepeatButton.classList.add("repeatButton-active");
            } else if ("RepeatOne" == repeatMode) {
                toggleRepeatButton.innerHTML = "<i class='md-icon'>repeat_one</i>";
                toggleRepeatButton.classList.add("repeatButton-active");
            } else {
                toggleRepeatButton.innerHTML = "<i class='md-icon'>repeat</i>";
                toggleRepeatButton.classList.remove("repeatButton-active");
            }
        }

        function updatePlayerVolumeState(context, isMuted, volumeLevel) {
            var view = context;
            var supportedCommands = currentPlayerSupportedCommands;
            var showMuteButton = true;
            var showVolumeSlider = true;
            var volumeSlider = view.querySelector('.nowPlayingVolumeSliderContainer');
            var progressElement = volumeSlider.querySelector('.mdl-slider-background-lower');

            if (-1 === supportedCommands.indexOf("Mute")) {
                showMuteButton = false;
            }

            if (-1 === supportedCommands.indexOf("SetVolume")) {
                showVolumeSlider = false;
            }

            if (currentPlayer.isLocalPlayer && appHost.supports("physicalvolumecontrol")) {
                showMuteButton = false;
                showVolumeSlider = false;
            }

            if (isMuted) {
                view.querySelector(".buttonMute").setAttribute("title", globalize.translate("Unmute"));
                view.querySelector(".buttonMute i").innerHTML = "&#xE04F;";
            } else {
                view.querySelector(".buttonMute").setAttribute("title", globalize.translate("Mute"));
                view.querySelector(".buttonMute i").innerHTML = "&#xE050;";
            }

            if (progressElement) {
                progressElement.style.width = (volumeLevel || 0) + '%';
            }

            if (showMuteButton) {
                view.querySelector(".buttonMute").classList.remove("hide");
            } else {
                view.querySelector(".buttonMute").classList.add("hide");
            }

            var nowPlayingVolumeSlider = context.querySelector(".nowPlayingVolumeSlider");
            var nowPlayingVolumeSliderContainer = context.querySelector(".nowPlayingVolumeSliderContainer");

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

        function updatePlayPauseState(isPaused, isActive) {
            var context = dlg;
            var btnPlayPause = context.querySelector(".btnPlayPause");
            btnPlayPause.querySelector("i").innerHTML = isPaused ? "play_arrow" : "pause";
            buttonVisible(btnPlayPause, isActive);
        }

        function updateTimeDisplay(positionTicks, runtimeTicks) {
            var context = dlg;
            var positionSlider = context.querySelector(".nowPlayingPositionSlider");

            if (positionSlider && !positionSlider.dragging) {
                if (runtimeTicks) {
                    var pct = positionTicks / runtimeTicks;
                    pct *= 100;
                    positionSlider.value = pct;
                } else {
                    positionSlider.value = 0;
                }
            }

            context.querySelector(".positionTime").innerHTML = null == positionTicks ? "--:--" : datetime.getDisplayRunningTime(positionTicks);
            context.querySelector(".runtime").innerHTML = null != runtimeTicks ? datetime.getDisplayRunningTime(runtimeTicks) : "--:--";
        }

        function getPlaylistItems(player) {
            return playbackManager.getPlaylist(player);
        }

        function loadPlaylist(context, player) {
            getPlaylistItems(player).then(function (items) {
                var html = "";
                html += listView.getListViewHtml({
                    items: items,
                    smallIcon: true,
                    action: "setplaylistindex",
                    enableUserDataButtons: false,
                    rightButtons: [{
                        icon: "&#xE15D;",
                        title: globalize.translate("ButtonRemove"),
                        id: "remove"
                    }],
                    dragHandle: true
                });

                if (items.length) {
                    context.querySelector(".playlistSection").classList.remove("hide");
                } else {
                    context.querySelector(".playlistSection").classList.add("hide");
                }

                var itemsContainer = context.querySelector(".playlist");
                itemsContainer.innerHTML = html;
                var playlistItemId = playbackManager.getCurrentPlaylistItemId(player);

                if (playlistItemId) {
                    var img = itemsContainer.querySelector('.listItem[data-playlistItemId="' + playlistItemId + '"] .listItemImage');

                    if (img) {
                        img.classList.remove("lazy");
                        img.classList.add("playlistIndexIndicatorImage");
                    }
                }

                imageLoader.lazyChildren(itemsContainer);
            });
        }

        function onPlaybackStart(e, state) {
            console.log("remotecontrol event: " + e.type);
            var player = this;
            onStateChanged.call(player, e, state);
        }

        function onRepeatModeChange(e) {
            var player = this;
            updateRepeatModeDisplay(playbackManager.getRepeatMode(player));
        }

        function onPlaylistUpdate(e) {
            loadPlaylist(dlg, this);
        }

        function onPlaylistItemRemoved(e, info) {
            var context = dlg;
            var playlistItemIds = info.playlistItemIds;

            for (var i = 0, length = playlistItemIds.length; i < length; i++) {
                var listItem = context.querySelector('.listItem[data-playlistItemId="' + playlistItemIds[i] + '"]');

                if (listItem) {
                    listItem.parentNode.removeChild(listItem);
                }
            }
        }

        function onPlaybackStopped(e, state) {
            console.log("remotecontrol event: " + e.type);
            var player = this;

            if (!state.NextMediaType) {
                updatePlayerState(player, dlg, {});
                loadPlaylist(dlg);
                Emby.Page.back();
            }
        }

        function onPlayPauseStateChanged(e) {
            updatePlayPauseState(this.paused(), true);
        }

        function onStateChanged(event, state) {
            var player = this;
            updatePlayerState(player, dlg, state);
            loadPlaylist(dlg, player);
        }

        function onTimeUpdate(e) {
            var now = new Date().getTime();

            if (!(now - lastUpdateTime < 700)) {
                lastUpdateTime = now;
                var player = this;
                currentRuntimeTicks = playbackManager.duration(player);
                updateTimeDisplay(playbackManager.currentTime(player), currentRuntimeTicks);
            }
        }

        function onVolumeChanged(e) {
            var player = this;
            updatePlayerVolumeState(dlg, player.isMuted(), player.getVolume());
        }

        function releaseCurrentPlayer() {
            var player = currentPlayer;

            if (player) {
                events.off(player, "playbackstart", onPlaybackStart);
                events.off(player, "statechange", onStateChanged);
                events.off(player, "repeatmodechange", onRepeatModeChange);
                events.off(player, "playlistitemremove", onPlaylistUpdate);
                events.off(player, "playlistitemmove", onPlaylistUpdate);
                events.off(player, "playbackstop", onPlaybackStopped);
                events.off(player, "volumechange", onVolumeChanged);
                events.off(player, "pause", onPlayPauseStateChanged);
                events.off(player, "unpause", onPlayPauseStateChanged);
                events.off(player, "timeupdate", onTimeUpdate);
                currentPlayer = null;
            }
        }

        function bindToPlayer(context, player) {
            if (releaseCurrentPlayer(), currentPlayer = player, player) {
                var state = playbackManager.getPlayerState(player);
                onStateChanged.call(player, {
                    type: "init"
                }, state);
                events.on(player, "playbackstart", onPlaybackStart);
                events.on(player, "statechange", onStateChanged);
                events.on(player, "repeatmodechange", onRepeatModeChange);
                events.on(player, "playlistitemremove", onPlaylistItemRemoved);
                events.on(player, "playlistitemmove", onPlaylistUpdate);
                events.on(player, "playbackstop", onPlaybackStopped);
                events.on(player, "volumechange", onVolumeChanged);
                events.on(player, "pause", onPlayPauseStateChanged);
                events.on(player, "unpause", onPlayPauseStateChanged);
                events.on(player, "timeupdate", onTimeUpdate);
                var playerInfo = playbackManager.getPlayerInfo();
                var supportedCommands = playerInfo.supportedCommands;
                currentPlayerSupportedCommands = supportedCommands;
                updateSupportedCommands(context, supportedCommands);
            }
        }

        function onBtnCommandClick() {
            if (currentPlayer) {
                if (this.classList.contains("repeatToggleButton")) {
                    toggleRepeat(currentPlayer);
                } else {
                    playbackManager.sendCommand({
                        Name: this.getAttribute("data-command")
                    }, currentPlayer);
                }
            }
        }

        function getSaveablePlaylistItems() {
            return getPlaylistItems(currentPlayer).then(function (items) {
                    return i.Id && i.ServerId
            });
        }

        function savePlaylist() {
            require(["playlistEditor"], function (playlistEditor) {
                getSaveablePlaylistItems().then(function (items) {
                    var serverId = items.length ? items[0].ServerId : ApiClient.serverId();
                    new playlistEditor().show({
                        items: items.map(function (i) {
                            return i.Id;
                        }),
                        serverId: serverId,
                        enableAddToPlayQueue: false,
                        defaultValue: "new"
                    });
                });
            });
        }

        function bindEvents(context) {
            var btnCommand = context.querySelectorAll(".btnCommand");

            for (var i = 0, length = btnCommand.length; i < length; i++) {
                btnCommand[i].addEventListener("click", onBtnCommandClick);
            }

            context.querySelector(".btnToggleFullscreen").addEventListener("click", function (e) {
                if (currentPlayer) {
                    playbackManager.sendCommand({
                        Name: e.target.getAttribute("data-command")
                    }, currentPlayer);
                }
            });
            context.querySelector(".btnAudioTracks").addEventListener("click", function (e) {
                if (currentPlayer && lastPlayerState && lastPlayerState.NowPlayingItem) {
                    showAudioMenu(context, currentPlayer, e.target, lastPlayerState.NowPlayingItem);
                }
            });
            context.querySelector(".btnSubtitles").addEventListener("click", function (e) {
                if (currentPlayer && lastPlayerState && lastPlayerState.NowPlayingItem) {
                    showSubtitleMenu(context, currentPlayer, e.target, lastPlayerState.NowPlayingItem);
                }
            });
            context.querySelector(".btnStop").addEventListener("click", function () {
                if (currentPlayer) {
                    playbackManager.stop(currentPlayer);
                }
            });
            context.querySelector(".btnPlayPause").addEventListener("click", function () {
                if (currentPlayer) {
                    playbackManager.playPause(currentPlayer);
                }
            });
            context.querySelector(".btnNextTrack").addEventListener("click", function () {
                if (currentPlayer) {
                    playbackManager.nextTrack(currentPlayer);
                }
            });
            context.querySelector(".btnRewind").addEventListener("click", function () {
                if (currentPlayer) {
                    playbackManager.rewind(currentPlayer);
                }
            });
            context.querySelector(".btnFastForward").addEventListener("click", function () {
                if (currentPlayer) {
                    playbackManager.fastForward(currentPlayer);
                }
            });
            context.querySelector(".btnPreviousTrack").addEventListener("click", function () {
                if (currentPlayer) {
                    playbackManager.previousTrack(currentPlayer);
                }
            });
            context.querySelector(".nowPlayingPositionSlider").addEventListener("change", function () {
                var value = this.value;

                if (currentPlayer) {
                    var newPercent = parseFloat(value);
                    playbackManager.seekPercent(newPercent, currentPlayer);
                }
            });

            context.querySelector(".nowPlayingPositionSlider").getBubbleText = function (value) {
                var state = lastPlayerState;

                if (!state || !state.NowPlayingItem || !currentRuntimeTicks) {
                    return "--:--";
                }

                var ticks = currentRuntimeTicks;
                ticks /= 100;
                ticks *= value;
                return datetime.getDisplayRunningTime(ticks);
            };

            context.querySelector(".nowPlayingVolumeSlider").addEventListener("change", function () {
                playbackManager.setVolume(this.value, currentPlayer);
            });
            context.querySelector(".nowPlayingVolumeSlider").addEventListener("mousemove", function () {
                playbackManager.setVolume(this.value, currentPlayer);
            });
            context.querySelector(".nowPlayingVolumeSlider").addEventListener("touchmove", function () {
                playbackManager.setVolume(this.value, currentPlayer);
            });
            context.querySelector(".buttonMute").addEventListener("click", function () {
                playbackManager.toggleMute(currentPlayer);
            });
            var playlistContainer = context.querySelector(".playlist");
            playlistContainer.addEventListener("action-remove", function (e) {
                playbackManager.removeFromPlaylist([e.detail.playlistItemId], currentPlayer);
            });
            playlistContainer.addEventListener("itemdrop", function (e) {
                var newIndex = e.detail.newIndex;
                var playlistItemId = e.detail.playlistItemId;
                playbackManager.movePlaylistItem(playlistItemId, newIndex, currentPlayer);
            });
            context.querySelector(".btnSavePlaylist").addEventListener("click", savePlaylist);
        }

        function onPlayerChange() {
            bindToPlayer(dlg, playbackManager.getCurrentPlayer());
        }

        function onMessageSubmit(e) {
            var form = e.target;
            playbackManager.sendCommand({
                Name: "DisplayMessage",
                Arguments: {
                    Header: form.querySelector("#txtMessageTitle").value,
                    Text: form.querySelector("#txtMessageText", form).value
                }
            }, currentPlayer);
            form.querySelector("input").value = "";

            require(["toast"], function (toast) {
                toast("Message sent.");
            });

            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        function onSendStringSubmit(e) {
            var form = e.target;
            playbackManager.sendCommand({
                Name: "SendString",
                Arguments: {
                    String: form.querySelector("#txtTypeText", form).value
                }
            }, currentPlayer);
            form.querySelector("input").value = "";

            require(["toast"], function (toast) {
                toast("Text sent.");
            });

            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        function init(ownerView, context) {
            bindEvents(context);
            context.querySelector(".sendMessageForm").addEventListener("submit", onMessageSubmit);
            context.querySelector(".typeTextForm").addEventListener("submit", onSendStringSubmit);
            events.on(playbackManager, "playerchange", onPlayerChange);
        }

        function onDialogClosed(e) {
            releaseCurrentPlayer();
            events.off(playbackManager, "playerchange", onPlayerChange);
            lastPlayerState = null;
        }

        function onShow(context, tab) {
            currentImgUrl = null;
            bindToPlayer(context, playbackManager.getCurrentPlayer());
        }

        var dlg;
        var currentPlayer;
        var lastPlayerState;
        var currentPlayerSupportedCommands = [];
        var lastUpdateTime = 0;
        var currentRuntimeTicks = 0;
        var self = this;

        self.init = function (ownerView, context) {
            dlg = context;
            init(ownerView, dlg);
        };

        self.onShow = function () {
            onShow(dlg, window.location.hash);
        };

        self.destroy = function () {
            onDialogClosed();
        };
    };
});
