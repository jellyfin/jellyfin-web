define(["jQuery", "loading", "emby-checkbox", "emby-input", "listViewStyle", "paper-icon-button-light"], function ($, loading) {
    "use strict";

    return function (page, providerId, options) {
        function getListingProvider(config, id) {
            if (config && id) {
                var result = config.ListingProviders.filter(function (provider) {
                    return provider.Id === id;
                })[0];

                if (result) {
                    return Promise.resolve(result);
                }

                return getListingProvider();
            }

            return ApiClient.getJSON(ApiClient.getUrl("LiveTv/ListingProviders/Default"));
        }

        function reload() {
            loading.show();
            ApiClient.getNamedConfiguration("livetv").then(function (config) {
                getListingProvider(config, providerId).then(function (info) {
                    page.querySelector(".txtPath").value = info.Path || "";
                    page.querySelector(".txtKids").value = (info.KidsCategories || []).join("|");
                    page.querySelector(".txtNews").value = (info.NewsCategories || []).join("|");
                    page.querySelector(".txtSports").value = (info.SportsCategories || []).join("|");
                    page.querySelector(".txtMovies").value = (info.MovieCategories || []).join("|");
                    page.querySelector(".txtMoviePrefix").value = info.MoviePrefix || "";
                    page.querySelector(".txtUserAgent").value = info.UserAgent || "";
                    page.querySelector(".chkAllTuners").checked = info.EnableAllTuners;

                    if (page.querySelector(".chkAllTuners").checked) {
                        page.querySelector(".selectTunersSection").classList.add("hide");
                    } else {
                        page.querySelector(".selectTunersSection").classList.remove("hide");
                    }

                    refreshTunerDevices(page, info, config.TunerHosts);
                    loading.hide();
                });
            });
        }

        function getCategories(txtInput) {
            var value = txtInput.value;

            if (value) {
                return value.split("|");
            }

            return [];
        }

        function submitListingsForm() {
            loading.show();
            var id = providerId;
            ApiClient.getNamedConfiguration("livetv").then(function (config) {
                var info = config.ListingProviders.filter(function (provider) {
                    return provider.Id === id;
                })[0] || {};
                info.Type = "xmltv";
                info.Path = page.querySelector(".txtPath").value;
                info.MoviePrefix = page.querySelector(".txtMoviePrefix").value || null;
                info.UserAgent = page.querySelector(".txtUserAgent").value || null;
                info.MovieCategories = getCategories(page.querySelector(".txtMovies"));
                info.KidsCategories = getCategories(page.querySelector(".txtKids"));
                info.NewsCategories = getCategories(page.querySelector(".txtNews"));
                info.SportsCategories = getCategories(page.querySelector(".txtSports"));
                info.EnableAllTuners = page.querySelector(".chkAllTuners").checked;
                info.EnabledTuners = info.EnableAllTuners ? [] : $(".chkTuner", page).get().filter(function (tuner) {
                    return tuner.checked;
                }).map(function (tuner) {
                    return tuner.getAttribute("data-id");
                });
                ApiClient.ajax({
                    type: "POST",
                    url: ApiClient.getUrl("LiveTv/ListingProviders", {
                        ValidateListings: true
                    }),
                    data: JSON.stringify(info),
                    contentType: "application/json"
                }).then(function (result) {
                    loading.hide();

                    if (false !== options.showConfirmation) {
                        Dashboard.processServerConfigurationUpdateResult();
                    }

                    Events.trigger(self, "submitted");
                }, function () {
                    loading.hide();
                    Dashboard.alert({
                        message: Globalize.translate("ErrorAddingXmlTvFile")
                    });
                });
            });
        }

        function getTunerName(providerId) {
            switch (providerId = providerId.toLowerCase()) {
                case "m3u":
                    return "M3U Playlist";
                case "hdhomerun":
                    return "HDHomerun";
                case "satip":
                    return "DVB";
                default:
                    return "Unknown";
            }
        }

        function refreshTunerDevices(page, providerInfo, devices) {
            var html = "";

            for (var i = 0, length = devices.length; i < length; i++) {
                var device = devices[i];
                html += '<div class="listItem">';
                var enabledTuners = providerInfo.EnabledTuners || [];
                var isChecked = providerInfo.EnableAllTuners || -1 !== enabledTuners.indexOf(device.Id);
                var checkedAttribute = isChecked ? " checked" : "";
                html += '<label class="listItemCheckboxContainer"><input type="checkbox" is="emby-checkbox" class="chkTuner" data-id="' + device.Id + '" ' + checkedAttribute + "><span></span></label>";
                html += '<div class="listItemBody two-line">';
                html += '<div class="listItemBodyText">';
                html += device.FriendlyName || getTunerName(device.Type);
                html += "</div>";
                html += '<div class="listItemBodyText secondary">';
                html += device.Url;
                html += "</div>";
                html += "</div>";
                html += "</div>";
            }

            page.querySelector(".tunerList").innerHTML = html;
        }

        function onSelectPathClick(e) {
            var page = $(e.target).parents(".xmltvForm")[0];

            require(["directorybrowser"], function (directoryBrowser) {
                var picker = new directoryBrowser();
                picker.show({
                    includeFiles: true,
                    callback: function (path) {
                        if (path) {
                            var txtPath = page.querySelector(".txtPath");
                            txtPath.value = path;
                            txtPath.focus();
                        }
                        picker.close();
                    }
                });
            });
        }

        var self = this;

        self.submit = function () {
            page.querySelector(".btnSubmitListings").click();
        };

        self.init = function () {
            options = options || {};

            if (false !== options.showCancelButton) {
                page.querySelector(".btnCancel").classList.remove("hide");
            } else {
                page.querySelector(".btnCancel").classList.add("hide");
            }

            if (false !== options.showSubmitButton) {
                page.querySelector(".btnSubmitListings").classList.remove("hide");
            } else {
                page.querySelector(".btnSubmitListings").classList.add("hide");
            }

            $("form", page).on("submit", function () {
                submitListingsForm();
                return false;
            });
            page.querySelector("#btnSelectPath").addEventListener("click", onSelectPathClick);
            page.querySelector(".chkAllTuners").addEventListener("change", function (evt) {
                if (evt.target.checked) {
                    page.querySelector(".selectTunersSection").classList.add("hide");
                } else {
                    page.querySelector(".selectTunersSection").classList.remove("hide");
                }
            });
            reload();
        };
    };
});
