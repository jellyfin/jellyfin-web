define(["jQuery", "loading", "libraryMenu", "globalize", "connectionManager", "emby-button"], function($, loading, libraryMenu, globalize, connectionManager) {
    "use strict";

    function populateHistory(packageInfo, page) {
        for (var html = "", i = 0, length = Math.min(packageInfo.versions.length, 10); i < length; i++) {
            var version = packageInfo.versions[i];
            html += '<h2 style="margin:.5em 0;">' + version.versionStr + " (" + version.classification + ")</h2>", html += '<div style="margin-bottom:1.5em;">' + version.description + "</div>"
        }
        $("#revisionHistory", page).html(html)
    }

    function populateVersions(packageInfo, page, installedPlugin) {
        for (var html = "", i = 0, length = packageInfo.versions.length; i < length; i++) {
            var version = packageInfo.versions[i];
            html += '<option value="' + version.versionStr + "|" + version.classification + '">' + version.versionStr + " (" + version.classification + ")</option>"
        }
        var selectmenu = $("#selectVersion", page).html(html);
        installedPlugin || $("#pCurrentVersion", page).hide().html("");
        var packageVersion = packageInfo.versions.filter(function(current) {
            return "Release" == current.classification
        })[0];
        if (packageVersion || (packageVersion = packageInfo.versions.filter(function(current) {
                return "Beta" == current.classification
            })[0]), packageVersion) {
            var val = packageVersion.versionStr + "|" + packageVersion.classification;
            selectmenu.val(val)
        }
    }

    function renderPackage(pkg, installedPlugins, pluginSecurityInfo, page) {
        var installedPlugin = installedPlugins.filter(function(ip) {
            return ip.Name == pkg.name
        })[0];
        populateVersions(pkg, page, installedPlugin);
        populateHistory(pkg, page);
        $(".pluginName", page).html(pkg.name);
        if ("Server" == pkg.targetSystem) {
            $("#btnInstallDiv", page).removeClass("hide");
            $("#nonServerMsg", page).hide();
            $("#pSelectVersion", page).removeClass("hide");
        } else {
            $("#btnInstallDiv", page).addClass("hide");
            $("#pSelectVersion", page).addClass("hide");
            var msg = globalize.translate("MessageInstallPluginFromApp");
            $("#nonServerMsg", page).html(msg).show();
        }
        if (pkg.shortDescription) {
            $("#tagline", page).show().html(pkg.shortDescription);
        } else {
            $("#tagline", page).hide();
        }
        $("#overview", page).html(pkg.overview || "");
        $("#developer", page).html(pkg.owner);
        if (pkg.richDescUrl) {
            $("#pViewWebsite", page).show();
            $("#pViewWebsite a", page).attr("href", pkg.richDescUrl);
        } else {
            $("#pViewWebsite", page).hide();
        }
        if (pkg.previewImage || pkg.thumbImage) {
            var img = pkg.previewImage ? pkg.previewImage : pkg.thumbImage;
            $("#pPreviewImage", page).show().html("<img class='pluginPreviewImg' src='" + img + "' style='max-width: 100%;' />");
        } else {
            $("#pPreviewImage", page).hide().html("");
        }
        if (installedPlugin) {
            var currentVersionText = globalize.translate("MessageYouHaveVersionInstalled").replace("{0}", "<strong>" + installedPlugin.Version + "</strong>");
            $("#pCurrentVersion", page).show().html(currentVersionText);
        } else {
            $("#pCurrentVersion", page).hide().html("");
        }
        loading.hide();
    }

    function alertText(options) {
        require(["alert"], function(alert) {
            alert(options)
        })
    }

    function performInstallation(page, packageName, guid, updateClass, version) {
        var developer = $("#developer", page).html().toLowerCase(),
            alertCallback = function(confirmed) {
                confirmed && (loading.show(), page.querySelector("#btnInstall").disabled = !0, ApiClient.installPlugin(packageName, guid, updateClass, version).then(function() {
                    loading.hide(), alertText(globalize.translate("PluginInstalledMessage"))
                }))
            };
        if ("luke" != developer && "ebr" != developer) {
            loading.hide();
            var msg = globalize.translate("MessagePluginInstallDisclaimer");
            msg += "<br/>", msg += "<br/>", msg += globalize.translate("PleaseConfirmPluginInstallation"), require(["confirm"], function(confirm) {
                confirm(msg, globalize.translate("HeaderConfirmPluginInstallation")).then(function() {
                    alertCallback(!0)
                }, function() {
                    alertCallback(!1)
                })
            })
        } else alertCallback(!0)
    }
    return function(view, params) {
        var onSubmit = function() {
            loading.show();
            var page = $(this).parents("#addPluginPage")[0],
                name = params.name,
                guid = params.guid;
            return ApiClient.getInstalledPlugins().then(function(plugins) {
                var installedPlugin = plugins.filter(function(ip) {
                        return ip.Name == name
                    })[0],
                    vals = $("#selectVersion", page).val().split("|"),
                    version = vals[0];
                installedPlugin && installedPlugin.Version == version ? (loading.hide(), Dashboard.alert({
                    message: globalize.translate("MessageAlreadyInstalled"),
                    title: globalize.translate("HeaderPluginInstallation")
                })) : performInstallation(page, name, guid, vals[1], version)
            }), !1
        };
        $(".addPluginForm", view).on("submit", onSubmit), view.addEventListener("viewshow", function() {
            var page = this;
            loading.show();
            var name = params.name,
                guid = params.guid,
                promise1 = ApiClient.getPackageInfo(name, guid),
                promise2 = ApiClient.getInstalledPlugins();
            connectionManager.getRegistrationInfo("themes", ApiClient, {
                viewOnly: !0
            }), Promise.all([promise1, promise2]).then(function(responses) {
                connectionManager.getRegistrationInfo("themes", ApiClient, {
                    viewOnly: !0
                }).then(function() {
                    renderPackage(responses[0], responses[1], {
                        IsMBSupporter: !0
                    }, page)
                }, function() {
                    renderPackage(responses[0], responses[1], {}, page)
                })
            })
        })
    }
});
