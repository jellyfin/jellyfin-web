define(["loading", "fnchecked", "emby-linkbutton", "emby-input", "emby-checkbox", "emby-button"], function (loading) {
    "use strict";

    function loadPage(page, config) {
        page.querySelector("#txtOpenSubtitleUsername").value = config.OpenSubtitlesUsername;
        page.querySelector("#txtOpenSubtitlePassword").value = config.OpenSubtitlesPasswordHash || "";
        loading.hide();
    }

    function onSubmit(evt) {
        evt.preventDefault();
        loading.show();
        var form = this;
        ApiClient.getNamedConfiguration("subtitles").then(function (config) {
            config.OpenSubtitlesUsername = form.querySelector("#txtOpenSubtitleUsername").value;
            var newPassword = form.querySelector("#txtOpenSubtitlePassword").value;

            if (newPassword) {
                config.OpenSubtitlesPasswordHash = newPassword;
            }

            ApiClient.updateNamedConfiguration("subtitles", config).then(Dashboard.processServerConfigurationUpdateResult);
        });
        return false;
    }

    $(document).on("pageinit", "#openSubtitlesPage", function() {
        $(".metadataSubtitlesForm").off("submit", onSubmit).on("submit", onSubmit)
    }).on("pageshow", "#openSubtitlesPage", function() {
        loading.show();
        var page = this;
        ApiClient.getNamedConfiguration("subtitles").then(function (response) {
            loadPage(page, response);
        });
    });
});
