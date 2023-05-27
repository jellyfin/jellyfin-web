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
import scrollHelper from '../../scripts/scrollHelper';
import '../../styles/playerepisodeselector.scss';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { be } from 'date-fns/locale';

interface SeriesData {
    seriesId: string | null,
    currentItem: BaseItemDto | null,
    seasons: {
        [seasonId: string]: {
            seasonData: BaseItemDto,
            episodes: BaseItemDto[],
        }
    }
}

interface Result {
    top: number,
    left: number,
    width: number,
    height: number
}

let data: SeriesData = {
    seriesId: null,
    currentItem: null,
    seasons: {}
};

type NoArgumentFunction = () => void;

function fillSeasons(seriesId: string, serverId: string): void {
    const apiClient = ServerConnections.getApiClient(serverId);
    apiClient.getSeasons(seriesId).then((seasons) => {
        return seasons.Items;
    }).then((seasons) => {
        if (!seasons) {
            return;
        }
        for (const season of seasons) {
            if (!season.Id) {
                continue;
            }
            data.seasons[season.Id] = {
                seasonData: season,
                episodes: []
            };
        }
    }).catch(() => {
        console.log('error while filling seasons');
    });
}

function fillEpisodes(seriesId: string, serverId: string): void {
    const apiClient = ServerConnections.getApiClient(serverId);
    apiClient.getItems(apiClient.getCurrentUserId(), {
        Fields: 'Overview',
        ParentId: seriesId,
        IncludeItemTypes: 'Episode',
        Recursive: true
    }).then((episodes) => {
        if (!episodes || !episodes.Items) {
            return;
        }
        for (const episode of episodes.Items) {
            if (!episode.SeasonId) {
                continue;
            }
            data.seasons[episode.SeasonId].episodes.push(episode);
        }
    }).catch(() => {
        console.log('error while filling episodes');
    });
}

function fillSeriesData(item: BaseItemDto, callback: NoArgumentFunction) {
    if (!item.SeriesId || !item.ServerId || !item.Id) {
        return;
    }
    if (item.SeriesId == data.seriesId && Object.keys(data.seasons).length !== 0) {
        data.currentItem = item;
        callback();
        return;
    }

    data = {
        seriesId: item.SeriesId,
        currentItem: item,
        seasons: {}
    };

    fillSeasons(item.SeriesId, item.ServerId);
    fillEpisodes(item.SeriesId, item.ServerId);
    callback();
}

function showSeasonSelector(positionTo: Element) {
    const items = Object.entries(data.seasons).map(([seasonId, season]) => {
        return {
            name: season.seasonData.Name,
            id: seasonId,
            selected: data.currentItem ? season.seasonData.Id == data.currentItem.SeasonId : false
        };
    });

    actionsheet.show({
        items: items,
        title: data.currentItem ? data.currentItem.SeriesName : '',
        positionTo: positionTo
    }).then(function (id) {
        showEpisodeSelector(id, positionTo);
    }).catch(() => { return; });
}

function showEpisodeSelector(seasonId: string, positionTo: Element) {
    if (!(seasonId in data.seasons)) {
        return;
    }

    const episodes = data.seasons[seasonId].episodes;
    if (!episodes || episodes.length === 0) {
        return;
    }

    if (!data.currentItem) {
        return;
    }
    show(
        episodes,
        data.currentItem,
        positionTo,
        episodes.length > 0 && episodes[0].SeasonName ? episodes[0].SeasonName : ''
    ).then((id) => {
        if (id === '-1') {
            showSeasonSelector(positionTo);
            return;
        }

        if (id === data.currentItem?.Id || !data.currentItem?.ServerId || !id) {
            return;
        }
        playbackManager.play({
            ids: [id],
            serverId: data.currentItem.ServerId
        });
    }).catch(() => {
        console.log('error while showing episode selector');
    });
}

function getOffsets(elems: Element[]) {
    const results: Result[] = [];

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

function getPosition(positionTo: Element, dlg: HTMLElement) {
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

function getItemHTML(item: BaseItemDto, currentItem: BaseItemDto) {
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
        forceDiv: true,
        cardCssClass: 'episodeSelectorCard',
        height: 320,
        width: 180
    }
    );

    const icon = item.Id === currentItem.Id ? 'check' : '';

    let menuItemClass = 'listItem listItem-button actionSheetMenuItem';
    if (layoutManager.tv) {
        menuItemClass += ' listItem-focusscale';
    } else if (layoutManager.mobile) {
        menuItemClass += ' actionsheet-xlargeFont';
    }

    return `
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
function getInnerHTML(items: BaseItemDto[], currentItem: BaseItemDto, title: string) {
    let style = '';

    // Admittedly a hack but right now the scrollbar is being factored into the width which is causing truncation
    if (items.length > 20) {
        const minWidth = dom.getWindowSize().innerWidth >= 300 ? 240 : 200;
        style += 'min-width:' + minWidth + 'px;';
    }

    const scrollClassName = layoutManager.tv ? 'scrollY smoothScrollY hiddenScrollY' : 'scrollY';

    let scrollerClassName = 'actionSheetScroller';
    if (layoutManager.tv) {
        scrollerClassName += ' actionSheetScroller-tv focuscontainer-x focuscontainer-y';
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

    html += items.map(i => getItemHTML(i, currentItem)).join('');
    return html + '</div>';
}

function createDialog() {
    const dialogOptions = {
        removeOnClose: true,
        scrollY: false,
        size: '',
        autoFocus: false,
        modal: false
    };

    let isFullscreen;

    if (layoutManager.tv) {
        dialogOptions.size = 'fullscreen';
        isFullscreen = true;
        dialogOptions.autoFocus = true;
    }

    const dlg = dialogHelper.createDialog(dialogOptions);

    if (isFullscreen) {
        dlg.classList.add('actionsheet-fullscreen');
    } else {
        dlg.classList.add('actionsheet-not-fullscreen');
    }

    dlg.classList.add('actionSheet');

    const btnCloseActionSheet = dlg.querySelector('.btnCloseActionSheet');
    if (btnCloseActionSheet) {
        btnCloseActionSheet.addEventListener('click', function () {
            dialogHelper.close(dlg);
        });
    }

    return dlg;
}

function scrollToCurrent(dlg: HTMLElement, currentItem: BaseItemDto) {
    const currentSelected = dlg.querySelector(`[data-id="${currentItem.Id}"]`);

    if (currentSelected) {
        currentSelected.scrollIntoView();
    }
}

function loadImages() {
    const seasons = document.querySelector('.actionSheetContent');
    imageLoader.lazyChildren(seasons);
    if (seasons) {
        for (const img of seasons.querySelectorAll('a')) {
            img.removeAttribute('href');
            const footer = img.querySelector('.innerCardFooter');
            if (footer) {
                footer.classList.add('hide');
            }
        }
    }
}

function setDLGPosition(dlg: HTMLElement, positionTo: Element) {
    const pos = positionTo && !layoutManager.tv ? getPosition(positionTo, dlg) : null;
    if (pos) {
        dlg.style.position = 'fixed';
        dlg.style.margin = '0';
        dlg.style.left = pos.left + 'px';
        dlg.style.top = pos.top + 'px';
    }
}

export function show(items: BaseItemDto[], currentItem: BaseItemDto, positionTo: Element, title: string) {
    const dlg = createDialog();
    dlg.innerHTML = getInnerHTML(items, currentItem, title);

    scrollHelper.centerFocus.on(dlg.querySelector('.actionSheetScroller'), false);

    let selectedId: string | null = null;

    return new Promise(function (resolve, reject) {
        let isResolved = false;
        dlg.addEventListener('click', function (e) {
            if (!(e.target instanceof HTMLElement)) {
                return;
            }

            const actionSheetMenuItem = dom.parentWithClass(e.target, 'actionSheetMenuItem');
            selectedId = actionSheetMenuItem ? actionSheetMenuItem.getAttribute('data-id') : null;
            isResolved = true;
            resolve(selectedId);
            dialogHelper.close(dlg);
        });

        dlg.addEventListener('close', function () {
            if (layoutManager.tv) {
                scrollHelper.centerFocus.off(dlg.querySelector('.actionSheetScroller'), false);
            }

            if (!isResolved && selectedId != null) {
                resolve(selectedId);
            } else if (!isResolved) {
                reject('ActionSheet closed without resolving');
            }
        });

        dialogHelper.open(dlg).catch(() => {
            reject('ActionSheet closed without resolving');
        });

        scrollToCurrent(dlg, currentItem);
        window.scroll = () => scrollToCurrent(dlg, currentItem);
        loadImages();
        setDLGPosition(dlg, positionTo);
    });
}

export default {
    showEpisodeSelector: showEpisodeSelector,
    fillSeriesData: fillSeriesData
};
