import loading from '../../../../components/loading/loading';
import libraryMenu from '../../../../scripts/libraryMenu';
import dom from '../../../../scripts/dom';
import globalize from '../../../../scripts/globalize';
import * as cardBuilder from '../../../../components/cardbuilder/cardBuilder.js';
import '../../../../components/cardbuilder/card.css';
import '../../../../elements/emby-button/emby-button';
import Dashboard, { pageIdOn } from '../../../../scripts/clientUtils';
import confirm from '../../../../components/confirm/confirm';

function deletePlugin(page, uniqueid, version, name) {
    const msg = globalize.translate('UninstallPluginConfirmation', name);

    confirm({
        title: globalize.translate('HeaderUninstallPlugin'),
        text: msg,
        primary: 'delete',
        confirmText: globalize.translate('HeaderUninstallPlugin')
    }).then(function () {
        loading.show();
        ApiClient.uninstallPluginByVersion(uniqueid, version).then(function () {
            reloadList(page);
        });
    });
}

function enablePlugin(page, uniqueid, version) {
    loading.show();
    ApiClient.enablePlugin(uniqueid, version).then(function () {
        reloadList(page);
    });
}

function disablePlugin(page, uniqueid, version) {
    loading.show();
    ApiClient.disablePlugin(uniqueid, version).then(function () {
        reloadList(page);
    });
}

function showNoConfigurationMessage() {
    Dashboard.alert({
        message: globalize.translate('MessageNoPluginConfiguration')
    });
}

function showConnectMessage() {
    Dashboard.alert({
        message: globalize.translate('MessagePluginConfigurationRequiresLocalAccess')
    });
}

function getPluginCardHtml(plugin, pluginConfigurationPages) {
    const configPage = pluginConfigurationPages.filter(function (pluginConfigurationPage) {
        return pluginConfigurationPage.PluginId == plugin.Id;
    })[0];

    const configPageUrl = configPage ? Dashboard.getPluginUrl(configPage.Name) : null;
    let html = '';

    html += `<div data-id='${plugin.Id}' data-version='${plugin.Version}' data-name='${plugin.Name}' data-removable='${plugin.CanUninstall}' data-status='${plugin.Status}' class='card backdropCard'>`;
    html += '<div class="cardBox visualCardBox">';
    html += '<div class="cardScalable">';
    html += '<div class="cardPadder cardPadder-backdrop"></div>';
    html += '<div class="cardContent">';
    if (configPageUrl) {
        html += `<a class="cardImageContainer" is="emby-linkbutton" style="margin:0;padding:0" href="${configPageUrl}">`;
    } else {
        html += '<div class="cardImageContainer noConfigPluginCard noHoverEffect emby-button">';
    }

    if (plugin.HasImage) {
        html += `<img src="/Plugins/${plugin.Id}/${plugin.Version}/Image" style="width:100%" />`;
    } else {
        html += `<div class="cardImage flex align-items-center justify-content-center ${cardBuilder.getDefaultBackgroundClass()}">`;
        html += '<span class="cardImageIcon material-icons extension"></span>';
        html += '</div>';
    }
    html += configPageUrl ? '</a>' : '</div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="cardFooter">';

    if (configPage || plugin.CanUninstall) {
        html += '<div style="text-align:right; float:right;padding-top:5px;">';
        html += '<button type="button" is="paper-icon-button-light" class="btnCardMenu autoSize"><span class="material-icons more_vert"></span></button>';
        html += '</div>';
    }

    html += "<div class='cardText'>";
    html += configPage && configPage.DisplayName ? configPage.DisplayName : plugin.Name;
    html += `<br/>${globalize.translate('LabelStatus')} ${plugin.Status}</div>`;
    html += "<div class='cardText cardText-secondary'>";
    html += plugin.Version;
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
}

function renderPlugins(page, plugins) {
    ApiClient.getJSON(ApiClient.getUrl('web/configurationpages') + '?pageType=PluginConfiguration').then(function (configPages) {
        populateList(page, plugins, configPages);
    });
}

function populateList(page, plugins, pluginConfigurationPages) {
    plugins = plugins.sort(function (plugin1, plugin2) {
        if (plugin1.Name > plugin2.Name) {
            return 1;
        }

        return -1;
    });

    let html = plugins.map(function (p) {
        return getPluginCardHtml(p, pluginConfigurationPages);
    }).join('');

    const installedPluginsElement = page.querySelector('.installedPlugins');
    installedPluginsElement.removeEventListener('click', onInstalledPluginsClick);
    installedPluginsElement.addEventListener('click', onInstalledPluginsClick);

    if (plugins.length) {
        installedPluginsElement.classList.add('itemsContainer');
        installedPluginsElement.classList.add('vertical-wrap');
    } else {
        html += '<div class="centerMessage">';
        html += '<h1>' + globalize.translate('MessageNoPluginsInstalled') + '</h1>';
        html += '<p><a is="emby-linkbutton" class="button-link" href="#!/availableplugins.html">';
        html += globalize.translate('MessageBrowsePluginCatalog');
        html += '</a></p>';
        html += '</div>';
    }

    installedPluginsElement.innerHTML = html;
    loading.hide();
}

function showPluginMenu(page, elem) {
    const card = dom.parentWithClass(elem, 'card');
    const id = card.getAttribute('data-id');
    const name = card.getAttribute('data-name');
    const removable = card.getAttribute('data-removable');
    const configHref = card.querySelector('.cardImageContainer').getAttribute('href');
    const status = card.getAttribute('data-status');
    const version = card.getAttribute('data-version');
    const menuItems = [];

    if (configHref) {
        menuItems.push({
            name: globalize.translate('Settings'),
            id: 'open',
            icon: 'mode_edit'
        });
    }

    if (removable === 'true') {
        if (status === 'Disabled') {
            menuItems.push({
                name: globalize.translate('EnablePlugin'),
                id: 'enable',
                icon: 'mode_enable'
            });
        }

        if (status === 'Active') {
            menuItems.push({
                name: globalize.translate('DisablePlugin'),
                id: 'disable',
                icon: 'mode_disable'
            });
        }

        menuItems.push({
            name: globalize.translate('ButtonUninstall'),
            id: 'delete',
            icon: 'delete'
        });
    }

    import('../../../../components/actionSheet/actionSheet').then((actionsheet) => {
        actionsheet.show({
            items: menuItems,
            positionTo: elem,
            callback: function (resultId) {
                switch (resultId) {
                    case 'open':
                        Dashboard.navigate(configHref);
                        break;
                    case 'delete':
                        deletePlugin(page, id, version, name);
                        break;
                    case 'enable':
                        enablePlugin(page, id, version);
                        break;
                    case 'disable':
                        disablePlugin(page, id, version);
                        break;
                }
            }
        });
    });
}

function reloadList(page) {
    loading.show();
    ApiClient.getInstalledPlugins().then(function (plugins) {
        renderPlugins(page, plugins);
    });
}

function getTabs() {
    return [{
        href: '#!/installedplugins.html',
        name: globalize.translate('TabMyPlugins')
    }, {
        href: '#!/availableplugins.html',
        name: globalize.translate('TabCatalog')
    }, {
        href: '#!/repositories.html',
        name: globalize.translate('TabRepositories')
    }];
}

function onInstalledPluginsClick(e) {
    if (dom.parentWithClass(e.target, 'noConfigPluginCard')) {
        showNoConfigurationMessage();
    } else if (dom.parentWithClass(e.target, 'connectModePluginCard')) {
        showConnectMessage();
    } else {
        const btnCardMenu = dom.parentWithClass(e.target, 'btnCardMenu');
        if (btnCardMenu) {
            showPluginMenu(dom.parentWithClass(btnCardMenu, 'page'), btnCardMenu);
        }
    }
}

pageIdOn('pageshow', 'pluginsPage', function () {
    libraryMenu.setTabs('plugins', 0, getTabs);
    reloadList(this);
});

window.PluginsPage = {
    renderPlugins: renderPlugins
};
