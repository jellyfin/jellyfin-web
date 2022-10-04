import loading from '../../../../components/loading/loading';
import libraryMenu from '../../../../scripts/libraryMenu';
import globalize from '../../../../scripts/globalize';
import * as cardBuilder from '../../../../components/cardbuilder/cardBuilder.js';
import '../../../../components/cardbuilder/card.scss';
import '../../../../elements/emby-button/emby-button';
import '../../../../elements/emby-checkbox/emby-checkbox';
import '../../../../elements/emby-select/emby-select';

function reloadList(page) {
    loading.show();
    const promise1 = ApiClient.getAvailablePlugins();
    const promise2 = ApiClient.getInstalledPlugins();
    Promise.all([promise1, promise2]).then(function (responses) {
        populateList({
            catalogElement: page.querySelector('#pluginTiles'),
            noItemsElement: page.querySelector('#noPlugins'),
            availablePlugins: responses[0],
            installedPlugins: responses[1]
        });
    });
}

function getHeaderText(category) {
    category = category.replace(' ', '');
    // TODO: Replace with switch
    if (category === 'Channel') {
        category = 'Channels';
    } else if (category === 'Theme') {
        category = 'Themes';
    } else if (category === 'LiveTV') {
        category = 'LiveTV';
    } else if (category === 'ScreenSaver') {
        category = 'HeaderScreenSavers';
    }

    return globalize.translate(category);
}

function populateList(options) {
    const availablePlugins = options.availablePlugins;
    const installedPlugins = options.installedPlugins;

    availablePlugins.forEach(function (plugin, index, array) {
        plugin.category = plugin.category || 'General';
        plugin.categoryDisplayName = getHeaderText(plugin.category);
        array[index] = plugin;
    });

    availablePlugins.sort(function (a, b) {
        if (a.category > b.category) {
            return 1;
        } else if (b.category > a.category) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        } else if (b.name > a.name) {
            return -1;
        }
        return 0;
    });

    let currentCategory = null;
    let html = '';

    for (let i = 0; i < availablePlugins.length; i++) {
        const plugin = availablePlugins[i];
        const category = plugin.categoryDisplayName;
        if (category != currentCategory) {
            if (currentCategory) {
                html += '</div>';
                html += '</div>';
            }
            html += '<div class="verticalSection">';
            html += '<h2 class="sectionTitle sectionTitle-cards">' + category + '</h2>';
            html += '<div class="itemsContainer vertical-wrap">';
            currentCategory = category;
        }
        html += getPluginHtml(plugin, options, installedPlugins);
    }
    html += '</div>';
    html += '</div>';

    if (!availablePlugins.length && options.noItemsElement) {
        options.noItemsElement.classList.remove('hide');
    }

    options.catalogElement.innerHTML = html;
    loading.hide();
}

function getPluginHtml(plugin, options, installedPlugins) {
    let html = '';
    let href = plugin.externalUrl ? plugin.externalUrl : '#/addplugin.html?name=' + encodeURIComponent(plugin.name) + '&guid=' + plugin.guid;

    if (options.context) {
        href += '&context=' + options.context;
    }

    const target = plugin.externalUrl ? ' target="_blank"' : '';
    html += "<div class='card backdropCard'>";
    html += '<div class="cardBox visualCardBox">';
    html += '<div class="cardScalable visualCardBox-cardScalable">';
    html += '<div class="cardPadder cardPadder-backdrop"></div>';
    html += '<div class="cardContent">';
    html += `<a class="cardImageContainer" is="emby-linkbutton" style="margin:0;padding:0" href="${href}" ${target}>`;

    if (plugin.imageUrl) {
        html += `<img src="${plugin.imageUrl}" style="width:100%" />`;
    } else {
        html += `<div class="cardImage flex align-items-center justify-content-center ${cardBuilder.getDefaultBackgroundClass()}">`;
        html += '<span class="cardImageIcon material-icons extension" aria-hidden="true"></span>';
        html += '</div>';
    }

    html += '</a>';
    html += '</div>';
    html += '</div>';
    html += '<div class="cardFooter">';
    html += "<div class='cardText'>";
    html += plugin.name;
    html += '</div>';
    const installedPlugin = installedPlugins.filter(function (ip) {
        return ip.Id == plugin.guid;
    })[0];
    html += "<div class='cardText cardText-secondary'>";
    html += installedPlugin ? globalize.translate('LabelVersionInstalled', installedPlugin.Version) : '&nbsp;';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
}

function getTabs() {
    return [{
        href: '#/installedplugins.html',
        name: globalize.translate('TabMyPlugins')
    }, {
        href: '#/availableplugins.html',
        name: globalize.translate('TabCatalog')
    }, {
        href: '#/repositories.html',
        name: globalize.translate('TabRepositories')
    }];
}

export default function (view) {
    view.addEventListener('viewshow', function () {
        libraryMenu.setTabs('plugins', 1, getTabs);
        reloadList(this);
    });
}
