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

        $('#revisionHistory', page).innerHtml = html;
    }

    function populateVersions(packageInfo, page, installedPlugin) {
        var html = '';

        for (var i = 0; i < packageInfo.versions.length; i++) {
            var version = packageInfo.versions[i];
            html += '<option value="' + version.version + '">' + version.version + '</option>';
        }

        var selectmenu = $('#selectVersion', page);
        selectmenu.innerHtml = html;

        if (!installedPlugin) {
            const currentVersion = page.querySelector('#pCurrentVersion');
            currentVersion.classList.add('hide');
            currentVersion.innerHtml = '';
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

        $('.pluginName', page).innerHtml = pkg.name;
        page.querySelector('#btnInstallDiv').classList.remove('hide');
        page.querySelector('#pSelectVersion').classList.remove('hide');

        if (pkg.overview) {
            const overview = $('#overview', page);
            overview.show();
            overview.innerHtml = pkg.overview;
        } else {
            page.querySelector('#overview').classList.add('hide');
        }

        $('#description', page).innerHtml = pkg.description;
        $('#developer', page).innerHtml = pkg.owner;

        if (installedPlugin) {
            var currentVersionText = globalize.translate('MessageYouHaveVersionInstalled', '<strong>' + installedPlugin.Version + '</strong>');
            const currentVersion = $('#pCurrentVersion', page);
            currentVersion.show();
            currentVersion.innerHtml = currentVersionText;
        } else {
            const currentVersion = page.querySelector('#pCurrentVersion');
            currentVersion.classList.add('hide');
            currentVersion.innerHtml = '';
        }

        loading.hide();
    }

    function alertText(options) {
        require(['alert'], function (alert) {
            alert(options);
        });
    }

    function performInstallation(page, name, guid, version) {
        var developer = $('#developer', page).innerHtml.toLowerCase();

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
            var page = this.closest('#addPluginPage');
            var name = params.name;
            var guid = params.guid;
            ApiClient.getInstalledPlugins().then(function (plugins) {
                var installedPlugin = plugins.filter(function (plugin) {
                    return plugin.Name == name;
                })[0];

                var version = $('#selectVersion', page).val();
                if (installedPlugin) {
                    if (installedPlugin.Version === version) {
                        loading.hide();
                        Dashboard.alert({
                            message: globalize.translate('MessageAlreadyInstalled'),
                            title: globalize.translate('HeaderPluginInstallation')
                        });
                    }
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
