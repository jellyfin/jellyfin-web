define(["loading", "appRouter", "layoutManager", "connectionManager", "userSettings", "cardBuilder", "datetime", "mediaInfo", "backdrop", "listView", "itemContextMenu", "itemHelper", "dom", "indicators", "imageLoader", "libraryMenu", "globalize", "browser", "events", "playbackManager", "scrollStyles", "emby-itemscontainer", "emby-checkbox", "emby-button", "emby-playstatebutton", "emby-ratingbutton", "emby-scroller", "emby-select"], function (loading, appRouter, layoutManager, connectionManager, userSettings, cardBuilder, datetime, mediaInfo, backdrop, listView, itemContextMenu, itemHelper, dom, indicators, imageLoader, libraryMenu, globalize, browser, events, playbackManager) {
    "use strict";

    function getPromise(apiClient, params) {
        var id = params.id;

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

        throw new Error("Invalid request");
    }

    function hideAll(page, className, show) {
        var i;
        var length;
        var elems = page.querySelectorAll("." + className);

        for (i = 0, length = elems.length; i < length; i++) {
            if (show) {
                elems[i].classList.remove("hide");
            } else {
                elems[i].classList.add("hide");
            }
        }
    }

    function getContextMenuOptions(item, user, button) {
        var options = {
            item: item,
            open: false,
            play: false,
            playAllFromHere: false,
            queueAllFromHere: false,
            positionTo: button,
            cancelTimer: false,
            record: false,
            deleteItem: true === item.IsFolder,
            shuffle: false,
            instantMix: false,
            user: user,
            share: true
        };
        return options;
    }

    function getProgramScheduleHtml(items) {
        var html = "";
        html += '<div is="emby-itemscontainer" class="itemsContainer vertical-list" data-contextmenu="false">';
        html += listView.getListViewHtml({
            items: items,
            enableUserDataButtons: false,
            image: true,
            imageSource: "channel",
            showProgramDateTime: true,
            showChannel: false,
            mediaInfo: false,
            action: "none",
            moreButton: false,
            recordButton: false
        });
        return html += "</div>";
    }

    function renderSeriesTimerSchedule(page, apiClient, seriesTimerId) {
        apiClient.getLiveTvTimers({
            UserId: apiClient.getCurrentUserId(),
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb",
            SortBy: "StartDate",
            EnableTotalRecordCount: false,
            EnableUserData: false,
            SeriesTimerId: seriesTimerId,
            Fields: "ChannelInfo,ChannelImage"
        }).then(function (result) {
            if (result.Items.length && result.Items[0].SeriesTimerId != seriesTimerId) {
                result.Items = [];
            }

            var html = getProgramScheduleHtml(result.Items);
            var scheduleTab = page.querySelector(".seriesTimerSchedule");
            scheduleTab.innerHTML = html;
            imageLoader.lazyChildren(scheduleTab);
        });
    }

    function renderTimerEditor(page, item, apiClient, user) {
        if ("Recording" !== item.Type || !user.Policy.EnableLiveTvManagement || !item.TimerId || "InProgress" !== item.Status) {
            return void hideAll(page, "btnCancelTimer");
        }

        hideAll(page, "btnCancelTimer", true);
    }

    function renderSeriesTimerEditor(page, item, apiClient, user) {
        if ("SeriesTimer" !== item.Type) {
            return void hideAll(page, "btnCancelSeriesTimer");
        }

        if (user.Policy.EnableLiveTvManagement) {
            require(["seriesRecordingEditor"], function (seriesRecordingEditor) {
                seriesRecordingEditor.embed(item, apiClient.serverId(), {
                    context: page.querySelector(".seriesRecordingEditor")
                });
            });

            page.querySelector(".seriesTimerScheduleSection").classList.remove("hide");
            hideAll(page, "btnCancelSeriesTimer", true);
            return void renderSeriesTimerSchedule(page, apiClient, item.Id);
        }

        page.querySelector(".seriesTimerScheduleSection").classList.add("hide");
        return void hideAll(page, "btnCancelSeriesTimer");
    }

    function renderTrackSelections(page, instance, item, forceReload) {
        var select = page.querySelector(".selectSource");

        if (!item.MediaSources || !itemHelper.supportsMediaSourceSelection(item) || -1 === playbackManager.getSupportedCommands().indexOf("PlayMediaSource") || !playbackManager.canPlay(item)) {
            page.querySelector(".trackSelections").classList.add("hide");
            select.innerHTML = "";
            page.querySelector(".selectVideo").innerHTML = "";
            page.querySelector(".selectAudio").innerHTML = "";
            page.querySelector(".selectSubtitles").innerHTML = "";
            return;
        }

        playbackManager.getPlaybackMediaSources(item).then(function (mediaSources) {
            instance._currentPlaybackMediaSources = mediaSources;
            page.querySelector(".trackSelections").classList.remove("hide");
            select.setLabel(globalize.translate("LabelVersion"));
            var currentValue = select.value;
            var selectedId = mediaSources[0].Id;
            select.innerHTML = mediaSources.map(function (v) {
                var selected = v.Id === selectedId ? " selected" : "";
                return '<option value="' + v.Id + '"' + selected + ">" + v.Name + "</option>";
            }).join("");

            if (mediaSources.length > 1) {
                page.querySelector(".selectSourceContainer").classList.remove("hide");
            } else {
                page.querySelector(".selectSourceContainer").classList.add("hide");
            }

            if (select.value !== currentValue || forceReload) {
                renderVideoSelections(page, mediaSources);
                renderAudioSelections(page, mediaSources);
                renderSubtitleSelections(page, mediaSources);
            }
        });
    }

    function renderVideoSelections(page, mediaSources) {
        var mediaSourceId = page.querySelector(".selectSource").value;
        var mediaSource = mediaSources.filter(function (m) {
            return m.Id === mediaSourceId;
        })[0];
        var tracks = mediaSource.MediaStreams.filter(function (m) {
            return "Video" === m.Type;
        });
        var select = page.querySelector(".selectVideo");
        select.setLabel(globalize.translate("LabelVideo"));
        var selectedId = tracks.length ? tracks[0].Index : -1;
        select.innerHTML = tracks.map(function (v) {
            var selected = v.Index === selectedId ? " selected" : "";
            var titleParts = [];
            var resolutionText = mediaInfo.getResolutionText(v);

            if (resolutionText) {
                titleParts.push(resolutionText);
            }

            if (v.Codec) {
                titleParts.push(v.Codec.toUpperCase());
            }

            return '<option value="' + v.Index + '" ' + selected + ">" + (v.DisplayTitle || titleParts.join(" ")) + "</option>";
        }).join("");
        select.setAttribute("disabled", "disabled");

        if (tracks.length) {
            page.querySelector(".selectVideoContainer").classList.remove("hide");
        } else {
            page.querySelector(".selectVideoContainer").classList.add("hide");
        }
    }

    function renderAudioSelections(page, mediaSources) {
        var mediaSourceId = page.querySelector(".selectSource").value;
        var mediaSource = mediaSources.filter(function (m) {
            return m.Id === mediaSourceId;
        })[0];
        var tracks = mediaSource.MediaStreams.filter(function (m) {
            return "Audio" === m.Type;
        });
        var select = page.querySelector(".selectAudio");
        select.setLabel(globalize.translate("LabelAudio"));
        var selectedId = mediaSource.DefaultAudioStreamIndex;
        select.innerHTML = tracks.map(function (v) {
            var selected = v.Index === selectedId ? " selected" : "";
            return '<option value="' + v.Index + '" ' + selected + ">" + v.DisplayTitle + "</option>";
        }).join("");

        if (tracks.length > 1) {
            select.removeAttribute("disabled");
        } else {
            select.setAttribute("disabled", "disabled");
        }

        if (tracks.length) {
            page.querySelector(".selectAudioContainer").classList.remove("hide");
        } else {
            page.querySelector(".selectAudioContainer").classList.add("hide");
        }
    }

    function renderSubtitleSelections(page, mediaSources) {
        var mediaSourceId = page.querySelector(".selectSource").value;
        var mediaSource = mediaSources.filter(function (m) {
            return m.Id === mediaSourceId;
        })[0];
        var tracks = mediaSource.MediaStreams.filter(function (m) {
            return "Subtitle" === m.Type;
        });
        var select = page.querySelector(".selectSubtitles");
        select.setLabel(globalize.translate("LabelSubtitles"));
        var selectedId = null == mediaSource.DefaultSubtitleStreamIndex ? -1 : mediaSource.DefaultSubtitleStreamIndex;

        if (tracks.length) {
            var selected = -1 === selectedId ? " selected" : "";
            select.innerHTML = '<option value="-1">' + globalize.translate("Off") + "</option>" + tracks.map(function (v) {
                selected = v.Index === selectedId ? " selected" : "";
                return '<option value="' + v.Index + '" ' + selected + ">" + v.DisplayTitle + "</option>";
            }).join("");
            page.querySelector(".selectSubtitlesContainer").classList.remove("hide");
        } else {
            select.innerHTML = "";
            page.querySelector(".selectSubtitlesContainer").classList.add("hide");
        }
    }

    function reloadPlayButtons(page, item) {
        var canPlay = false;

        if ("Program" == item.Type) {
            var now = new Date();

            if (now >= datetime.parseISO8601Date(item.StartDate, true) && now < datetime.parseISO8601Date(item.EndDate, true)) {
                hideAll(page, "btnPlay", true);
                canPlay = true;
            } else {
                hideAll(page, "btnPlay");
            }

            hideAll(page, "btnResume");
            hideAll(page, "btnInstantMix");
            hideAll(page, "btnShuffle");
        } else if (playbackManager.canPlay(item)) {
            hideAll(page, "btnPlay", true);
            var enableInstantMix = -1 !== ["Audio", "MusicAlbum", "MusicGenre", "MusicArtist"].indexOf(item.Type);
            hideAll(page, "btnInstantMix", enableInstantMix);
            var enableShuffle = item.IsFolder || -1 !== ["MusicAlbum", "MusicGenre", "MusicArtist"].indexOf(item.Type);
            hideAll(page, "btnShuffle", enableShuffle);
            canPlay = true;
            hideAll(page, "btnResume", item.UserData && item.UserData.PlaybackPositionTicks > 0);
        } else {
            hideAll(page, "btnPlay");
            hideAll(page, "btnResume");
            hideAll(page, "btnInstantMix");
            hideAll(page, "btnShuffle");
        }

        return canPlay;
    }

    function reloadUserDataButtons(page, item) {
        var i;
        var length;
        var btnPlaystates = page.querySelectorAll(".btnPlaystate");

        for (i = 0, length = btnPlaystates.length; i < length; i++) {
            var btnPlaystate = btnPlaystates[i];

            if (itemHelper.canMarkPlayed(item)) {
                btnPlaystate.classList.remove("hide");
                btnPlaystate.setItem(item);
            } else {
                btnPlaystate.classList.add("hide");
                btnPlaystate.setItem(null);
            }
        }

        var btnUserRatings = page.querySelectorAll(".btnUserRating");

        for (i = 0, length = btnUserRatings.length; i < length; i++) {
            var btnUserRating = btnUserRatings[i];

            if (itemHelper.canRate(item)) {
                btnUserRating.classList.remove("hide");
                btnUserRating.setItem(item);
            } else {
                btnUserRating.classList.add("hide");
                btnUserRating.setItem(null);
            }
        }
    }

    function getArtistLinksHtml(artists, serverId, context) {
        var html = [];

        for (var i = 0, length = artists.length; i < length; i++) {
            var artist = artists[i];
            var href = appRouter.getRouteUrl(artist, {
                context: context,
                itemType: "MusicArtist",
                serverId: serverId
            });
            html.push('<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + href + '">' + artist.Name + "</a>");
        }

        return html = html.join(" / ");
    }

    function renderName(item, container, isStatic, context) {
        var parentRoute;
        var parentNameHtml = [];
        var parentNameLast = false;

        if (item.AlbumArtists) {
            parentNameHtml.push(getArtistLinksHtml(item.AlbumArtists, item.ServerId, context));
            parentNameLast = true;
        } else if (item.ArtistItems && item.ArtistItems.length && "MusicVideo" === item.Type) {
            parentNameHtml.push(getArtistLinksHtml(item.ArtistItems, item.ServerId, context));
            parentNameLast = true;
        } else if (item.SeriesName && "Episode" === item.Type) {
            parentRoute = appRouter.getRouteUrl({
                Id: item.SeriesId,
                Name: item.SeriesName,
                Type: "Series",
                IsFolder: true,
                ServerId: item.ServerId
            }, {
                context: context
            });
            parentNameHtml.push('<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + parentRoute + '">' + item.SeriesName + "</a>");
        } else if (item.IsSeries || item.EpisodeTitle) {
            parentNameHtml.push(item.Name);
        }

        if (item.SeriesName && "Season" === item.Type) {
            parentRoute = appRouter.getRouteUrl({
                Id: item.SeriesId,
                Name: item.SeriesName,
                Type: "Series",
                IsFolder: true,
                ServerId: item.ServerId
            }, {
                context: context
            });
            parentNameHtml.push('<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + parentRoute + '">' + item.SeriesName + "</a>");
        } else if (null != item.ParentIndexNumber && "Episode" === item.Type) {
            parentRoute = appRouter.getRouteUrl({
                Id: item.SeasonId,
                Name: item.SeasonName,
                Type: "Season",
                IsFolder: true,
                ServerId: item.ServerId
            }, {
                context: context
            });
            parentNameHtml.push('<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + parentRoute + '">' + item.SeasonName + "</a>");
        } else if (null != item.ParentIndexNumber && item.IsSeries) {
            parentNameHtml.push(item.SeasonName || "S" + item.ParentIndexNumber);
        } else if (item.Album && item.AlbumId && ("MusicVideo" === item.Type || "Audio" === item.Type)) {
            parentRoute = appRouter.getRouteUrl({
                Id: item.AlbumId,
                Name: item.Album,
                Type: "MusicAlbum",
                IsFolder: true,
                ServerId: item.ServerId
            }, {
                context: context
            });
            parentNameHtml.push('<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + parentRoute + '">' + item.Album + "</a>");
        } else if (item.Album) {
            parentNameHtml.push(item.Album);
        }

        var html = "";

        if (parentNameHtml.length) {
            if (parentNameLast) {
                html = '<h3 class="parentName" style="margin: .25em 0;">' + parentNameHtml.join(" - ") + "</h3>";
            } else {
                html = '<h1 class="parentName" style="margin: .1em 0 .25em;">' + parentNameHtml.join(" - ") + "</h1>";
            }
        }

        var name = itemHelper.getDisplayName(item, {
            includeParentInfo: false
        });
        var offset = parentNameLast ? ".25em" : ".5em";

        if (html && !parentNameLast) {
            html += '<h3 class="itemName infoText" style="margin: .25em 0 .5em;">' + name + '</h3>';
        } else {
            html = '<h1 class="itemName infoText" style="margin: .1em 0 ' + offset + ';">' + name + "</h1>" + html;
        }

        if (item.OriginalTitle && item.OriginalTitle != item.Name) {
            html += '<h4 class="itemName infoText" style="margin: -' + offset + ' 0 0">' + item.OriginalTitle + '</h4>';
        }

        container.innerHTML = html;

        if (html.length) {
            container.classList.remove("hide");
        } else {
            container.classList.add("hide");
        }
    }

    function setTrailerButtonVisibility(page, item) {
        if ((item.LocalTrailerCount || item.RemoteTrailers && item.RemoteTrailers.length) && -1 !== playbackManager.getSupportedCommands().indexOf("PlayTrailers")) {
            hideAll(page, "btnPlayTrailer", true);
        } else {
            hideAll(page, "btnPlayTrailer");
        }
    }

    function renderBackdrop(item) {
        if (dom.getWindowSize().innerWidth >= 1000) {
            backdrop.setBackdrops([item]);
        } else {
            backdrop.clear();
        }
    }

    function renderDetailPageBackdrop(page, item, apiClient) {
        var imgUrl;
        var hasbackdrop = false;
        var itemBackdropElement = page.querySelector("#itemBackdrop");
        var usePrimaryImage = item.MediaType === "Video" && item.Type !== "Movie" && item.Type !== "Trailer" ||
            item.MediaType && item.MediaType !== "Video" ||
            item.Type === "MusicAlbum" ||
            item.Type === "Person";

        if (!layoutManager.mobile && !userSettings.enableBackdrops()) {
            return false;
        }

        if ("Program" === item.Type && item.ImageTags && item.ImageTags.Thumb) {
            imgUrl = apiClient.getScaledImageUrl(item.Id, {
                type: "Thumb",
                maxWidth: dom.getScreenWidth(),
                index: 0,
                tag: item.ImageTags.Thumb
            });
            page.classList.remove("noBackdrop");
            imageLoader.lazyImage(itemBackdropElement, imgUrl, false);
            hasbackdrop = true;
        } else if (usePrimaryImage && item.ImageTags && item.ImageTags.Primary) {
            imgUrl = apiClient.getScaledImageUrl(item.Id, {
                type: "Primary",
                maxWidth: dom.getScreenWidth(),
                index: 0,
                tag: item.ImageTags.Primary
            });
            page.classList.remove("noBackdrop");
            imageLoader.lazyImage(itemBackdropElement, imgUrl, false);
            hasbackdrop = true;
        } else if (item.BackdropImageTags && item.BackdropImageTags.length) {
            imgUrl = apiClient.getScaledImageUrl(item.Id, {
                type: "Backdrop",
                maxWidth: dom.getScreenWidth(),
                index: 0,
                tag: item.BackdropImageTags[0]
            });
            page.classList.remove("noBackdrop");
            imageLoader.lazyImage(itemBackdropElement, imgUrl, false);
            hasbackdrop = true;
        } else if (item.ParentBackdropItemId && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length) {
            imgUrl = apiClient.getScaledImageUrl(item.ParentBackdropItemId, {
                type: "Backdrop",
                maxWidth: dom.getScreenWidth(),
                index: 0,
                tag: item.ParentBackdropImageTags[0]
            });
            page.classList.remove("noBackdrop");
            imageLoader.lazyImage(itemBackdropElement, imgUrl, false);
            hasbackdrop = true;
        } else if (item.ImageTags && item.ImageTags.Thumb) {
            imgUrl = apiClient.getScaledImageUrl(item.Id, {
                type: "Thumb",
                maxWidth: dom.getScreenWidth(),
                index: 0,
                tag: item.ImageTags.Thumb
            });
            page.classList.remove("noBackdrop");
            imageLoader.lazyImage(itemBackdropElement, imgUrl, false);
            hasbackdrop = true;
        } else {
            itemBackdropElement.style.backgroundImage = "";
        }

        if ("Person" === item.Type) {
            // FIXME: This hides the backdrop on all persons to fix a margin issue. Ideally, a proper fix should be made.
            page.classList.add('noBackdrop');
            itemBackdropElement.classList.add("personBackdrop");
        } else {
            itemBackdropElement.classList.remove("personBackdrop");
        }

        return hasbackdrop;
    }

    function reloadFromItem(instance, page, params, item, user) {
        var context = params.context;
        page.querySelector(".detailPagePrimaryContainer").classList.add("detailSticky");

        renderName(item, page.querySelector(".nameContainer"), false, context);
        var apiClient = connectionManager.getApiClient(item.ServerId);
        renderSeriesTimerEditor(page, item, apiClient, user);
        renderTimerEditor(page, item, apiClient, user);
        renderImage(page, item, apiClient, user);
        renderLogo(page, item, apiClient);
        setTitle(item, apiClient);
        setInitialCollapsibleState(page, item, apiClient, context, user);
        renderDetails(page, item, apiClient, context);
        renderTrackSelections(page, instance, item);
        renderBackdrop(item);
        renderDetailPageBackdrop(page, item, apiClient);
        var canPlay = reloadPlayButtons(page, item);

        if ((item.LocalTrailerCount || item.RemoteTrailers && item.RemoteTrailers.length) && -1 !== playbackManager.getSupportedCommands().indexOf("PlayTrailers")) {
            hideAll(page, "btnPlayTrailer", true);
        } else {
            hideAll(page, "btnPlayTrailer");
        }

        setTrailerButtonVisibility(page, item);

        if (item.CanDelete && !item.IsFolder) {
            hideAll(page, "btnDeleteItem", true);
        } else {
            hideAll(page, "btnDeleteItem");
        }

        if ("Program" !== item.Type || canPlay) {
            hideAll(page, "mainDetailButtons", true);
        } else {
            hideAll(page, "mainDetailButtons");
        }

        showRecordingFields(instance, page, item, user);
        var groupedVersions = (item.MediaSources || []).filter(function (g) {
            return "Grouping" == g.Type;
        });

        if (user.Policy.IsAdministrator && groupedVersions.length) {
            page.querySelector(".btnSplitVersions").classList.remove("hide");
        } else {
            page.querySelector(".btnSplitVersions").classList.add("hide");
        }

        if (itemContextMenu.getCommands(getContextMenuOptions(item, user)).length) {
            hideAll(page, "btnMoreCommands", true);
        } else {
            hideAll(page, "btnMoreCommands");
        }

        var itemBirthday = page.querySelector("#itemBirthday");

        if ("Person" == item.Type && item.PremiereDate) {
            try {
                var birthday = datetime.parseISO8601Date(item.PremiereDate, true).toDateString();
                itemBirthday.classList.remove("hide");
                itemBirthday.innerHTML = globalize.translate("BirthDateValue").replace("{0}", birthday);
            } catch (err) {
                itemBirthday.classList.add("hide");
            }
        } else {
            itemBirthday.classList.add("hide");
        }

        var itemDeathDate = page.querySelector("#itemDeathDate");

        if ("Person" == item.Type && item.EndDate) {
            try {
                var deathday = datetime.parseISO8601Date(item.EndDate, true).toDateString();
                itemDeathDate.classList.remove("hide");
                itemDeathDate.innerHTML = globalize.translate("DeathDateValue").replace("{0}", deathday);
            } catch (err) {
                itemDeathDate.classList.add("hide");
            }
        } else {
            itemDeathDate.classList.add("hide");
        }

        var itemBirthLocation = page.querySelector("#itemBirthLocation");

        if ("Person" == item.Type && item.ProductionLocations && item.ProductionLocations.length) {
            var gmap = '<a is="emby-linkbutton" class="button-link textlink" target="_blank" href="https://maps.google.com/maps?q=' + item.ProductionLocations[0] + '">' + item.ProductionLocations[0] + "</a>";
            itemBirthLocation.classList.remove("hide");
            itemBirthLocation.innerHTML = globalize.translate("BirthPlaceValue").replace("{0}", gmap);
        } else {
            itemBirthLocation.classList.add("hide");
        }

        setPeopleHeader(page, item);
        loading.hide();

        if (item.Type === "Book") {
            hideAll(page, "btnDownload", true);
        }

        require(["autoFocuser"], function (autoFocuser) {
            autoFocuser.autoFocus(page);
        });
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

    function setTitle(item, apiClient) {
        var url = logoImageUrl(item, apiClient, {});

        if (url != null) {
            var pageTitle = document.querySelector(".pageTitle");
            pageTitle.style.backgroundImage = "url('" + url + "')";
            pageTitle.classList.add("pageTitleWithLogo");
            pageTitle.innerHTML = "";
        } else {
            Emby.Page.setTitle("");
        }
    }

    function renderLogo(page, item, apiClient) {
        var url = logoImageUrl(item, apiClient, {
            maxWidth: 400
        });
        var detailLogo = page.querySelector(".detailLogo");

        if (!layoutManager.mobile && !userSettings.enableBackdrops()) {
            detailLogo.classList.add("hide");
        } else if (url) {
            detailLogo.classList.remove("hide");
            detailLogo.classList.add("lazy");
            detailLogo.setAttribute("data-src", url);
            imageLoader.lazyImage(detailLogo);
        } else {
            detailLogo.classList.add("hide");
        }
    }

    function showRecordingFields(instance, page, item, user) {
        if (!instance.currentRecordingFields) {
            var recordingFieldsElement = page.querySelector(".recordingFields");

            if ("Program" == item.Type && user.Policy.EnableLiveTvManagement) {
                require(["recordingFields"], function (recordingFields) {
                    instance.currentRecordingFields = new recordingFields({
                        parent: recordingFieldsElement,
                        programId: item.Id,
                        serverId: item.ServerId
                    });
                    recordingFieldsElement.classList.remove("hide");
                });
            } else {
                recordingFieldsElement.classList.add("hide");
                recordingFieldsElement.innerHTML = "";
            }
        }
    }

    function renderUserInfo(page, item) {
        var lastPlayedElement = page.querySelector(".itemLastPlayed");

        if (item.UserData && item.UserData.LastPlayedDate) {
            lastPlayedElement.classList.remove("hide");
            var datePlayed = datetime.parseISO8601Date(item.UserData.LastPlayedDate);
            lastPlayedElement.innerHTML = globalize.translate("DatePlayed") + ": " + datetime.toLocaleDateString(datePlayed) + " " + datetime.getDisplayTime(datePlayed);
        } else {
            lastPlayedElement.classList.add("hide");
        }
    }

    function renderLinks(linksElem, item) {
        var html = [];

        if (item.DateCreated && itemHelper.enableDateAddedDisplay(item)) {
            var dateCreated = datetime.parseISO8601Date(item.DateCreated);
            html.push(globalize.translate("AddedOnValue", datetime.toLocaleDateString(dateCreated) + " " + datetime.getDisplayTime(dateCreated)));
        }

        var links = [];

        if (!layoutManager.tv && item.HomePageUrl) {
            links.push('<a style="color:inherit;" is="emby-linkbutton" class="button-link" href="' + item.HomePageUrl + '" target="_blank">' + globalize.translate("ButtonWebsite") + "</a>");
        }
        if (item.ExternalUrls) {
            for (var i = 0, length = item.ExternalUrls.length; i < length; i++) {
                var url = item.ExternalUrls[i];
                links.push('<a style="color:inherit;" is="emby-linkbutton" class="button-link" href="' + url.Url + '" target="_blank">' + url.Name + "</a>");
            }
        }

        if (links.length) {
            html.push(globalize.translate("LinksValue", links.join(", ")));
        }

        linksElem.innerHTML = html.join(", ");

        if (html.length) {
            linksElem.classList.remove("hide");
        } else {
            linksElem.classList.add("hide");
        }
    }

    function renderDetailImage(page, elem, item, apiClient, editable, imageLoader, indicators) {
        if ("SeriesTimer" === item.Type || "Program" === item.Type) {
            editable = false;
        }

        elem.classList.add("detailimg-hidemobile");

        var imageTags = item.ImageTags || {};

        if (item.PrimaryImageTag) {
            imageTags.Primary = item.PrimaryImageTag;
        }

        var url;
        var html = "";
        var shape = "portrait";
        var detectRatio = false;

        /* In the following section, getScreenWidth() is multiplied by 0.5 as the posters
        are 25vw and we need double the resolution to counter Skia's scaling. */
        // TODO: Find a reliable way to get the poster width
        if (imageTags.Primary) {
            url = apiClient.getScaledImageUrl(item.Id, {
                type: "Primary",
                maxWidth: Math.round(dom.getScreenWidth() * 0.5),
                tag: item.ImageTags.Primary
            });
            detectRatio = true;
        } else if (item.BackdropImageTags && item.BackdropImageTags.length) {
            url = apiClient.getScaledImageUrl(item.Id, {
                type: "Backdrop",
                maxWidth: Math.round(dom.getScreenWidth() * 0.5),
                tag: item.BackdropImageTags[0]
            });
            shape = "thumb";
        } else if (imageTags.Thumb) {
            url = apiClient.getScaledImageUrl(item.Id, {
                type: "Thumb",
                maxWidth: Math.round(dom.getScreenWidth() * 0.5),
                tag: item.ImageTags.Thumb
            });
            shape = "thumb";
        } else if (imageTags.Disc) {
            url = apiClient.getScaledImageUrl(item.Id, {
                type: "Disc",
                maxWidth: Math.round(dom.getScreenWidth() * 0.5),
                tag: item.ImageTags.Disc
            });
            shape = "square";
        } else if (item.AlbumId && item.AlbumPrimaryImageTag) {
            url = apiClient.getScaledImageUrl(item.AlbumId, {
                type: "Primary",
                maxWidth: Math.round(dom.getScreenWidth() * 0.5),
                tag: item.AlbumPrimaryImageTag
            });
            shape = "square";
        } else if (item.SeriesId && item.SeriesPrimaryImageTag) {
            url = apiClient.getScaledImageUrl(item.SeriesId, {
                type: "Primary",
                maxWidth: Math.round(dom.getScreenWidth() * 0.5),
                tag: item.SeriesPrimaryImageTag
            });
        } else if (item.ParentPrimaryImageItemId && item.ParentPrimaryImageTag) {
            url = apiClient.getScaledImageUrl(item.ParentPrimaryImageItemId, {
                type: "Primary",
                maxWidth: Math.round(dom.getScreenWidth() * 0.5),
                tag: item.ParentPrimaryImageTag
            });
        }

        if (editable && url === undefined) {
            html += "<a class='itemDetailGalleryLink itemDetailImage defaultCardBackground defaultCardBackground"+ cardBuilder.getDefaultBackgroundClass(item.Name) + "' is='emby-linkbutton' style='display:block;margin:0;padding:0;' href='#'>";
        } else if (!editable && url === undefined) {
            html += "<div class='itemDetailGalleryLink itemDetailImage defaultCardBackground defaultCardBackground"+ cardBuilder.getDefaultBackgroundClass(item.Name) + "' is='emby-linkbutton' style='display:block;margin:0;padding:0;' href='#'>";
        } else if (editable) {
            html += "<a class='itemDetailGalleryLink' is='emby-linkbutton' style='display:block;margin:0;padding:0;' href='#'>";
        }

        if (url) {
            html += "<img class='itemDetailImage lazy' src='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=' />";
        }

        if (url === undefined) {
            html += cardBuilder.getDefaultText(item);
        }

        if (editable) {
            html += "</a>";
        } else if (!editable && url === undefined) {
            html += "</div>";
        }

        var progressHtml = item.IsFolder || !item.UserData ? "" : indicators.getProgressBarHtml(item);
        html += '<div class="detailImageProgressContainer">';

        if (progressHtml) {
            html += progressHtml;
        }

        html += "</div>";
        elem.innerHTML = html;

        if (detectRatio && item.PrimaryImageAspectRatio) {
            if (item.PrimaryImageAspectRatio >= 1.48) {
                shape = "thumb";
            } else if (item.PrimaryImageAspectRatio >= 0.85 && item.PrimaryImageAspectRatio <= 1.34) {
                shape = "square";
            }
        }

        if ("thumb" == shape) {
            elem.classList.add("thumbDetailImageContainer");
            elem.classList.remove("portraitDetailImageContainer");
            elem.classList.remove("squareDetailImageContainer");
        } else if ("square" == shape) {
            elem.classList.remove("thumbDetailImageContainer");
            elem.classList.remove("portraitDetailImageContainer");
            elem.classList.add("squareDetailImageContainer");
        } else {
            elem.classList.remove("thumbDetailImageContainer");
            elem.classList.add("portraitDetailImageContainer");
            elem.classList.remove("squareDetailImageContainer");
        }

        if (url) {
            imageLoader.lazyImage(elem.querySelector("img"), url);
        }
    }

    function renderImage(page, item, apiClient, user) {
        renderDetailImage(
            page,
            page.querySelector(".detailImageContainer"),
            item,
            apiClient,
            user.Policy.IsAdministrator && "Photo" != item.MediaType,
            imageLoader,
            indicators
        );
    }

    function refreshDetailImageUserData(elem, item) {
        elem.querySelector(".detailImageProgressContainer").innerHTML = indicators.getProgressBarHtml(item);
    }

    function refreshImage(page, item) {
        refreshDetailImageUserData(page.querySelector(".detailImageContainer"), item);
    }

    function setPeopleHeader(page, item) {
        if ("Audio" == item.MediaType || "MusicAlbum" == item.Type || "Book" == item.MediaType || "Photo" == item.MediaType) {
            page.querySelector("#peopleHeader").innerHTML = globalize.translate("HeaderPeople");
        } else {
            page.querySelector("#peopleHeader").innerHTML = globalize.translate("HeaderCastAndCrew");
        }
    }

    function renderNextUp(page, item, user) {
        var section = page.querySelector(".nextUpSection");

        if ("Series" != item.Type) {
            return void section.classList.add("hide");
        }

        connectionManager.getApiClient(item.ServerId).getNextUpEpisodes({
            SeriesId: item.Id,
            UserId: user.Id
        }).then(function (result) {
            if (result.Items.length) {
                section.classList.remove("hide");
            } else {
                section.classList.add("hide");
            }

            var html = cardBuilder.getCardsHtml({
                items: result.Items,
                shape: "overflowBackdrop",
                showTitle: true,
                displayAsSpecial: "Season" == item.Type && item.IndexNumber,
                overlayText: false,
                centerText: true,
                overlayPlayButton: true
            });
            var itemsContainer = section.querySelector(".nextUpItems");
            itemsContainer.innerHTML = html;
            imageLoader.lazyChildren(itemsContainer);
        });
    }

    function setInitialCollapsibleState(page, item, apiClient, context, user) {
        page.querySelector(".collectionItems").innerHTML = "";

        if ("Playlist" == item.Type) {
            page.querySelector("#childrenCollapsible").classList.remove("hide");
            renderPlaylistItems(page, item);
        } else if ("Studio" == item.Type || "Person" == item.Type || "Genre" == item.Type || "MusicGenre" == item.Type || "MusicArtist" == item.Type) {
            page.querySelector("#childrenCollapsible").classList.remove("hide");
            renderItemsByName(page, item);
        } else if (item.IsFolder) {
            if ("BoxSet" == item.Type) {
                page.querySelector("#childrenCollapsible").classList.add("hide");
            }

            renderChildren(page, item);
        } else {
            page.querySelector("#childrenCollapsible").classList.add("hide");
        }

        if ("Series" == item.Type) {
            renderSeriesSchedule(page, item);
            renderNextUp(page, item, user);
        } else {
            page.querySelector(".nextUpSection").classList.add("hide");
        }

        renderScenes(page, item);

        if (item.SpecialFeatureCount && 0 != item.SpecialFeatureCount && "Series" != item.Type) {
            page.querySelector("#specialsCollapsible").classList.remove("hide");
            renderSpecials(page, item, user, 6);
        } else {
            page.querySelector("#specialsCollapsible").classList.add("hide");
        }

        renderCast(page, item);

        if (item.PartCount && item.PartCount > 1) {
            page.querySelector("#additionalPartsCollapsible").classList.remove("hide");
            renderAdditionalParts(page, item, user);
        } else {
            page.querySelector("#additionalPartsCollapsible").classList.add("hide");
        }

        if ("MusicAlbum" == item.Type) {
            renderMusicVideos(page, item, user);
        } else {
            page.querySelector("#musicVideosCollapsible").classList.add("hide");
        }
    }

    function renderOverview(elems, item) {
        for (var i = 0, length = elems.length; i < length; i++) {
            var elem = elems[i];
            var overview = item.Overview || "";

            if (overview) {
                elem.innerHTML = overview;
                elem.classList.remove("hide");
                var anchors = elem.querySelectorAll("a");

                for (var j = 0, length2 = anchors.length; j < length2; j++) {
                    anchors[j].setAttribute("target", "_blank");
                }
            } else {
                elem.innerHTML = "";
                elem.classList.add("hide");
            }
        }
    }

    function renderGenres(page, item, context) {
        context = context || inferContext(item);
        var type;
        var genres = item.GenreItems || [];

        switch (context) {
            case "music":
                type = "MusicGenre";
                break;

            default:
                type = "Genre";
        }

        var html = genres.map(function (p) {
            return '<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + appRouter.getRouteUrl({
                Name: p.Name,
                Type: type,
                ServerId: item.ServerId,
                Id: p.Id
            }, {
                context: context
            }) + '">' + p.Name + "</a>";
        }).join(", ");
        var elem = page.querySelector(".genres");
        elem.innerHTML = globalize.translate(genres.length > 1 ? "GenresValue" : "GenreValue", html);

        if (genres.length) {
            elem.classList.remove("hide");
        } else {
            elem.classList.add("hide");
        }
    }

    function renderDirector(page, item, context) {
        var directors = (item.People || []).filter(function (p) {
            return "Director" === p.Type;
        });
        var html = directors.map(function (p) {
            return '<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + appRouter.getRouteUrl({
                Name: p.Name,
                Type: "Person",
                ServerId: item.ServerId,
                Id: p.Id
            }, {
                context: context
            }) + '">' + p.Name + "</a>";
        }).join(", ");
        var elem = page.querySelector(".directors");
        elem.innerHTML = globalize.translate(directors.length > 1 ? "DirectorsValue" : "DirectorValue", html);

        if (directors.length) {
            elem.classList.remove("hide");
        } else {
            elem.classList.add("hide");
        }
    }

    function renderDetails(page, item, apiClient, context, isStatic) {
        renderSimilarItems(page, item, context);
        renderMoreFromSeason(page, item, apiClient);
        renderMoreFromArtist(page, item, apiClient);
        renderDirector(page, item, context);
        renderGenres(page, item, context);
        renderChannelGuide(page, apiClient, item);
        var taglineElement = page.querySelector(".tagline");

        if (item.Taglines && item.Taglines.length) {
            taglineElement.classList.remove("hide");
            taglineElement.innerHTML = item.Taglines[0];
        } else {
            taglineElement.classList.add("hide");
        }

        var overview = page.querySelector(".overview");
        var externalLinksElem = page.querySelector(".itemExternalLinks");

        renderOverview([overview], item);
        var i;
        var itemMiscInfo;
        itemMiscInfo = page.querySelectorAll(".itemMiscInfo-primary");

        for (i = 0; i < itemMiscInfo.length; i++) {
            mediaInfo.fillPrimaryMediaInfo(itemMiscInfo[i], item, {
                interactive: true,
                episodeTitle: false,
                subtitles: false
            });

            if (itemMiscInfo[i].innerHTML && "SeriesTimer" !== item.Type) {
                itemMiscInfo[i].classList.remove("hide");
            } else {
                itemMiscInfo[i].classList.add("hide");
            }
        }

        itemMiscInfo = page.querySelectorAll(".itemMiscInfo-secondary");

        for (i = 0; i < itemMiscInfo.length; i++) {
            mediaInfo.fillSecondaryMediaInfo(itemMiscInfo[i], item, {
                interactive: true
            });

            if (itemMiscInfo[i].innerHTML && "SeriesTimer" !== item.Type) {
                itemMiscInfo[i].classList.remove("hide");
            } else {
                itemMiscInfo[i].classList.add("hide");
            }
        }

        reloadUserDataButtons(page, item);
        renderLinks(externalLinksElem, item);
        renderUserInfo(page, item);
        renderTags(page, item);
        renderSeriesAirTime(page, item, isStatic);
    }

    function enableScrollX() {
        return browser.mobile && screen.availWidth <= 1000;
    }

    function getPortraitShape(scrollX) {
        if (null == scrollX) {
            scrollX = enableScrollX();
        }

        return scrollX ? "overflowPortrait" : "portrait";
    }

    function getSquareShape(scrollX) {
        if (null == scrollX) {
            scrollX = enableScrollX();
        }

        return scrollX ? "overflowSquare" : "square";
    }

    function renderMoreFromSeason(view, item, apiClient) {
        var section = view.querySelector(".moreFromSeasonSection");

        if (section) {
            if ("Episode" !== item.Type || !item.SeasonId || !item.SeriesId) {
                return void section.classList.add("hide");
            }

            var userId = apiClient.getCurrentUserId();
            apiClient.getEpisodes(item.SeriesId, {
                SeasonId: item.SeasonId,
                UserId: userId,
                Fields: "ItemCounts,PrimaryImageAspectRatio,BasicSyncInfo,CanDelete,MediaSourceCount"
            }).then(function (result) {
                if (result.Items.length < 2) {
                    return void section.classList.add("hide");
                }

                section.classList.remove("hide");
                section.querySelector("h2").innerHTML = globalize.translate("MoreFromValue", item.SeasonName);
                var itemsContainer = section.querySelector(".itemsContainer");
                cardBuilder.buildCards(result.Items, {
                    parentContainer: section,
                    itemsContainer: itemsContainer,
                    shape: "autooverflow",
                    sectionTitleTagName: "h2",
                    scalable: true,
                    showTitle: true,
                    overlayText: false,
                    centerText: true,
                    includeParentInfoInTitle: false,
                    allowBottomPadding: false
                });
                var card = itemsContainer.querySelector('.card[data-id="' + item.Id + '"]');

                if (card) {
                    setTimeout(function () {
                        section.querySelector(".emby-scroller").toStart(card.previousSibling || card, true);
                    }, 100);
                }
            });
        }
    }

    function renderMoreFromArtist(view, item, apiClient) {
        var section = view.querySelector(".moreFromArtistSection");

        if (section) {
            if ("MusicArtist" === item.Type) {
                if (!apiClient.isMinServerVersion("3.4.1.19")) {
                    return void section.classList.add("hide");
                }
            } else if ("MusicAlbum" !== item.Type || !item.AlbumArtists || !item.AlbumArtists.length) {
                return void section.classList.add("hide");
            }

            var query = {
                IncludeItemTypes: "MusicAlbum",
                Recursive: true,
                ExcludeItemIds: item.Id,
                SortBy: "ProductionYear,SortName",
                SortOrder: "Descending"
            };

            if ("MusicArtist" === item.Type) {
                query.ContributingArtistIds = item.Id;
            } else if (apiClient.isMinServerVersion("3.4.1.18")) {
                query.AlbumArtistIds = item.AlbumArtists[0].Id;
            } else {
                query.ArtistIds = item.AlbumArtists[0].Id;
            }

            apiClient.getItems(apiClient.getCurrentUserId(), query).then(function (result) {
                if (!result.Items.length) {
                    return void section.classList.add("hide");
                }

                section.classList.remove("hide");

                if ("MusicArtist" === item.Type) {
                    section.querySelector("h2").innerHTML = globalize.translate("HeaderAppearsOn");
                } else {
                    section.querySelector("h2").innerHTML = globalize.translate("MoreFromValue", item.AlbumArtists[0].Name);
                }

                cardBuilder.buildCards(result.Items, {
                    parentContainer: section,
                    itemsContainer: section.querySelector(".itemsContainer"),
                    shape: "autooverflow",
                    sectionTitleTagName: "h2",
                    scalable: true,
                    coverImage: "MusicArtist" === item.Type || "MusicAlbum" === item.Type,
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
        var similarCollapsible = page.querySelector("#similarCollapsible");

        if (similarCollapsible) {
            if ("Movie" != item.Type && "Trailer" != item.Type && "Series" != item.Type && "Program" != item.Type && "Recording" != item.Type && "MusicAlbum" != item.Type && "MusicArtist" != item.Type && "Playlist" != item.Type) {
                return void similarCollapsible.classList.add("hide");
            }

            similarCollapsible.classList.remove("hide");
            var apiClient = connectionManager.getApiClient(item.ServerId);
            var options = {
                userId: apiClient.getCurrentUserId(),
                limit: 12,
                fields: "PrimaryImageAspectRatio,UserData,CanDelete"
            };

            if ("MusicAlbum" == item.Type && item.AlbumArtists && item.AlbumArtists.length) {
                options.ExcludeArtistIds = item.AlbumArtists[0].Id;
            }

            apiClient.getSimilarItems(item.Id, options).then(function (result) {
                if (!result.Items.length) {
                    return void similarCollapsible.classList.add("hide");
                }

                similarCollapsible.classList.remove("hide");
                var html = "";
                html += cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: "autooverflow",
                    showParentTitle: "MusicAlbum" == item.Type,
                    centerText: true,
                    showTitle: true,
                    context: context,
                    lazy: true,
                    showDetailsMenu: true,
                    coverImage: "MusicAlbum" == item.Type || "MusicArtist" == item.Type,
                    overlayPlayButton: true,
                    overlayText: false,
                    showYear: "Movie" === item.Type || "Trailer" === item.Type || "Series" === item.Type
                });
                var similarContent = similarCollapsible.querySelector(".similarContent");
                similarContent.innerHTML = html;
                imageLoader.lazyChildren(similarContent);
            });
        }
    }

    function renderSeriesAirTime(page, item, isStatic) {
        var seriesAirTime = page.querySelector("#seriesAirTime");
        if ("Series" != item.Type) {
            seriesAirTime.classList.add("hide");
            return;
        }
        var html = "";
        if (item.AirDays && item.AirDays.length) {
            if (7 == item.AirDays.length) {
                html += "daily";
            } else {
                html += item.AirDays.map(function (a) {
                    return a + "s";
                }).join(",");
            }
        }
        if (item.AirTime) {
            html += " at " + item.AirTime;
        }
        if (item.Studios.length) {
            if (isStatic) {
                html += " on " + item.Studios[0].Name;
            } else {
                var context = inferContext(item);
                var href = appRouter.getRouteUrl(item.Studios[0], {
                    context: context,
                    itemType: "Studio",
                    serverId: item.ServerId
                });
                html += ' on <a class="textlink button-link" is="emby-linkbutton" href="' + href + '">' + item.Studios[0].Name + "</a>";
            }
        }
        if (html) {
            html = ("Ended" == item.Status ? "Aired " : "Airs ") + html;
            seriesAirTime.innerHTML = html;
            seriesAirTime.classList.remove("hide");
        } else {
            seriesAirTime.classList.add("hide");
        }
    }

    function renderTags(page, item) {
        var itemTags = page.querySelector(".itemTags");
        var tagElements = [];
        var tags = item.Tags || [];

        if ("Program" === item.Type) {
            tags = [];
        }

        for (var i = 0, length = tags.length; i < length; i++) {
            tagElements.push(tags[i]);
        }

        if (tagElements.length) {
            itemTags.innerHTML = globalize.translate("TagsValue", tagElements.join(", "));
            itemTags.classList.remove("hide");
        } else {
            itemTags.innerHTML = "";
            itemTags.classList.add("hide");
        }
    }

    function renderChildren(page, item) {
        var fields = "ItemCounts,PrimaryImageAspectRatio,BasicSyncInfo,CanDelete,MediaSourceCount";
        var query = {
            ParentId: item.Id,
            Fields: fields
        };

        if ("BoxSet" !== item.Type) {
            query.SortBy = "SortName";
        }

        var promise;
        var apiClient = connectionManager.getApiClient(item.ServerId);
        var userId = apiClient.getCurrentUserId();

        if ("Series" == item.Type) {
            promise = apiClient.getSeasons(item.Id, {
                userId: userId,
                Fields: fields
            });
        } else if ("Season" == item.Type) {
            fields += ",Overview";
            promise = apiClient.getEpisodes(item.SeriesId, {
                seasonId: item.Id,
                userId: userId,
                Fields: fields
            });
        } else if ("MusicArtist" == item.Type) {
            query.SortBy = "ProductionYear,SortName";
        }

        promise = promise || apiClient.getItems(apiClient.getCurrentUserId(), query);
        promise.then(function (result) {
            var html = "";
            var scrollX = false;
            var isList = false;
            var childrenItemsContainer = page.querySelector(".childrenItemsContainer");

            if ("MusicAlbum" == item.Type) {
                html = listView.getListViewHtml({
                    items: result.Items,
                    smallIcon: true,
                    showIndex: true,
                    index: "disc",
                    showIndexNumberLeft: true,
                    playFromHere: true,
                    action: "playallfromhere",
                    image: false,
                    artist: "auto",
                    containerAlbumArtists: item.AlbumArtists,
                    addToListButton: true
                });
                isList = true;
            } else if ("Series" == item.Type) {
                scrollX = enableScrollX();
                html = cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: "overflowPortrait",
                    showTitle: true,
                    centerText: true,
                    lazy: true,
                    overlayPlayButton: true,
                    allowBottomPadding: !scrollX
                });
            } else if ("Season" == item.Type || "Episode" == item.Type) {
                if ("Episode" !== item.Type) {
                    isList = true;
                }
                scrollX = "Episode" == item.Type;
                if (result.Items.length < 2 && "Episode" === item.Type) {
                    return;
                }

                if ("Episode" === item.Type) {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: "overflowBackdrop",
                        showTitle: true,
                        displayAsSpecial: "Season" == item.Type && item.IndexNumber,
                        playFromHere: true,
                        overlayText: true,
                        lazy: true,
                        showDetailsMenu: true,
                        overlayPlayButton: true,
                        allowBottomPadding: !scrollX,
                        includeParentInfoInTitle: false
                    });
                } else if ("Season" === item.Type) {
                    html = listView.getListViewHtml({
                        items: result.Items,
                        showIndexNumber: false,
                        enableOverview: true,
                        imageSize: "large",
                        enableSideMediaInfo: false,
                        highlight: false,
                        action: layoutManager.tv ? "resume" : "none",
                        infoButton: true,
                        imagePlayButton: true,
                        includeParentInfoInTitle: false
                    });
                }
            }

            if ("BoxSet" !== item.Type) {
                page.querySelector("#childrenCollapsible").classList.remove("hide");
            }
            if (scrollX) {
                childrenItemsContainer.classList.add("scrollX");
                childrenItemsContainer.classList.add("hiddenScrollX");
                childrenItemsContainer.classList.remove("vertical-wrap");
                childrenItemsContainer.classList.remove("vertical-list");
            } else {
                childrenItemsContainer.classList.remove("scrollX");
                childrenItemsContainer.classList.remove("hiddenScrollX");
                childrenItemsContainer.classList.remove("smoothScrollX");
                if (isList) {
                    childrenItemsContainer.classList.add("vertical-list");
                    childrenItemsContainer.classList.remove("vertical-wrap");
                } else {
                    childrenItemsContainer.classList.add("vertical-wrap");
                    childrenItemsContainer.classList.remove("vertical-list");
                }
            }
            childrenItemsContainer.innerHTML = html;
            imageLoader.lazyChildren(childrenItemsContainer);
            if ("BoxSet" == item.Type) {
                var collectionItemTypes = [{
                    name: globalize.translate("HeaderVideos"),
                    mediaType: "Video"
                }, {
                    name: globalize.translate("HeaderSeries"),
                    type: "Series"
                }, {
                    name: globalize.translate("HeaderAlbums"),
                    type: "MusicAlbum"
                }, {
                    name: globalize.translate("HeaderBooks"),
                    type: "Book"
                }];
                renderCollectionItems(page, item, collectionItemTypes, result.Items);
            }
        });

        if ("Season" == item.Type) {
            page.querySelector("#childrenTitle").innerHTML = globalize.translate("HeaderEpisodes");
        } else if ("Series" == item.Type) {
            page.querySelector("#childrenTitle").innerHTML = globalize.translate("HeaderSeasons");
        } else if ("MusicAlbum" == item.Type) {
            page.querySelector("#childrenTitle").innerHTML = globalize.translate("HeaderTracks");
        } else {
            page.querySelector("#childrenTitle").innerHTML = globalize.translate("HeaderItems");
        }

        if ("MusicAlbum" == item.Type || "Season" == item.Type) {
            page.querySelector(".childrenSectionHeader").classList.add("hide");
            page.querySelector("#childrenCollapsible").classList.add("verticalSection-extrabottompadding");
        } else {
            page.querySelector(".childrenSectionHeader").classList.remove("hide");
        }
    }

    function renderItemsByName(page, item) {
        require("scripts/itembynamedetailpage".split(","), function () {
            window.ItemsByName.renderItems(page, item);
        });
    }

    function renderPlaylistItems(page, item) {
        require("scripts/playlistedit".split(","), function () {
            PlaylistViewer.render(page, item);
        });
    }

    function renderProgramsForChannel(page, result) {
        var html = "";
        var currentItems = [];
        var currentStartDate = null;

        for (var i = 0, length = result.Items.length; i < length; i++) {
            var item = result.Items[i];
            var itemStartDate = datetime.parseISO8601Date(item.StartDate);

            if (!(currentStartDate && currentStartDate.toDateString() === itemStartDate.toDateString())) {
                if (currentItems.length) {
                    html += '<div class="verticalSection verticalDetailSection">';
                    html += '<h2 class="sectionTitle padded-left">' + datetime.toLocaleDateString(currentStartDate, {
                        weekday: "long",
                        month: "long",
                        day: "numeric"
                    }) + "</h2>";
                    html += '<div is="emby-itemscontainer" class="vertical-list padded-left padded-right">' + listView.getListViewHtml({
                        items: currentItems,
                        enableUserDataButtons: false,
                        showParentTitle: true,
                        image: false,
                        showProgramTime: true,
                        mediaInfo: false,
                        parentTitleWithTitle: true
                    }) + "</div></div>";
                }

                currentStartDate = itemStartDate;
                currentItems = [];
            }

            currentItems.push(item);
        }

        if (currentItems.length) {
            html += '<div class="verticalSection verticalDetailSection">';
            html += '<h2 class="sectionTitle padded-left">' + datetime.toLocaleDateString(currentStartDate, {
                weekday: "long",
                month: "long",
                day: "numeric"
            }) + "</h2>";
            html += '<div is="emby-itemscontainer" class="vertical-list padded-left padded-right">' + listView.getListViewHtml({
                items: currentItems,
                enableUserDataButtons: false,
                showParentTitle: true,
                image: false,
                showProgramTime: true,
                mediaInfo: false,
                parentTitleWithTitle: true
            }) + "</div></div>";
        }

        page.querySelector(".programGuide").innerHTML = html;
    }

    function renderChannelGuide(page, apiClient, item) {
        if ("TvChannel" === item.Type) {
            page.querySelector(".programGuideSection").classList.remove("hide");
            apiClient.getLiveTvPrograms({
                ChannelIds: item.Id,
                UserId: apiClient.getCurrentUserId(),
                HasAired: false,
                SortBy: "StartDate",
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
        var apiClient = connectionManager.getApiClient(item.ServerId);
        apiClient.getLiveTvPrograms({
            UserId: apiClient.getCurrentUserId(),
            HasAired: false,
            SortBy: "StartDate",
            EnableTotalRecordCount: false,
            EnableImages: false,
            ImageTypeLimit: 0,
            Limit: 50,
            EnableUserData: false,
            LibrarySeriesId: item.Id
        }).then(function (result) {
            if (result.Items.length) {
                page.querySelector("#seriesScheduleSection").classList.remove("hide");
            } else {
                page.querySelector("#seriesScheduleSection").classList.add("hide");
            }

            page.querySelector("#seriesScheduleList").innerHTML = listView.getListViewHtml({
                items: result.Items,
                enableUserDataButtons: false,
                showParentTitle: false,
                image: false,
                showProgramDateTime: true,
                mediaInfo: false,
                showTitle: true,
                moreButton: false,
                action: "programdialog"
            });
            loading.hide();
        });
    }

    function inferContext(item) {
        if ("Movie" === item.Type || "BoxSet" === item.Type) {
            return "movies";
        }

        if ("Series" === item.Type || "Season" === item.Type || "Episode" === item.Type) {
            return "tvshows";
        }

        if ("MusicArtist" === item.Type || "MusicAlbum" === item.Type || "Audio" === item.Type || "AudioBook" === item.Type) {
            return "music";
        }

        if ("Program" === item.Type) {
            return "livetv";
        }

        return null;
    }

    function filterItemsByCollectionItemType(items, typeInfo) {
        return items.filter(function (item) {
            if (typeInfo.mediaType) {
                return item.MediaType == typeInfo.mediaType;
            }

            return item.Type == typeInfo.type;
        });
    }

    function canPlaySomeItemInCollection(items) {
        var i = 0;

        for (var length = items.length; i < length; i++) {
            if (playbackManager.canPlay(items[i])) {
                return true;
            }
        }

        return false;
    }

    function renderCollectionItems(page, parentItem, types, items) {
        page.querySelector(".collectionItems").innerHTML = "";
        var i;
        var length;

        for (i = 0, length = types.length; i < length; i++) {
            var type = types[i];
            var typeItems = filterItemsByCollectionItemType(items, type);

            if (typeItems.length) {
                renderCollectionItemType(page, parentItem, type, typeItems);
            }
        }

        var otherType = {
            name: globalize.translate("HeaderOtherItems")
        };
        var otherTypeItems = items.filter(function (curr) {
            return !types.filter(function (t) {
                return filterItemsByCollectionItemType([curr], t).length > 0;
            }).length;
        });

        if (otherTypeItems.length) {
            renderCollectionItemType(page, parentItem, otherType, otherTypeItems);
        }

        if (!items.length) {
            renderCollectionItemType(page, parentItem, {
                name: globalize.translate("HeaderItems")
            }, items);
        }

        var containers = page.querySelectorAll(".collectionItemsContainer");

        var notifyRefreshNeeded = function () {
            renderChildren(page, parentItem);
        };

        for (i = 0, length = containers.length; i < length; i++) {
            containers[i].notifyRefreshNeeded = notifyRefreshNeeded;
        }

        // if nothing in the collection can be played hide play and shuffle buttons
        if (!canPlaySomeItemInCollection(items)) {
            hideAll(page, "btnPlay", false);
            hideAll(page, "btnShuffle", false);
        }

        // HACK: Call autoFocuser again because btnPlay may be hidden, but focused by reloadFromItem
        // FIXME: Sometimes focus does not move until all (?) sections are loaded
        require(["autoFocuser"], function (autoFocuser) {
            autoFocuser.autoFocus(page);
        });
    }

    function renderCollectionItemType(page, parentItem, type, items) {
        var html = "";
        html += '<div class="verticalSection">';
        html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
        html += '<h2 class="sectionTitle sectionTitle-cards">';
        html += "<span>" + type.name + "</span>";
        html += "</h2>";
        html += '<button class="btnAddToCollection sectionTitleButton" type="button" is="paper-icon-button-light" style="margin-left:1em;"><i class="material-icons" icon="add">add</i></button>';
        html += "</div>";
        html += '<div is="emby-itemscontainer" class="itemsContainer collectionItemsContainer vertical-wrap padded-left padded-right">';
        var shape = "MusicAlbum" == type.type ? getSquareShape(false) : getPortraitShape(false);
        html += cardBuilder.getCardsHtml({
            items: items,
            shape: shape,
            showTitle: true,
            showYear: "Video" === type.mediaType || "Series" === type.type,
            centerText: true,
            lazy: true,
            showDetailsMenu: true,
            overlayMoreButton: true,
            showAddToCollection: false,
            showRemoveFromCollection: true,
            collectionId: parentItem.Id
        });
        html += "</div>";
        html += "</div>";
        var collectionItems = page.querySelector(".collectionItems");
        collectionItems.insertAdjacentHTML("beforeend", html);
        imageLoader.lazyChildren(collectionItems);
        collectionItems.querySelector(".btnAddToCollection").addEventListener("click", function () {
            require(["alert"], function (alert) {
                alert({
                    text: globalize.translate("AddItemToCollectionHelp"),
                    html: globalize.translate("AddItemToCollectionHelp") + '<br/><br/><a is="emby-linkbutton" class="button-link" target="_blank" href="https://web.archive.org/web/20181216120305/https://github.com/MediaBrowser/Wiki/wiki/Collections">' + globalize.translate("ButtonLearnMore") + "</a>"
                });
            });
        });
    }

    function renderMusicVideos(page, item, user) {
        connectionManager.getApiClient(item.ServerId).getItems(user.Id, {
            SortBy: "SortName",
            SortOrder: "Ascending",
            IncludeItemTypes: "MusicVideo",
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo,CanDelete,MediaSourceCount",
            AlbumIds: item.Id
        }).then(function (result) {
            if (result.Items.length) {
                page.querySelector("#musicVideosCollapsible").classList.remove("hide");
                var musicVideosContent = page.querySelector(".musicVideosContent");
                musicVideosContent.innerHTML = getVideosHtml(result.Items, user);
                imageLoader.lazyChildren(musicVideosContent);
            } else {
                page.querySelector("#musicVideosCollapsible").classList.add("hide");
            }
        });
    }

    function renderAdditionalParts(page, item, user) {
        connectionManager.getApiClient(item.ServerId).getAdditionalVideoParts(user.Id, item.Id).then(function (result) {
            if (result.Items.length) {
                page.querySelector("#additionalPartsCollapsible").classList.remove("hide");
                var additionalPartsContent = page.querySelector("#additionalPartsContent");
                additionalPartsContent.innerHTML = getVideosHtml(result.Items, user);
                imageLoader.lazyChildren(additionalPartsContent);
            } else {
                page.querySelector("#additionalPartsCollapsible").classList.add("hide");
            }
        });
    }

    function renderScenes(page, item) {
        var chapters = item.Chapters || [];

        if (chapters.length && !chapters[0].ImageTag && (chapters = []), chapters.length) {
            page.querySelector("#scenesCollapsible").classList.remove("hide");
            var scenesContent = page.querySelector("#scenesContent");

            require(["chaptercardbuilder"], function (chaptercardbuilder) {
                chaptercardbuilder.buildChapterCards(item, chapters, {
                    itemsContainer: scenesContent,
                    backdropShape: "overflowBackdrop",
                    squareShape: "overflowSquare"
                });
            });
        } else {
            page.querySelector("#scenesCollapsible").classList.add("hide");
        }
    }

    function getVideosHtml(items, user, limit, moreButtonClass) {
        var html = cardBuilder.getCardsHtml({
            items: items,
            shape: "auto",
            showTitle: true,
            action: "play",
            overlayText: false,
            centerText: true,
            showRuntime: true
        });

        if (limit && items.length > limit) {
            html += '<p style="margin: 0;padding-left:5px;"><button is="emby-button" type="button" class="raised more ' + moreButtonClass + '">' + globalize.translate("ButtonMore") + "</button></p>";
        }

        return html;
    }

    function renderSpecials(page, item, user, limit) {
        connectionManager.getApiClient(item.ServerId).getSpecialFeatures(user.Id, item.Id).then(function (specials) {
            var specialsContent = page.querySelector("#specialsContent");
            specialsContent.innerHTML = getVideosHtml(specials, user, limit, "moreSpecials");
            imageLoader.lazyChildren(specialsContent);
        });
    }

    function renderCast(page, item) {
        var people = (item.People || []).filter(function (p) {
            return "Director" !== p.Type;
        });

        if (!people.length) {
            return void page.querySelector("#castCollapsible").classList.add("hide");
        }

        page.querySelector("#castCollapsible").classList.remove("hide");
        var castContent = page.querySelector("#castContent");

        require(["peoplecardbuilder"], function (peoplecardbuilder) {
            peoplecardbuilder.buildPeopleCards(people, {
                itemsContainer: castContent,
                coverImage: true,
                serverId: item.ServerId,
                shape: "overflowPortrait"
            });
        });
    }

    function itemDetailPage() {
        var self = this;
        self.setInitialCollapsibleState = setInitialCollapsibleState;
        self.renderDetails = renderDetails;
        self.renderCast = renderCast;
    }

    function bindAll(view, selector, eventName, fn) {
        var i;
        var length;
        var elems = view.querySelectorAll(selector);

        for (i = 0, length = elems.length; i < length; i++) {
            elems[i].addEventListener(eventName, fn);
        }
    }

    function onTrackSelectionsSubmit(e) {
        e.preventDefault();
        return false;
    }

    window.ItemDetailPage = new itemDetailPage();
    return function (view, params) {
        function reload(instance, page, params) {
            loading.show();
            var apiClient = params.serverId ? connectionManager.getApiClient(params.serverId) : ApiClient;
            var promises = [getPromise(apiClient, params), apiClient.getCurrentUser()];
            Promise.all(promises).then(function (responses) {
                var item = responses[0];
                var user = responses[1];
                currentItem = item;
                reloadFromItem(instance, page, params, item, user);
            });
        }

        function splitVersions(instance, page, apiClient, params) {
            require(["confirm"], function (confirm) {
                confirm("Are you sure you wish to split the media sources into separate items?", "Split Media Apart").then(function () {
                    loading.show();
                    apiClient.ajax({
                        type: "DELETE",
                        url: apiClient.getUrl("Videos/" + params.id + "/AlternateSources")
                    }).then(function () {
                        loading.hide();
                        reload(instance, page, params);
                    });
                });
            });
        }

        function getPlayOptions(startPosition) {
            var audioStreamIndex = view.querySelector(".selectAudio").value || null;
            return {
                startPositionTicks: startPosition,
                mediaSourceId: view.querySelector(".selectSource").value,
                audioStreamIndex: audioStreamIndex,
                subtitleStreamIndex: view.querySelector(".selectSubtitles").value
            };
        }

        function playItem(item, startPosition) {
            var playOptions = getPlayOptions(startPosition);
            playOptions.items = [item];
            playbackManager.play(playOptions);
        }

        function playTrailer() {
            playbackManager.playTrailers(currentItem);
        }

        function playCurrentItem(button, mode) {
            var item = currentItem;

            if ("Program" === item.Type) {
                var apiClient = connectionManager.getApiClient(item.ServerId);
                return void apiClient.getLiveTvChannel(item.ChannelId, apiClient.getCurrentUserId()).then(function (channel) {
                    playbackManager.play({
                        items: [channel]
                    });
                });
            }

            playItem(item, item.UserData && "resume" === mode ? item.UserData.PlaybackPositionTicks : 0);
        }

        function onPlayClick() {
            playCurrentItem(this, this.getAttribute("data-mode"));
        }

        function onInstantMixClick() {
            playbackManager.instantMix(currentItem);
        }

        function onShuffleClick() {
            playbackManager.shuffle(currentItem);
        }

        function onDeleteClick() {
            require(["deleteHelper"], function (deleteHelper) {
                deleteHelper.deleteItem({
                    item: currentItem,
                    navigate: true
                });
            });
        }

        function onCancelSeriesTimerClick() {
            require(["recordingHelper"], function (recordingHelper) {
                recordingHelper.cancelSeriesTimerWithConfirmation(currentItem.Id, currentItem.ServerId).then(function () {
                    Dashboard.navigate("livetv.html");
                });
            });
        }

        function onCancelTimerClick() {
            require(["recordingHelper"], function (recordingHelper) {
                recordingHelper.cancelTimer(connectionManager.getApiClient(currentItem.ServerId), currentItem.TimerId).then(function () {
                    reload(self, view, params);
                });
            });
        }

        function onPlayTrailerClick() {
            playTrailer();
        }

        function onDownloadClick() {
            require(['fileDownloader'], function (fileDownloader) {
                var downloadHref = apiClient.getItemDownloadUrl(currentItem.Id);
                fileDownloader.download([{
                    url: downloadHref,
                    itemId: currentItem.Id,
                    serverId: currentItem.serverId
                }]);
            });
        }

        function onMoreCommandsClick() {
            var button = this;
            apiClient.getCurrentUser().then(function (user) {
                itemContextMenu.show(getContextMenuOptions(currentItem, user, button)).then(function (result) {
                    if (result.deleted) {
                        appRouter.goHome();
                    } else if (result.updated) {
                        reload(self, view, params);
                    }
                });
            });
        }

        function onPlayerChange() {
            renderTrackSelections(view, self, currentItem);
            setTrailerButtonVisibility(view, currentItem);
        }

        function editImages() {
            return new Promise(function (resolve, reject) {
                require(["imageEditor"], function (imageEditor) {
                    imageEditor.show({
                        itemId: currentItem.Id,
                        serverId: currentItem.ServerId
                    }).then(resolve, reject);
                });
            });
        }

        function onWebSocketMessage(e, data) {
            var msg = data;

            if ("UserDataChanged" === msg.MessageType && currentItem && msg.Data.UserId == apiClient.getCurrentUserId()) {
                var key = currentItem.UserData.Key;
                var userData = msg.Data.UserDataList.filter(function (u) {
                    return u.Key == key;
                })[0];

                if (userData) {
                    currentItem.UserData = userData;
                    reloadPlayButtons(view, currentItem);
                    refreshImage(view, currentItem);
                }
            }
        }

        var currentItem;
        var self = this;
        var apiClient = params.serverId ? connectionManager.getApiClient(params.serverId) : ApiClient;
        view.querySelectorAll(".btnPlay");
        bindAll(view, ".btnPlay", "click", onPlayClick);
        bindAll(view, ".btnResume", "click", onPlayClick);
        bindAll(view, ".btnInstantMix", "click", onInstantMixClick);
        bindAll(view, ".btnShuffle", "click", onShuffleClick);
        bindAll(view, ".btnPlayTrailer", "click", onPlayTrailerClick);
        bindAll(view, ".btnCancelSeriesTimer", "click", onCancelSeriesTimerClick);
        bindAll(view, ".btnCancelTimer", "click", onCancelTimerClick);
        bindAll(view, ".btnDeleteItem", "click", onDeleteClick);
        bindAll(view, ".btnDownload", "click", onDownloadClick);
        view.querySelector(".btnMoreCommands i").innerHTML = "&#xE5D3;";
        view.querySelector(".trackSelections").addEventListener("submit", onTrackSelectionsSubmit);
        view.querySelector(".btnSplitVersions").addEventListener("click", function () {
            splitVersions(self, view, apiClient, params);
        });
        bindAll(view, ".btnMoreCommands", "click", onMoreCommandsClick);
        view.querySelector(".selectSource").addEventListener("change", function () {
            renderVideoSelections(view, self._currentPlaybackMediaSources);
            renderAudioSelections(view, self._currentPlaybackMediaSources);
            renderSubtitleSelections(view, self._currentPlaybackMediaSources);
        });
        view.addEventListener("click", function (e) {
            if (dom.parentWithClass(e.target, "moreScenes")) {
                renderScenes(view, currentItem);
            } else if (dom.parentWithClass(e.target, "morePeople")) {
                renderCast(view, currentItem);
            } else if (dom.parentWithClass(e.target, "moreSpecials")) {
                apiClient.getCurrentUser().then(function (user) {
                    renderSpecials(view, currentItem, user);
                });
            }
        });
        view.querySelector(".detailImageContainer").addEventListener("click", function (e) {
            if (dom.parentWithClass(e.target, "itemDetailGalleryLink")) {
                editImages().then(function () {
                    reload(self, view, params);
                });
            }
        });
        view.addEventListener("viewshow", function (e) {
            var page = this;

            if (layoutManager.mobile) {
                libraryMenu.setTransparentMenu(true);
            }

            if (e.detail.isRestored) {
                if (currentItem) {
                    setTitle(currentItem, connectionManager.getApiClient(currentItem.ServerId));
                    renderTrackSelections(page, self, currentItem, true);
                }
            } else {
                reload(self, page, params);
            }

            events.on(apiClient, "message", onWebSocketMessage);
            events.on(playbackManager, "playerchange", onPlayerChange);
        });
        view.addEventListener("viewbeforehide", function () {
            events.off(apiClient, "message", onWebSocketMessage);
            events.off(playbackManager, "playerchange", onPlayerChange);
            libraryMenu.setTransparentMenu(false);
        });
        view.addEventListener("viewdestroy", function () {
            currentItem = null;
            self._currentPlaybackMediaSources = null;
            self.currentRecordingFields = null;
        });
    };
});
