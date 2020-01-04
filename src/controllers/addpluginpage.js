define(['jQuery', 'loading', 'libraryMenu', 'globalize', 'connectionManager', 'emby-button'], function ($, loading, libraryMenu, globalize, connectionManager) {
    'use strict';

    /**
     * @param packageInfo
     * @param page
     */
    function populateHistory (packageInfo, page) {
        var html = '';
        var length = Math.min(packageInfo.versions.length, 10);

        for (var i = 0; i < length; i++) {
            var version = packageInfo.versions[i];
            html += '<h2 style="margin:.5em 0;">' + version.versionStr + ' (' + version.classification + ')</h2>';
            html += '<div style="margin-bottom:1.5em;">' + version.description + '</div>';
        }

        $('#revisionHistory', page).html(html);
    }

    /**
     * @param packageInfo
     * @param page
     * @param installedPlugin
     */
    function populateVersions (packageInfo, page, installedPlugin) {
        var html = '';

        for (var i = 0; i < packageInfo.versions.length; i++) {
            var version = packageInfo.versions[i];
            html += '<option value="' + version.versionStr + '|' + version.classification + '">' + version.versionStr + ' (' + version.classification + ')</option>';
        }

        var selectmenu = $('#selectVersion', page).html(html);

        if (!installedPlugin) {
            $('#pCurrentVersion', page).hide().html('');
        }

        var packageVersion = packageInfo.versions.filter(function (current) {
            return current.classification == 'Release';
        })[0];
        packageVersion = packageVersion || packageInfo.versions.filter(function (current) {
            return current.classification == 'Beta';
        })[0];

        if (packageVersion) {
            var val = packageVersion.versionStr + '|' + packageVersion.classification;
            selectmenu.val(val);
        }
    }

    /**
     * @param pkg
     * @param installedPlugins
     * @param page
     */
    function renderPackage (pkg, installedPlugins, page) {
        var installedPlugin = installedPlugins.filter(function (ip) {
            return ip.Name == pkg.name;
        })[0];
        populateVersions(pkg, page, installedPlugin);
        populateHistory(pkg, page);
        $('.pluginName', page).html(pkg.name);

        if (pkg.targetSystem == 'Server') {
            $('#btnInstallDiv', page).removeClass('hide');
            $('#nonServerMsg', page).hide();
            $('#pSelectVersion', page).removeClass('hide');
        } else {
            $('#btnInstallDiv', page).addClass('hide');
            $('#pSelectVersion', page).addClass('hide');
            var msg = globalize.translate('MessageInstallPluginFromApp');
            $('#nonServerMsg', page).html(msg).show();
        }

        if (pkg.shortDescription) {
            $('#tagline', page).show().html(pkg.shortDescription);
        } else {
            $('#tagline', page).hide();
        }

        $('#overview', page).html(pkg.overview || '');
        $('#developer', page).html(pkg.owner);

        if (pkg.richDescUrl) {
            $('#pViewWebsite', page).show();
            $('#pViewWebsite a', page).attr('href', pkg.richDescUrl);
        } else {
            $('#pViewWebsite', page).hide();
        }

        if (pkg.previewImage || pkg.thumbImage) {
            var img = pkg.previewImage ? pkg.previewImage : pkg.thumbImage;
            $('#pPreviewImage', page).show().html("<img class='pluginPreviewImg' src='" + img + "' style='max-width: 100%;' />");
        } else {
            $('#pPreviewImage', page).hide().html('');
        }

        if (installedPlugin) {
            var currentVersionText = globalize.translate('MessageYouHaveVersionInstalled').replace('{0}', '<strong>' + installedPlugin.Version + '</strong>');
            $('#pCurrentVersion', page).show().html(currentVersionText);
        } else {
            $('#pCurrentVersion', page).hide().html('');
        }

        loading.hide();
    }

    /**
     * @param options
     */
    function alertText (options) {
        require(['alert'], function (alert) {
            alert(options);
        });
    }

    /**
     * @param page
     * @param packageName
     * @param guid
     * @param updateClass
     * @param version
     */
    function performInstallation (page, packageName, guid, updateClass, version) {
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
        $('.addPluginForm', view).on('submit', function () {
            loading.show();
            var page = $(this).parents('#addPluginPage')[0];
            var name = params.name;
            var guid = params.guid;
            ApiClient.getInstalledPlugins().then(function (plugins) {
                var installedPlugin = plugins.filter(function (plugin) {
                    return plugin.Name == name;
                })[0];
                var vals = $('#selectVersion', page).val().split('|');
                var version = vals[0];

                if (installedPlugin) {
                    if (installedPlugin.Version === version) {
                        loading.hide();
                        Dashboard.alert({
                            message: globalize.translate('MessageAlreadyInstalled'),
                            title: globalize.translate('HeaderPluginInstallation')
                        });
                    }
                } else {
                    performInstallation(page, name, guid, vals[1], version);
                }
            });
            return false;
        });
        view.addEventListener('viewshow', function () {
            var page = this;
            loading.show();
            var name = params.name;
            var guid = params.guid;
            var promise1 = ApiClient.getPackageInfo(name, guid);
            var promise2 = ApiClient.getInstalledPlugins();
            Promise.all([promise1, promise2]).then(function (responses) {
                renderPackage(responses[0], responses[1], page);
            });
        });
    };
});
