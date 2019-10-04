define(["jQuery", "apphost", "scripts/taskbutton", "loading", "libraryMenu", "globalize", "dom", "indicators", "scripts/imagehelper", "cardStyle", "emby-itemrefreshindicator"], function ($, appHost, taskButton, loading, libraryMenu, globalize, dom, indicators, imageHelper) {
    "use strict";

    function addVirtualFolder(page) {
        require(["medialibrarycreator"], function (medialibrarycreator) {
            new medialibrarycreator().show({
                collectionTypeOptions: getCollectionTypeOptions().filter(function (f) {
                    return !f.hidden;
                }),
                refresh: shouldRefreshLibraryAfterChanges(page)
            }).then(function (hasChanges) {
                if (hasChanges) {
                    reloadLibrary(page);
                }
            });
        });
    }

    function editVirtualFolder(page, virtualFolder) {
        require(["medialibraryeditor"], function (medialibraryeditor) {
            new medialibraryeditor().show({
                refresh: shouldRefreshLibraryAfterChanges(page),
                library: virtualFolder
            }).then(function (hasChanges) {
                if (hasChanges) {
                    reloadLibrary(page);
                }
            });
        });
    }

    function deleteVirtualFolder(page, virtualFolder) {
        var msg = globalize.translate("MessageAreYouSureYouWishToRemoveMediaFolder");

        if (virtualFolder.Locations.length) {
            msg += "<br/><br/>" + globalize.translate("MessageTheFollowingLocationWillBeRemovedFromLibrary") + "<br/><br/>";
            msg += virtualFolder.Locations.join("<br/>");
        }

        require(["confirm"], function (confirm) {
            confirm({

                text: msg,
                title: globalize.translate('HeaderRemoveMediaFolder'),
                confirmText: globalize.translate('Delete'),
                primary: 'delete'

            }).then(function () {
                var refreshAfterChange = shouldRefreshLibraryAfterChanges(page);
                ApiClient.removeVirtualFolder(virtualFolder.Name, refreshAfterChange).then(function () {
                    reloadLibrary(page);
                });
            });
        });
    }

    function refreshVirtualFolder(page, virtualFolder) {
        require(["refreshDialog"], function (refreshDialog) {
            new refreshDialog({
                itemIds: [virtualFolder.ItemId],
                serverId: ApiClient.serverId(),
                mode: "scan"
            }).show();
        });
    }

    function renameVirtualFolder(page, virtualFolder) {
        require(["prompt"], function (prompt) {
            prompt({
                label: globalize.translate("LabelNewName"),
                confirmText: globalize.translate("ButtonRename")
            }).then(function (newName) {
                if (newName && newName != virtualFolder.Name) {
                    var refreshAfterChange = shouldRefreshLibraryAfterChanges(page);
                    ApiClient.renameVirtualFolder(virtualFolder.Name, newName, refreshAfterChange).then(function () {
                        reloadLibrary(page);
                    });
                }
            });
        });
    }

    function showCardMenu(page, elem, virtualFolders) {
        var card = dom.parentWithClass(elem, "card");
        var index = parseInt(card.getAttribute("data-index"));
        var virtualFolder = virtualFolders[index];
        var menuItems = [];
        menuItems.push({
            name: globalize.translate("ButtonEditImages"),
            id: "editimages",
            ironIcon: "photo"
        });
        menuItems.push({
            name: globalize.translate("ManageLibrary"),
            id: "edit",
            ironIcon: "folder_open"
        });
        menuItems.push({
            name: globalize.translate("ButtonRemove"),
            id: "delete",
            ironIcon: "remove"
        });
        menuItems.push({
            name: globalize.translate("ButtonRename"),
            id: "rename",
            ironIcon: "mode_edit"
        });
        menuItems.push({
            name: globalize.translate("ScanLibrary"),
            id: "refresh",
            ironIcon: "refresh"
        });

        require(["actionsheet"], function (actionsheet) {
            actionsheet.show({
                items: menuItems,
                positionTo: elem,
                callback: function (resultId) {
                    switch (resultId) {
                        case "edit":
                            editVirtualFolder(page, virtualFolder);
                            break;

                        case "editimages":
                            editImages(page, virtualFolder);
                            break;

                        case "rename":
                            renameVirtualFolder(page, virtualFolder);
                            break;

                        case "delete":
                            deleteVirtualFolder(page, virtualFolder);
                            break;

                        case "refresh":
                            refreshVirtualFolder(page, virtualFolder);
                    }
                }
            });
        });
    }

    function reloadLibrary(page) {
        loading.show();
        ApiClient.getVirtualFolders().then(function (result) {
            reloadVirtualFolders(page, result);
        });
    }

    function shouldRefreshLibraryAfterChanges(page) {
        return "mediaLibraryPage" === page.id;
    }

    function reloadVirtualFolders(page, virtualFolders) {
        var html = "";
        virtualFolders.push({
            Name: globalize.translate("ButtonAddMediaLibrary"),
            icon: "add_circle",
            Locations: [],
            showType: false,
            showLocations: false,
            showMenu: false,
            showNameWithIcon: true
        });

        for (var i = 0; i < virtualFolders.length; i++) {
            var virtualFolder = virtualFolders[i];
            html += getVirtualFolderHtml(page, virtualFolder, i);
        }

        var divVirtualFolders = page.querySelector("#divVirtualFolders");
        divVirtualFolders.innerHTML = html;
        divVirtualFolders.classList.add("itemsContainer");
        divVirtualFolders.classList.add("vertical-wrap");
        $(".btnCardMenu", divVirtualFolders).on("click", function () {
            showCardMenu(page, this, virtualFolders);
        });
        divVirtualFolders.querySelector(".addLibrary").addEventListener("click", function () {
            addVirtualFolder(page);
        });
        $(".editLibrary", divVirtualFolders).on("click", function () {
            var card = $(this).parents(".card")[0];
            var index = parseInt(card.getAttribute("data-index"));
            var virtualFolder = virtualFolders[index];

            if (virtualFolder.ItemId) {
                editVirtualFolder(page, virtualFolder);
            }
        });
        loading.hide();
    }

    function editImages(page, virtualFolder) {
        require(["imageEditor"], function (imageEditor) {
            imageEditor.show({
                itemId: virtualFolder.ItemId,
                serverId: ApiClient.serverId()
            }).then(function () {
                reloadLibrary(page);
            });
        });
    }

    function getLink(text, url) {
        return globalize.translate(text, '<a is="emby-linkbutton" class="button-link" href="' + url + '" target="_blank" data-autohide="true">', "</a>");
    }

    function getCollectionTypeOptions() {
        return [{
            name: "",
            value: ""
        }, {
            name: globalize.translate("FolderTypeMovies"),
            value: "movies",
            message: getLink("MovieLibraryHelp", "https://docs.jellyfin.org/general/server/media/movies.html")
        }, {
            name: globalize.translate("FolderTypeMusic"),
            value: "music",
            message: getLink("MusicLibraryHelp", "https://docs.jellyfin.org/general/server/media/music.html")
        }, {
            name: globalize.translate("FolderTypeTvShows"),
            value: "tvshows",
            message: getLink("TvLibraryHelp", "https://docs.jellyfin.org/general/server/media/shows.html")
        }, {
            name: globalize.translate("FolderTypeBooks"),
            value: "books",
            message: getLink("BookLibraryHelp", "https://docs.jellyfin.org/general/server/media/books.html")
        }, {
            name: globalize.translate("OptionHomeVideos"),
            value: "homevideos"
        }, {
            name: globalize.translate("FolderTypeMusicVideos"),
            value: "musicvideos"
        }, {
            name: globalize.translate("FolderTypeUnset"),
            value: "mixed",
            message: globalize.translate("MessageUnsetContentHelp")
        }];
    }

    function getVirtualFolderHtml(page, virtualFolder, index) {
        var html = "";
        var style = "";

        if (page.classList.contains("wizardPage")) {
            style += "min-width:33.3%;";
        }

        html += '<div class="card backdropCard scalableCard backdropCard-scalable" style="' + style + '" data-index="' + index + '" data-id="' + virtualFolder.ItemId + '">';
        html += '<div class="cardBox visualCardBox">';
        html += '<div class="cardScalable visualCardBox-cardScalable">';
        html += '<div class="cardPadder cardPadder-backdrop"></div>';
        html += '<div class="cardContent">';
        var imgUrl = "";

        if (virtualFolder.PrimaryImageItemId) {
            imgUrl = ApiClient.getScaledImageUrl(virtualFolder.PrimaryImageItemId, {
                type: "Primary"
            });
        }

        var hasCardImageContainer;

        if (imgUrl) {
            html += '<div class="cardImageContainer editLibrary" style="cursor:pointer;background-image:url(\'' + imgUrl + "');\">";
            hasCardImageContainer = true;
        } else if (!virtualFolder.showNameWithIcon) {
            html += '<div class="cardImageContainer editLibrary" style="cursor:pointer;">';
            html += '<i class="cardImageIcon-small md-icon">' + (virtualFolder.icon || imageHelper.getLibraryIcon(virtualFolder.CollectionType)) + "</i>";
            hasCardImageContainer = true;
        }

        if (hasCardImageContainer) {
            html += '<div class="cardIndicators backdropCardIndicators">';
            html += '<div is="emby-itemrefreshindicator"' + (virtualFolder.RefreshProgress || virtualFolder.RefreshStatus && "Idle" !== virtualFolder.RefreshStatus ? "" : ' class="hide"') + ' data-progress="' + (virtualFolder.RefreshProgress || 0) + '" data-status="' + virtualFolder.RefreshStatus + '"></div>';
            html += "</div>";
            html += "</div>";
        }

        if (!imgUrl && virtualFolder.showNameWithIcon) {
            html += '<h3 class="cardImageContainer addLibrary" style="position:absolute;top:0;left:0;right:0;bottom:0;cursor:pointer;flex-direction:column;">';
            html += '<i class="cardImageIcon-small md-icon">' + (virtualFolder.icon || imageHelper.getLibraryIcon(virtualFolder.CollectionType)) + "</i>";

            if (virtualFolder.showNameWithIcon) {
                html += '<div style="margin:1em 0;position:width:100%;">';
                html += virtualFolder.Name;
                html += "</div>";
            }

            html += "</h3>";
        }

        html += "</div>";
        html += "</div>";
        html += '<div class="cardFooter visualCardBox-cardFooter">'; // always show menu unless explicitly hidden

        if (virtualFolder.showMenu !== false) {
            html += '<div style="text-align:right; float:right;padding-top:5px;">';
            html += '<button type="button" is="paper-icon-button-light" class="btnCardMenu autoSize"><i class="md-icon">&#xE5D3;</i></button>';
            html += "</div>";
        }

        html += "<div class='cardText'>";

        if (virtualFolder.showNameWithIcon) {
            html += "&nbsp;";
        } else {
            html += virtualFolder.Name;
        }

        html += "</div>";
        var typeName = getCollectionTypeOptions().filter(function (t) {
            return t.value == virtualFolder.CollectionType;
        })[0];
        typeName = typeName ? typeName.name : globalize.translate("FolderTypeUnset");
        html += "<div class='cardText cardText-secondary'>";

        if (virtualFolder.showType === false) {
            html += "&nbsp;";
        } else {
            html += typeName;
        }

        html += "</div>";

        if (virtualFolder.showLocations === false) {
            html += "<div class='cardText cardText-secondary'>";
            html += "&nbsp;";
            html += "</div>";
        } else if (virtualFolder.Locations.length && virtualFolder.Locations.length === 1) {
            html += "<div class='cardText cardText-secondary'>";
            html += virtualFolder.Locations[0];
            html += "</div>";
        } else {
            html += "<div class='cardText cardText-secondary'>";
            html += globalize.translate("NumLocationsValue", virtualFolder.Locations.length);
            html += "</div>";
        }

        html += "</div>";
        html += "</div>";
        html += "</div>";
        return html;
    }

    function getTabs() {
        return [{
            href: "library.html",
            name: globalize.translate("HeaderLibraries")
        }, {
            href: "librarydisplay.html",
            name: globalize.translate("TabDisplay")
        }, {
            href: "metadataimages.html",
            name: globalize.translate("TabMetadata")
        }, {
            href: "metadatanfo.html",
            name: globalize.translate("TabNfoSettings")
        }];
    }

    window.WizardLibraryPage = {
        next: function () {
            Dashboard.navigate("wizardsettings.html");
        }
    };
    pageClassOn("pageshow", "mediaLibraryPage", function () {
        reloadLibrary(this);
    });
    pageIdOn("pageshow", "mediaLibraryPage", function () {
        libraryMenu.setTabs("librarysetup", 0, getTabs);
        var page = this;
        taskButton({
            mode: "on",
            progressElem: page.querySelector(".refreshProgress"),
            taskKey: "RefreshLibrary",
            button: page.querySelector(".btnRefresh")
        });
    });
    pageIdOn("pagebeforehide", "mediaLibraryPage", function () {
        var page = this;
        taskButton({
            mode: "off",
            progressElem: page.querySelector(".refreshProgress"),
            taskKey: "RefreshLibrary",
            button: page.querySelector(".btnRefresh")
        });
    });
});
