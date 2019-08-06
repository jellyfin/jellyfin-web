define(["globalize", "loading", "libraryMenu", "emby-checkbox", "emby-button", "emby-button"], function(globalize, loading, libraryMenu) {
    "use strict";

    function getTabs() {
        return [{
            href: "library.html",
            name: Globalize.translate("HeaderLibraries")
        }, {
            href: "librarydisplay.html",
            name: Globalize.translate("TabDisplay")
        }, {
            href: "metadataimages.html",
            name: Globalize.translate("TabMetadata")
        }, {
            href: "metadatanfo.html",
            name: Globalize.translate("TabNfoSettings")
        }]
    }

    return function(view, params) {
        function loadData() {
            ApiClient.getServerConfiguration().then(function(config) {
                view.querySelector(".chkFolderView").checked = config.EnableFolderView;
                view.querySelector(".chkGroupMoviesIntoCollections").checked = config.EnableGroupingIntoCollections;
                view.querySelector(".chkDisplaySpecialsWithinSeasons").checked = config.DisplaySpecialsWithinSeasons;
                view.querySelector(".chkExternalContentInSuggestions").checked = config.EnableExternalContentInSuggestions;
                view.querySelector("#chkSaveMetadataHidden").checked = config.SaveMetadataHidden;
            });
            ApiClient.getNamedConfiguration("metadata").then(function(metadata) {
                loadMetadataConfig(this, metadata)
            });
        }

        function loadMetadataConfig(page, config) {
            $("#selectDateAdded", page).val(config.UseFileCreationTimeForDateAdded ? "1" : "0");
        }

        view.querySelector("form").addEventListener("submit", function(e) {
            loading.show();
            var form = this;
            ApiClient.getServerConfiguration().then(function(config) {
                config.EnableFolderView = form.querySelector(".chkFolderView").checked;
                config.EnableGroupingIntoCollections = form.querySelector(".chkGroupMoviesIntoCollections").checked;
                config.DisplaySpecialsWithinSeasons = form.querySelector(".chkDisplaySpecialsWithinSeasons").checked;
                config.EnableExternalContentInSuggestions = form.querySelector(".chkExternalContentInSuggestions").checked;
                config.SaveMetadataHidden = form.querySelector("#chkSaveMetadataHidden").checked;
                ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult);
            });
            ApiClient.getNamedConfiguration("metadata").then(function(config) {
                config.UseFileCreationTimeForDateAdded = "1" === $("#selectDateAdded", form).val();
                ApiClient.updateNamedConfiguration("metadata", config);
            });

            e.preventDefault();
            loading.hide();
            return false;
        });

        view.addEventListener("viewshow", function() {
            libraryMenu.setTabs("librarysetup", 1, getTabs);
            loadData();
            ApiClient.getSystemInfo().then(function(info) {
                 if ("Windows" === info.OperatingSystem) {
                     view.querySelector(".fldSaveMetadataHidden").classList.remove("hide");
                 } else {
                     view.querySelector(".fldSaveMetadataHidden").classList.add("hide");
                 }
            });
        });
    }
});