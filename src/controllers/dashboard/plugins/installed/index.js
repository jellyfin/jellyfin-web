import loading from 'loading';
import libraryMenu from 'libraryMenu';
import dom from 'dom';
import globalize from 'globalize';
import 'cardStyle';
import 'emby-button';

function deletePlugin(page, uniqueid, name) {
    const msg = globalize.translate('UninstallPluginConfirmation', name);

    import('confirm').then(({default: confirm}) => {
        confirm.default({
            title: globalize.translate('HeaderUninstallPlugin'),
            text: msg,
            primary: 'delete',
            confirmText: globalize.translate('HeaderUninstallPlugin')
        }).then(function () {
            loading.show();
            ApiClient.uninstallPlugin(uniqueid).then(function () {
                reloadList(page);
            });
        });
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
    html += "<div data-id='" + plugin.Id + "' data-name='" + plugin.Name + "' data-removable='" + plugin.CanUninstall + "' class='card backdropCard'>";
    html += '<div class="cardBox visualCardBox">';
    html += '<div class="cardScalable">';
    html += '<div class="cardPadder cardPadder-backdrop"></div>';
    html += configPageUrl ? '<a class="cardContent cardImageContainer" is="emby-linkbutton" href="' + configPageUrl + '">' : '<div class="cardContent noConfigPluginCard noHoverEffect cardImageContainer emby-button">';
    html += '<span class="cardImageIcon material-icons folder"></span>';
    html += configPageUrl ? '</a>' : '</div>';
    html += '</div>';
    html += '<div class="cardFooter">';

    if (configPage || plugin.CanUninstall) {
        html += '<div style="text-align:right; float:right;padding-top:5px;">';
        html += '<button type="button" is="paper-icon-button-light" class="btnCardMenu autoSize"><span class="material-icons more_vert"></span></button>';
        html += '</div>';
    }

    html += "<div class='cardText'>";
    html += configPage && configPage.DisplayName ? configPage.DisplayName : plugin.Name;
    html += '</div>';
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
        html += '<p><a is="emby-linkbutton" class="button-link" href="availableplugins.html">';
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
    const configHref = card.querySelector('.cardContent').getAttribute('href');
    const menuItems = [];

    if (configHref) {
        menuItems.push({
            name: globalize.translate('Settings'),
            id: 'open',
            icon: 'mode_edit'
        });
    }

    if (removable === 'true') {
        menuItems.push({
            name: globalize.translate('ButtonUninstall'),
            id: 'delete',
            icon: 'delete'
        });
    }

    import('actionsheet').then(({default: actionsheet}) => {
        actionsheet.show({
            items: menuItems,
            positionTo: elem,
            callback: function (resultId) {
                switch (resultId) {
                    case 'open':
                        Dashboard.navigate(configHref);
                        break;
                    case 'delete':
                        deletePlugin(page, id, name);
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
        href: 'installedplugins.html',
        name: globalize.translate('TabMyPlugins')
    }, {
        href: 'availableplugins.html',
        name: globalize.translate('TabCatalog')
    }, {
        href: 'repositories.html',
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
