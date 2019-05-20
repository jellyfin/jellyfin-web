define(["loading", "dialogHelper", "dom", "jQuery", "components/libraryoptionseditor/libraryoptionseditor", "emby-toggle", "emby-input", "emby-select", "paper-icon-button-light", "listViewStyle", "formDialogStyle", "emby-button", "flexStyles"], function(loading, dialogHelper, dom, $, libraryoptionseditor) {
    "use strict";

    function onAddLibrary() {
        if (isCreating) return false;

        if (pathInfos.length == 0) {
            require(["alert"], function(alert) {
                alert({
                    text: Globalize.translate("PleaseAddAtLeastOneFolder"),
                    type: "error"
                })
            });
            return false;
        }

        isCreating = true;
        loading.show();

        var dlg = dom.parentWithClass(this, "dlg-librarycreator");
        var name = $("#txtValue", dlg).val();
        var type = $("#selectCollectionType", dlg).val();
        if (type == "mixed") type = null;
        var libraryOptions = libraryoptionseditor.getLibraryOptions(dlg.querySelector(".libraryOptions"));
        libraryOptions.PathInfos = pathInfos;
        ApiClient.addVirtualFolder(name, type, currentOptions.refresh, libraryOptions).then(function() {
            hasChanges = true;
            isCreating = false;
            loading.hide();
            dialogHelper.close(dlg);
        }, function() {
            require(["toast"], function(toast) {
                toast(Globalize.translate("ErrorAddingMediaPathToVirtualFolder"));
            });
            isCreating = false;
            loading.hide();
        });
        return false;
    }

    function getCollectionTypeOptionsHtml(collectionTypeOptions) {
        return collectionTypeOptions.map(function(i) {
            return '<option value="' + i.value + '">' + i.name + "</option>";
        }).join("");
    }

    function initEditor(page, collectionTypeOptions) {
        $("#selectCollectionType", page).html(getCollectionTypeOptionsHtml(collectionTypeOptions)).val("").on("change", function() {
            var value = this.value;
            var dlg = $(this).parents(".dialog")[0];
            libraryoptionseditor.setContentType(dlg.querySelector(".libraryOptions"), value == "mixed" ? "" : value);
            if (value) {
                dlg.querySelector(".libraryOptions").classList.remove("hide");
            } else {
                dlg.querySelector(".libraryOptions").classList.add("hide");
            }

            if (value != "mixed") {
                var index = this.selectedIndex;
                if (index != -1) {
                    var name = this.options[index].innerHTML.replace("*", "").replace("&amp;", "&");
                    $("#txtValue", dlg).val(name);
                    var folderOption = collectionTypeOptions.filter(function(i) {
                        return i.value == value
                    })[0];
                    $(".collectionTypeFieldDescription", dlg).html(folderOption.message || "")
                }
            }
        });

        page.querySelector(".btnAddFolder").addEventListener("click", onAddButtonClick);
        page.querySelector(".btnSubmit").addEventListener("click", onAddLibrary);
        page.querySelector(".folderList").addEventListener("click", onRemoveClick);
        page.querySelector(".chkAdvanced").addEventListener("change", onToggleAdvancedChange);
    }

    function onToggleAdvancedChange() {
        var dlg = dom.parentWithClass(this, "dlg-librarycreator");
        libraryoptionseditor.setAdvancedVisible(dlg.querySelector(".libraryOptions"), this.checked);
    }

    function onAddButtonClick() {
        var page = dom.parentWithClass(this, "dlg-librarycreator");
        require(["directorybrowser"], function(directoryBrowser) {
            var picker = new directoryBrowser;
            picker.show({
                enableNetworkSharePath: true,
                callback: function(path, networkSharePath) {
                    path && addMediaLocation(page, path, networkSharePath);
                    picker.close();
                }
            })
        })
    }

    function getFolderHtml(pathInfo, index) {
        var html = "";
        return html += '<div class="listItem listItem-border lnkPath" style="padding-left:.5em;">', html += '<div class="' + (pathInfo.NetworkPath ? "listItemBody two-line" : "listItemBody") + '">', html += '<div class="listItemBodyText">' + pathInfo.Path + "</div>", pathInfo.NetworkPath && (html += '<div class="listItemBodyText secondary">' + pathInfo.NetworkPath + "</div>"), html += "</div>", html += '<button type="button" is="paper-icon-button-light"" class="listItemButton btnRemovePath" data-index="' + index + '"><i class="md-icon">remove_circle</i></button>', html += "</div>"
    }

    function renderPaths(page) {
        var foldersHtml = pathInfos.map(getFolderHtml).join("");
        var folderList = page.querySelector(".folderList");
        folderList.innerHTML = foldersHtml;
        foldersHtml ? folderList.classList.remove("hide") : folderList.classList.add("hide");
    }

    function addMediaLocation(page, path, networkSharePath) {
        var pathLower = path.toLowerCase();
        var pathFilter = pathInfos.filter(function(p) {
            return p.Path.toLowerCase() == pathLower;
        });
        if (!pathFilter.length) {
            var pathInfo = {
                Path: path
            };
            networkSharePath && (pathInfo.NetworkPath = networkSharePath);
            pathInfos.push(pathInfo);
            renderPaths(page);
        }
    }

    function onRemoveClick(e) {
        var button = dom.parentWithClass(e.target, "btnRemovePath");
        var index = parseInt(button.getAttribute("data-index"));
        var location = pathInfos[index].Path;
        var locationLower = location.toLowerCase();
        pathInfos = pathInfos.filter(function(p) {
            return p.Path.toLowerCase() != locationLower;
        });
        renderPaths(dom.parentWithClass(button, "dlg-librarycreator"));
    }

    function onDialogClosed() {
        currentResolve(hasChanges);
    }

    function initLibraryOptions(dlg) {
        libraryoptionseditor.embed(dlg.querySelector(".libraryOptions")).then(function() {
            $("#selectCollectionType", dlg).trigger("change");
            onToggleAdvancedChange.call(dlg.querySelector(".chkAdvanced"));
        })
    }

    function editor() {
        this.show = function(options) {
            return new Promise(function(resolve, reject) {
                currentOptions = options;
                currentResolve = resolve;
                hasChanges = false;
                var xhr = new XMLHttpRequest;
                xhr.open("GET", "components/medialibrarycreator/medialibrarycreator.template.html", true);
                xhr.onload = function(e) {
                    var template = this.response,
                        dlg = dialogHelper.createDialog({
                            size: "medium-tall",
                            modal: false,
                            removeOnClose: true,
                            scrollY: false
                        });
                    dlg.classList.add("ui-body-a");
                    dlg.classList.add("background-theme-a");
                    dlg.classList.add("dlg-librarycreator");
                    dlg.classList.add("formDialog");
                    dlg.innerHTML = Globalize.translateDocument(template);
                    initEditor(dlg, options.collectionTypeOptions);
                    dlg.addEventListener("close", onDialogClosed);
                    dialogHelper.open(dlg);
                    dlg.querySelector(".btnCancel").addEventListener("click", function() {
                        dialogHelper.close(dlg)
                    });
                    pathInfos = [];
                    renderPaths(dlg);
                    initLibraryOptions(dlg);
                };
                xhr.send();
            });
        }
    }

    var pathInfos = [];
    var currentResolve;
    var currentOptions;

    var hasChanges = false;
    var isCreating = false;

    return editor
});
