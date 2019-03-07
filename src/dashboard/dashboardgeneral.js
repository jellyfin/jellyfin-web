define(["jQuery", "loading", "fnchecked", "emby-checkbox", "emby-textarea", "emby-input", "emby-select", "emby-linkbutton"], function($, loading) {
    "use strict";

    function loadPage(page, config, languageOptions, systemInfo) {
        if (systemInfo.CanLaunchWebBrowser) {
            page.querySelector("#fldRunWebAppAtStartup").classList.remove("hide");
        } else {
            page.querySelector("#fldRunWebAppAtStartup").classList.add("hide");
        }
        page.querySelector("#txtCachePath").value = config.CachePath || "";
        $("#txtMetadataPath", page).val(config.MetadataPath || "");
        $("#txtMetadataNetworkPath", page).val(config.MetadataNetworkPath || "");
        $("#selectLocalizationLanguage", page).html(languageOptions.map(function(l) {
            return '<option value="' + l.Value + '">' + l.Name + "</option>"
        })).val(config.UICulture);
        currentLanguage = config.UICulture;
        if (systemInfo.CanSelfUpdate) {
            page.querySelector(".fldAutomaticUpdates").classList.remove("hide");
        } else {
            page.querySelector(".fldAutomaticUpdates").classList.add("hide");
        }
        $("#chkEnableAutomaticServerUpdates", page).checked(config.EnableAutoUpdate);
        $("#chkEnableAutomaticRestart", page).checked(config.EnableAutomaticRestart);
        if (systemInfo.CanSelfRestart) {
            page.querySelector("#fldEnableAutomaticRestart").classList.remove("hide");
        } else {
            page.querySelector("#fldEnableAutomaticRestart").classList.add("hide");
        }
        if (systemInfo.CanSelfRestart || systemInfo.CanSelfUpdate) {
            $(".autoUpdatesContainer", page).removeClass("hide");
        } else {
            $(".autoUpdatesContainer", page).addClass("hide");
        }
        loading.hide();
    }

    function onSubmit() {
        loading.show();
        var form = this;
        $(form).parents(".page");
        return ApiClient.getServerConfiguration().then(function(config) {
            config.UICulture = $("#selectLocalizationLanguage", form).val();
            config.CachePath = form.querySelector("#txtCachePath").value;
            config.MetadataPath = $("#txtMetadataPath", form).val();
            config.MetadataNetworkPath = $("#txtMetadataNetworkPath", form).val();
            var requiresReload = false;
            if (config.UICulture !== currentLanguage) {
                requiresReload = true;
            }
            config.EnableAutomaticRestart = $("#chkEnableAutomaticRestart", form).checked();
            config.EnableAutoUpdate = $("#chkEnableAutomaticServerUpdates", form).checked();
            ApiClient.updateServerConfiguration(config).then(function() {
                ApiClient.getNamedConfiguration(brandingConfigKey).then(function(brandingConfig) {
                    brandingConfig.LoginDisclaimer = form.querySelector("#txtLoginDisclaimer").value;
                    brandingConfig.CustomCss = form.querySelector("#txtCustomCss").value;
                    if (currentBrandingOptions && brandingConfig.CustomCss !== currentBrandingOptions.CustomCss) {
                        requiresReload = true;
                    }
                    ApiClient.updateNamedConfiguration(brandingConfigKey, brandingConfig).then(function() {
                        Dashboard.processServerConfigurationUpdateResult();
                        if (requiresReload && !AppInfo.isNativeApp) {
                            window.location.reload(true);
                        }
                    });
                })
            })
        }), !1
    }

    var currentBrandingOptions;
    var currentLanguage;
    var brandingConfigKey = "branding";

    return function(view, params) {
        $("#btnSelectCachePath", view).on("click.selectDirectory", function() {
            require(["directorybrowser"], function(directoryBrowser) {
                var picker = new directoryBrowser;
                picker.show({
                    callback: function(path) {
                        if (path) {
                            view.querySelector("#txtCachePath").value = path;
                        }
                        picker.close();
                    },
                    validateWriteable: true,
                    header: Globalize.translate("HeaderSelectServerCachePath"),
                    instruction: Globalize.translate("HeaderSelectServerCachePathHelp")
                })
            })
        });

        $("#btnSelectMetadataPath", view).on("click.selectDirectory", function() {
            require(["directorybrowser"], function(directoryBrowser) {
                var picker = new directoryBrowser();
                picker.show({
                    path: $("#txtMetadataPath", view).val(),
                    callback: function(path) {
                        if (path) {
                            $("#txtMetadataPath", view).val(path);
                        }
                        picker.close();
                    },
                    validateWriteable: true,
                    header: Globalize.translate("HeaderSelectMetadataPath"),
                    instruction: Globalize.translate("HeaderSelectMetadataPathHelp")
                })
            })
        });

        $("#btnSelectMetadataNetworkPath", view).on("click.selectDirectory", function() {
            require(["directorybrowser"], function(directoryBrowser) {
                var picker = new directoryBrowser();
                picker.show({
                    path: $("#txtMetadataNetworkPath", view).val(),
                    callback: function(path) {
                        if (path) {
                            $("#txtMetadataNetworkPath", view).val(path);
                        }
                        picker.close();
                    },
                    validateWriteable: true,
                    header: Globalize.translate("LabelOptionalNetworkPath"),
                    instruction: Globalize.translate("LabelOptionalNetworkPathHelp")
                })
            })
        });

        $(".dashboardGeneralForm", view).off("submit", onSubmit).on("submit", onSubmit);
        view.addEventListener("viewshow", function() {
            var promiseConfig = ApiClient.getServerConfiguration();
            var promiseLanguageOptions = ApiClient.getJSON(ApiClient.getUrl("Localization/Options"));
            var promiseSystemInfo = ApiClient.getSystemInfo();
            Promise.all([promiseConfig, promiseLanguageOptions, promiseSystemInfo]).then(function(responses) {
                loadPage(view, responses[0], responses[1], responses[2]);
            });
            ApiClient.getNamedConfiguration(brandingConfigKey).then(function(config) {
                currentBrandingOptions = config;
                view.querySelector("#txtLoginDisclaimer").value = config.LoginDisclaimer || "";
                view.querySelector("#txtCustomCss").value = config.CustomCss || "";
            });
        });
    }
});
