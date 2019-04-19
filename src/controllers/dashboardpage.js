define(["datetime", "events", "itemHelper", "serverNotifications", "dom", "globalize", "loading", "connectionManager", "playMethodHelper", "cardBuilder", "imageLoader", "components/activitylog", "humanedate", "listViewStyle", "emby-button", "flexStyles", "emby-button", "emby-itemscontainer"], function (datetime, events, itemHelper, serverNotifications, dom, globalize, loading, connectionManager, playMethodHelper, cardBuilder, imageLoader, ActivityLog) {
    "use strict";

    function buttonEnabled(elem, enabled) {
        if (enabled) {
            elem.setAttribute("disabled", "");
            elem.removeAttribute("disabled");
        } else {
            elem.setAttribute("disabled", "disabled");
        }
    }

    function showPlaybackInfo(btn, session) {
        require(["alert"], function (alert) {
            var showTranscodeReasons;
            var title;
            var text = [];
            var displayPlayMethod = playMethodHelper.getDisplayPlayMethod(session);
            var isDirectStream = "DirectStream" === displayPlayMethod;
            var isTranscode = "Transcode" === displayPlayMethod;

            if (isDirectStream) {
                title = globalize.translate("DirectStreaming");
                text.push(globalize.translate("DirectStreamHelp1"));
                text.push("<br/>");
                text.push(globalize.translate("DirectStreamHelp2"));
            } else if (isTranscode) {
                title = globalize.translate("Transcoding");
                text.push(globalize.translate("MediaIsBeingConverted"));

                if (session.TranscodingInfo && session.TranscodingInfo.TranscodeReasons && session.TranscodingInfo.TranscodeReasons.length) {
                    text.push("<br/>");
                    text.push(globalize.translate("LabelReasonForTranscoding"));
                    session.TranscodingInfo.TranscodeReasons.forEach(function (transcodeReason) {
                        text.push(globalize.translate("" + transcodeReason));
                    });
                }
            }
            alert({
                text: text.join("<br/>"),
                title: title
            });
        });
    }

    function showSendMessageForm(btn, session) {
        require(["prompt"], function (prompt) {
            prompt({
                title: globalize.translate("HeaderSendMessage"),
                label: globalize.translate("LabelMessageText"),
                confirmText: globalize.translate("ButtonSend")
            }).then(function (text) {
                if (text) {
                    connectionManager.getApiClient(session.ServerId).sendMessageCommand(session.Id, {
                        Text: text,
                        TimeoutMs: 5e3
                    });
                }
            });
        });
    }

    function showOptionsMenu(btn, session) {
        require(["actionsheet"], function (actionsheet) {
            var menuItems = [];

            if (session.ServerId && session.DeviceId !== connectionManager.deviceId()) {
                menuItems.push({
                    name: globalize.translate("SendMessage"),
                    id: "sendmessage"
                });
            }

            if (session.TranscodingInfo && session.TranscodingInfo.TranscodeReasons && session.TranscodingInfo.TranscodeReasons.length) {
                menuItems.push({
                    name: globalize.translate("ViewPlaybackInfo"),
                    id: "transcodinginfo"
                });
            }

            return actionsheet.show({
                items: menuItems,
                positionTo: btn
            }).then(function (id) {
                switch (id) {
                    case "sendmessage":
                        showSendMessageForm(btn, session);
                        break;
                    case "transcodinginfo":
                        showPlaybackInfo(btn, session);
                }
            });
        });
    }

    function onActiveDevicesClick(evt) {
        var btn = dom.parentWithClass(evt.target, "sessionCardButton");

        if (btn) {
            var card = dom.parentWithClass(btn, "card");

            if (card) {
                var sessionId = card.id;
                var session = (DashboardPage.sessionsList || []).filter(function (dashboardSession) {
                    return "session" + dashboardSession.Id === sessionId;
                })[0];

                if (session) {
                    if (btn.classList.contains("btnCardOptions")) {
                        showOptionsMenu(btn, session);
                    } else if (btn.classList.contains("btnSessionInfo")) {
                        showPlaybackInfo(btn, session);
                    } else if (btn.classList.contains("btnSessionSendMessage")) {
                        showSendMessageForm(btn, session);
                    } else if (btn.classList.contains("btnSessionStop")) {
                        connectionManager.getApiClient(session.ServerId).sendPlayStateCommand(session.Id, "Stop");
                    } else if (btn.classList.contains("btnSessionPlayPause") && session.PlayState) {
                        connectionManager.getApiClient(session.ServerId).sendPlayStateCommand(session.Id, "PlayPause");
                    }
                }
            }
        }
    }

    function filterSessions(sessions) {
        var list = [];
        var minActiveDate = new Date().getTime() - 9e5;

        for (var i = 0, length = sessions.length; i < length; i++) {
            var session = sessions[i];

            if (!session.NowPlayingItem && !session.UserId) {
                continue;
            }

            if (datetime.parseISO8601Date(session.LastActivityDate, true).getTime() >= minActiveDate) {
                list.push(session);
            }
        }
        return list;
    }

    function refreshActiveRecordings(view, apiClient) {
        apiClient.getLiveTvRecordings({
            UserId: Dashboard.getCurrentUserId(),
            IsInProgress: true,
            Fields: "CanDelete,PrimaryImageAspectRatio",
            EnableTotalRecordCount: false,
            EnableImageTypes: "Primary,Thumb,Backdrop"
        }).then(function (result) {
            var itemsContainer = view.querySelector(".activeRecordingItems");

            if (!result.Items.length) {
                view.querySelector(".activeRecordingsSection").classList.add("hide");
                return void (itemsContainer.innerHTML = "");
            }

            view.querySelector(".activeRecordingsSection").classList.remove("hide");
            itemsContainer.innerHTML = cardBuilder.getCardsHtml({
                items: result.Items,
                shape: "auto",
                defaultShape: "backdrop",
                showTitle: true,
                showParentTitle: true,
                coverImage: true,
                cardLayout: false,
                centerText: true,
                preferThumb: "auto",
                overlayText: false,
                overlayMoreButton: true,
                action: "none",
                centerPlayButton: true
            });
            imageLoader.lazyChildren(itemsContainer);
        });
    }

    function reloadSystemInfo(view, apiClient) {
        apiClient.getSystemInfo().then(function (systemInfo) {
            view.querySelector("#serverName").innerHTML = globalize.translate("DashboardServerName", systemInfo.ServerName);

            var localizedVersion = globalize.translate("DashboardVersionNumber", systemInfo.Version);
            if (systemInfo.SystemUpdateLevel && "Release" != systemInfo.SystemUpdateLevel) {
                localizedVersion += " " + globalize.translate("Option" + systemInfo.SystemUpdateLevel).toLowerCase();
            }
            view.querySelector("#versionNumber").innerHTML = localizedVersion;

            if (systemInfo.SupportsHttps) {
                view.querySelector("#ports").innerHTML = globalize.translate("LabelRunningOnPorts", systemInfo.HttpServerPortNumber, systemInfo.HttpsPortNumber);
            } else {
                view.querySelector("#ports").innerHTML = globalize.translate("LabelRunningOnPort", systemInfo.HttpServerPortNumber);
            }

            DashboardPage.renderUrls(view, systemInfo);
            DashboardPage.renderPaths(view, systemInfo);

            if (systemInfo.CanSelfRestart) {
                view.querySelector("#btnRestartServer").classList.remove("hide");
            } else {
                view.querySelector("#btnRestartServer").classList.add("hide");
            }
        });
    }

    function renderInfo(view, sessions, forceUpdate) {
        sessions = filterSessions(sessions);
        renderActiveConnections(view, sessions);
        loading.hide();
    }

    function pollForInfo(view, apiClient, forceUpdate) {
        apiClient.getSessions({
            ActiveWithinSeconds: 960
        }).then(function (sessions) {
            renderInfo(view, sessions, forceUpdate);
        });
        apiClient.getScheduledTasks().then(function (tasks) {
            renderRunningTasks(view, tasks);
        });
    }

    function renderActiveConnections(view, sessions) {
        var html = "";
        DashboardPage.sessionsList = sessions;
        var parentElement = view.querySelector(".activeDevices");
        var cardElem = parentElement.querySelector(".card");

        if (cardElem) {
            cardElem.classList.add("deadSession");
        }

        for (var i = 0, length = sessions.length; i < length; i++) {
            var session = sessions[i];
            var rowId = "session" + session.Id;
            var elem = view.querySelector("#" + rowId);

            if (elem) {
                DashboardPage.updateSession(elem, session);
            } else {
                var nowPlayingItem = session.NowPlayingItem;
                var className = "scalableCard card activeSession backdropCard backdropCard-scalable";

                if (session.TranscodingInfo && session.TranscodingInfo.CompletionPercentage) {
                    className += " transcodingSession";
                }

                html += '<div class="' + className + '" id="' + rowId + '">';
                html += '<div class="cardBox visualCardBox">';
                html += '<div class="cardScalable visualCardBox-cardScalable">';
                html += '<div class="cardPadder cardPadder-backdrop"></div>';
                html += '<div class="cardContent">';
                var imgUrl = DashboardPage.getNowPlayingImageUrl(nowPlayingItem);

                if (imgUrl) {
                    html += '<div class="sessionNowPlayingContent sessionNowPlayingContent-withbackground"';
                    html += ' data-src="' + imgUrl + '" style="display:inline-block;background-image:url(\'' + imgUrl + "');\"";
                } else {
                    html += '<div class="sessionNowPlayingContent"';
                }

                html += "></div>";
                html += '<div class="sessionNowPlayingInnerContent">';
                html += '<div class="sessionAppInfo">';
                var clientImage = DashboardPage.getClientImage(session);

                if (clientImage) {
                    html += clientImage;
                }

                html += '<div class="sessionAppName" style="display:inline-block;">';
                html += '<div class="sessionDeviceName">' + session.DeviceName + "</div>";
                html += '<div class="sessionAppSecondaryText">' + DashboardPage.getAppSecondaryText(session) + "</div>";
                html += "</div>";
                html += "</div>";
                html += '<div class="sessionNowPlayingTime">' + DashboardPage.getSessionNowPlayingTime(session) + "</div>";

                if (session.TranscodingInfo && session.TranscodingInfo.Framerate) {
                    html += '<div class="sessionTranscodingFramerate">' + session.TranscodingInfo.Framerate + " fps</div>";
                } else {
                    html += '<div class="sessionTranscodingFramerate"></div>';
                }

                var nowPlayingName = DashboardPage.getNowPlayingName(session);
                html += '<div class="sessionNowPlayingInfo" data-imgsrc="' + nowPlayingName.image + '">';
                html += nowPlayingName.html;
                html += "</div>";
                if (nowPlayingItem && nowPlayingItem.RunTimeTicks) {
                    html += '<progress class="playbackProgress" min="0" max="100" value="' + 100 * (session.PlayState.PositionTicks || 0) / nowPlayingItem.RunTimeTicks + '"></progress>';
                } else {
                    html += '<progress class="playbackProgress hide" min="0" max="100"></progress>';
                }

                if (session.TranscodingInfo && session.TranscodingInfo.CompletionPercentage) {
                    html += '<progress class="transcodingProgress" min="0" max="100" value="' + session.TranscodingInfo.CompletionPercentage.toFixed(1) + '"></progress>';
                } else {
                    html += '<progress class="transcodingProgress hide" min="0" max="100"></progress>';
                }

                html += "</div>";
                html += "</div>";
                html += "</div>";
                html += '<div class="sessionCardFooter cardFooter">';
                html += '<div class="sessionCardButtons flex align-items-center justify-content-center">';
                var btnCssClass;
                btnCssClass = session.ServerId && session.NowPlayingItem && session.SupportsRemoteControl && session.DeviceId !== connectionManager.deviceId() ? "" : " hide";
                html += '<button is="paper-icon-button-light" class="sessionCardButton btnSessionPlayPause paper-icon-button-light ' + btnCssClass + '"><i class="md-icon">&#xE034;</i></button>';
                html += '<button is="paper-icon-button-light" class="sessionCardButton btnSessionStop paper-icon-button-light ' + btnCssClass + '"><i class="md-icon">&#xE047;</i></button>';
                btnCssClass = session.TranscodingInfo && session.TranscodingInfo.TranscodeReasons && session.TranscodingInfo.TranscodeReasons.length ? "" : " hide";
                html += '<button is="paper-icon-button-light" class="sessionCardButton btnSessionInfo paper-icon-button-light ' + btnCssClass + '" title="' + globalize.translate("ViewPlaybackInfo") + '"><i class="md-icon">&#xE88E;</i></button>';
                btnCssClass = session.ServerId && -1 !== session.SupportedCommands.indexOf("DisplayMessage") && session.DeviceId !== connectionManager.deviceId() ? "" : " hide";
                html += '<button is="paper-icon-button-light" class="sessionCardButton btnSessionSendMessage paper-icon-button-light ' + btnCssClass + '" title="' + globalize.translate("SendMessage") + '"><i class="md-icon">&#xE0C9;</i></button>';
                html += "</div>";
                html += '<div class="sessionNowPlayingStreamInfo" style="padding:.5em 0 1em;">';
                html += DashboardPage.getSessionNowPlayingStreamInfo(session);
                html += "</div>";
                html += '<div class="flex align-items-center justify-content-center">';
                var userImage = DashboardPage.getUserImage(session);
                html += userImage ? '<img style="height:1.71em;border-radius:50px;margin-right:.5em;" src="' + userImage + '" />' : '<div style="height:1.71em;"></div>';
                html += '<div class="sessionUserName" style="text-transform:uppercase;">';
                html += DashboardPage.getUsersHtml(session) || "&nbsp;";
                html += "</div>";
                html += "</div>";
                html += "</div>";
                html += "</div>";
                html += "</div>";
            }
        }

        parentElement.insertAdjacentHTML("beforeend", html);
        var deadSessionElem = parentElement.querySelector(".deadSession");

        if (deadSessionElem) {
            deadSessionElem.parentNode.removeChild(deadSessionElem);
        }
    }

    function renderRunningTasks(view, tasks) {
        var html = "";
        tasks = tasks.filter(function (task) {
            if ("Idle" != task.State) {
                return !task.IsHidden;
            }

            return false;
        });

        if (tasks.length) {
            view.querySelector(".runningTasksContainer").classList.remove("hide");
        } else {
            view.querySelector(".runningTasksContainer").classList.add("hide");
        }

        for (var i = 0, length = tasks.length; i < length; i++) {
            var task = tasks[i];

            html += "<p>";
            html += task.Name + "<br/>";
            if (task.State === "Running") {
                var progress = (task.CurrentProgressPercentage || 0).toFixed(1);
                html += '<progress max="100" value="' + progress + '" title="' + progress + '%">';
                html += progress + "%";
                html += "</progress>";
                html += "<span style='color:#00a4dc;margin-left:5px;margin-right:5px;'>" + progress + "%</span>";
                html += '<button type="button" is="paper-icon-button-light" title="' + globalize.translate("ButtonStop") + '" onclick="DashboardPage.stopTask(this, \'' + task.Id + '\');" class="autoSize"><i class="md-icon">cancel</i></button>';
            } else if (task.State === "Cancelling") {
                html += '<span style="color:#cc0000;">' + globalize.translate("LabelStopping") + "</span>";
            }

            html += "</p>";
        }

        view.querySelector("#divRunningTasks").innerHTML = html;
    }

    window.DashboardPage = {
        renderPaths: function (page, systemInfo) {
            page.querySelector("#cachePath").innerHTML = systemInfo.CachePath;
            page.querySelector("#logPath").innerHTML = systemInfo.LogPath;
            page.querySelector("#transcodePath").innerHTML = systemInfo.TranscodingTempPath;
            page.querySelector("#metadataPath").innerHTML = systemInfo.InternalMetadataPath;
            page.querySelector("#webPath").innerHTML = systemInfo.WebPath;
        },
        startInterval: function (apiClient) {
            apiClient.sendMessage("SessionsStart", "0,1500");
            apiClient.sendMessage("ScheduledTasksInfoStart", "0,1000");
        },
        stopInterval: function (apiClient) {
            apiClient.sendMessage("SessionsStop");
            apiClient.sendMessage("ScheduledTasksInfoStop");
        },
        getSessionNowPlayingStreamInfo: function (session) {
            var html = "";
            var showTranscodingInfo = false;
            var displayPlayMethod = playMethodHelper.getDisplayPlayMethod(session);
            if (displayPlayMethod === "DirectStream") {
                html += globalize.translate("DirectStreaming");
            } else if (displayPlayMethod === "Transcode") {
                html += globalize.translate("Transcoding");
                if (session.TranscodingInfo && session.TranscodingInfo.Framerate) {
                    html += " (" + session.TranscodingInfo.Framerate + " fps)";
                }
                showTranscodingInfo = true;
            } else if (displayPlayMethod === "DirectPlay") {
                html += globalize.translate("DirectPlaying");
            }
            if (showTranscodingInfo) {
                var line = [];

                if (session.TranscodingInfo) {
                    if (session.TranscodingInfo.Bitrate) {
                        if (session.TranscodingInfo.Bitrate > 1e6) {
                            line.push((session.TranscodingInfo.Bitrate / 1e6).toFixed(1) + " Mbps");
                        } else {
                            line.push(Math.floor(session.TranscodingInfo.Bitrate / 1e3) + " kbps");
                        }
                    }

                    if (session.TranscodingInfo.Container) {
                        line.push(session.TranscodingInfo.Container);
                    }

                    if (session.TranscodingInfo.VideoCodec) {
                        line.push(session.TranscodingInfo.VideoCodec);
                    }

                    if (session.TranscodingInfo.AudioCodec && session.TranscodingInfo.AudioCodec != session.TranscodingInfo.Container) {
                        line.push(session.TranscodingInfo.AudioCodec);
                    }
                }

                if (line.length) {
                    html += " - " + line.join(" ");
                }
            }

            return html || "&nbsp;";
        },
        getSessionNowPlayingTime: function (session) {
            var nowPlayingItem = session.NowPlayingItem;
            var html = "";

            if (nowPlayingItem) {
                if (session.PlayState.PositionTicks) {
                    html += datetime.getDisplayRunningTime(session.PlayState.PositionTicks);
                } else {
                    html += "--:--:--";
                }

                html += " / ";

                if (nowPlayingItem && nowPlayingItem.RunTimeTicks) {
                    html += datetime.getDisplayRunningTime(nowPlayingItem.RunTimeTicks);
                } else {
                    html += "--:--:--";
                }

                return html;
            }

            return html;
        },
        getAppSecondaryText: function (session) {
            return session.Client + " " + session.ApplicationVersion;
        },
        getNowPlayingName: function (session) {
            var imgUrl = "";
            var nowPlayingItem = session.NowPlayingItem;

            if (!nowPlayingItem) {
                return {
                    html: "Last seen " + humane_date(session.LastActivityDate),
                    image: imgUrl
                };
            }

            var topText = itemHelper.getDisplayName(nowPlayingItem);
            var bottomText = "";

            if (nowPlayingItem.Artists && nowPlayingItem.Artists.length) {
                bottomText = topText;
                topText = nowPlayingItem.Artists[0];
            } else {
                if (nowPlayingItem.SeriesName || nowPlayingItem.Album) {
                    bottomText = topText;
                    topText = nowPlayingItem.SeriesName || nowPlayingItem.Album;
                } else if (nowPlayingItem.ProductionYear) {
                    bottomText = nowPlayingItem.ProductionYear;
                }
            }

            if (nowPlayingItem.ImageTags && nowPlayingItem.ImageTags.Logo) {
                imgUrl = ApiClient.getScaledImageUrl(nowPlayingItem.Id, {
                    tag: nowPlayingItem.ImageTags.Logo,
                    maxHeight: 24,
                    maxWidth: 130,
                    type: "Logo"
                });
            } else {
                if (nowPlayingItem.ParentLogoImageTag) {
                    imgUrl = ApiClient.getScaledImageUrl(nowPlayingItem.ParentLogoItemId, {
                        tag: nowPlayingItem.ParentLogoImageTag,
                        maxHeight: 24,
                        maxWidth: 130,
                        type: "Logo"
                    });
                }
            }

            if (imgUrl) {
                topText = '<img src="' + imgUrl + '" style="max-height:24px;max-width:130px;" />';
            }

            return {
                html: bottomText ? topText + "<br/>" + bottomText : topText,
                image: imgUrl
            };
        },
        getUsersHtml: function (session) {
            var html = [];

            if (session.UserId) {
                html.push(session.UserName);
            }

            for (var i = 0, length = session.AdditionalUsers.length; i < length; i++) {
                html.push(session.AdditionalUsers[i].UserName);
            }

            return html.join(", ");
        },
        getUserImage: function (session) {
            if (session.UserId && session.UserPrimaryImageTag) {
                return ApiClient.getUserImageUrl(session.UserId, {
                    tag: session.UserPrimaryImageTag,
                    height: 24,
                    type: "Primary"
                });
            }

            return null;
        },
        updateSession: function (row, session) {
            row.classList.remove("deadSession");
            var nowPlayingItem = session.NowPlayingItem;

            if (nowPlayingItem) {
                row.classList.add("playingSession");
            } else {
                row.classList.remove("playingSession");
            }

            if (session.ServerId && -1 !== session.SupportedCommands.indexOf("DisplayMessage") && session.DeviceId !== connectionManager.deviceId()) {
                row.querySelector(".btnSessionSendMessage").classList.remove("hide");
            } else {
                row.querySelector(".btnSessionSendMessage").classList.add("hide");
            }

            if (session.TranscodingInfo && session.TranscodingInfo.TranscodeReasons && session.TranscodingInfo && session.TranscodingInfo.TranscodeReasons.length) {
                row.querySelector(".btnSessionInfo").classList.remove("hide");
            } else {
                row.querySelector(".btnSessionInfo").classList.add("hide");
            }

            var btnSessionPlayPause = row.querySelector(".btnSessionPlayPause");

            if (session.ServerId && nowPlayingItem && session.SupportsRemoteControl && session.DeviceId !== connectionManager.deviceId()) {
                btnSessionPlayPause.classList.remove("hide");
                row.querySelector(".btnSessionStop").classList.remove("hide");
            } else {
                btnSessionPlayPause.classList.add("hide");
                row.querySelector(".btnSessionStop").classList.add("hide");
            }

            if (session.PlayState && session.PlayState.IsPaused) {
                btnSessionPlayPause.querySelector("i").innerHTML = "&#xE037;";
            } else {
                btnSessionPlayPause.querySelector("i").innerHTML = "&#xE034;";
            }

            row.querySelector(".sessionNowPlayingStreamInfo").innerHTML = DashboardPage.getSessionNowPlayingStreamInfo(session);
            row.querySelector(".sessionNowPlayingTime").innerHTML = DashboardPage.getSessionNowPlayingTime(session);
            row.querySelector(".sessionUserName").innerHTML = DashboardPage.getUsersHtml(session) || "&nbsp;";
            row.querySelector(".sessionAppSecondaryText").innerHTML = DashboardPage.getAppSecondaryText(session);
            row.querySelector(".sessionTranscodingFramerate").innerHTML = session.TranscodingInfo && session.TranscodingInfo.Framerate ? session.TranscodingInfo.Framerate + " fps" : "";
            var nowPlayingName = DashboardPage.getNowPlayingName(session);
            var nowPlayingInfoElem = row.querySelector(".sessionNowPlayingInfo");

            if (!(nowPlayingName.image && nowPlayingName.image == nowPlayingInfoElem.getAttribute("data-imgsrc"))) {
                nowPlayingInfoElem.innerHTML = nowPlayingName.html;
                nowPlayingInfoElem.setAttribute("data-imgsrc", nowPlayingName.image || "");
            }

            var playbackProgressElem = row.querySelector(".playbackProgress");

            if (playbackProgressElem) {
                if (nowPlayingItem && nowPlayingItem.RunTimeTicks) {
                    var position = session.PlayState.PositionTicks || 0;
                    var value = 100 * position / nowPlayingItem.RunTimeTicks;
                    playbackProgressElem.classList.remove("hide");
                    playbackProgressElem.value = value;
                } else {
                    playbackProgressElem.classList.add("hide");
                }
            }

            var transcodingProgress = row.querySelector(".transcodingProgress");

            if (session.TranscodingInfo && session.TranscodingInfo.CompletionPercentage) {
                row.classList.add("transcodingSession");
                transcodingProgress.value = session.TranscodingInfo.CompletionPercentage;
                transcodingProgress.classList.remove("hide");
            } else {
                transcodingProgress.classList.add("hide");
                row.classList.remove("transcodingSession");
            }

            var imgUrl = DashboardPage.getNowPlayingImageUrl(nowPlayingItem) || "";
            var imgElem = row.querySelector(".sessionNowPlayingContent");

            if (imgUrl != imgElem.getAttribute("data-src")) {
                imgElem.style.backgroundImage = imgUrl ? "url('" + imgUrl + "')" : "";
                imgElem.setAttribute("data-src", imgUrl);

                if (imgUrl) {
                    imgElem.classList.add("sessionNowPlayingContent-withbackground");
                } else {
                    imgElem.classList.remove("sessionNowPlayingContent-withbackground");
                }
            }
        },
        getClientImage: function (connection) {
            var iconUrl = (connection.Client.toLowerCase(), connection.DeviceName.toLowerCase(), connection.AppIconUrl);

            if (iconUrl) {
                if (-1 === iconUrl.indexOf("://")) {
                    iconUrl = ApiClient.getUrl(iconUrl);
                }

                return "<img src='" + iconUrl + "' />";
            }

            return null;
        },
        getNowPlayingImageUrl: function (item) {
            if (item && item.BackdropImageTags && item.BackdropImageTags.length) {
                return ApiClient.getScaledImageUrl(item.Id, {
                    type: "Backdrop",
                    width: 275,
                    tag: item.BackdropImageTags[0]
                });
            }

            if (item && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length) {
                return ApiClient.getScaledImageUrl(item.ParentBackdropItemId, {
                    type: "Backdrop",
                    width: 275,
                    tag: item.ParentBackdropImageTags[0]
                });
            }

            if (item && item.BackdropImageTag) {
                return ApiClient.getScaledImageUrl(item.BackdropItemId, {
                    type: "Backdrop",
                    width: 275,
                    tag: item.BackdropImageTag
                });
            }

            var imageTags = (item || {}).ImageTags || {};

            if (item && imageTags.Thumb) {
                return ApiClient.getScaledImageUrl(item.Id, {
                    type: "Thumb",
                    width: 275,
                    tag: imageTags.Thumb
                });
            }

            if (item && item.ParentThumbImageTag) {
                return ApiClient.getScaledImageUrl(item.ParentThumbItemId, {
                    type: "Thumb",
                    width: 275,
                    tag: item.ParentThumbImageTag
                });
            }

            if (item && item.ThumbImageTag) {
                return ApiClient.getScaledImageUrl(item.ThumbItemId, {
                    type: "Thumb",
                    width: 275,
                    tag: item.ThumbImageTag
                });
            }

            if (item && imageTags.Primary) {
                return ApiClient.getScaledImageUrl(item.Id, {
                    type: "Primary",
                    width: 275,
                    tag: imageTags.Primary
                });
            }

            if (item && item.PrimaryImageTag) {
                return ApiClient.getScaledImageUrl(item.PrimaryImageItemId, {
                    type: "Primary",
                    width: 275,
                    tag: item.PrimaryImageTag
                });
            }

            return null;
        },
        systemUpdateTaskKey: "SystemUpdateTask",
        renderUrls: function (page, systemInfo) {
            var helpButton = '<a is="emby-linkbutton" class="raised raised-mini button-submit" href="https://web.archive.org/web/20181216120305/https://github.com/MediaBrowser/Wiki/wiki/Connectivity" target="_blank" style="margin-left:.7em;font-size:84%;padding:.2em .8em;">' + globalize.translate("ButtonHelp") + "</a>";
            var localUrlElem = page.querySelector(".localUrl");
            var externalUrlElem = page.querySelector(".externalUrl");

            if (systemInfo.LocalAddress) {
                var localAccessHtml = globalize.translate("LabelLocalAccessUrl", '<a is="emby-linkbutton" class="button-link" href="' + systemInfo.LocalAddress + '" target="_blank">' + systemInfo.LocalAddress + "</a>");
                localUrlElem.innerHTML = localAccessHtml + helpButton;
                localUrlElem.classList.remove("hide");
            } else {
                localUrlElem.classList.add("hide");
            }

            if (systemInfo.WanAddress) {
                var externalUrl = systemInfo.WanAddress;
                var remoteAccessHtml = globalize.translate("LabelRemoteAccessUrl", '<a is="emby-linkbutton" class="button-link" href="' + externalUrl + '" target="_blank">' + externalUrl + "</a>");
                externalUrlElem.innerHTML = remoteAccessHtml + helpButton;
                externalUrlElem.classList.remove("hide");
            } else {
                externalUrlElem.classList.add("hide");
            }
        },
        stopTask: function (btn, id) {
            var page = dom.parentWithClass(btn, "page");
            ApiClient.stopScheduledTask(id).then(function () {
                pollForInfo(page, ApiClient);
            });
        },
        restart: function (btn) {
            require(["confirm"], function (confirm) {
                confirm({
                    title: globalize.translate("HeaderRestart"),
                    text: globalize.translate("MessageConfirmRestart"),
                    confirmText: globalize.translate("ButtonRestart"),
                    primary: "cancel"
                }).then(function () {
                    var page = dom.parentWithClass(btn, "page");
                    buttonEnabled(page.querySelector("#btnRestartServer"), false);
                    buttonEnabled(page.querySelector("#btnShutdown"), false);
                    ApiClient.restartServer();
                });
            });
        },
        shutdown: function (btn) {
            require(["confirm"], function (confirm) {
                confirm({
                    title: globalize.translate("HeaderShutdown"),
                    text: globalize.translate("MessageConfirmShutdown"),
                    confirmText: globalize.translate("ButtonShutdown"),
                    primary: "cancel"
                }).then(function () {
                    var page = dom.parentWithClass(btn, "page");
                    buttonEnabled(page.querySelector("#btnRestartServer"), false);
                    buttonEnabled(page.querySelector("#btnShutdown"), false);
                    ApiClient.shutdownServer();
                });
            });
        }
    };
    return function (view, params) {
        function onRestartRequired(evt, apiClient) {
            if (apiClient.serverId() === serverId) {
                renderHasPendingRestart(view, apiClient, true);
            }
        }

        function onServerShuttingDown(evt, apiClient) {
            if (apiClient.serverId() === serverId) {
                renderHasPendingRestart(view, apiClient, true);
            }
        }

        function onServerRestarting(evt, apiClient) {
            if (apiClient.serverId() === serverId) {
                renderHasPendingRestart(view, apiClient, true);
            }
        }

        function onPackageInstalling(evt, apiClient) {
            if (apiClient.serverId() === serverId) {
                pollForInfo(view, apiClient, true);
                reloadSystemInfo(view, apiClient);
            }
        }

        function onPackageInstallationCompleted(evt, apiClient) {
            if (apiClient.serverId() === serverId) {
                pollForInfo(view, apiClient, true);
                reloadSystemInfo(view, apiClient);
            }
        }

        function onSessionsUpdate(evt, apiClient, info) {
            if (apiClient.serverId() === serverId) {
                renderInfo(view, info);
            }
        }

        function onScheduledTasksUpdate(evt, apiClient, info) {
            if (apiClient.serverId() === serverId) {
                renderRunningTasks(view, info);
            }
        }

        var serverId = ApiClient.serverId();
        view.querySelector(".activeDevices").addEventListener("click", onActiveDevicesClick);
        view.addEventListener("viewshow", function () {
            var page = this;
            var apiClient = ApiClient;

            if (apiClient) {
                loading.show();
                pollForInfo(page, apiClient);
                DashboardPage.startInterval(apiClient);
                // TODO we currently don't support packages and thus these events are useless
                events.on(serverNotifications, "RestartRequired", onRestartRequired);
                events.on(serverNotifications, "ServerShuttingDown", onServerShuttingDown);
                events.on(serverNotifications, "ServerRestarting", onServerRestarting);
                events.on(serverNotifications, "PackageInstalling", onPackageInstalling);
                events.on(serverNotifications, "PackageInstallationCompleted", onPackageInstallationCompleted);
                events.on(serverNotifications, "Sessions", onSessionsUpdate);
                events.on(serverNotifications, "ScheduledTasksInfo", onScheduledTasksUpdate);
                DashboardPage.lastAppUpdateCheck = null;
                reloadSystemInfo(page, ApiClient);

                if (!page.userActivityLog) {
                    page.userActivityLog = new ActivityLog({
                        serverId: ApiClient.serverId(),
                        element: page.querySelector(".userActivityItems")
                    });
                }

                if (ApiClient.isMinServerVersion("3.4.1.25")) {
                    if (!page.serverActivityLog) {
                        page.serverActivityLog = new ActivityLog({
                            serverId: ApiClient.serverId(),
                            element: page.querySelector(".serverActivityItems")
                        });
                    }
                }

                refreshActiveRecordings(view, apiClient);
                loading.hide();
            }
        });
        view.addEventListener("viewbeforehide", function () {
            var apiClient = ApiClient;
            events.off(serverNotifications, "RestartRequired", onRestartRequired);
            events.off(serverNotifications, "ServerShuttingDown", onServerShuttingDown);
            events.off(serverNotifications, "ServerRestarting", onServerRestarting);
            events.off(serverNotifications, "PackageInstalling", onPackageInstalling);
            events.off(serverNotifications, "PackageInstallationCompleted", onPackageInstallationCompleted);
            events.off(serverNotifications, "Sessions", onSessionsUpdate);
            events.off(serverNotifications, "ScheduledTasksInfo", onScheduledTasksUpdate);

            if (apiClient) {
                DashboardPage.stopInterval(apiClient);
            }
        });
        view.addEventListener("viewdestroy", function () {
            var page = this;
            var userActivityLog = page.userActivityLog;
            if (userActivityLog) {
                userActivityLog.destroy();
            }
            var serverActivityLog = page.serverActivityLog;
            if (serverActivityLog) {
                serverActivityLog.destroy();
            }
        });
    };
});
