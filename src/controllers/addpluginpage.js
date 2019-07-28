define(['jQuery', 'loading', 'libraryMenu', 'globalize', 'connectionManager', 'emby-button'], function ($, loading, libraryMenu, globalize, connectionManager) {
    'use strict';

    function populateHistory(packageInfo, page) {

        var html = '';

        for (var i = 0, length = Math.min(packageInfo.versions.length, 10) ; i < length; i++) {

            var version = packageInfo.versions[i];

            html += '<h2 style="margin:.5em 0;">' + version.versionStr + ' (' + version.classification + ')</h2>';

            html += '<div style="margin-bottom:1.5em;">' + version.description + '</div>';
        }

        $('#revisionHistory', page).html(html);
    }

    function populateVersions(packageInfo, page, installedPlugin) {

        var html = '';

        for (var i = 0, length = packageInfo.versions.length; i < length; i++) {

            var version = packageInfo.versions[i];

            html += '<option value="' + version.versionStr + '|' + version.classification + '">' + version.versionStr + ' (' + version.classification + ')</option>';

        }

        var selectmenu = $('#selectVersion', page).html(html);

        if (!installedPlugin) {

            $('#pCurrentVersion', page).hide().html("");
        }

        var packageVersion = packageInfo.versions.filter(function (current) {

            return current.classification == "Release";
        })[0];

        if (!packageVersion) {

            packageVersion = packageInfo.versions.filter(function (current) {

                return current.classification == "Beta";
            })[0];
        }

        if (packageVersion) {
            var val = packageVersion.versionStr + '|' + packageVersion.classification;

            selectmenu.val(val);
        }
    }

    function renderPackage(pkg, installedPlugins, page) {

        var installedPlugin = installedPlugins.filter(function (ip) {
            return ip.Name == pkg.name;
        })[0];

        populateVersions(pkg, page, installedPlugin);
        populateHistory(pkg, page);

        $('.pluginName', page).html(pkg.name);

        if (pkg.targetSystem == 'Server') {
            $("#btnInstallDiv", page).removeClass('hide');
            $("#nonServerMsg", page).hide();
            $("#pSelectVersion", page).removeClass('hide');
        } else {
            $("#btnInstallDiv", page).addClass('hide');
            $("#pSelectVersion", page).addClass('hide');

            var msg = globalize.translate('MessageInstallPluginFromApp');
            $("#nonServerMsg", page).html(msg).show();
        }

        if (pkg.shortDescription) {
            $('#tagline', page).show().html(pkg.shortDescription);
        } else {
            $('#tagline', page).hide();
        }

        $('#overview', page).html(pkg.overview || "");


        $('#developer', page).html(pkg.owner);

        if (pkg.richDescUrl) {
            $('#pViewWebsite', page).show();
            $('#pViewWebsite a', page).attr('href', pkg.richDescUrl);
        } else {
            $('#pViewWebsite', page).hide();
        }

        if (pkg.previewImage || pkg.thumbImage) {

            var img = pkg.previewImage ? pkg.previewImage : pkg.thumbImage;
            $('#pPreviewImage', page).show().html("<img src='" + img + "' style='max-width: 100%;-moz-box-shadow: 0 0 20px 3px " + color + ";-webkit-box-shadow: 0 0 20px 3px " + color + ";box-shadow: 0 0 20px 3px " + color + ";' />");
        } else {
            $('#pPreviewImage', page).hide().html("");
        }

        if (installedPlugin) {

            var currentVersionText = globalize.translate('MessageYouHaveVersionInstalled').replace('{0}', '<strong>' + installedPlugin.Version + '</strong>');
            $('#pCurrentVersion', page).show().html(currentVersionText);

        } else {
            $('#pCurrentVersion', page).hide().html("");
        }

        loading.hide();
    }

    function alertText(options) {
        require(['alert'], function (alert) {
            alert(options);
        });
    }

    function performInstallation(page, packageName, guid, updateClass, version) {

        var developer = $('#developer', page).html().toLowerCase();

        var alertCallback = function () {

            loading.show();

            page.querySelector('#btnInstall').disabled = true;

            ApiClient.installPlugin(packageName, guid, updateClass, version).then(function () {

                loading.hide();

                alertText(globalize.translate('PluginInstalledMessage'));
            });
        };

        if (developer !== 'jellyfin') {

            loading.hide();

            var msg = globalize.translate('MessagePluginInstallDisclaimer');
            msg += '<br/>';
            msg += '<br/>';
            msg += globalize.translate('PleaseConfirmPluginInstallation');

            require(['confirm'], function (confirm) {

                confirm(msg, globalize.translate('HeaderConfirmPluginInstallation')).then(function () {

                    alertCallback();
                }, function () {

                    console.log('plugin not installed');
                });

            });

        } else {
            alertCallback();
        }
    }

    return function (view, params) {

        var onSubmit = function () {

            loading.show();

            var page = $(this).parents('#addPluginPage')[0];

            var name = params.name;
            var guid = params.guid;

            ApiClient.getInstalledPlugins().then(function (plugins) {

                var installedPlugin = plugins.filter(function (ip) {
                    return ip.Name == name;
                })[0];

                var vals = $('#selectVersion', page).val().split('|');

                var version = vals[0];

                if (installedPlugin && installedPlugin.Version == version) {

                    loading.hide();

                    Dashboard.alert({
                        message: globalize.translate('MessageAlreadyInstalled'),
                        title: globalize.translate('HeaderPluginInstallation')
                    });
                } else {
                    performInstallation(page, name, guid, vals[1], version);
                }
            });

            return false;
        };

        $('.addPluginForm', view).on('submit', onSubmit);

        updateHelpUrl(view, params);

        view.addEventListener('viewbeforeshow', function () {

            var page = this;

            updateHelpUrl(page, params);
        });

        view.addEventListener('viewshow', function () {

            var page = this;

            loading.show();

            var name = params.name;
            var guid = params.guid;

            var promise1 = ApiClient.getPackageInfo(name, guid);
            var promise2 = ApiClient.getInstalledPlugins();
            var promise3 = ApiClient.getPluginSecurityInfo();

            Promise.all([promise1, promise2, promise3]).then(function (responses) {

                renderPackage(responses[0], responses[1], responses[2], page);
            });

            updateHelpUrl(page, params);
        });
    };
});
