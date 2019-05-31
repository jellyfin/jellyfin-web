define(["jQuery", "loading", "libraryMenu", "fnchecked", "emby-checkbox", "emby-button"], function($, loading, libraryMenu) {
    "use strict";

    function loadPage(page, config) {
        $("#chkSaveMetadataHidden", page).checked(config.SaveMetadataHidden);
    }

    function loadMetadataConfig(page, config) {
        $("#selectDateAdded", page).val(config.UseFileCreationTimeForDateAdded ? "1" : "0");
    }

    function alertText(options) {
        require(["alert"], function(alert) {
            alert(options);
        });
    }

    function onSubmit() {
        loading.show();
        var form = this;
        ApiClient.getServerConfiguration().then(function(config) {
            config.SaveMetadataHidden = $("#chkSaveMetadataHidden", form).checked();
            ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult);
        });
        ApiClient.getNamedConfiguration("metadata").then(function(config) {
            config.UseFileCreationTimeForDateAdded = "1" === $("#selectDateAdded", form).val();
            ApiClient.updateNamedConfiguration("metadata", config);
        });
        loading.hide();
        return false;
    }

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
        }, {
            href: "librarysettings.html",
            name: Globalize.translate("TabAdvanced")
        }]
    }

    return function(view, params) {
        $(".librarySettingsForm").off("submit", onSubmit).on("submit", onSubmit);
        view.addEventListener("viewshow", function() {
            libraryMenu.setTabs("librarysetup", 4, getTabs);
            loading.show();
            var page = this;
            ApiClient.getServerConfiguration().then(function(config) {
                loadPage(page, config)
            });
            ApiClient.getNamedConfiguration("metadata").then(function(metadata) {
                loadMetadataConfig(page, metadata)
            });
            ApiClient.getSystemInfo().then(function(info) {
                 if ("Windows" === info.OperatingSystem) {
                     page.querySelector(".fldSaveMetadataHidden").classList.remove("hide");
                 } else {
                     page.querySelector(".fldSaveMetadataHidden").classList.add("hide");
                 }
            });
            loading.hide();
        });
    }
});
