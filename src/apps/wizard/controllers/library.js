import escapeHtml from 'escape-html';

import { getDefaultBackgroundClass } from 'components/cardbuilder/cardBuilderUtils';
import confirm from 'components/confirm/confirm';
import loading from 'components/loading/loading';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import dom from 'utils/dom';
import taskButton from 'scripts/taskbutton';
import Dashboard, { pageClassOn, pageIdOn } from 'utils/dashboard';
import imageHelper from 'utils/image';

import 'components/cardbuilder/card.scss';
import 'elements/emby-itemrefreshindicator/emby-itemrefreshindicator';

function addVirtualFolder(page) {
    import('components/mediaLibraryCreator/mediaLibraryCreator').then(({ default: MediaLibraryCreator }) => {
        new MediaLibraryCreator({
            collectionTypeOptions: getCollectionTypeOptions().filter(function (f) {
                return !f.hidden;
            }),
            refresh: shouldRefreshLibraryAfterChanges(page)
        }).then(function (hasChanges) {
            if (hasChanges) {
                reloadLibrary(page);
            }
        });
    });
}

function editVirtualFolder(page, virtualFolder) {
    import('components/mediaLibraryEditor/mediaLibraryEditor').then(({ default: MediaLibraryEditor }) => {
        new MediaLibraryEditor({
            refresh: shouldRefreshLibraryAfterChanges(page),
            library: virtualFolder
        }).then(function (hasChanges) {
            if (hasChanges) {
                reloadLibrary(page);
            }
        });
    });
}

function deleteVirtualFolder(page, virtualFolder) {
    let msg = globalize.translate('MessageAreYouSureYouWishToRemoveMediaFolder');

    if (virtualFolder.Locations.length) {
        msg += '<br/><br/>' + globalize.translate('MessageTheFollowingLocationWillBeRemovedFromLibrary') + '<br/><br/>';
        msg += virtualFolder.Locations.join('<br/>');
    }

    confirm({
        text: msg,
        title: globalize.translate('HeaderRemoveMediaFolder'),
        confirmText: globalize.translate('Delete'),
        primary: 'delete'
    }).then(function () {
        const refreshAfterChange = shouldRefreshLibraryAfterChanges(page);
        ServerConnections.currentApiClient()
            .removeVirtualFolder(virtualFolder.Name, refreshAfterChange)
            .then(function () {
                reloadLibrary(page);
            });
    });
}

function refreshVirtualFolder(page, virtualFolder) {
    import('components/refreshdialog/refreshdialog').then(({ default: RefreshDialog }) => {
        new RefreshDialog({
            itemIds: [virtualFolder.ItemId],
            serverId: ServerConnections.currentApiClient().serverId(),
            mode: 'scan'
        }).show();
    });
}

function renameVirtualFolder(page, virtualFolder) {
    import('components/prompt/prompt').then(({ default: prompt }) => {
        prompt({
            label: globalize.translate('LabelNewName'),
            description: globalize.translate('MessageRenameMediaFolder'),
            confirmText: globalize.translate('ButtonRename')
        }).then(function (newName) {
            if (newName && newName !== virtualFolder.Name) {
                const refreshAfterChange = shouldRefreshLibraryAfterChanges(page);
                ServerConnections.currentApiClient()
                    .renameVirtualFolder(virtualFolder.Name, newName, refreshAfterChange)
                    .then(function () {
                        reloadLibrary(page);
                    });
            }
        });
    });
}

function showCardMenu(page, elem, virtualFolders) {
    const card = dom.parentWithClass(elem, 'card');
    const index = Number.parseInt(card.dataset.index, 10);
    const virtualFolder = virtualFolders[index];
    const menuItems = [];
    menuItems.push({
        name: globalize.translate('EditImages'),
        id: 'editimages',
        icon: 'photo'
    }, {
        name: globalize.translate('ManageLibrary'),
        id: 'edit',
        icon: 'folder'
    }, {
        name: globalize.translate('ButtonRename'),
        id: 'rename',
        icon: 'mode_edit'
    }, {
        name: globalize.translate('ScanLibrary'),
        id: 'refresh',
        icon: 'refresh'
    }, {
        name: globalize.translate('ButtonRemove'),
        id: 'delete',
        icon: 'delete'
    });

    import('components/actionSheet/actionSheet').then((actionsheet) => {
        actionsheet.show({
            items: menuItems,
            positionTo: elem,
            callback: function (resultId) {
                switch (resultId) {
                    case 'edit':
                        editVirtualFolder(page, virtualFolder);
                        break;

                    case 'editimages':
                        editImages(page, virtualFolder);
                        break;

                    case 'rename':
                        renameVirtualFolder(page, virtualFolder);
                        break;

                    case 'delete':
                        deleteVirtualFolder(page, virtualFolder);
                        break;

                    case 'refresh':
                        refreshVirtualFolder(page, virtualFolder);
                }
            }
        });
    });
}

function reloadLibrary(page) {
    loading.show();
    ServerConnections.currentApiClient()
        .getVirtualFolders()
        .then(function (result) {
            reloadVirtualFolders(page, result);
        });
}

function shouldRefreshLibraryAfterChanges(page) {
    return page.id === 'mediaLibraryPage';
}

function reloadVirtualFolders(page, virtualFolders) {
    let html = '';
    virtualFolders.push({
        Name: globalize.translate('ButtonAddMediaLibrary'),
        icon: 'add_circle',
        Locations: [],
        showType: false,
        showLocations: false,
        showMenu: false,
        showNameWithIcon: false,
        elementId: 'addLibrary'
    });

    for (let i = 0; i < virtualFolders.length; i++) {
        const virtualFolder = virtualFolders[i];
        html += getVirtualFolderHtml(page, virtualFolder, i);
    }

    const divVirtualFolders = page.querySelector('#divVirtualFolders');
    divVirtualFolders.innerHTML = html;
    divVirtualFolders.classList.add('itemsContainer', 'vertical-wrap');
    const btnCardMenuElements = divVirtualFolders.querySelectorAll('.btnCardMenu');
    for (const btn of btnCardMenuElements) {
        btn.addEventListener('click', function () {
            showCardMenu(page, btn, virtualFolders);
        });
    }
    divVirtualFolders.querySelector('#addLibrary').addEventListener('click', function () {
        addVirtualFolder(page);
    });

    const libraryEditElements = divVirtualFolders.querySelectorAll('.editLibrary');
    for (const btn of libraryEditElements) {
        btn.addEventListener('click', function () {
            const card = dom.parentWithClass(btn, 'card');
            const index = Number.parseInt(card.dataset.index, 10);
            const virtualFolder = virtualFolders[index];

            if (virtualFolder.ItemId) {
                editVirtualFolder(page, virtualFolder);
            }
        });
    }
    loading.hide();
}

function editImages(page, virtualFolder) {
    import('components/imageeditor/imageeditor').then((imageEditor) => {
        imageEditor.show({
            itemId: virtualFolder.ItemId,
            serverId: ServerConnections.currentApiClient().serverId()
        }).then(function () {
            reloadLibrary(page);
        });
    });
}

function getLink(text, url) {
    return globalize.translate(text, '<a is="emby-linkbutton" class="button-link" href="' + url + '" target="_blank" data-autohide="true">', '</a>');
}

function getCollectionTypeOptions() {
    return [{
        name: '',
        value: ''
    }, {
        name: globalize.translate('Movies'),
        value: 'movies',
        message: getLink('MovieLibraryHelp', 'https://jellyfin.org/docs/general/server/media/movies')
    }, {
        name: globalize.translate('TabMusic'),
        value: 'music',
        message: getLink('MusicLibraryHelp', 'https://jellyfin.org/docs/general/server/media/music')
    }, {
        name: globalize.translate('Shows'),
        value: 'tvshows',
        message: getLink('TvLibraryHelp', 'https://jellyfin.org/docs/general/server/media/shows')
    }, {
        name: globalize.translate('Books'),
        value: 'books',
        message: getLink('BookLibraryHelp', 'https://jellyfin.org/docs/general/server/media/books')
    }, {
        name: globalize.translate('HomeVideosPhotos'),
        value: 'homevideos'
    }, {
        name: globalize.translate('MusicVideos'),
        value: 'musicvideos'
    }, {
        name: globalize.translate('MixedMoviesShows'),
        value: 'mixed',
        message: globalize.translate('MessageUnsetContentHelp')
    }];
}

function createImageUrl(virtualFolder) {
    if (!virtualFolder.PrimaryImageItemId) return '';

    return ServerConnections.currentApiClient().getScaledImageUrl(
        virtualFolder.PrimaryImageItemId,
        {
            maxWidth: Math.round(dom.getScreenWidth() * 0.40),
            type: 'Primary'
        }
    );
}

function getCardImageContainerHtml(virtualFolder, imgUrl) {
    if (imgUrl) {
        return `
            <div class="cardImageContainer editLibrary" style="cursor:pointer">
                                                                <img src="${imgUrl}" style="width:100%" alt="${escapeHtml(virtualFolder.Name)}" />
            </div>
        `;
    }

    if (!virtualFolder.showNameWithIcon) {
        const iconClass = virtualFolder.icon || imageHelper.getLibraryIcon(virtualFolder.CollectionType);
        return `
            <div class="cardImageContainer editLibrary ${getDefaultBackgroundClass()}" style="cursor:pointer;">
                <span class="cardImageIcon material-icons ${iconClass}" aria-hidden="true"></span>
            </div>
        `;
    }

    return '';
}

function getRefreshIndicatorHtml(virtualFolder) {
    const isRefreshing = virtualFolder.RefreshProgress
                        || (virtualFolder.RefreshStatus && virtualFolder.RefreshStatus !== 'Idle');
    const hideClass = isRefreshing ? '' : ' class="hide"';

    return `
        <div class="cardIndicators backdropCardIndicators">
            <div is="emby-itemrefreshindicator"${hideClass}
                 data-progress="${virtualFolder.RefreshProgress || 0}"
                                                   data-status="${escapeHtml(virtualFolder.RefreshStatus || '')}"></div>
        </div>
    `;
}

function getNameWithIconHtml(virtualFolder) {
    if (!virtualFolder.showNameWithIcon) return '';

    const iconClass = virtualFolder.icon || imageHelper.getLibraryIcon(virtualFolder.CollectionType);
    return `
        <h3 class="cardImageContainer addLibrary"
            style="position:absolute;top:0;left:0;right:0;bottom:0;cursor:pointer;flex-direction:column;">
            <span class="cardImageIcon material-icons ${iconClass}" aria-hidden="true"></span>
            <div style="margin:1em 0;width:100%;">
                ${escapeHtml(virtualFolder.Name)}
            </div>
        </h3>
    `;
}

function getCardMenuHtml(virtualFolder) {
    if (virtualFolder.showMenu === false) return '';

    const dirTextAlign = globalize.getIsRTL() ? 'left' : 'right';
    return `
        <div style="text-align:${dirTextAlign}; float:${dirTextAlign};padding-top:5px;">
            <button type="button" is="paper-icon-button-light" class="btnCardMenu autoSize">
                <span class="material-icons more_vert" aria-hidden="true"></span>
            </button>
        </div>
    `;
}

function getCollectionTypeName(collectionType) {
    const typeOption = getCollectionTypeOptions().find(t => t.value === collectionType);
    return typeOption ? typeOption.name : globalize.translate('Other');
}

function getLocationHtml(locations, showLocations) {
    if (showLocations === false) {
        return '<div class="cardText cardText-secondary">&nbsp;</div>';
    }

    if (locations.length === 1) {
        return `
            <div class="cardText cardText-secondary" dir="ltr" style="text-align:left;">
                ${escapeHtml(locations[0])}
            </div>
        `;
    }

    return `
        <div class="cardText cardText-secondary">
            ${globalize.translate('NumLocationsValue', locations.length)}
        </div>
    `;
}

function getVirtualFolderHtml(page, virtualFolder, index) {
    const elementId = virtualFolder.elementId ? `id="${virtualFolder.elementId}" ` : '';
    const imgUrl = createImageUrl(virtualFolder);
    const hasCardImageContainer = imgUrl || !virtualFolder.showNameWithIcon;

    const cardImageHtml = getCardImageContainerHtml(virtualFolder, imgUrl);
    const refreshIndicatorHtml = hasCardImageContainer ? getRefreshIndicatorHtml(virtualFolder) : '';
    const nameWithIconHtml = (!imgUrl && virtualFolder.showNameWithIcon) ? getNameWithIconHtml(virtualFolder) : '';
    const cardMenuHtml = getCardMenuHtml(virtualFolder);
    const typeName = getCollectionTypeName(virtualFolder.CollectionType);
    const nameText = virtualFolder.showNameWithIcon ? '&nbsp;' : escapeHtml(virtualFolder.Name);
    const typeText = virtualFolder.showType === false ? '&nbsp;' : typeName;
    const locationHtml = getLocationHtml(virtualFolder.Locations, virtualFolder.showLocations);

    return `
        <div ${elementId} class="card backdropCard scalableCard backdropCard-scalable"
             style="min-width:33.3%;"
             data-index="${index}"
                                                    data-id="${virtualFolder.ItemId ? virtualFolder.ItemId : ''}">
            <div class="cardBox visualCardBox">
                <div class="cardScalable visualCardBox-cardScalable">
                    <div class="cardPadder cardPadder-backdrop"></div>
                    <div class="cardContent">
                        ${cardImageHtml}
                        ${refreshIndicatorHtml}
                        ${nameWithIconHtml}
                    </div>
                </div>
                <div class="cardFooter visualCardBox-cardFooter">
                    ${cardMenuHtml}
                    <div class="cardText">${nameText}</div>
                    <div class="cardText cardText-secondary">${typeText}</div>
                    ${locationHtml}
                </div>
            </div>
        </div>
    `;
}

window.WizardLibraryPage = {
    next: function () {
        Dashboard.navigate('wizard/settings');
    }
};
pageClassOn('pageshow', 'mediaLibraryPage', function () {
    reloadLibrary(this);
});
pageIdOn('pageshow', 'mediaLibraryPage', function () {
    const page = this;
    taskButton({
        mode: 'on',
        progressElem: page.querySelector('.refreshProgress'),
        taskKey: 'RefreshLibrary',
        button: page.querySelector('.btnRefresh')
    });
});
pageIdOn('pagebeforehide', 'mediaLibraryPage', function () {
    const page = this;
    taskButton({
        mode: 'off',
        progressElem: page.querySelector('.refreshProgress'),
        taskKey: 'RefreshLibrary',
        button: page.querySelector('.btnRefresh')
    });
});

