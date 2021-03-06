import 'jquery';
import loading from '../../../../components/loading/loading';
import globalize from '../../../../scripts/globalize';
import '../../../../elements/emby-button/emby-button';
import Dashboard from '../../../../scripts/clientUtils';
import alert from '../../../../components/alert';
import confirm from '../../../../components/confirm/confirm';

function populateHistory(packageInfo, page) {
    let html = '';
    const length = Math.min(packageInfo.versions.length, 10);

    for (let i = 0; i < length; i++) {
        const version = packageInfo.versions[i];
        html += '<h2 style="margin:.5em 0;">' + version.version + '</h2>';
        html += '<div style="margin-bottom:1.5em;">' + version.changelog + '</div>';
    }

    $('#revisionHistory', page).html(html);
}

function populateVersions(packageInfo, page, installedPlugin) {
    let html = '';

    packageInfo.versions.sort((a, b) => {
        return b.timestamp < a.timestamp ? -1 : 1;
    });

    for (let i = 0; i < packageInfo.versions.length; i++) {
        const version = packageInfo.versions[i];
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
        const currentVersionText = globalize.translate('MessageYouHaveVersionInstalled', '<strong>' + installedPlugin.Version + '</strong>');
        $('#pCurrentVersion', page).show().html(currentVersionText);
    } else {
        $('#pCurrentVersion', page).hide().html('');
    }

    loading.hide();
}

function alertText(options) {
    alert(options);
}

function performInstallation(page, name, guid, version) {
    const developer = $('#developer', page).html().toLowerCase();

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

    if (developer !== 'jellyfin') {
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
