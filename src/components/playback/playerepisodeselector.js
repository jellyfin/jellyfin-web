import escapeHtml from 'escape-html';
import dialogHelper from '../dialogHelper/dialogHelper';
import layoutManager from '../layoutManager';
import globalize from '../../scripts/globalize';
import dom from '../../scripts/dom';
import '../../elements/emby-button/emby-button';
import '../actionSheet/actionSheet.scss';
import '../../styles/flexstyles.scss';
import 'material-design-icons-iconfont';
import '../../styles/scrollstyles.scss';
import '../../components/listview/listview.scss';
import imageLoader from '../images/imageLoader';
import cardBuilder from '../cardbuilder/cardBuilder';
import ServerConnections from '../ServerConnections';
import { playbackManager } from './playbackmanager';
import actionsheet from '../actionSheet/actionSheet';
import './playerepisodeselector.scss';

// seasons: seasonId: {seasonData: seasonItem, episodes: [episode]}
let seriesData = {
    seriesId: null,
    currentItem: null,
    seasons: {}
};

function fillSeriesData(item, callback) {
    if (item.SeriesId == seriesData.seriesId && Object.keys(seriesData.seasons).length !== 0) {
        seriesData.currentItem = item;
        callback();
        return;
    }

    seriesData = {
        seriesId: item.SeriesId,
        currentItem: item,
        seasons: {}
    };

    const apiClient = ServerConnections.getApiClient(item.ServerId);

    apiClient.getSeasons(item.SeriesId).then((seasons) => {
        return seasons.Items;
    }).then((seasons) => {
        for (const season of seasons) {
            seriesData.seasons[season.Id] = {
                seasonData: season,
                episodes: []
            };
        }
    });

    apiClient.getItems(apiClient.getCurrentUserId(), {
        Fields: 'Overview',
        ParentId: item.SeriesId,
        IncludeItemTypes: 'Episode',
        Recursive: true
    }).then((episodes) => {
        for (const episode of episodes.Items) {
            seriesData.seasons[episode.SeasonId].episodes.push(episode);
        }
    }).then(() => {
        callback();
    });
}

function showSeasonSelector(positionTo) {
    const items = Object.entries(seriesData.seasons).map(([seasonId, season]) => {
        return {
            name: season.seasonData.Name,
            id: seasonId,
            selected: season.seasonData.Id == seriesData.currentItem.SeasonId
        };
    });

    actionsheet.show({
        items: items,
        title: seriesData.currentItem.SeriesName,
        positionTo: positionTo
    }).then(function (id) {
        showEpisodeSelector(id, positionTo);
    });
}

function showEpisodeSelector(seasonId, positionTo) {
    if (!(seasonId in seriesData.seasons)) {
        return;
    }

    const episodes = seriesData.seasons[seasonId].episodes;
    if (!episodes || episodes.length === 0) {
        return;
    }

    show(
        episodes,
        seriesData.currentItem,
        positionTo,
        episodes[0].SeasonName
    ).then((id) => {
        if (id === '-1') {
            showSeasonSelector(positionTo);
            return;
        }

        if (id === seriesData.currentItem.Id) {
            return;
        }

        playbackManager.play({
            ids: [id],
            serverId: seriesData.currentItem.ServerId
        });
    });
}

function getOffsets(elems) {
    const results = [];

    if (!document) {
        return results;
    }

    for (const elem of elems) {
        const box = elem.getBoundingClientRect();

        results.push({
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height
        });
    }

    return results;
}

function getPosition(positionTo, dlg) {
    const windowSize = dom.getWindowSize();
    const windowHeight = windowSize.innerHeight;
    const windowWidth = windowSize.innerWidth;

    const pos = getOffsets([positionTo])[0];

    pos.left += (pos.width || 0) / 2;

    const height = dlg.offsetHeight || 300;
    const width = dlg.offsetWidth || 160;

    // Account for popup size
    pos.top -= height / 2;
    pos.left -= width / 2;

    // Avoid showing too close to the bottom
    const overflowX = pos.left + width - windowWidth;
    const overflowY = pos.top + height - windowHeight;

    if (overflowX > 0) {
        pos.left -= (overflowX + 20);
    }
    if (overflowY > 0) {
        pos.top -= (overflowY + 20);
    }

    // Do some boundary checking
    pos.top = Math.max(pos.top, 10);
    pos.left = Math.max(pos.left, 10);

    return pos;
}

function centerFocus(elem, horiz, on) {
    import('../../scripts/scrollHelper').then((scrollHelper) => {
        const fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}

export function show(items, currentItem, positionTo, title) {
    // items (jellyfin_items)
    // currentItem (jellyfin_item)
    // positionTo
    // title

    const dialogOptions = {
        removeOnClose: true,
        scrollY: false
    };

    let isFullscreen;

    if (layoutManager.tv) {
        dialogOptions.size = 'fullscreen';
        isFullscreen = true;
        dialogOptions.autoFocus = true;
    } else {
        dialogOptions.modal = false;
        dialogOptions.autoFocus = false;
    }

    const dlg = dialogHelper.createDialog(dialogOptions);

    if (isFullscreen) {
        dlg.classList.add('actionsheet-fullscreen');
    } else {
        dlg.classList.add('actionsheet-not-fullscreen');
    }

    dlg.classList.add('actionSheet');

    const scrollClassName = layoutManager.tv ? 'scrollY smoothScrollY hiddenScrollY' : 'scrollY';
    let style = '';

    // Admittedly a hack but right now the scrollbar is being factored into the width which is causing truncation
    if (items.length > 20) {
        const minWidth = dom.getWindowSize().innerWidth >= 300 ? 240 : 200;
        style += 'min-width:' + minWidth + 'px;';
    }
    let scrollerClassName = 'actionSheetScroller';
    if (layoutManager.tv) {
        scrollerClassName += ' actionSheetScroller-tv focuscontainer-x focuscontainer-y';
    }

    let menuItemClass = 'listItem listItem-button actionSheetMenuItem';

    if (layoutManager.tv) {
        menuItemClass += ' listItem-focusscale';
    }

    if (layoutManager.mobile) {
        menuItemClass += ' actionsheet-xlargeFont';
    }

    const maxHeight = layoutManager.tv ? '' : 'max-height: 66vh;';

    const tvExitButton = `
        <button is="paper-icon-button-light" class="btnCloseActionSheet hide-mouse-idle-tv" tabindex="-1" title="${globalize.translate('ButtonBack')}">
            <span class="material-icons arrow_back" aria-hidden="true"></span>
        </button>
    `;

    const seasonsButton = `
            <button is="emby-button" type="button" class="listItem listItem-button actionSheetMenuItem emby-button" data-id="-1">
                <span class="actionsheetMenuItemIcon listItemIcon listItemIcon-transparent material-icons arrow_back" aria-hidden="true"></span>
                <div class="listItemBody actionsheetListItemBody">
                    <h1 class="listItemBodyText actionSheetItemText">${escapeHtml(title)}</h1>
                </div>
            </button>
    `;

    const scroller = `
        <div class="${scrollerClassName} ${scrollClassName}" style="${style}">
    `;

    let html = `<div class="actionSheetContent actionSheetContent-centered" style="${maxHeight}">`;

    if (layoutManager.tv) {
        html += tvExitButton + scroller + seasonsButton;
    } else {
        html += seasonsButton + scroller;
    }

    for (const item of items) {
        const autoFocus = item.Id === currentItem.Id && layoutManager.tv ? ' autoFocus' : '';

        let progressWidth = 0;
        if (item.UserData && item.UserData.PlayedPercentage != null) {
            progressWidth = item.UserData.PlayedPercentage;
        } else if (item.UserData && item.UserData.Played) {
            progressWidth = 100;
        }

        const card = cardBuilder.getCardsHtml([item], {
            shape: 'backdrop',
            disableHoverMenu: true,
            disableIndicators: true,
            overlayPlayButton: false,
            cardCssClass: 'episodeSelectorCard',
            height: 320,
            width: 180
        }
        );

        const icon = item.Id === currentItem.Id ? 'check' : '';

        html += `
            <button ${autoFocus} is="emby-button" type="button" class="${menuItemClass}" data-id="${item.Id}">
                <span class="actionsheetMenuItemIcon listItemIcon listItemIcon-transparent material-icons ${icon}" aria-hidden="true"></span>
                <div class="episodeSelector">
                    <div class="flex justify-content-space-between align-items-center flex-direction-row">
                        <h3 class="episodeSelectorEpisodeName">
                            ${escapeHtml(`${item.IndexNumber ? item.IndexNumber + '. ' : ''}${item.Name}`)}
                        </h3>
                        <div class="itemProgressBar innerCardFooter episodeSelectProgressBar">
                            <div class="itemProgressBarForeground" style="width:${progressWidth}%;"></div>
                        </div>
                    </div>
                    <div class="flex align-items-center">
                            ${card}
                        <p class="episodeSelectorOverview">
                            ${item.Overview ? escapeHtml(item.Overview) : ''}
                        </p>
                    </div>
                </div>
            </button>`;
    }

    html += '</div>';

    dlg.innerHTML = html;

    if (layoutManager.tv) {
        centerFocus(dlg.querySelector('.actionSheetScroller'), false, true);
    }

    const btnCloseActionSheet = dlg.querySelector('.btnCloseActionSheet');
    if (btnCloseActionSheet) {
        btnCloseActionSheet.addEventListener('click', function () {
            dialogHelper.close(dlg);
        });
    }

    let selectedId;

    return new Promise(function (resolve, reject) {
        let isResolved;

        dlg.addEventListener('click', function (e) {
            const actionSheetMenuItem = dom.parentWithClass(e.target, 'actionSheetMenuItem');

            if (actionSheetMenuItem) {
                selectedId = actionSheetMenuItem.getAttribute('data-id');

                dialogHelper.close(dlg);
            }
        });

        dlg.addEventListener('close', function () {
            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.actionSheetScroller'), false, false);
            }

            if (!isResolved) {
                if (selectedId != null) {
                    resolve(selectedId);
                } else {
                    reject('ActionSheet closed without resolving');
                }
            }
        });

        dialogHelper.open(dlg);

        const pos = positionTo && dialogOptions.size !== 'fullscreen' ? getPosition(positionTo, dlg) : null;

        const seasons = dlg.querySelector('.scrollY');
        const selected = dlg.querySelector(`[data-id="${currentItem.Id}"]`);

        if (selected && seasons) {
            seasons.scrollTop = seasons.scrollTop + selected.offsetTop - 100;
        }

        imageLoader.lazyChildren(seasons);
        for (const img of seasons.querySelectorAll('a')) {
            img.removeAttribute('href');
            const footer = img.querySelector('.innerCardFooter');
            if (footer) {
                footer.classList.add('hide');
            }
        }

        if (pos) {
            dlg.style.position = 'fixed';
            dlg.style.margin = 0;
            dlg.style.left = pos.left + 'px';
            dlg.style.top = pos.top + 'px';
        }
    });
}

export default {
    showEpisodeSelector: showEpisodeSelector,
    fillSeriesData: fillSeriesData
};
