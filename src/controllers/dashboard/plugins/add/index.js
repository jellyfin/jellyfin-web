import 'jquery';
import markdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import loading from '../../../../components/loading/loading';
import globalize from '../../../../scripts/globalize';
import Dashboard from '../../../../utils/dashboard';
import alert from '../../../../components/alert';
import confirm from '../../../../components/confirm/confirm';

import 'elements/emby-button/emby-button';
import 'elements/emby-collapse/emby-collapse';
import 'elements/emby-select/emby-select';

function populateHistory(packageInfo, page) {
    let html = '';
    const length = Math.min(packageInfo.versions.length, 10);

    for (let i = 0; i < length; i++) {
        const version = packageInfo.versions[i];
        html += '<h2 style="margin:.5em 0;">' + version.version + '</h2>';
        html += '<div style="margin-bottom:1.5em;">' + DOMPurify.sanitize(markdownIt({ html: true }).render(version.changelog)) + '</div>';
    }

    $('#revisionHistory', page).html(html);
}

function populateVersions(packageInfo, page, installedPlugin) {
    let html = '';

    packageInfo.versions.sort((a, b) => {
        return b.timestamp < a.timestamp ? -1 : 1;
    });

    for (const version of packageInfo.versions) {
        html += '<option value="' + version.version + '">' + globalize.translate('PluginFromRepo', version.version, version.repositoryName) + '</option>';
    }

    const selectmenu = $('#selectVersion', page).html(html);

    if (!installedPlugin) {
        $('#pCurrentVersion', page).hide().html('');
    }

    const packageVersion = packageInfo.versions[0];
    if (packageVersion) {
        selectmenu.val(packageVersion.version);
    }
}

function renderPackage(pkg, installedPlugins, page) {
    const installedPlugin = installedPlugins.filter(function (ip) {
        return ip.Name == pkg.name;
    })[0];

    populateVersions(pkg, page, installedPlugin);
    populateHistory(pkg, page);

    $('.pluginName', page).text(pkg.name);
    $('#btnInstallDiv', page).removeClass('hide');
    $('#pSelectVersion', page).removeClass('hide');

    if (pkg.overview) {
        $('#overview', page).show().text(pkg.overview);
    } else {
        $('#overview', page).hide();
    }

    $('#description', page).text(pkg.description);
    $('#developer', page).text(pkg.owner);
    // This is a hack; the repository name and URL should be part of the global values
    // for the plugin, not each individual version. So we just use the top (latest)
    // version to get this information. If it's missing (no versions), then say so.
    if (pkg.versions.length) {
        $('#repositoryName', page).text(pkg.versions[0].repositoryName);
        $('#repositoryUrl', page).text(pkg.versions[0].repositoryUrl);
    } else {
        $('#repositoryName', page).text(globalize.translate('Unknown'));
        $('#repositoryUrl', page).text(globalize.translate('Unknown'));
    }

    if (installedPlugin) {
        const currentVersionText = globalize.translate('MessageYouHaveVersionInstalled', '<strong>' + installedPlugin.Version + '</strong>');
        $('#pCurrentVersion', page).show().html(currentVersionText);
    } else {
        $('#pCurrentVersion', page).hide().text('');
    }

    loading.hide();
}

function alertText(options) {
    alert(options);
}

function performInstallation(page, name, guid, version) {
    const repositoryUrl = $('#repositoryUrl', page).html().toLowerCase();

    const alertCallback = function () {
        loading.show();
        page.querySelector('#btnInstall').disabled = true;
        ApiClient.installPlugin(name, guid, version).then(() => {
            loading.hide();
            alertText(globalize.translate('MessagePluginInstalled'));
        }).catch(() => {
            alertText(globalize.translate('MessagePluginInstallError'));
        });
    };

    // Check the repository URL for the official Jellyfin repository domain, or
    // present the warning for 3rd party plugins.
    if (!repositoryUrl.startsWith('https://repo.jellyfin.org/')) {
        loading.hide();
        let msg = globalize.translate('MessagePluginInstallDisclaimer');
        msg += '<br/>';
        msg += '<br/>';
        msg += globalize.translate('PleaseConfirmPluginInstallation');

        confirm(msg, globalize.translate('HeaderConfirmPluginInstallation')).then(function () {
            alertCallback();
        }).catch(() => {
            console.debug('plugin not installed');
        });
    } else {
        alertCallback();
    }
}

export default function(view, params) {
    $('.addPluginForm', view).on('submit', function () {
        loading.show();
        const page = $(this).parents('#addPluginPage')[0];
        const name = params.name;
        const guid = params.guid;
        ApiClient.getInstalledPlugins().then(function (plugins) {
            const installedPlugin = plugins.filter(function (plugin) {
                return plugin.Name == name;
            })[0];

            const version = $('#selectVersion', page).val();
            if (installedPlugin && installedPlugin.Version === version) {
                loading.hide();
                Dashboard.alert({
                    message: globalize.translate('MessageAlreadyInstalled'),
                    title: globalize.translate('HeaderPluginInstallation')
                });
            } else {
                performInstallation(page, name, guid, version);
            }
        }).catch(() => {
            alertText(globalize.translate('MessageGetInstalledPluginsError'));
        });
        return false;
    });
    view.addEventListener('viewshow', function () {
        const page = this;
        loading.show();
        const name = params.name;
        const guid = params.guid;
        const promise1 = ApiClient.getPackageInfo(name, guid);
        const promise2 = ApiClient.getInstalledPlugins();
        Promise.all([promise1, promise2]).then(function (responses) {
            renderPackage(responses[0], responses[1], page);
        });
    });
}
