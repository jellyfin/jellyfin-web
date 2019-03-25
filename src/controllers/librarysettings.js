define(["jQuery", "loading", "libraryMenu", "fnchecked", "emby-checkbox", "emby-button"], function($, loading, libraryMenu) {
    "use strict";

    function loadPage(page, config) {
        $("#chkSaveMetadataHidden", page).checked(config.SaveMetadataHidden);
        loading.hide();
    }

    function loadMetadataConfig(page, config) {
        $("#selectDateAdded", page).val(config.UseFileCreationTimeForDateAdded ? "1" : "0");
    }

    function loadFanartConfig(page, config) {
        $("#txtFanartApiKey", page).val(config.UserApiKey || "");
    }

    function saveFanart(form) {
        ApiClient.getNamedConfiguration("fanart").then(function(config) {
            config.UserApiKey = $("#txtFanartApiKey", form).val(), ApiClient.updateNamedConfiguration("fanart", config);
        });
    }

    function saveMetadata(form) {
        ApiClient.getNamedConfiguration("metadata").then(function(config) {
            config.UseFileCreationTimeForDateAdded = "1" === $("#selectDateAdded", form).val(), ApiClient.updateNamedConfiguration("metadata", config);
        })
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
            config.FanartApiKey = $("#txtFanartApiKey", form).val();
            ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult);
        });
        saveMetadata(form);
        saveFanart(form);
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
            ApiClient.getNamedConfiguration("fanart").then(function(metadata) {
                loadFanartConfig(page, metadata)
            });
            ApiClient.getSystemInfo().then(function(info) {
                 if ("Windows" === info.OperatingSystem) {
                     page.querySelector(".fldSaveMetadataHidden").classList.remove("hide");
                 } else {
                     page.querySelector(".fldSaveMetadataHidden").classList.add("hide");
                 }
            });
        });
    }
});