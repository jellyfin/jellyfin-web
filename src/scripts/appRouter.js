define(["components/appRouter", "itemHelper"], function (appRouter, itemHelper) {
    function showItem(item, serverId, options) {
        if ("string" == typeof item) {
            require(["connectionManager"], function (connectionManager) {
                var apiClient = connectionManager.currentApiClient();
                apiClient.getItem(apiClient.getCurrentUserId(), item).then(function (item) {
                    appRouter.showItem(item, options);
                });
            });
        } else {
            if (2 == arguments.length) {
                options = arguments[1];
            }

            appRouter.show("/" + appRouter.getRouteUrl(item, options), {
                item: item
            });
        }
    }

    appRouter.showLocalLogin = function (serverId, manualLogin) {
        Dashboard.navigate("login.html?serverid=" + serverId);
    };

    appRouter.showVideoOsd = function () {
        return Dashboard.navigate("videoosd.html");
    };

    appRouter.showSelectServer = function () {
        Dashboard.navigate(AppInfo.isNativeApp ? "selectserver.html" : "login.html");
    };

    appRouter.showWelcome = function () {
        Dashboard.navigate(AppInfo.isNativeApp ? "selectserver.html" : "login.html");
    };

    appRouter.showSettings = function () {
        Dashboard.navigate("mypreferencesmenu.html");
    };

    appRouter.showGuide = function () {
        Dashboard.navigate("livetv.html?tab=1");
    };

    appRouter.goHome = function () {
        Dashboard.navigate("home.html");
    };

    appRouter.showSearch = function () {
        Dashboard.navigate("search.html");
    };

    appRouter.showLiveTV = function () {
        Dashboard.navigate("livetv.html");
    };

    appRouter.showRecordedTV = function () {
        Dashboard.navigate("livetv.html?tab=3");
    };

    appRouter.showFavorites = function () {
        Dashboard.navigate("home.html?tab=1");
    };

    appRouter.showSettings = function () {
        Dashboard.navigate("mypreferencesmenu.html");
    };

    appRouter.showNowPlaying = function () {
        Dashboard.navigate("nowplaying.html");
    };

    appRouter.setTitle = function (title) {
        LibraryMenu.setTitle(title);
    };

    appRouter.getRouteUrl = function (item, options) {
        if (!item) {
            throw new Error("item cannot be null");
        }

        if (item.url) {
            return item.url;
        }

        var context = options ? options.context : null;
        var id = item.Id || item.ItemId;

        if (!options) {
            options = {};
        }

        var url;
        var itemType = item.Type || (options ? options.itemType : null);
        var serverId = item.ServerId || options.serverId;

        if ("settings" === item) {
            return "mypreferencesmenu.html";
        }

        if ("wizard" === item) {
            return "wizardstart.html";
        }

        if ("manageserver" === item) {
            return "dashboard.html";
        }

        if ("recordedtv" === item) {
            return "livetv.html?tab=3&serverId=" + options.serverId;
        }

        if ("nextup" === item) {
            return "list.html?type=nextup&serverId=" + options.serverId;
        }

        if ("list" === item) {
            var url = "list.html?serverId=" + options.serverId + "&type=" + options.itemTypes;

            if (options.isFavorite) {
                url += "&IsFavorite=true";
            }

            return url;
        }

        if ("livetv" === item) {
            if ("programs" === options.section) {
                return "livetv.html?tab=0&serverId=" + options.serverId;
            }
            if ("guide" === options.section) {
                return "livetv.html?tab=1&serverId=" + options.serverId;
            }

            if ("movies" === options.section) {
                return "list.html?type=Programs&IsMovie=true&serverId=" + options.serverId;
            }

            if ("shows" === options.section) {
                return "list.html?type=Programs&IsSeries=true&IsMovie=false&IsNews=false&serverId=" + options.serverId;
            }

            if ("sports" === options.section) {
                return "list.html?type=Programs&IsSports=true&serverId=" + options.serverId;
            }

            if ("kids" === options.section) {
                return "list.html?type=Programs&IsKids=true&serverId=" + options.serverId;
            }

            if ("news" === options.section) {
                return "list.html?type=Programs&IsNews=true&serverId=" + options.serverId;
            }

            if ("onnow" === options.section) {
                return "list.html?type=Programs&IsAiring=true&serverId=" + options.serverId;
            }

            if ("dvrschedule" === options.section) {
                return "livetv.html?tab=4&serverId=" + options.serverId;
            }

            if ("seriesrecording" === options.section) {
                return "livetv.html?tab=5&serverId=" + options.serverId;
            }

            return "livetv.html?serverId=" + options.serverId;
        }

        if ("SeriesTimer" == itemType) {
            return "itemdetails.html?seriesTimerId=" + id + "&serverId=" + serverId;
        }

        if ("livetv" == item.CollectionType) {
            return "livetv.html";
        }

        if ("Genre" === item.Type) {
            url = "list.html?genreId=" + item.Id + "&serverId=" + serverId;

            if ("livetv" === context) {
                url += "&type=Programs";
            }

            if (options.parentId) {
                url += "&parentId=" + options.parentId;
            }

            return url;
        }

        if ("MusicGenre" === item.Type) {
            url = "list.html?musicGenreId=" + item.Id + "&serverId=" + serverId;

            if (options.parentId) {
                url += "&parentId=" + options.parentId;
            }

            return url;
        }

        if ("Studio" === item.Type) {
            url = "list.html?studioId=" + item.Id + "&serverId=" + serverId;

            if (options.parentId) {
                url += "&parentId=" + options.parentId;
            }

            return url;
        }

        if ("folders" !== context && !itemHelper.isLocalItem(item)) {
            if ("movies" == item.CollectionType) {
                url = "movies.html?topParentId=" + item.Id;

                if (options && "latest" === options.section) {
                    url += "&tab=1";
                }

                return url;
            }

            if ("tvshows" == item.CollectionType) {
                url = "tv.html?topParentId=" + item.Id;

                if (options && "latest" === options.section) {
                    url += "&tab=2";
                }

                return url;
            }

            if ("music" == item.CollectionType) {
                return "music.html?topParentId=" + item.Id;
            }
        }

        var itemTypes = ["Playlist", "TvChannel", "Program", "BoxSet", "MusicAlbum", "MusicGenre", "Person", "Recording", "MusicArtist"];

        if (itemTypes.indexOf(itemType) >= 0) {
            return "itemdetails.html?id=" + id + "&serverId=" + serverId;
        }

        var contextSuffix = context ? "&context=" + context : "";

        if ("Series" == itemType || "Season" == itemType || "Episode" == itemType) {
            return "itemdetails.html?id=" + id + contextSuffix + "&serverId=" + serverId;
        }

        if (item.IsFolder) {
            if (id) {
                return "list.html?parentId=" + id + "&serverId=" + serverId;
            }

            return "#";
        }

        return "itemdetails.html?id=" + id + "&serverId=" + serverId;
    };

    appRouter.showItem = showItem;
    return appRouter;
});
