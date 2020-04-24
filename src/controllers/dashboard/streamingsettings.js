define(["jQuery", "libraryMenu", "loading"], function ($, libraryMenu, loading) {
    "use strict";

    function loadPage(page, config) {
        $("#txtRemoteClientBitrateLimit", page).val(config.RemoteClientBitrateLimit / 1e6 || "");
        loading.hide();
    }

    function onSubmit() {
        loading.show();
        var form = this;
        ApiClient.getServerConfiguration().then(function (config) {
            config.RemoteClientBitrateLimit = parseInt(1e6 * parseFloat($("#txtRemoteClientBitrateLimit", form).val() || "0"));
            ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult);
        });

        return false;
    }

    function getTabs() {
        return [{
            href: "encodingsettings.html",
            name: Globalize.translate("Transcoding")
        }, {
            href: "playbackconfiguration.html",
            name: Globalize.translate("TabResumeSettings")
        }, {
            href: "streamingsettings.html",
            name: Globalize.translate("TabStreaming")
        }];
    }

    $(document).on("pageinit", "#streamingSettingsPage", function () {
        $(".streamingSettingsForm").off("submit", onSubmit).on("submit", onSubmit);
    }).on("pageshow", "#streamingSettingsPage", function () {
        loading.show();
        libraryMenu.setTabs("playback", 2, getTabs);
        var page = this;
        ApiClient.getServerConfiguration().then(function (config) {
            loadPage(page, config);
        });
    });
});
