define(['jQuery', 'loading', 'libraryMenu', 'globalize', 'connectionManager', 'emby-button'], function ($, loading, libraryMenu, globalize, connectionManager) {
    'use strict';

    function populateHistory(packageInfo, page) {
        var html = '';
        var length = Math.min(packageInfo.versions.length, 10);

        for (var i = 0; i < length; i++) {
            var version = packageInfo.versions[i];
            html += '<h2 style="margin:.5em 0;">' + version.version + '</h2>';
            html += '<div style="margin-bottom:1.5em;">' + version.changelog + '</div>';
        }

        $('#revisionHistory', page).html(html);
    }

    function populateVersions(packageInfo, page, installedPlugin) {
        var html = '';

        for (var i = 0; i < packageInfo.versions.length; i++) {
            var version = packageInfo.versions[i];
            html += '<option value="' + version.version + '">' + version.version + '</option>';
        }

        var selectmenu = $('#selectVersion', page).html(html);

        if (!installedPlugin) {
            $('#pCurrentVersion', page).hide().html('');
        }

        var packageVersion = packageInfo.versions[0];
        if (packageVersion) {
            selectmenu.val(packageVersion.version);
        }
    }

    function renderPackage(pkg, installedPlugins, page) {
        var installedPlugin = installedPlugins.filter(function (ip) {
            return ip.Name == pkg.name;
        })[0];

        populateVersions(pkg, page, installedPlugin);
        populateHistory(pkg, page);

        $('.pluginName', page).html(pkg.name);
        $('#btnInstallDiv', page).removeClass('hide');
        $('#pSelectVersion', page).removeClass('hide');

        if (pkg.overview) {
            $('#overview', page).show().html(pkg.overview);
        } else {
            $('#overview', page).hide();
        }

        $('#description', page).html(pkg.description);
        $('#developer', page).html(pkg.owner);

        if (installedPlugin) {
            var currentVersionText = globalize.translate('MessageYouHaveVersionInstalled', '<strong>' + installedPlugin.Version + '</strong>');
            $('#pCurrentVersion', page).show().html(currentVersionText);
        } else {
            $('#pCurrentVersion', page).hide().html('');
        }

        loading.hide();
    }

    function alertText(options) {
        require(['alert'], function ({default: alert}) {
            alert(options);
        });
    }

    function performInstallation(page, name, guid, version) {
        var developer = $('#developer', page).html().toLowerCase();

        var alertCallback = function () {
            loading.show();
            page.querySelector('#btnInstall').disabled = true;
            ApiClient.installPlugin(name, guid, version).then(function () {
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
                    console.debug('plugin not installed');
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

                var version = $('#selectVersion', page).val();
                if (installedPlugin && installedPlugin.Version === version) {
                    loading.hide();
                    Dashboard.alert({
                        message: globalize.translate('MessageAlreadyInstalled'),
                        title: globalize.translate('HeaderPluginInstallation')
                    });
                } else {
                    performInstallation(page, name, guid, version);
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
