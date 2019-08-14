define(["loading", "appRouter", "layoutManager", "connectionManager", "cardBuilder", "datetime", "mediaInfo", "backdrop", "listView", "itemContextMenu", "itemHelper", "dom", "indicators", "apphost", "imageLoader", "libraryMenu", "globalize", "browser", "events", "scrollHelper", "playbackManager", "libraryBrowser", "scrollStyles", "emby-itemscontainer", "emby-checkbox", "emby-button", "emby-playstatebutton", "emby-ratingbutton", "emby-scroller", "emby-select"], function (loading, appRouter, layoutManager, connectionManager, cardBuilder, datetime, mediaInfo, backdrop, listView, itemContextMenu, itemHelper, dom, indicators, appHost, imageLoader, libraryMenu, globalize, browser, events, scrollHelper, playbackManager, libraryBrowser) {
    "use strict";

    function getPromise(apiClient, params) {
        var id = params.id;
        if (id) {
            return apiClient.getItem(apiClient.getCurrentUserId(), id);
        }
        if (params.seriesTimerId) {
            return apiClient.getLiveTvSeriesTimer(params.seriesTimerId);
        }
        var name = params.genre;
        if (name) {
            return apiClient.getGenre(name, apiClient.getCurrentUserId());
        }
        name = params.musicgenre;
        if (name) {
            return apiClient.getMusicGenre(name, apiClient.getCurrentUserId());
        }
        name = params.musicartist;
        if (name) {
            return apiClient.getArtist(name, apiClient.getCurrentUserId());
        } else {
            throw new Error("Invalid request");
        }
    }

    function hideAll(page, className, show) {
        var i, length;
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
            deleteItem: item.IsFolder === true,
            shuffle: false,
            instantMix: false,
            user: user,
            share: true
        };
        return options;
    }

    function getProgramScheduleHtml(items, options) {
        options = options || {};
        var html = "";
        html += '<div is="emby-itemscontainer" class="itemsContainer vertical-list" data-contextmenu="false">';
        html += listView.getListViewHtml({
            items: items,
            enableUserDataButtons: false,
            image: false,
            imageSource: "channel",
            showProgramDateTime: true,
            showChannel: true,
            mediaInfo: false,
            action: "none",
            moreButton: false,
            recordButton: false
        });
        html += "</div>";
        return html;
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
        if ("Recording" !== item.Type || !user.Policy.EnableLiveTvManagement || !item.TimerId || "InProgress" !== item.Status) return void hideAll(page, "btnCancelTimer");
        hideAll(page, "btnCancelTimer", true)
    }

    function renderSeriesTimerEditor(page, item, apiClient, user) {
        if (item.Type !== "SeriesTimer") {
            return;
        }
        if (!user.Policy.EnableLiveTvManagement) {
            page.querySelector(".seriesTimerScheduleSection").classList.add("hide");
            hideAll(page, "btnCancelSeriesTimer");
            return;
        }
        require(["seriesRecordingEditor"], function (seriesRecordingEditor) {
            seriesRecordingEditor.embed(item, apiClient.serverId(), {
                context: page.querySelector(".seriesRecordingEditor")
            });
        });
        page.querySelector(".seriesTimerScheduleSection").classList.remove("hide");
        hideAll(page, "btnCancelSeriesTimer", true);
        renderSeriesTimerSchedule(page, apiClient, item.Id);
    }

    function renderTrackSelections(page, instance, item, forceReload) {
        var select = page.querySelector(".selectSource");
        if (!item.MediaSources || !itemHelper.supportsMediaSourceSelection(item) || -1 === playbackManager.getSupportedCommands().indexOf("PlayMediaSource") || !playbackManager.canPlay(item)) return page.querySelector(".trackSelections").classList.add("hide"), select.innerHTML = "", page.querySelector(".selectVideo").innerHTML = "", page.querySelector(".selectAudio").innerHTML = "", void(page.querySelector(".selectSubtitles").innerHTML = "");
        playbackManager.getPlaybackMediaSources(item).then(function (mediaSources) {
            instance._currentPlaybackMediaSources = mediaSources, page.querySelector(".trackSelections").classList.remove("hide"), select.setLabel(globalize.translate("LabelVersion"));
            var currentValue = select.value,
                selectedId = mediaSources[0].Id;
            select.innerHTML = mediaSources.map(function (v) {
                var selected = v.Id === selectedId ? " selected" : "";
                return '<option value="' + v.Id + '"' + selected + ">" + v.Name + "</option>"
            }).join(""), mediaSources.length > 1 ? page.querySelector(".selectSourceContainer").classList.remove("hide") : page.querySelector(".selectSourceContainer").classList.add("hide"), (select.value !== currentValue || forceReload) && (renderVideoSelections(page, mediaSources), renderAudioSelections(page, mediaSources), renderSubtitleSelections(page, mediaSources))
        })
    }

    function renderVideoSelections(page, mediaSources) {
        var mediaSourceId = page.querySelector(".selectSource").value,
            mediaSource = mediaSources.filter(function (m) {
                return m.Id === mediaSourceId
            })[0],
            tracks = mediaSource.MediaStreams.filter(function (m) {
                return "Video" === m.Type
            }),
            select = page.querySelector(".selectVideo");
        select.setLabel(globalize.translate("LabelVideo"));
        var selectedId = tracks.length ? tracks[0].Index : -1;
        select.innerHTML = tracks.map(function (v) {
            var selected = v.Index === selectedId ? " selected" : "",
                titleParts = [],
                resolutionText = mediaInfo.getResolutionText(v);
            return resolutionText && titleParts.push(resolutionText), v.Codec && titleParts.push(v.Codec.toUpperCase()), '<option value="' + v.Index + '" ' + selected + ">" + (v.DisplayTitle || titleParts.join(" ")) + "</option>"
        }).join(""), select.setAttribute("disabled", "disabled"), tracks.length ? page.querySelector(".selectVideoContainer").classList.remove("hide") : page.querySelector(".selectVideoContainer").classList.add("hide")
    }

    function renderAudioSelections(page, mediaSources) {
        var mediaSourceId = page.querySelector(".selectSource").value,
            mediaSource = mediaSources.filter(function (m) {
                return m.Id === mediaSourceId
            })[0],
            tracks = mediaSource.MediaStreams.filter(function (m) {
                return "Audio" === m.Type
            }),
            select = page.querySelector(".selectAudio");
        select.setLabel(globalize.translate("LabelAudio"));
        var selectedId = mediaSource.DefaultAudioStreamIndex;
        select.innerHTML = tracks.map(function (v) {
            var selected = v.Index === selectedId ? " selected" : "";
            return '<option value="' + v.Index + '" ' + selected + ">" + v.DisplayTitle + "</option>"
        }).join(""), tracks.length > 1 ? select.removeAttribute("disabled") : select.setAttribute("disabled", "disabled"), tracks.length ? page.querySelector(".selectAudioContainer").classList.remove("hide") : page.querySelector(".selectAudioContainer").classList.add("hide")
    }

    function renderSubtitleSelections(page, mediaSources) {
        var mediaSourceId = page.querySelector(".selectSource").value,
            mediaSource = mediaSources.filter(function (m) {
                return m.Id === mediaSourceId
            })[0],
            tracks = mediaSource.MediaStreams.filter(function (m) {
                return "Subtitle" === m.Type
            }),
            select = page.querySelector(".selectSubtitles");
        select.setLabel(globalize.translate("LabelSubtitles"));
        var selectedId = null == mediaSource.DefaultSubtitleStreamIndex ? -1 : mediaSource.DefaultSubtitleStreamIndex;
        if (tracks.length) {
            var selected = -1 === selectedId ? " selected" : "";
            select.innerHTML = '<option value="-1">' + globalize.translate("Off") + "</option>" + tracks.map(function (v) {
                return selected = v.Index === selectedId ? " selected" : "", '<option value="' + v.Index + '" ' + selected + ">" + v.DisplayTitle + "</option>"
            }).join(""), page.querySelector(".selectSubtitlesContainer").classList.remove("hide")
        } else select.innerHTML = "", page.querySelector(".selectSubtitlesContainer").classList.add("hide")
    }

    function reloadPlayButtons(page, item) {
        var canPlay = false;
        if (item.Type == "Program") {
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
            var enableInstantMix = ["Audio", "MusicAlbum", "MusicGenre", "MusicArtist"].indexOf(item.Type) !== -1;
            hideAll(page, "btnInstantMix", enableInstantMix);
            var enableShuffle = item.IsFolder || ["MusicAlbum", "MusicGenre", "MusicArtist"].indexOf(item.Type) !== -1;
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
        var i, length;
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
        for (var html = [], i = 0, length = artists.length; i < length; i++) {
            var artist = artists[i],
                href = appRouter.getRouteUrl(artist, {
                    context: context,
                    itemType: "MusicArtist",
                    serverId: serverId
                });
            html.push('<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + href + '">' + artist.Name + "</a>")
        }
        return html = html.join(" / ")
    }

    function renderName(item, container, isStatic, context) {
        var parentRoute, parentNameHtml = [],
            parentNameLast = false;
        item.AlbumArtists ? (parentNameHtml.push(getArtistLinksHtml(item.AlbumArtists, item.ServerId, context)), parentNameLast = true) : item.ArtistItems && item.ArtistItems.length && "MusicVideo" === item.Type ? (parentNameHtml.push(getArtistLinksHtml(item.ArtistItems, item.ServerId, context)), parentNameLast = true) : item.SeriesName && "Episode" === item.Type ? (parentRoute = appRouter.getRouteUrl({
            Id: item.SeriesId,
            Name: item.SeriesName,
            Type: "Series",
            IsFolder: true,
            ServerId: item.ServerId
        }, {
            context: context
        }), parentNameHtml.push('<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + parentRoute + '">' + item.SeriesName + "</a>")) : (item.IsSeries || item.EpisodeTitle) && parentNameHtml.push(item.Name), item.SeriesName && "Season" === item.Type ? (parentRoute = appRouter.getRouteUrl({
            Id: item.SeriesId,
            Name: item.SeriesName,
            Type: "Series",
            IsFolder: true,
            ServerId: item.ServerId
        }, {
            context: context
        }), parentNameHtml.push('<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + parentRoute + '">' + item.SeriesName + "</a>")) : null != item.ParentIndexNumber && "Episode" === item.Type ? (parentRoute = appRouter.getRouteUrl({
            Id: item.SeasonId,
            Name: item.SeasonName,
            Type: "Season",
            IsFolder: true,
            ServerId: item.ServerId
        }, {
            context: context
        }), parentNameHtml.push('<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + parentRoute + '">' + item.SeasonName + "</a>")) : null != item.ParentIndexNumber && item.IsSeries ? parentNameHtml.push(item.SeasonName || "S" + item.ParentIndexNumber) : item.Album && item.AlbumId && ("MusicVideo" === item.Type || "Audio" === item.Type) ? (parentRoute = appRouter.getRouteUrl({
            Id: item.AlbumId,
            Name: item.Album,
            Type: "MusicAlbum",
            IsFolder: true,
            ServerId: item.ServerId
        }, {
            context: context
        }), parentNameHtml.push('<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + parentRoute + '">' + item.Album + "</a>")) : item.Album && parentNameHtml.push(item.Album);
        var html = "";
        parentNameHtml.length && (html = parentNameLast ? '<h3 class="parentName" style="margin: .25em 0;">' + parentNameHtml.join(" - ") + "</h3>" : '<h1 class="parentName" style="margin: .1em 0 .25em;">' + parentNameHtml.join(" - ") + "</h1>");
        var name = itemHelper.getDisplayName(item, {
            includeParentInfo: false
        });
        html && !parentNameLast ? html += '<h3 class="itemName" style="margin: .25em 0 .5em;">' + name + "</h3>" : html = parentNameLast ? '<h1 class="itemName" style="margin: .1em 0 .25em;">' + name + "</h1>" + html : '<h1 class="itemName" style="margin: .1em 0 .5em;">' + name + "</h1>" + html, container.innerHTML = html, html.length ? container.classList.remove("hide") : container.classList.add("hide")
    }

    function setTrailerButtonVisibility(page, item) {
        (item.LocalTrailerCount || item.RemoteTrailers && item.RemoteTrailers.length) && -1 !== playbackManager.getSupportedCommands().indexOf("PlayTrailers") ? hideAll(page, "btnPlayTrailer", true) : hideAll(page, "btnPlayTrailer")
    }

    function renderDetailPageBackdrop(page, item, apiClient) {
        var screenWidth = screen.availWidth;
        var imgUrl;
        var hasbackdrop = false;
        var itemBackdropElement = page.querySelector("#itemBackdrop");
        var usePrimaryImage = (item.MediaType === "Video" && item.Type !== "Movie" && item.Type !== "Trailer") || (item.MediaType && item.MediaType !== "Video") || (item.Type === "MusicAlbum") || (item.Type === "MusicArtist");
        if (item.Type === "Program" && item.ImageTags && item.ImageTags.Thumb) {
            imgUrl = apiClient.getScaledImageUrl(item.Id, {
                type: "Thumb",
                index: 0,
                maxWidth: screenWidth,
                tag: item.ImageTags.Thumb
            });
            itemBackdropElement.classList.remove("noBackdrop");
            imageLoader.lazyImage(itemBackdropElement, imgUrl, false);
            hasbackdrop = true;
        } else if (usePrimaryImage && item.ImageTags && item.ImageTags.Primary) {
            imgUrl = apiClient.getScaledImageUrl(item.Id, {
                type: "Primary",
                index: 0,
                maxWidth: screenWidth,
                tag: item.ImageTags.Primary
            });
            itemBackdropElement.classList.remove("noBackdrop");
            imageLoader.lazyImage(itemBackdropElement, imgUrl, false);
            hasbackdrop = true;
        } else if (item.BackdropImageTags && item.BackdropImageTags.length) {
            imgUrl = apiClient.getScaledImageUrl(item.Id, {
                type: "Backdrop",
                index: 0,
                maxWidth: screenWidth,
                tag: item.BackdropImageTags[0]
            });
            itemBackdropElement.classList.remove("noBackdrop");
            imageLoader.lazyImage(itemBackdropElement, imgUrl, false);
            hasbackdrop = true;
        } else if (item.ParentBackdropItemId && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length) {
            imgUrl = apiClient.getScaledImageUrl(item.ParentBackdropItemId, {
                type: "Backdrop",
                index: 0,
                tag: item.ParentBackdropImageTags[0],
                maxWidth: screenWidth
            });
            itemBackdropElement.classList.remove("noBackdrop");
            imageLoader.lazyImage(itemBackdropElement, imgUrl, false);
            hasbackdrop = true;
        } else if (item.ImageTags && item.ImageTags.Thumb) {
            imgUrl = apiClient.getScaledImageUrl(item.Id, {
                type: "Thumb",
                index: 0,
                maxWidth: screenWidth,
                tag: item.ImageTags.Thumb
            });
            itemBackdropElement.classList.remove("noBackdrop");
            imageLoader.lazyImage(itemBackdropElement, imgUrl, false);
            hasbackdrop = true;
        } else {
            itemBackdropElement.classList.add("noBackdrop");
            itemBackdropElement.style.backgroundImage = "";
        }
        return hasbackdrop;
    }

    function reloadFromItem(instance, page, params, item, user) {
        var context = params.context;
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
        if (dom.getWindowSize().innerWidth >= 1000) {
            backdrop.setBackdrops([item]);
        } else {
            backdrop.clear();
        }
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
            return "Grouping" == g.Type
        });
        if (user.Policy.IsAdministrator && groupedVersions.length) {
            page.querySelector(".splitVersionContainer").classList.remove("hide");
        } else {
            page.querySelector(".splitVersionContainer").classList.add("hide");
        }
        var commands = itemContextMenu.getCommands(getContextMenuOptions(item, user));
        if (commands.length) {
            hideAll(page, "btnMoreCommands", true);
        } else {
            hideAll(page, "btnMoreCommands");
        }
        var itemBirthday = page.querySelector("#itemBirthday");
        if (item.Type == "Person" && item.PremiereDate) {
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
        if (item.Type == "Person" && item.EndDate) {
            try {
                var deathday = datetime.parseISO8601Date(item.EndDate, true).toDateString();
                itemDeathDate.classList.remove("hide");
                itemDeathDate.innerHTML = globalize.translate("DeathDateValue").replace("{0}", deathday);
            } catch (err) {
                itemDeathDate.classList.add("hide");
            }
        } else {}
        var itemBirthLocation = page.querySelector("#itemBirthLocation");
        if (item.Type == "Person" && item.ProductionLocations && item.ProductionLocations.length) {
            var gmap = '<a is="emby-linkbutton" class="button-link textlink" target="_blank" href="https://maps.google.com/maps?q=' + item.ProductionLocations[0] + '">' + item.ProductionLocations[0] + "</a>";
            itemBirthLocation.classList.remove("hide");
            itemBirthLocation.innerHTML = globalize.translate("BirthPlaceValue").replace("{0}", gmap);
        } else {
            itemBirthLocation.classList.add("hide");
        }
        setPeopleHeader(page, item);
        loading.hide();
        try {
            require(["focusManager"], function (focusManager) {
                [".btnResume", ".btnPlay"].every(function (cls) {
                    var elems = page.querySelectorAll(cls);
                    for (var i = 0; i < elems.length; i++) {
                        if (focusManager.isCurrentlyFocusable(elems[i])) {
                            focusManager.focus(elems[i]);
                            return false;
                        }
                    }
                    return true;
                });
            });
        } catch (e) {
            console.log(e);
        }
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
        if (url = null) {
            var pageTitle = document.querySelector(".pageTitle");
            pageTitle.style.backgroundImage = "url('" + url + "')";
            pageTitle.classList.add("pageTitleWithLogo");
            pageTitle.innerHTML = ""
        } else Emby.Page.setTitle("")
    }

    function renderLogo(page, item, apiClient) {
        var url = logoImageUrl(item, apiClient, {
            maxWidth: 300
        });
        var detailLogo = page.querySelector(".detailLogo");
        if (url) {
            detailLogo.classList.remove("hide");
            detailLogo.classList.add("lazy");
            detailLogo.setAttribute("data-src", url);
            imageLoader.lazyImage(detailLogo);
        } else {
            detailLogo.classList.add("hide");
        }
    }

    function showRecordingFields(instance, page, item, user) {
        if (instance.currentRecordingFields) {
            return;
        }
        var recordingFieldsElement = page.querySelector(".recordingFields");
        if (item.Type == "Program" && user.Policy.EnableLiveTvManagement) {
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

    function renderLinks(linksElem, item) {
        var html = [];
        if (item.DateCreated && itemHelper.enableDateAddedDisplay(item)) {
            var dateCreated = datetime.parseISO8601Date(item.DateCreated);
            html.push(globalize.translate("AddedOnValue", datetime.toLocaleDateString(dateCreated) + " " + datetime.getDisplayTime(dateCreated)))
        }
        var links = [];
        if (!layoutManager.tv && (item.HomePageUrl && links.push('<a style="color:inherit;" is="emby-linkbutton" class="button-link" href="' + item.HomePageUrl + '" target="_blank">' + globalize.translate("ButtonWebsite") + "</a>"), item.ExternalUrls))
            for (var i = 0, length = item.ExternalUrls.length; i < length; i++) {
                var url = item.ExternalUrls[i];
                links.push('<a style="color:inherit;" is="emby-linkbutton" class="button-link" href="' + url.Url + '" target="_blank">' + url.Name + "</a>")
            }
        links.length && html.push(globalize.translate("LinksValue", links.join(", "))), linksElem.innerHTML = html.join(", "), html.length ? linksElem.classList.remove("hide") : linksElem.classList.add("hide")
    }

    function renderDetailImage(page, elem, item, apiClient, editable, imageLoader, indicators) {
        if (item.Type === "SeriesTimer" || item.Type === "Program") {
            editable = false;
        }
        if (item.Type !== "Person") {
            elem.classList.add("detailimg-hidemobile");
            page.querySelector(".detailPageContent").classList.add("detailPageContent-nodetailimg");
        } else {
            page.querySelector(".detailPageContent").classList.remove("detailPageContent-nodetailimg");
        }
        var imageTags = item.ImageTags || {};
        if (item.PrimaryImageTag) {
            imageTags.Primary = item.PrimaryImageTag;
        }
        var html = "";
        var url;
        var shape = "portrait";
        var detectRatio = false;
        if (imageTags.Primary) {
            url = apiClient.getScaledImageUrl(item.Id, {
                type: "Primary",
                maxHeight: 360,
                tag: item.ImageTags.Primary
            });
            detectRatio = true;
        } else if (item.BackdropImageTags && item.BackdropImageTags.length) {

            url = apiClient.getScaledImageUrl(item.Id, {
                type: "Backdrop",
                maxHeight: 360,
                tag: item.BackdropImageTags[0]
            });
            shape = "thumb";
        } else if (imageTags.Thumb) {

            url = apiClient.getScaledImageUrl(item.Id, {
                type: "Thumb",
                maxHeight: 360,
                tag: item.ImageTags.Thumb
            });
            shape = "thumb";
        } else if (imageTags.Disc) {

            url = apiClient.getScaledImageUrl(item.Id, {
                type: "Disc",
                maxHeight: 360,
                tag: item.ImageTags.Disc
            });
            shape = "square";
        } else if (item.AlbumId && item.AlbumPrimaryImageTag) {

            url = apiClient.getScaledImageUrl(item.AlbumId, {
                type: "Primary",
                maxHeight: 360,
                tag: item.AlbumPrimaryImageTag
            });
            shape = "square";
        } else if (item.SeriesId && item.SeriesPrimaryImageTag) {

            url = apiClient.getScaledImageUrl(item.SeriesId, {
                type: "Primary",
                maxHeight: 360,
                tag: item.SeriesPrimaryImageTag
            });
        } else if (item.ParentPrimaryImageItemId && item.ParentPrimaryImageTag) {

            url = apiClient.getScaledImageUrl(item.ParentPrimaryImageItemId, {
                type: "Primary",
                maxHeight: 360,
                tag: item.ParentPrimaryImageTag
            });
        }
        html += '<div style="position:relative;">';
        if (editable) {
            html += "<a class='itemDetailGalleryLink' is='emby-linkbutton' style='display:block;padding:2px;margin:0;' href='#'>";
        }
        if (detectRatio && item.PrimaryImageAspectRatio) {
            if (item.PrimaryImageAspectRatio >= 1.48) {
                shape = "thumb";
            } else if (item.PrimaryImageAspectRatio >= .85 && item.PrimaryImageAspectRatio <= 1.34) {
                shape = "square";
            }
        }
        html += "<img class='itemDetailImage lazy' src='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=' />";
        if (editable) {
            html += "</a>";
        }
        var progressHtml = item.IsFolder || !item.UserData ? "" : indicators.getProgressBarHtml(item);
        html += '<div class="detailImageProgressContainer">';
        if (progressHtml) {
            html += progressHtml;
        }
        html += "</div>";
        html += "</div>";
        elem.innerHTML = html;
        if (shape == "thumb") {
            elem.classList.add("thumbDetailImageContainer");
            elem.classList.remove("portraitDetailImageContainer");
            elem.classList.remove("squareDetailImageContainer");
        } else if (shape == "square") {
            elem.classList.remove("thumbDetailImageContainer");
            elem.classList.remove("portraitDetailImageContainer");
            elem.classList.add("squareDetailImageContainer");
        } else {
            elem.classList.remove("thumbDetailImageContainer");
            elem.classList.add("portraitDetailImageContainer");
            elem.classList.remove("squareDetailImageContainer");
        }
        if (url) {
            var img = elem.querySelector("img");
            imageLoader.lazyImage(img, url);
        }
    }

    function renderImage(page, item, apiClient, user) {
        renderDetailImage(page, page.querySelector(".detailImageContainer"), item, apiClient, user.Policy.IsAdministrator && "Photo" != item.MediaType, imageLoader, indicators)
    }

    function refreshDetailImageUserData(elem, item) {
        elem.querySelector(".detailImageProgressContainer").innerHTML = indicators.getProgressBarHtml(item)
    }

    function refreshImage(page, item, user) {
        refreshDetailImageUserData(page.querySelector(".detailImageContainer"), item)
    }

    function setPeopleHeader(page, item) {
        if (item.MediaType == "Audio" || item.Type == "MusicAlbum" || item.MediaType == "Book" || item.MediaType == "Photo") {
            page.querySelector("#peopleHeader").innerHTML = globalize.translate("HeaderPeople");
        } else {
            page.querySelector("#peopleHeader").innerHTML = globalize.translate("HeaderCastAndCrew");
        }
    }

    function renderNextUp(page, item, user) {
        var section = page.querySelector(".nextUpSection");
        if (item.Type != "Series") {
            section.classList.add("hide");
            return;
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
                shape: getThumbShape(false),
                showTitle: true,
                displayAsSpecial: item.Type == "Season" && item.IndexNumber,
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
        if (item.Type == "Playlist") {
            page.querySelector("#childrenCollapsible").classList.remove("hide");
            renderPlaylistItems(page, item, user);
        } else if (item.Type == "Studio" || item.Type == "Person" || item.Type == "Genre" || item.Type == "MusicGenre" || item.Type == "MusicArtist") {
            page.querySelector("#childrenCollapsible").classList.remove("hide");
            renderItemsByName(page, item, user);
        } else if (item.IsFolder) {
            if (item.Type == "BoxSet") {
                page.querySelector("#childrenCollapsible").classList.add("hide");
            }
            renderChildren(page, item);
        } else {
            page.querySelector("#childrenCollapsible").classList.add("hide");
        }
        if (item.Type == "Series") {
            renderSeriesSchedule(page, item, user);
        }
        if (item.Type == "Series") {
            renderNextUp(page, item, user);
        } else {
            page.querySelector(".nextUpSection").classList.add("hide");
        }
        if (item.MediaSources && item.MediaSources.length) {
            if (item.EnableMediaSourceDisplay == null ? item.SourceType !== "Channel" : item.EnableMediaSourceDisplay) {
                page.querySelector(".audioVideoMediaInfo").classList.add("hide");
            }
            renderMediaSources(page, user, item);
        }
        renderScenes(page, item);
        if (!item.SpecialFeatureCount || item.SpecialFeatureCount == 0 || item.Type == "Series") {
            page.querySelector("#specialsCollapsible").classList.add("hide");
        } else {
            page.querySelector("#specialsCollapsible").classList.remove("hide");
            renderSpecials(page, item, user, 6);
        }
        renderCast(page, item, context, enableScrollX() ? null : 12);
        if (item.PartCount && item.PartCount > 1) {
            page.querySelector("#additionalPartsCollapsible").classList.remove("hide");
            renderAdditionalParts(page, item, user);
        } else {
            page.querySelector("#additionalPartsCollapsible").classList.add("hide");
        }
        if (item.Type == "MusicAlbum") {
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
                for (var anchors = elem.querySelectorAll("a"), j = 0, length2 = anchors.length; j < length2; j++) {
                    anchors[j].setAttribute("target", "_blank");
                }
            } else {
                elem.innerHTML = "";
                elem.classList.add("hide");
            }
        }
    }

    function renderGenres(page, item, apiClient, context, isStatic) {
        var context = inferContext(item);
        var type, genres = item.GenreItems || [];
        switch (context) {
            case "music":
                type = "MusicGenre";
                break;
            default:
                type = "Genre"
        }

        var html = genres.map(function (p) {
                return '<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + appRouter.getRouteUrl({
                    Name: p.Name,
                    Type: type,
                    ServerId: item.ServerId,
                    Id: p.Id
                }, {
                    context: context
                }) + '">' + p.Name + "</a>"
            }).join(", "),
            elem = page.querySelector(".genres");
        elem.innerHTML = genres.length > 1 ? globalize.translate("GenresValue", html) : globalize.translate("GenreValue", html), genres.length ? elem.classList.remove("hide") : elem.classList.add("hide")
    }

    function renderDirector(page, item, apiClient, context, isStatic) {
        var directors = (item.People || []).filter(function (p) {
                return "Director" === p.Type
            }),
            html = directors.map(function (p) {
                return '<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' + appRouter.getRouteUrl({
                    Name: p.Name,
                    Type: "Person",
                    ServerId: item.ServerId,
                    Id: p.Id
                }, {
                    context: context
                }) + '">' + p.Name + "</a>"
            }).join(", "),
            elem = page.querySelector(".directors");
        elem.innerHTML = directors.length > 1 ? globalize.translate("DirectorsValue", html) : globalize.translate("DirectorValue", html), directors.length ? elem.classList.remove("hide") : elem.classList.add("hide")
    }

    function renderDetails(page, item, apiClient, context, isStatic) {
        renderSimilarItems(page, item, context);
        renderMoreFromSeason(page, item, apiClient);
        renderMoreFromArtist(page, item, apiClient);
        renderDirector(page, item, apiClient, context, isStatic);
        renderGenres(page, item, apiClient, context, isStatic);
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
        if (item.Type === "Season" || item.Type === "MusicAlbum" || item.Type === "MusicArtist") {
            overview.classList.add("detailsHiddenOnMobile");
            externalLinksElem.classList.add("detailsHiddenOnMobile");
        }
        renderOverview([overview], item);
        var i, length;
        var itemMiscInfo = page.querySelectorAll(".itemMiscInfo-primary");
        for (i = 0, length = itemMiscInfo.length; i < length; i++) {
            mediaInfo.fillPrimaryMediaInfo(itemMiscInfo[i], item, {
                interactive: true,
                episodeTitle: false,
                subtitles: false
            });
            if (itemMiscInfo[i].innerHTML || item.Type === "SeriesTimer") {
                itemMiscInfo[i].classList.remove("hide");
            } else {
                itemMiscInfo[i].classList.add("hide");
            }
        }
        itemMiscInfo = page.querySelectorAll(".itemMiscInfo-secondary");
        for (i = 0, length = itemMiscInfo.length; i < length; i++) {
            mediaInfo.fillSecondaryMediaInfo(itemMiscInfo[i], item, {
                interactive: true
            });
            if (itemMiscInfo[i].innerHTML) {
                itemMiscInfo[i].classList.remove("hide");
            } else {
                itemMiscInfo[i].classList.add("hide");
            }
        }
        reloadUserDataButtons(page, item);
        renderLinks(externalLinksElem, item);
        renderTags(page, item);
        renderSeriesAirTime(page, item, isStatic)
    }

    function enableScrollX() {
        return browser.mobile && screen.availWidth <= 1000;
    }

    function getPortraitShape(scrollX) {
        if (scrollX == null) {
            scrollX = enableScrollX();
        }
        return scrollX ? "overflowPortrait" : "portrait";
    }

    function getSquareShape(scrollX) {
        if (scrollX == null) {
            scrollX = enableScrollX();
        }
        return scrollX ? "overflowSquare" : "square";
    }

    function getThumbShape(scrollX) {
        if (scrollX == null) {
            scrollX = enableScrollX();
        }
        return scrollX ? "overflowBackdrop" : "backdrop";
    }

    function renderMoreFromSeason(view, item, apiClient) {
        var section = view.querySelector(".moreFromSeasonSection");
        if (section) {
            if ("Episode" !== item.Type || !item.SeasonId || !item.SeriesId) return void section.classList.add("hide");
            var userId = apiClient.getCurrentUserId();
            apiClient.getEpisodes(item.SeriesId, {
                SeasonId: item.SeasonId,
                UserId: userId,
                Fields: "ItemCounts,PrimaryImageAspectRatio,BasicSyncInfo,CanDelete,MediaSourceCount"
            }).then(function (result) {
                if (result.Items.length < 2) return void section.classList.add("hide");
                section.classList.remove("hide"), section.querySelector("h2").innerHTML = globalize.translate("MoreFromValue", item.SeasonName);
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
                card && setTimeout(function () {
                    section.querySelector(".emby-scroller").toStart(card.previousSibling || card, true)
                }, 100)
            })
        }
    }

    function renderMoreFromArtist(view, item, apiClient) {
        var section = view.querySelector(".moreFromArtistSection");
        if (section) {
            if ("MusicArtist" === item.Type) {
                if (!apiClient.isMinServerVersion("3.4.1.19")) return void section.classList.add("hide")
            } else if ("MusicAlbum" !== item.Type || !item.AlbumArtists || !item.AlbumArtists.length) return void section.classList.add("hide");
            var query = {
                IncludeItemTypes: "MusicAlbum",
                Recursive: true,
                ExcludeItemIds: item.Id,
                SortBy: "ProductionYear,SortName",
                SortOrder: "Descending"
            };
            "MusicArtist" === item.Type ? query.ContributingArtistIds = item.Id : apiClient.isMinServerVersion("3.4.1.18") ? query.AlbumArtistIds = item.AlbumArtists[0].Id : query.ArtistIds = item.AlbumArtists[0].Id, apiClient.getItems(apiClient.getCurrentUserId(), query).then(function (result) {
                if (!result.Items.length) return void section.classList.add("hide");
                section.classList.remove("hide"), "MusicArtist" === item.Type ? section.querySelector("h2").innerHTML = globalize.translate("HeaderAppearsOn") : section.querySelector("h2").innerHTML = globalize.translate("MoreFromValue", item.AlbumArtists[0].Name), cardBuilder.buildCards(result.Items, {
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
                })
            })
        }
    }

    function renderSimilarItems(page, item, context) {
        var similarCollapsible = page.querySelector("#similarCollapsible");
        if (!similarCollapsible) {
            return;
        }
        if (item.Type == "Movie" || item.Type == "Trailer" || item.Type == "Series" || item.Type == "Program" || item.Type == "Recording" || item.Type == "MusicAlbum" || item.Type == "MusicArtist" || item.Type == "Playlist") {
            similarCollapsible.classList.remove("hide");
        } else {
            similarCollapsible.classList.add("hide");
            return;
        }
        var apiClient = connectionManager.getApiClient(item.ServerId);
        var options = {
            userId: apiClient.getCurrentUserId(),
            limit: 12,
            fields: "PrimaryImageAspectRatio,UserData,CanDelete"
        };
        if (item.Type == "MusicAlbum" && item.AlbumArtists && item.AlbumArtists.length) {
            options.ExcludeArtistIds = item.AlbumArtists[0].Id;
        }
        apiClient.getSimilarItems(item.Id, options).then(function (result) {
            if (!result.Items.length) {
                similarCollapsible.classList.add("hide");
                return;
            }
            similarCollapsible.classList.remove("hide");
            var html = "";
            html += cardBuilder.getCardsHtml({
                items: result.Items,
                shape: "autooverflow",
                showParentTitle: item.Type == "MusicAlbum",
                centerText: true,
                showTitle: true,
                context: context,
                lazy: true,
                showDetailsMenu: true,
                coverImage: item.Type == "MusicAlbum" || item.Type == "MusicArtist",
                overlayPlayButton: true,
                overlayText: false,
                showYear: item.Type == "Movie" || item.Type == "Trailer"
            });
            var similarContent = similarCollapsible.querySelector(".similarContent");
            similarContent.innerHTML = html;
            imageLoader.lazyChildren(similarContent);
        });
    }

    function renderSeriesAirTime(page, item, isStatic) {
        var seriesAirTime = page.querySelector("#seriesAirTime");
        if (item.Type != "Series") {
            seriesAirTime.classList.add("hide");
            return;
        }
        var html = "";
        if (item.AirDays && item.AirDays.length) {
            html += item.AirDays.length == 7 ? "daily" : item.AirDays.map(function (a) {
                return a + "s";
            }).join(",");
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
                html += ' on <a class="textlink button-link" is="emby-button" href="' + href + '">' + item.Studios[0].Name + "</a>";
            }
        }
        if (html) {
            html = (item.Status == "Ended" ? "Aired " : "Airs ") + html;
            seriesAirTime.innerHTML = html;
            seriesAirTime.classList.remove("hide");
        } else {
            seriesAirTime.classList.add("hide");
        }
    }

    function renderTags(page, item) {
        var itemTags = page.querySelector(".itemTags"),
            tagElements = [],
            tags = item.Tags || [];
        "Program" === item.Type && (tags = []);
        for (var i = 0, length = tags.length; i < length; i++) tagElements.push(tags[i]);
        tagElements.length ? (itemTags.innerHTML = globalize.translate("TagsValue", tagElements.join(", ")), itemTags.classList.remove("hide")) : (itemTags.innerHTML = "", itemTags.classList.add("hide"))
    }

    function renderChildren(page, item) {
        var fields = "ItemCounts,PrimaryImageAspectRatio,BasicSyncInfo,CanDelete,MediaSourceCount";
        var query = {
            ParentId: item.Id,
            Fields: fields
        };
        if (item.Type !== "BoxSet") {
            query.SortBy = "SortName";
        }
        var apiClient = connectionManager.getApiClient(item.ServerId);
        var userId = apiClient.getCurrentUserId();
        var promise;
        if (item.Type == "Series") {
            promise = apiClient.getSeasons(item.Id, {
                userId: userId,
                Fields: fields
            });
        } else if (item.Type == "Season") {
            fields += ",Overview";
            promise = apiClient.getEpisodes(item.SeriesId, {
                seasonId: item.Id,
                userId: userId,
                Fields: fields
            });
        } else if (item.Type == "MusicAlbum" || item.Type == "MusicArtist") {
            query.SortBy = "ProductionYear,SortName";
        }
        promise = promise || apiClient.getItems(apiClient.getCurrentUserId(), query);
        promise.then(function (result) {
            var html = "";
            var scrollX = false;
            var isList = false;
            var scrollClass = "hiddenScrollX";
            var childrenItemsContainer = page.querySelector(".childrenItemsContainer");
            if (item.Type == "MusicAlbum") {
                html = listView.getListViewHtml({
                    items: result.Items,
                    smallIcon: true,
                    showIndex: true,
                    index: "disc",
                    showIndexNumber: true,
                    playFromHere: true,
                    action: "playallfromhere",
                    image: false,
                    artist: "auto",
                    containerAlbumArtist: item.AlbumArtist,
                    addToListButton: true
                });
                isList = true;
            } else if (item.Type == "Series") {
                scrollX = enableScrollX();
                html = cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: getPortraitShape(),
                    showTitle: true,
                    centerText: true,
                    lazy: true,
                    overlayPlayButton: true,
                    allowBottomPadding: !scrollX
                });
            } else if (item.Type == "Season" || item.Type == "Episode") {
                if (item.Type === "Episode") {
                    childrenItemsContainer.classList.add("darkScroller");
                } else {
                    isList = true;
                }
                scrollX = item.Type == "Episode";
                if (!browser.touch) {
                    scrollClass = "smoothScrollX";
                }
                if (result.Items.length < 2 && item.Type === "Episode") {
                    return;
                } else if (item.Type === "Episode") {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: getThumbShape(scrollX),
                        showTitle: true,
                        displayAsSpecial: item.Type == "Season" && item.IndexNumber,
                        playFromHere: true,
                        overlayText: true,
                        lazy: true,
                        showDetailsMenu: true,
                        overlayPlayButton: true,
                        allowBottomPadding: !scrollX,
                        includeParentInfoInTitle: false
                    });
                } else if (item.Type === "Season") {
                    html = listView.getListViewHtml({
                        items: result.Items,
                        showIndexNumber: false,
                        enableOverview: true,
                        imageSize: "large",
                        enableSideMediaInfo: false,
                        highlight: false,
                        action: "none",
                        infoButton: true,
                        imagePlayButton: true,
                        includeParentInfoInTitle: false
                    });
                }
            }
            if (item.Type !== "BoxSet") {
                page.querySelector("#childrenCollapsible").classList.remove("hide");
            }
            if (scrollX) {
                childrenItemsContainer.classList.add(scrollClass);
                childrenItemsContainer.classList.remove("vertical-wrap");
                childrenItemsContainer.classList.remove("vertical-list");
            } else {
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
            if (item.Type == "BoxSet") {
                var collectionItemTypes = [{
                    name: globalize.translate("HeaderVideos"),
                    mediaType: "Video"
                },
                {
                    name: globalize.translate("HeaderSeries"),
                    type: "Series"
                },
                {
                    name: globalize.translate("HeaderAlbums"),
                    type: "MusicAlbum"
                },
                {
                    name: globalize.translate("HeaderBooks"),
                    type: "Book"
                }
                ];
                renderCollectionItems(page, item, collectionItemTypes, result.Items);
            }
        });
        if (item.Type == "Season") {
            page.querySelector("#childrenTitle").innerHTML = globalize.translate("HeaderEpisodes");
        } else if (item.Type == "Series") {
            page.querySelector("#childrenTitle").innerHTML = globalize.translate("HeaderSeasons");
        } else if (item.Type == "MusicAlbum") {
            page.querySelector("#childrenTitle").innerHTML = globalize.translate("HeaderTracks");
        } else {
            page.querySelector("#childrenTitle").innerHTML = globalize.translate("HeaderItems");
        }
        if (item.Type == "MusicAlbum" || item.Type == "Season") {
            page.querySelector(".childrenSectionHeader", page).classList.add("hide");
        } else {
            page.querySelector(".childrenSectionHeader", page).classList.remove("hide");
        }
    }

    function renderItemsByName(page, item, user) {
        require("scripts/itembynamedetailpage".split(","), function () {
            window.ItemsByName.renderItems(page, item);
        });
    }

    function renderPlaylistItems(page, item, user) {
        require("scripts/playlistedit".split(","), function () {
            PlaylistViewer.render(page, item);
        });
    }

    function renderProgramsForChannel(page, result) {
        for (var html = "", currentItems = [], currentStartDate = null, i = 0, length = result.Items.length; i < length; i++) {
            var item = result.Items[i],
                itemStartDate = datetime.parseISO8601Date(item.StartDate);
            currentStartDate && currentStartDate.toDateString() === itemStartDate.toDateString() || (currentItems.length && (html += '<div class="verticalSection verticalDetailSection">', html += '<h2 class="sectionTitle padded-left">' + datetime.toLocaleDateString(currentStartDate, {
                weekday: "long",
                month: "long",
                day: "numeric"
            }) + "</h2>", html += '<div is="emby-itemscontainer" class="vertical-list padded-left padded-right">' + listView.getListViewHtml({
                items: currentItems,
                enableUserDataButtons: false,
                showParentTitle: true,
                image: false,
                showProgramTime: true,
                mediaInfo: false,
                parentTitleWithTitle: true
            }) + "</div></div>"), currentStartDate = itemStartDate, currentItems = []), currentItems.push(item)
        }
        currentItems.length && (html += '<div class="verticalSection verticalDetailSection">', html += '<h2 class="sectionTitle padded-left">' + datetime.toLocaleDateString(currentStartDate, {
            weekday: "long",
            month: "long",
            day: "numeric"
        }) + "</h2>", html += '<div is="emby-itemscontainer" class="vertical-list padded-left padded-right">' + listView.getListViewHtml({
            items: currentItems,
            enableUserDataButtons: false,
            showParentTitle: true,
            image: false,
            showProgramTime: true,
            mediaInfo: false,
            parentTitleWithTitle: true
        }) + "</div></div>"), page.querySelector(".programGuide").innerHTML = html
    }

    function renderChannelGuide(page, apiClient, item) {
        if (item.Type === "TvChannel") {
            page.querySelector(".programGuideSection").classList.remove("hide");
            apiClient.getLiveTvPrograms({
                ChannelIds: channelId,
                UserId: apiClient.getCurrentUserId(),
                HasAired: false,
                SortBy: "StartDate",
                EnableTotalRecordCount: false,
                EnableImages: false,
                ImageTypeLimit: 0,
                EnableUserData: false
            }).then(function (result) {
                renderPrograms(page, result);
                loading.hide();
            });
        }
    }

    function renderSeriesSchedule(page, item, user) {
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
        if (item.Type == "Movie" || item.Type == "BoxSet") {
            return "movies";
        }
        if (item.Type == "Series" || item.Type == "Season" || item.Type == "Episode") {
            return "tvshows";
        }
        if (item.Type == "MusicArtist" || item.Type == "MusicAlbum" || item.Type == "Audio" || item.Type == "AudioBook") {
            return "music";
        }
        if (item.Type == "Program") {
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

    function renderCollectionItems(page, parentItem, types, items) {
        page.querySelector(".collectionItems").innerHTML = "";
        var i, length;
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
        var containers = page.querySelectorAll(".collectionItemsContainer"),
            notifyRefreshNeeded = function () {
                renderChildren(page, parentItem)
            };
        for (i = 0, length = containers.length; i < length; i++) containers[i].notifyRefreshNeeded = notifyRefreshNeeded
    }

    function renderCollectionItemType(page, parentItem, type, items) {
        var html = "";
        html += '<div class="verticalSection">';
        html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
        html += '<h2 class="sectionTitle sectionTitle-cards">';
        html += "<span>" + type.name + "</span>";
        html += "</h2>";
        html += '<button class="btnAddToCollection sectionTitleButton" type="button" is="paper-icon-button-light" style="margin-left:1em;"><i class="md-icon" icon="add">add</i></button>';
        html += "</div>";
        html += '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap padded-left padded-right">';
        var shape = type.type == "MusicAlbum" ? getSquareShape(false) : getPortraitShape(false);
        html += cardBuilder.getCardsHtml({
            items: items,
            shape: shape,
            showTitle: true,
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
        if (chapters.length && !chapters[0].ImageTag) {
            chapters = [];
        }
        if (!chapters.length) {
            page.querySelector("#scenesCollapsible").classList.add("hide");
        } else {
            page.querySelector("#scenesCollapsible").classList.remove("hide");
            var scenesContent = page.querySelector("#scenesContent");
            require(["chaptercardbuilder"], function (chaptercardbuilder) {
                chaptercardbuilder.buildChapterCards(item, chapters, {
                    itemsContainer: scenesContent,
                    width: 400,
                    backdropShape: "overflowBackdrop",
                    squareShape: "overflowSquare"
                });
            });
        }
    }

    function renderMediaSources(page, user, item) {
        var html = item.MediaSources.map(function (v) {
            return getMediaSourceHtml(user, item, v);
        }).join('<div style="border-top:1px solid #444;margin: 1em 0;"></div>');
        if (item.MediaSources.length > 1) {
            html = "<br/>" + html;
        }
        var mediaInfoContent = page.querySelector("#mediaInfoContent");
        mediaInfoContent.innerHTML = html;
        if (html) {
            page.querySelector(".audioVideoMediaInfo").classList.remove("hide");
        } else {
            page.querySelector(".audioVideoMediaInfo").classList.add("hide");
        }
    }

    function getMediaSourceHtml(user, item, version) {
        var html = "";
        if (version.Name && item.MediaSources.length > 1) {
            html += '<div><span class="mediaInfoAttribute">' + version.Name + "</span></div><br/>";
        }
        for (var i = 0, length = version.MediaStreams.length; i < length; i++) {
            var stream = version.MediaStreams[i];
            if (stream.Type === "Data") {
                continue;
            }
            html += '<div class="mediaInfoStream">';
            var displayType = globalize.translate("MediaInfoStreamType" + stream.Type);
            html += '<h2 class="mediaInfoStreamType">' + displayType + "</h2>";
            var attributes = [];
            if (stream.DisplayTitle) {
                attributes.push(createAttribute("Title", stream.DisplayTitle));
            }
            if (stream.Language && stream.Type !== "Video") {
                attributes.push(createAttribute(globalize.translate("MediaInfoLanguage"), stream.Language));
            }
            if (stream.Codec) {
                attributes.push(createAttribute(globalize.translate("MediaInfoCodec"), stream.Codec.toUpperCase()));
            }
            if (stream.CodecTag) {
                attributes.push(createAttribute(globalize.translate("MediaInfoCodecTag"), stream.CodecTag));
            }
            if (stream.IsAVC != null) {
                attributes.push(createAttribute("AVC", (stream.IsAVC ? "Yes" : "No")));
            }
            if (stream.Profile) {
                attributes.push(createAttribute(globalize.translate("MediaInfoProfile"), stream.Profile));
            }
            if (stream.Level) {
                attributes.push(createAttribute(globalize.translate("MediaInfoLevel"), stream.Level));
            }
            if (stream.Width || stream.Height) {
                attributes.push(createAttribute(globalize.translate("MediaInfoResolution"), stream.Width + "x" + stream.Height));
            }
            if (stream.AspectRatio && stream.Codec !== "mjpeg") {
                attributes.push(createAttribute(globalize.translate("MediaInfoAspectRatio"), stream.AspectRatio));
            }
            if (stream.Type === "Video") {
                if (stream.IsAnamorphic != null) {
                    attributes.push(createAttribute(globalize.translate("MediaInfoAnamorphic"), (stream.IsAnamorphic ? "Yes" : "No")));
                }
                attributes.push(createAttribute(globalize.translate("MediaInfoInterlaced"), (stream.IsInterlaced ? "Yes" : "No")));
            }
            if (stream.AverageFrameRate || stream.RealFrameRate) {
                attributes.push(createAttribute(globalize.translate("MediaInfoFramerate"), (stream.AverageFrameRate || stream.RealFrameRate)));
            }
            if (stream.ChannelLayout) {
                attributes.push(createAttribute(globalize.translate("MediaInfoLayout"), stream.ChannelLayout));
            }
            if (stream.Channels) {
                attributes.push(createAttribute(globalize.translate("MediaInfoChannels"), stream.Channels + " ch"));
            }
            if (stream.BitRate && stream.Codec !== "mjpeg") {
                attributes.push(createAttribute(globalize.translate("MediaInfoBitrate"), (parseInt(stream.BitRate / 1000)) + " kbps"));
            }
            if (stream.SampleRate) {
                attributes.push(createAttribute(globalize.translate("MediaInfoSampleRate"), stream.SampleRate + " Hz"));
            }
            if (stream.BitDepth) {
                attributes.push(createAttribute(globalize.translate("MediaInfoBitDepth"), stream.BitDepth + " bit"));
            }
            if (stream.PixelFormat) {
                attributes.push(createAttribute(globalize.translate("MediaInfoPixelFormat"), stream.PixelFormat));
            }
            if (stream.RefFrames) {
                attributes.push(createAttribute(globalize.translate("MediaInfoRefFrames"), stream.RefFrames));
            }
            if (stream.NalLengthSize) {
                attributes.push(createAttribute("NAL", stream.NalLengthSize));
            }
            if (stream.Type !== "Video") {
                attributes.push(createAttribute(globalize.translate("MediaInfoDefault"), (stream.IsDefault ? "Yes" : "No")));
            }
            if (stream.Type === "Subtitle") {
                attributes.push(createAttribute(globalize.translate("MediaInfoForced"), (stream.IsForced ? "Yes" : "No")));
                attributes.push(createAttribute(globalize.translate("MediaInfoExternal"), (stream.IsExternal ? "Yes" : "No")));
            }
            if (stream.Type === "Video" && version.Timestamp) {
                attributes.push(createAttribute(globalize.translate("MediaInfoTimestamp"), version.Timestamp));
            }
            html += attributes.join("<br/>");
            html += "</div>";
        }
        if (version.Container) {
            html += '<div><span class="mediaInfoLabel">' + globalize.translate("MediaInfoContainer") + '</span><span class="mediaInfoAttribute">' + version.Container + "</span></div>";
        }
        if (version.Formats && version.Formats.length) {
            //html += "<div><span class="mediaInfoLabel">"+Globalize.translate("MediaInfoFormat")+"</span><span class="mediaInfoAttribute">" + version.Formats.join(",") + "</span></div>";
        }
        if (version.Path && version.Protocol !== "Http" && user && user.Policy.IsAdministrator) {
            html += '<div><span class="mediaInfoLabel">' + globalize.translate("MediaInfoPath") + '</span><span class="mediaInfoAttribute">' + version.Path + "</span></div>";
        }
        if (version.Size) {
            var size = (version.Size / (1024 * 1024)).toFixed(0);
            html += '<div><span class="mediaInfoLabel">' + globalize.translate("MediaInfoSize") + '</span><span class="mediaInfoAttribute">' + size + " MB</span></div>";
        }
        return html;
    }

    function createAttribute(label, value) {
        return '<span class="mediaInfoLabel">' + label + '</span><span class="mediaInfoAttribute">' + value + "</span>"
    }

    function getVideosHtml(items, user, limit, moreButtonClass) {
        var html = cardBuilder.getCardsHtml({
            items: items,
            shape: "auto",
            showTitle: true,
            action: "play",
            overlayText: true,
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

    function renderCast(page, item, context, limit, isStatic) {
        var people = (item.People || []).filter(function (p) {
            return "Director" !== p.Type
        });
        if (!people.length) return void page.querySelector("#castCollapsible").classList.add("hide");
        page.querySelector("#castCollapsible").classList.remove("hide");
        var castContent = page.querySelector("#castContent");
        require(["peoplecardbuilder"], function (peoplecardbuilder) {
            peoplecardbuilder.buildPeopleCards(people, {
                itemsContainer: castContent,
                coverImage: true,
                serverId: item.ServerId,
                width: 160,
                shape: getPortraitShape()
            })
        })
    }

    function itemDetailPage() {
        var self = this;
        self.setInitialCollapsibleState = setInitialCollapsibleState;
        self.renderDetails = renderDetails;
        self.renderCast = renderCast;
        self.renderMediaSources = renderMediaSources
    }

    function bindAll(view, selector, eventName, fn) {

        var elems = view.querySelectorAll(selector);
        var i, length;
        for (i = 0, length = elems.length; i < length; i++) {
            elems[i].addEventListener(eventName, fn);
        }
    }

    function onTrackSelectionsSubmit(e) {
        return e.preventDefault(), false
    }
    return window.ItemDetailPage = new itemDetailPage,
    function (view, params) {
        function reload(instance, page, params) {
            loading.show();
            var apiClient = params.serverId ? connectionManager.getApiClient(params.serverId) : ApiClient,
                promises = [getPromise(apiClient, params), apiClient.getCurrentUser()];
            Promise.all(promises).then(function (responses) {
                var item = responses[0];
                var user = responses[1];
                currentItem = item;
                reloadFromItem(instance, page, params, item, user)
            })
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
            }
        }

        function playItem(item, startPosition) {
            var playOptions = getPlayOptions(startPosition);
            playOptions.items = [item], playbackManager.play(playOptions)
        }

        function playTrailer(page) {
            playbackManager.playTrailers(currentItem)
        }

        function playCurrentItem(button, mode) {
            var item = currentItem;
            if (item.Type === "Program") {
                var apiClient = connectionManager.getApiClient(item.ServerId);
                apiClient.getLiveTvChannel(item.ChannelId, apiClient.getCurrentUserId()).then(function (channel) {
                    playbackManager.play({
                        items: [channel]
                    });
                });
                return;
            }
            playItem(item, item.UserData && "resume" === mode ? item.UserData.PlaybackPositionTicks : 0)
        }

        function onPlayClick() {
            playCurrentItem(this, this.getAttribute("data-mode"))
        }

        function onInstantMixClick() {
            playbackManager.instantMix(currentItem)
        }

        function onShuffleClick() {
            playbackManager.shuffle(currentItem)
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
            playTrailer(view)
        }

        function onDownloadChange() {
            reload(self, view, params)
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
            setTrailerButtonVisibility(view, currentItem)
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
            if (msg.MessageType === "UserDataChanged") {
                if (currentItem && msg.Data.UserId == apiClient.getCurrentUserId()) {
                    var key = currentItem.UserData.Key;
                    var userData = msg.Data.UserDataList.filter(function (u) {
                        return u.Key == key;
                    })[0];
                    if (userData) {
                        currentItem.UserData = userData;
                        reloadPlayButtons(view, currentItem);
                        apiClient.getCurrentUser().then(function (user) {
                            refreshImage(view, currentItem, user);
                        });
                    }
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
        view.querySelector(".btnMoreCommands i").innerHTML = "&#xE5D3;";
        view.querySelector(".trackSelections").addEventListener("submit", onTrackSelectionsSubmit);
        view.querySelector(".btnSplitVersions").addEventListener("click", function () {
            splitVersions(self, view, apiClient, params)
        });
        bindAll(view, ".btnMoreCommands", "click", onMoreCommandsClick);
        view.querySelector(".selectSource").addEventListener("change", function () {
            renderVideoSelections(view, self._currentPlaybackMediaSources);
            renderAudioSelections(view, self._currentPlaybackMediaSources);
            renderSubtitleSelections(view, self._currentPlaybackMediaSources);
        });
        view.addEventListener("click", function (e) {
            if (dom.parentWithClass(e.target, "moreScenes")) {
                apiClient.getCurrentUser().then(function (user) {
                    renderScenes(view, currentItem, user);
                });
            } else if (dom.parentWithClass(e.target, "morePeople")) {
                renderCast(view, currentItem, params.context);
            } else if (dom.parentWithClass(e.target, "moreSpecials")) {
                apiClient.getCurrentUser().then(function (user) {
                    renderSpecials(view, currentItem, user);
                });
            }
        });
        view.querySelector(".detailImageContainer").addEventListener("click", function (e) {
            var itemDetailGalleryLink = dom.parentWithClass(e.target, "itemDetailGalleryLink");
            if (itemDetailGalleryLink) {
                editImages().then(function () {
                    reload(self, view, params);
                });
            }
        });
        view.addEventListener("viewshow", function (e) {
            var page = this;
            libraryMenu.setTransparentMenu(true), e.detail.isRestored ? currentItem && (setTitle(currentItem, connectionManager.getApiClient(currentItem.ServerId)), renderTrackSelections(page, self, currentItem, true)) : reload(self, page, params), events.on(apiClient, "message", onWebSocketMessage), events.on(playbackManager, "playerchange", onPlayerChange)
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
        })
    }
});
