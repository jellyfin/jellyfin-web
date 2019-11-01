define(["connectionManager", "listView", "cardBuilder", "imageLoader", "libraryBrowser", "emby-itemscontainer", "emby-button"], function (connectionManager, listView, cardBuilder, imageLoader, libraryBrowser) {
    "use strict";

    function renderItems(page, item) {
        var sections = [];

        if (item.ArtistCount) {
            sections.push({
                name: Globalize.translate("TabArtists"),
                type: "MusicArtist"
            });
        }

        if (item.ProgramCount && "Person" == item.Type) {
            sections.push({
                name: Globalize.translate("HeaderUpcomingOnTV"),
                type: "Program"
            });
        }

        if (item.MovieCount) {
            sections.push({
                name: Globalize.translate("TabMovies"),
                type: "Movie"
            });
        }

        if (item.SeriesCount) {
            sections.push({
                name: Globalize.translate("TabShows"),
                type: "Series"
            });
        }

        if (item.EpisodeCount) {
            sections.push({
                name: Globalize.translate("TabEpisodes"),
                type: "Episode"
            });
        }

        if (item.TrailerCount) {
            sections.push({
                name: Globalize.translate("TabTrailers"),
                type: "Trailer"
            });
        }

        if (item.AlbumCount) {
            sections.push({
                name: Globalize.translate("TabAlbums"),
                type: "MusicAlbum"
            });
        }

        if (item.MusicVideoCount) {
            sections.push({
                name: Globalize.translate("TabMusicVideos"),
                type: "MusicVideo"
            });
        }

        var elem = page.querySelector("#childrenContent");
        elem.innerHTML = sections.map(function (section) {
            var html = "";
            var sectionClass = "verticalSection";

            if ("Audio" === section.type) {
                sectionClass += " verticalSection-extrabottompadding";
            }

            html += '<div class="' + sectionClass + '" data-type="' + section.type + '">';
            html += '<div class="sectionTitleContainer sectionTitleContainer-cards">';
            html += '<h2 class="sectionTitle sectionTitle-cards padded-left">';
            html += section.name;
            html += "</h2>";
            html += '<a is="emby-linkbutton" href="#" class="clearLink hide" style="margin-left:1em;vertical-align:middle;"><button is="emby-button" type="button" class="raised more raised-mini noIcon">' + Globalize.translate("ButtonMore") + "</button></a>";
            html += "</div>";
            html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right">';
            html += "</div>";
            return html += "</div>";
        }).join("");
        var sectionElems = elem.querySelectorAll(".verticalSection");

        for (var i = 0, length = sectionElems.length; i < length; i++) {
            renderSection(page, item, sectionElems[i], sectionElems[i].getAttribute("data-type"));
        }
    }

    function renderSection(page, item, element, type) {
        switch (type) {
            case "Program":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Program",
                    PersonTypes: "",
                    ArtistIds: "",
                    AlbumArtistIds: "",
                    Limit: 10,
                    SortBy: "StartDate"
                }, {
                    shape: "backdrop",
                    showTitle: true,
                    centerText: true,
                    overlayMoreButton: true,
                    preferThumb: true,
                    overlayText: false,
                    showAirTime: true,
                    showAirDateTime: true,
                    showChannelName: true
                });
                break;

            case "Movie":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Movie",
                    PersonTypes: "",
                    ArtistIds: "",
                    AlbumArtistIds: "",
                    Limit: 10,
                    SortBy: "SortName"
                }, {
                    shape: "portrait",
                    showTitle: true,
                    centerText: true,
                    overlayMoreButton: true,
                    overlayText: false,
                    showYear: true
                });
                break;

            case "MusicVideo":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "MusicVideo",
                    PersonTypes: "",
                    ArtistIds: "",
                    AlbumArtistIds: "",
                    Limit: 10,
                    SortBy: "SortName"
                }, {
                    shape: "portrait",
                    showTitle: true,
                    centerText: true,
                    overlayPlayButton: true
                });
                break;

            case "Trailer":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Trailer",
                    PersonTypes: "",
                    ArtistIds: "",
                    AlbumArtistIds: "",
                    Limit: 10,
                    SortBy: "SortName"
                }, {
                    shape: "portrait",
                    showTitle: true,
                    centerText: true,
                    overlayPlayButton: true
                });
                break;

            case "Series":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Series",
                    PersonTypes: "",
                    ArtistIds: "",
                    AlbumArtistIds: "",
                    Limit: 10,
                    SortBy: "SortName"
                }, {
                    shape: "portrait",
                    showTitle: true,
                    centerText: true,
                    overlayMoreButton: true
                });
                break;

            case "MusicAlbum":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "MusicAlbum",
                    PersonTypes: "",
                    ArtistIds: "",
                    AlbumArtistIds: "",
                    SortOrder: "Descending",
                    SortBy: "ProductionYear,Sortname"
                }, {
                    shape: "square",
                    playFromHere: true,
                    showTitle: true,
                    showYear: true,
                    coverImage: true,
                    centerText: true,
                    overlayPlayButton: true
                });
                break;

            case "MusicArtist":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "MusicArtist",
                    PersonTypes: "",
                    ArtistIds: "",
                    AlbumArtistIds: "",
                    Limit: 8,
                    SortBy: "SortName"
                }, {
                    shape: "square",
                    playFromHere: true,
                    showTitle: true,
                    showParentTitle: true,
                    coverImage: true,
                    centerText: true,
                    overlayPlayButton: true
                });
                break;

            case "Episode":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Episode",
                    PersonTypes: "",
                    ArtistIds: "",
                    AlbumArtistIds: "",
                    Limit: 6,
                    SortBy: "SortName"
                }, {
                    shape: "backdrop",
                    showTitle: true,
                    showParentTitle: true,
                    centerText: true,
                    overlayPlayButton: true
                });
                break;

            case "Audio":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Audio",
                    PersonTypes: "",
                    ArtistIds: "",
                    AlbumArtistIds: "",
                    SortBy: "AlbumArtist,Album,SortName"
                }, {
                    playFromHere: true,
                    action: "playallfromhere",
                    smallIcon: true,
                    artist: true
                });
        }
    }

    function loadItems(element, item, type, query, listOptions) {
        query = getQuery(query, item);
        getItemsFunction(query, item)(query.StartIndex, query.Limit, query.Fields).then(function (result) {
            var html = "";

            if (query.Limit && result.TotalRecordCount > query.Limit) {
                var link = element.querySelector("a");
                link.classList.remove("hide");
                link.setAttribute("href", getMoreItemsHref(item, type));
            } else {
                element.querySelector("a").classList.add("hide");
            }

            listOptions.items = result.Items;
            var itemsContainer = element.querySelector(".itemsContainer");

            if ("Audio" == type) {
                html = listView.getListViewHtml(listOptions);
                itemsContainer.classList.remove("vertical-wrap");
                itemsContainer.classList.add("vertical-list");
            } else {
                html = cardBuilder.getCardsHtml(listOptions);
                itemsContainer.classList.add("vertical-wrap");
                itemsContainer.classList.remove("vertical-list");
            }

            itemsContainer.innerHTML = html;
            imageLoader.lazyChildren(itemsContainer);
        });
    }

    function getMoreItemsHref(item, type) {
        if ("Genre" == item.Type) {
            return "list.html?type=" + type + "&genreId=" + item.Id + "&serverId=" + item.ServerId;
        }

        if ("MusicGenre" == item.Type) {
            return "list.html?type=" + type + "&musicGenreId=" + item.Id + "&serverId=" + item.ServerId;
        }

        if ("Studio" == item.Type) {
            return "list.html?type=" + type + "&studioId=" + item.Id + "&serverId=" + item.ServerId;
        }

        if ("MusicArtist" == item.Type) {
            return "list.html?type=" + type + "&artistId=" + item.Id + "&serverId=" + item.ServerId;
        }

        if ("Person" == item.Type) {
            return "list.html?type=" + type + "&personId=" + item.Id + "&serverId=" + item.ServerId;
        }

        return "list.html?type=" + type + "&parentId=" + item.Id + "&serverId=" + item.ServerId;
    }

    function addCurrentItemToQuery(query, item) {
        if (item.Type == "Person") {
            query.PersonIds = item.Id;
        } else if (item.Type == "Genre") {
            query.Genres = item.Name;
        } else if (item.Type == "MusicGenre") {
            query.Genres = item.Name;
        } else if (item.Type == "GameGenre") {
            query.Genres = item.Name;
        } else if (item.Type == "Studio") {
            query.StudioIds = item.Id;
        } else if (item.Type == "MusicArtist") {
            query.AlbumArtistIds = item.Id;
        }
    }

    function getQuery(options, item) {
        var query = {
            SortOrder: "Ascending",
            IncludeItemTypes: "",
            Recursive: true,
            Fields: "AudioInfo,SeriesInfo,ParentId,PrimaryImageAspectRatio,BasicSyncInfo",
            Limit: 100,
            StartIndex: 0,
            CollapseBoxSetItems: false
        };
        query = Object.assign(query, options || {});
        addCurrentItemToQuery(query, item);
        return query;
    }

    function getItemsFunction(options, item) {
        var query = getQuery(options, item);
        return function (index, limit, fields) {
            query.StartIndex = index;
            query.Limit = limit;

            if (fields) {
                query.Fields += "," + fields;
            }

            var apiClient = connectionManager.getApiClient(item.ServerId);

            if ("MusicArtist" === query.IncludeItemTypes) {
                query.IncludeItemTypes = null;
                return apiClient.getAlbumArtists(apiClient.getCurrentUserId(), query);
            }

            return apiClient.getItems(apiClient.getCurrentUserId(), query);
        };
    }

    window.ItemsByName = {
        renderItems: renderItems
    };
});
