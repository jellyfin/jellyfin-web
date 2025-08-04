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
            if (newName && newName != virtualFolder.Name) {
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
    const index = parseInt(card.getAttribute('data-index'), 10);
    const virtualFolder = virtualFolders[index];
    const menuItems = [];
    menuItems.push({
        name: globalize.translate('EditImages'),
        id: 'editimages',
        icon: 'photo'
    });
    menuItems.push({
        name: globalize.translate('ManageLibrary'),
        id: 'edit',
        icon: 'folder'
    });
    menuItems.push({
        name: globalize.translate('ButtonRename'),
        id: 'rename',
        icon: 'mode_edit'
    });
    menuItems.push({
        name: globalize.translate('ScanLibrary'),
        id: 'refresh',
        icon: 'refresh'
    });
    menuItems.push({
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
    divVirtualFolders.classList.add('itemsContainer');
    divVirtualFolders.classList.add('vertical-wrap');
    const btnCardMenuElements = divVirtualFolders.querySelectorAll('.btnCardMenu');
    btnCardMenuElements.forEach(function (btn) {
        btn.addEventListener('click', function () {
            showCardMenu(page, btn, virtualFolders);
        });
    });
    divVirtualFolders.querySelector('#addLibrary').addEventListener('click', function () {
        addVirtualFolder(page);
    });

    const libraryEditElements = divVirtualFolders.querySelectorAll('.editLibrary');
    libraryEditElements.forEach(function (btn) {
        btn.addEventListener('click', function () {
            const card = dom.parentWithClass(btn, 'card');
            const index = parseInt(card.getAttribute('data-index'), 10);
            const virtualFolder = virtualFolders[index];

            if (virtualFolder.ItemId) {
                editVirtualFolder(page, virtualFolder);
            }
        });
    });
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

function getVirtualFolderHtml(page, virtualFolder, index) {
    // Create the main card div
    const cardDiv = document.createElement('div');
    if (virtualFolder.elementId) cardDiv.id = virtualFolder.elementId;
    cardDiv.className = 'card backdropCard scalableCard backdropCard-scalable';
    cardDiv.style.minWidth = '33.3%';
    cardDiv.dataset.index = index;
    cardDiv.dataset.id = virtualFolder.ItemId;

    // CardBox
    const cardBox = document.createElement('div');
    cardBox.className = 'cardBox visualCardBox';

    const cardScalable = document.createElement('div');
    cardScalable.className = 'cardScalable visualCardBox-cardScalable';

    const cardPadder = document.createElement('div');
    cardPadder.className = 'cardPadder cardPadder-backdrop';

    const cardContent = document.createElement('div');
    cardContent.className = 'cardContent';

    // Image logic
    let imgUrl = '';
    if (virtualFolder.PrimaryImageItemId) {
        imgUrl = ServerConnections.currentApiClient()
            .getScaledImageUrl(virtualFolder.PrimaryImageItemId, {
                maxWidth: Math.round(dom.getScreenWidth() * 0.40),
                type: 'Primary'
            });
    }

    let hasCardImageContainer = false;
    if (imgUrl) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'cardImageContainer editLibrary';
        imgContainer.style.cursor = 'pointer';

        const img = document.createElement('img');
        img.src = imgUrl;
        img.style.width = '100%';
        imgContainer.appendChild(img);

        // Card indicators
        const indicators = document.createElement('div');
        indicators.className = 'cardIndicators backdropCardIndicators';

        const refreshIndicator = document.createElement('div');
        refreshIndicator.setAttribute('is', 'emby-itemrefreshindicator');
        if (!(virtualFolder.RefreshProgress || (virtualFolder.RefreshStatus && virtualFolder.RefreshStatus !== 'Idle'))) {
            refreshIndicator.className = 'hide';
        }
        refreshIndicator.dataset.progress = virtualFolder.RefreshProgress || 0;
        refreshIndicator.dataset.status = virtualFolder.RefreshStatus || '';
        indicators.appendChild(refreshIndicator);

        imgContainer.appendChild(indicators);
        cardContent.appendChild(imgContainer);
        hasCardImageContainer = true;
    } else if (!virtualFolder.showNameWithIcon) {
        const imgContainer = document.createElement('div');
        imgContainer.className = `cardImageContainer editLibrary ${getDefaultBackgroundClass()}`;
        imgContainer.style.cursor = 'pointer';

        const icon = document.createElement('span');
        icon.className = `cardImageIcon material-icons ${virtualFolder.icon || imageHelper.getLibraryIcon(virtualFolder.CollectionType)}`;
        icon.setAttribute('aria-hidden', 'true');
        imgContainer.appendChild(icon);

        // Card indicators
        const indicators = document.createElement('div');
        indicators.className = 'cardIndicators backdropCardIndicators';

        const refreshIndicator = document.createElement('div');
        refreshIndicator.setAttribute('is', 'emby-itemrefreshindicator');
        if (!(virtualFolder.RefreshProgress || (virtualFolder.RefreshStatus && virtualFolder.RefreshStatus !== 'Idle'))) {
            refreshIndicator.className = 'hide';
        }
        refreshIndicator.dataset.progress = virtualFolder.RefreshProgress || 0;
        refreshIndicator.dataset.status = virtualFolder.RefreshStatus || '';
        indicators.appendChild(refreshIndicator);

        imgContainer.appendChild(indicators);
        cardContent.appendChild(imgContainer);
        hasCardImageContainer = true;
    }

    if (hasCardImageContainer) {
        // Card Indicators
        const cardIndicators = document.createElement('div');
        cardIndicators.className = 'cardIndicators backdropCardIndicators';

        const refreshIndicator = document.createElement('div');
        refreshIndicator.setAttribute('is', 'emby-itemrefreshindicator');
        if (!(virtualFolder.RefreshProgress || (virtualFolder.RefreshStatus && virtualFolder.RefreshStatus !== 'Idle'))) {
            refreshIndicator.className = 'hide';
        }
        refreshIndicator.setAttribute('data-progress', virtualFolder.RefreshProgress || 0);
        refreshIndicator.setAttribute('data-status', virtualFolder.RefreshStatus);

        cardIndicators.appendChild(refreshIndicator);
        cardImageContainer.appendChild(cardIndicators);
        cardContent.appendChild(cardImageContainer);
    }

    if (!imgUrl && virtualFolder.showNameWithIcon) {
        const h3 = document.createElement('h3');
        h3.className = 'cardImageContainer addLibrary';
        h3.style.position = 'absolute';
        h3.style.top = '0';
        h3.style.left = '0';
        h3.style.right = '0';
        h3.style.bottom = '0';
        h3.style.cursor = 'pointer';
        h3.style.flexDirection = 'column';

        const icon = document.createElement('span');
        icon.className = `cardImageIcon material-icons ${virtualFolder.icon || imageHelper.getLibraryIcon(virtualFolder.CollectionType)}`;
        icon.setAttribute('aria-hidden', 'true');
        h3.appendChild(icon);

        if (virtualFolder.showNameWithIcon) {
            const nameDiv = document.createElement('div');
            nameDiv.style.margin = '1em 0';
            nameDiv.style.width = '100%';
            nameDiv.textContent = virtualFolder.Name;
            h3.appendChild(nameDiv);
        }
        cardContent.appendChild(h3);
    }

    cardScalable.appendChild(cardPadder);
    cardScalable.appendChild(cardContent);
    cardBox.appendChild(cardScalable);

    // Card Footer
    const cardFooter = document.createElement('div');
    cardFooter.className = 'cardFooter visualCardBox-cardFooter';

    // Menu button
    if (virtualFolder.showMenu !== false) {
        const dirTextAlign = globalize.getIsRTL() ? 'left' : 'right';
        const menuDiv = document.createElement('div');
        menuDiv.style.textAlign = dirTextAlign;
        menuDiv.style.float = dirTextAlign;
        menuDiv.style.paddingTop = '5px';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('is', 'paper-icon-button-light');
        btn.className = 'btnCardMenu autoSize';

        const icon = document.createElement('span');
        icon.className = 'material-icons more_vert';
        icon.setAttribute('aria-hidden', 'true');
        btn.appendChild(icon);

        menuDiv.appendChild(btn);
        cardFooter.appendChild(menuDiv);
    }

    // Card Text (Name)
    const cardText = document.createElement('div');
    cardText.className = 'cardText';
    if (virtualFolder.showNameWithIcon) {
        cardText.innerHTML = '&nbsp;';
    } else {
        cardText.textContent = virtualFolder.Name;
    }
    cardFooter.appendChild(cardText);

    // Card Text (Type)
    let typeName = getCollectionTypeOptions().filter(function (t) {
        return t.value == virtualFolder.CollectionType;
    })[0];
    typeName = typeName ? typeName.name : globalize.translate('Other');
    const cardTextSecondary = document.createElement('div');
    cardTextSecondary.className = 'cardText cardText-secondary';
    if (virtualFolder.showType === false) {
        cardTextSecondary.innerHTML = '&nbsp;';
    } else {
        cardTextSecondary.textContent = typeName;
    }
    cardFooter.appendChild(cardTextSecondary);

    // Card Text (Locations)
    const cardTextLocations = document.createElement('div');
    cardTextLocations.className = 'cardText cardText-secondary';
    if (virtualFolder.showLocations === false) {
        cardTextLocations.innerHTML = '&nbsp;';
    } else if (virtualFolder.Locations.length && virtualFolder.Locations.length === 1) {
        cardTextLocations.dir = 'ltr';
        cardTextLocations.style.textAlign = 'left';
        cardTextLocations.textContent = virtualFolder.Locations[0];
    } else {
        cardTextLocations.textContent = globalize.translate('NumLocationsValue', virtualFolder.Locations.length);
    }
    cardFooter.appendChild(cardTextLocations);

    cardBox.appendChild(cardFooter);
    cardDiv.appendChild(cardBox);

    // Return as HTML string for compatibility with the rest of the code
    return cardDiv.outerHTML;
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

