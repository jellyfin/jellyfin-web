define(["loading", "appRouter", "layoutManager", "appSettings", "apphost", "focusManager", "connectionManager", "backdrop", "globalize", "staticBackdrops", "actionsheet", "dom", "material-icons", "flexStyles", "emby-scroller", "emby-itemscontainer", "cardStyle", "emby-button"], function(loading, appRouter, layoutManager, appSettings, appHost, focusManager, connectionManager, backdrop, globalize, staticBackdrops, actionSheet, dom) {
    "use strict";

    function renderSelectServerItems(view, servers) {
        var items = servers.map(function(server) {
                return {
                    name: server.Name,
                    showIcon: !0,
                    icon: "&#xE307;",
                    cardType: "",
                    id: server.Id,
                    server: server
                }
            }),
            html = items.map(function(item) {
                var cardImageContainer;
                cardImageContainer = item.showIcon ? '<i class="cardImageIcon md-icon">' + item.icon + "</i>" : '<div class="cardImage" style="' + item.cardImageStyle + '"></div>';
                var cardBoxCssClass = "cardBox";
                layoutManager.tv && (cardBoxCssClass += " cardBox-focustransform");
                var innerOpening = '<div class="' + cardBoxCssClass + '">';
                return '<button raised class="card overflowSquareCard loginSquareCard scalableCard overflowSquareCard-scalable" style="display:inline-block;" data-id="' + item.id + '" data-url="' + (item.url || "") + '" data-cardtype="' + item.cardType + '">' + innerOpening + '<div class="cardScalable card-focuscontent"><div class="cardPadder cardPadder-square"></div><div class="cardContent"><div class="cardImageContainer coveredImage" style="background:#0288D1;border-radius:.15em;">' + cardImageContainer + '</div></div></div><div class="cardFooter"><div class="cardText cardTextCentered">' + item.name + "</div></div></div></button>"
            }).join(""),
            itemsContainer = view.querySelector(".servers");
        items.length || (html = "<p>" + globalize.translate("MessageNoServersAvailableToConnect") + "</p>"), itemsContainer.innerHTML = html, loading.hide()
    }

    function updatePageStyle(view, params) {
        "1" == params.showuser ? (view.classList.add("libraryPage"), view.classList.remove("standalonePage"), view.classList.add("noSecondaryNavPage")) : (view.classList.add("standalonePage"), view.classList.remove("libraryPage"), view.classList.remove("noSecondaryNavPage"))
    }

    function showGeneralError() {
        loading.hide(), alertText(globalize.translate("DefaultErrorMessage"))
    }

    function alertText(text) {
        alertTextWithOptions({
            text: text
        })
    }

    function alertTextWithOptions(options) {
        require(["alert"], function(alert) {
            alert(options)
        })
    }

    function showServerConnectionFailure() {
        alertText(globalize.translate("MessageUnableToConnectToServer"), globalize.translate("HeaderConnectionFailure"))
    }

    return function(view, params) {
        function connectToServer(server) {
            loading.show(), connectionManager.connectToServer(server, {
                enableAutoLogin: appSettings.enableAutoLogin()
            }).then(function(result) {
                loading.hide();
                var apiClient = result.ApiClient;
                switch (result.State) {
                    case "SignedIn":
                        Dashboard.onServerChanged(apiClient.getCurrentUserId(), apiClient.accessToken(), apiClient), Dashboard.navigate("home.html");
                        break;
                    case "ServerSignIn":
                        Dashboard.onServerChanged(null, null, apiClient), Dashboard.navigate("login.html?serverid=" + result.Servers[0].Id);
                        break;
                    case "ServerUpdateNeeded":
                        alertTextWithOptions({
                            text: globalize.translate("core#ServerUpdateNeeded", "https://github.com/jellyfin/jellyfin"),
                            html: globalize.translate("core#ServerUpdateNeeded", '<a href="https://github.com/jellyfin/jellyfin">https://github.com/jellyfin/jellyfin</a>')
                        });
                        break;
                    default:
                        showServerConnectionFailure()
                }
            })
        }

        function deleteServer(server) {
            loading.show(), connectionManager.deleteServer(server.Id).then(function() {
                loading.hide(), loadServers()
            }, function() {
                loading.hide(), loadServers()
            })
        }

        function onServerClick(server) {
            var menuItems = [];
            menuItems.push({
                name: globalize.translate("Connect"),
                id: "connect"
            }), menuItems.push({
                name: globalize.translate("Delete"),
                id: "delete"
            });
            actionSheet.show({
                items: menuItems,
                title: server.Name
            }).then(function(id) {
                switch (id) {
                    case "connect":
                        connectToServer(server);
                        break;
                    case "delete":
                        deleteServer(server);
                }
            })
        }

        function onServersRetrieved(result) {
            servers = result, renderSelectServerItems(view, result), layoutManager.tv && focusManager.autoFocus(view)
        }

        function loadServers() {
            loading.show(), connectionManager.getAvailableServers().then(onServersRetrieved, function(result) {
                onServersRetrieved([])
            })
        }
        var servers;
        layoutManager.desktop;
        updatePageStyle(view, params);
        var backdropUrl = staticBackdrops.getRandomImageUrl();
        view.addEventListener("viewshow", function(e) {
            var isRestored = e.detail.isRestored;
            appRouter.setTitle(null);
            backdrop.setBackdrop(backdropUrl);
            if (!isRestored) loadServers();
        }), view.querySelector(".servers").addEventListener("click", function(e) {
            var card = dom.parentWithClass(e.target, "card");
            if (card) {
                var url = card.getAttribute("data-url");
                if (url) appRouter.show(url);
                else {
                    var id = card.getAttribute("data-id");
                    onServerClick(servers.filter(function(s) {
                        return s.Id === id
                    })[0])
                }
            }
        })
    }
});
