import escapeHTML from 'escape-html';

import loading from '../../../../components/loading/loading';
import libraryMenu from '../../../../scripts/libraryMenu';
import globalize from '../../../../scripts/globalize';
import '../../../../components/cardbuilder/card.scss';
import '../../../../elements/emby-button/emby-button';
import '../../../../elements/emby-checkbox/emby-checkbox';
import '../../../../elements/emby-select/emby-select';
import { getDefaultBackgroundClass } from '../../../../components/cardbuilder/cardBuilderUtils';

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

    for (const plugin of availablePlugins) {
        const category = plugin.categoryDisplayName;
        if (category != currentCategory) {
            if (currentCategory) {
                html += '</div>';
                html += '</div>';
            }
            html += '<div class="verticalSection">';
            html += '<h2 class="sectionTitle sectionTitle-cards">' + escapeHTML(category) + '</h2>';
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

    const searchBar = document.getElementById('txtSearchPlugins');
    if (searchBar) {
        searchBar.addEventListener('input', () => onSearchBarType(searchBar));
    }

    options.catalogElement.innerHTML = html;
    loading.hide();
}

function onSearchBarType(searchBar) {
    const filter = searchBar.value.toLowerCase();
    for (const header of document.querySelectorAll('div .verticalSection')) {
        // keep track of shown cards after each search
        let shown = 0;
        for (const card of header.querySelectorAll('div .card')) {
            if (filter && filter != '' && !card.textContent.toLowerCase().includes(filter)) {
                card.style.display = 'none';
            } else {
                card.style.display = 'unset';
                shown++;
            }
        }
        // hide title if no cards are shown
        if (shown <= 0) {
            header.style.display = 'none';
        } else {
            header.style.display = 'unset';
        }
    }
}

function getPluginHtml(plugin, options, installedPlugins) {
    let html = '';
    let href = plugin.externalUrl ? plugin.externalUrl : '#/dashboard/plugins/add?name=' + encodeURIComponent(plugin.name) + '&guid=' + plugin.guid;

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
        html += `<img src="${escapeHTML(plugin.imageUrl)}" style="width:100%" />`;
    } else {
        html += `<div class="cardImage flex align-items-center justify-content-center ${getDefaultBackgroundClass()}">`;
        html += '<span class="cardImageIcon material-icons extension" aria-hidden="true"></span>';
        html += '</div>';
    }

    html += '</a>';
    html += '</div>';
    html += '</div>';
    html += '<div class="cardFooter">';
    html += "<div class='cardText'>";
    html += escapeHTML(plugin.name);
    html += '</div>';
    const installedPlugin = installedPlugins.find(installed => installed.Id === plugin.guid);
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
        href: '#/dashboard/plugins',
        name: globalize.translate('TabMyPlugins')
    }, {
        href: '#/dashboard/plugins/catalog',
        name: globalize.translate('TabCatalog')
    }, {
        href: '#/dashboard/plugins/repositories',
        name: globalize.translate('TabRepositories')
    }];
}

export default function (view) {
    view.addEventListener('viewshow', function () {
        libraryMenu.setTabs('plugins', 1, getTabs);
        reloadList(this);
    });
}
