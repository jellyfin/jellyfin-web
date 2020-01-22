define(["loading", "libraryMenu", "globalize", "emby-checkbox", "emby-select"], function (loading, libraryMenu, globalize) {
    "use strict";

    function onSubmit(e) {
        var form = this;
        var localAddress = form.querySelector("#txtLocalAddress").value;
        var enableUpnp = form.querySelector("#chkEnableUpnp").checked;
        confirmSelections(localAddress, enableUpnp, function () {
            var validationResult = getValidationAlert(form);

            if (validationResult) {
                alertText(validationResult);
                return;
            }

            validateHttps(form).then(function () {
                loading.show();
                ApiClient.getServerConfiguration().then(function (config) {
                    config.LocalNetworkSubnets = form.querySelector("#txtLanNetworks").value.split(",").map(function (s) {
                        return s.trim();
                    }).filter(function (s) {
                        return s.length > 0;
                    });
                    config.RemoteIPFilter = form.querySelector("#txtExternalAddressFilter").value.split(",").map(function (s) {
                        return s.trim();
                    }).filter(function (s) {
                        return s.length > 0;
                    });
                    config.IsRemoteIPFilterBlacklist = "blacklist" === form.querySelector("#selectExternalAddressFilterMode").value;
                    config.PublicPort = form.querySelector("#txtPublicPort").value;
                    config.PublicHttpsPort = form.querySelector("#txtPublicHttpsPort").value;
                    var httpsMode = form.querySelector("#selectHttpsMode").value;

                    switch (httpsMode) {
                        case "proxy":
                            config.EnableHttps = true;
                            config.RequireHttps = false;
                            config.IsBehindProxy = true;
                            break;

                        case "required":
                            config.EnableHttps = true;
                            config.RequireHttps = true;
                            config.IsBehindProxy = false;
                            break;

                        case "enabled":
                            config.EnableHttps = true;
                            config.RequireHttps = false;
                            config.IsBehindProxy = false;
                            break;

                        default:
                            config.EnableHttps = false;
                            config.RequireHttps = false;
                            config.IsBehindProxy = false;
                    }

                    config.HttpsPortNumber = form.querySelector("#txtHttpsPort").value;
                    config.HttpServerPortNumber = form.querySelector("#txtPortNumber").value;
                    config.EnableUPnP = enableUpnp;
                    config.BaseUrl = form.querySelector("#txtBaseUrl").value;
                    config.EnableRemoteAccess = form.querySelector("#chkRemoteAccess").checked;
                    config.CertificatePath = form.querySelector("#txtCertificatePath").value || null;
                    config.CertificatePassword = form.querySelector("#txtCertPassword").value || null;
                    config.LocalNetworkAddresses = localAddress ? [localAddress] : [];
                    ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult, Dashboard.processErrorResponse);
                });
            });
        });
        e.preventDefault();
    }

    function triggerChange(select) {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", false, true);
        select.dispatchEvent(evt);
    }

    function getValidationAlert(form) {
        if (form.querySelector("#txtPublicPort").value === form.querySelector("#txtPublicHttpsPort").value) {
            return "The public http and https ports must be different.";
        }

        if (form.querySelector("#txtPortNumber").value === form.querySelector("#txtHttpsPort").value) {
            return "The http and https ports must be different.";
        }

        return null;
    }

    function validateHttps(form) {
        var certPath = form.querySelector("#txtCertificatePath").value || null;
        var httpsMode = form.querySelector("#selectHttpsMode").value;

        if ("enabled" !== httpsMode && "required" !== httpsMode || certPath) {
            return Promise.resolve();
        }

        return new Promise(function (resolve, reject) {
            return alertText({
                title: globalize.translate("TitleHostingSettings"),
                text: globalize.translate("HttpsRequiresCert")
            }).then(reject, reject);
        });
    }

    function alertText(options) {
        return new Promise(function (resolve, reject) {
            require(["alert"], function (alert) {
                alert(options).then(resolve, reject);
            });
        });
    }

    function confirmSelections(localAddress, enableUpnp, callback) {
        if (localAddress || !enableUpnp) {
            alertText({
                title: globalize.translate("TitleHostingSettings"),
                text: globalize.translate("SettingsWarning")
            }).then(callback);
        } else {
            callback();
        }
    }

    return function (view, params) {
        function loadPage(page, config) {
            page.querySelector("#txtPortNumber").value = config.HttpServerPortNumber;
            page.querySelector("#txtPublicPort").value = config.PublicPort;
            page.querySelector("#txtPublicHttpsPort").value = config.PublicHttpsPort;
            page.querySelector("#txtLocalAddress").value = config.LocalNetworkAddresses[0] || "";
            page.querySelector("#txtLanNetworks").value = (config.LocalNetworkSubnets || []).join(", ");
            page.querySelector("#txtExternalAddressFilter").value = (config.RemoteIPFilter || []).join(", ");
            page.querySelector("#selectExternalAddressFilterMode").value = config.IsRemoteIPFilterBlacklist ? "blacklist" : "whitelist";
            page.querySelector("#chkRemoteAccess").checked = null == config.EnableRemoteAccess || config.EnableRemoteAccess;
            var selectHttpsMode = page.querySelector("#selectHttpsMode");

            if (config.IsBehindProxy) {
                selectHttpsMode.value = "proxy";
            } else if (config.RequireHttps) {
                selectHttpsMode.value = "required";
            } else if (config.EnableHttps) {
                selectHttpsMode.value = "enabled";
            } else {
                selectHttpsMode.value = "disabled";
            }

            page.querySelector("#txtHttpsPort").value = config.HttpsPortNumber;
            page.querySelector("#txtBaseUrl").value = config.BaseUrl || "";
            var txtCertificatePath = page.querySelector("#txtCertificatePath");
            txtCertificatePath.value = config.CertificatePath || "";
            page.querySelector("#txtCertPassword").value = config.CertificatePassword || "";
            page.querySelector("#chkEnableUpnp").checked = config.EnableUPnP;
            triggerChange(page.querySelector("#chkRemoteAccess"));
            loading.hide();
        }

        view.querySelector("#chkRemoteAccess").addEventListener("change", function () {
            if (this.checked) {
                view.querySelector(".fldExternalAddressFilter").classList.remove("hide");
                view.querySelector(".fldExternalAddressFilterMode").classList.remove("hide");
                view.querySelector(".fldPublicPort").classList.remove("hide");
                view.querySelector(".fldPublicHttpsPort").classList.remove("hide");
                view.querySelector(".fldCertificatePath").classList.remove("hide");
                view.querySelector(".fldCertPassword").classList.remove("hide");
                view.querySelector(".fldHttpsMode").classList.remove("hide");
                view.querySelector(".fldEnableUpnp").classList.remove("hide");
            } else {
                view.querySelector(".fldExternalAddressFilter").classList.add("hide");
                view.querySelector(".fldExternalAddressFilterMode").classList.add("hide");
                view.querySelector(".fldPublicPort").classList.add("hide");
                view.querySelector(".fldPublicHttpsPort").classList.add("hide");
                view.querySelector(".fldCertificatePath").classList.add("hide");
                view.querySelector(".fldCertPassword").classList.add("hide");
                view.querySelector(".fldHttpsMode").classList.add("hide");
                view.querySelector(".fldEnableUpnp").classList.add("hide");
            }
        });
        view.querySelector("#btnSelectCertPath").addEventListener("click", function () {
            require(["directorybrowser"], function (directoryBrowser) {
                var picker = new directoryBrowser();
                picker.show({
                    includeFiles: true,
                    includeDirectories: true,
                    callback: function (path) {
                        if (path) {
                            view.querySelector("#txtCertificatePath").value = path;
                        }

                        picker.close();
                    },
                    header: globalize.translate("HeaderSelectCertificatePath")
                });
            });
        });
        view.querySelector(".dashboardHostingForm").addEventListener("submit", onSubmit);
        view.addEventListener("viewshow", function (e) {
            loading.show();
            ApiClient.getServerConfiguration().then(function (config) {
                loadPage(view, config);
            });
        });
    };
});
