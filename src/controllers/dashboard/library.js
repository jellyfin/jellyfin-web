import 'jquery';
import taskButton from '../../scripts/taskbutton';
import loading from '../../components/loading/loading';
import libraryMenu from '../../scripts/libraryMenu';
import globalize from '../../scripts/globalize';
import dom from '../../scripts/dom';
import imageHelper from '../../scripts/imagehelper';
import '../../components/cardbuilder/card.css';
import '../../elements/emby-itemrefreshindicator/emby-itemrefreshindicator';
import Dashboard, { pageClassOn, pageIdOn } from '../../scripts/clientUtils';
import confirm from '../../components/confirm/confirm';
import cardBuilder from '../../components/cardbuilder/cardBuilder';

/* eslint-disable indent */

    function addVirtualFolder(page) {
        import('../../components/mediaLibraryCreator/mediaLibraryCreator').then(({default: medialibrarycreator}) => {
            new medialibrarycreator({
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
        import('../../components/mediaLibraryEditor/mediaLibraryEditor').then(({default: medialibraryeditor}) => {
            new medialibraryeditor({
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
            ApiClient.removeVirtualFolder(virtualFolder.Name, refreshAfterChange).then(function () {
                reloadLibrary(page);
            });
        });
    }

    function refreshVirtualFolder(page, virtualFolder) {
        import('../../components/refreshdialog/refreshdialog').then(({default: refreshDialog}) => {
            new refreshDialog({
                itemIds: [virtualFolder.ItemId],
                serverId: ApiClient.serverId(),
                mode: 'scan'
            }).show();
        });
    }

    function renameVirtualFolder(page, virtualFolder) {
        import('../../components/prompt/prompt').then(({default: prompt}) => {
            prompt({
                label: globalize.translate('LabelNewName'),
                confirmText: globalize.translate('ButtonRename')
            }).then(function (newName) {
                if (newName && newName != virtualFolder.Name) {
                    const refreshAfterChange = shouldRefreshLibraryAfterChanges(page);
                    ApiClient.renameVirtualFolder(virtualFolder.Name, newName, refreshAfterChange).then(function () {
                        reloadLibrary(page);
                    });
                }
            });
        });
    }

    function showCardMenu(page, elem, virtualFolders) {
        const card = dom.parentWithClass(elem, 'card');
        const index = parseInt(card.getAttribute('data-index'));
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
            icon: 'folder_open'
        });
        menuItems.push({
            name: globalize.translate('ButtonRemove'),
            id: 'delete',
            icon: 'delete'
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

        import('../../components/actionSheet/actionSheet').then((actionsheet) => {
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
        ApiClient.getVirtualFolders().then(function (result) {
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
            showNameWithIcon: false
        });

        for (let i = 0; i < virtualFolders.length; i++) {
            const virtualFolder = virtualFolders[i];
            html += getVirtualFolderHtml(page, virtualFolder, i);
        }

        const divVirtualFolders = page.querySelector('#divVirtualFolders');
        divVirtualFolders.innerHTML = html;
        divVirtualFolders.classList.add('itemsContainer');
        divVirtualFolders.classList.add('vertical-wrap');
        $('.btnCardMenu', divVirtualFolders).on('click', function () {
            showCardMenu(page, this, virtualFolders);
        });
        divVirtualFolders.querySelector('#addLibrary').addEventListener('click', function () {
            addVirtualFolder(page);
        });
        $('.editLibrary', divVirtualFolders).on('click', function () {
            const card = $(this).parents('.card')[0];
            const index = parseInt(card.getAttribute('data-index'));
            const virtualFolder = virtualFolders[index];

            if (virtualFolder.ItemId) {
                editVirtualFolder(page, virtualFolder);
            }
        });
        loading.hide();
    }

    function editImages(page, virtualFolder) {
        import('../../components/imageeditor/imageeditor').then((imageEditor) => {
            imageEditor.show({
                itemId: virtualFolder.ItemId,
                serverId: ApiClient.serverId()
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
            message: getLink('MovieLibraryHelp', 'https://docs.jellyfin.org/general/server/media/movies.html')
        }, {
            name: globalize.translate('TabMusic'),
            value: 'music',
            message: getLink('MusicLibraryHelp', 'https://docs.jellyfin.org/general/server/media/music.html')
        }, {
            name: globalize.translate('Shows'),
            value: 'tvshows',
            message: getLink('TvLibraryHelp', 'https://docs.jellyfin.org/general/server/media/shows.html')
        }, {
            name: globalize.translate('Books'),
            value: 'books',
            message: getLink('BookLibraryHelp', 'https://docs.jellyfin.org/general/server/media/books.html')
        }, {
            name: globalize.translate('Photos'),
            value: 'homevideos'
        }, {
            name: globalize.translate('MusicVideos'),
            value: 'musicvideos'
        }, {
            name: globalize.translate('Other'),
            value: 'mixed',
            message: globalize.translate('MessageUnsetContentHelp')
        }];
    }

    function getVirtualFolderHtml(page, virtualFolder, index) {
        let html = '';
        let style = '';

        if (page.classList.contains('wizardPage')) {
            style += 'min-width:33.3%;';
        }

        if (virtualFolder.Locations.length == 0) {
            html += '<div id="addLibrary" class="card backdropCard scalableCard backdropCard-scalable" style="' + style + '" data-index="' + index + '" data-id="' + virtualFolder.ItemId + '">';
        } else {
            html += '<div class="card backdropCard scalableCard backdropCard-scalable" style="' + style + '" data-index="' + index + '" data-id="' + virtualFolder.ItemId + '">';
        }

        html += '<div class="cardBox visualCardBox">';
        html += '<div class="cardScalable visualCardBox-cardScalable">';
        html += '<div class="cardPadder cardPadder-backdrop"></div>';
        html += '<div class="cardContent">';
        let imgUrl = '';

        if (virtualFolder.PrimaryImageItemId) {
            imgUrl = ApiClient.getScaledImageUrl(virtualFolder.PrimaryImageItemId, {
                maxWidth: Math.round(dom.getScreenWidth() * 0.40),
                type: 'Primary'
            });
        }

        let hasCardImageContainer;

        if (imgUrl) {
            html += `<div class="cardImageContainer editLibrary ${imgUrl ? '' : cardBuilder.getDefaultBackgroundClass()}" style="cursor:pointer">`;
            html += `<img src="${imgUrl}" style="width:100%" />`;
            hasCardImageContainer = true;
        } else if (!virtualFolder.showNameWithIcon) {
            html += `<div class="cardImageContainer editLibrary ${cardBuilder.getDefaultBackgroundClass()}" style="cursor:pointer;">`;
            html += '<span class="cardImageIcon material-icons ' + (virtualFolder.icon || imageHelper.getLibraryIcon(virtualFolder.CollectionType)) + '"></span>';
            hasCardImageContainer = true;
        }

        if (hasCardImageContainer) {
            html += '<div class="cardIndicators backdropCardIndicators">';
            html += '<div is="emby-itemrefreshindicator"' + (virtualFolder.RefreshProgress || virtualFolder.RefreshStatus && virtualFolder.RefreshStatus !== 'Idle' ? '' : ' class="hide"') + ' data-progress="' + (virtualFolder.RefreshProgress || 0) + '" data-status="' + virtualFolder.RefreshStatus + '"></div>';
            html += '</div>';
            html += '</div>';
        }

        if (!imgUrl && virtualFolder.showNameWithIcon) {
            html += '<h3 class="cardImageContainer addLibrary" style="position:absolute;top:0;left:0;right:0;bottom:0;cursor:pointer;flex-direction:column;">';
            html += '<span class="cardImageIcon material-icons ' + (virtualFolder.icon || imageHelper.getLibraryIcon(virtualFolder.CollectionType)) + '"></span>';

            if (virtualFolder.showNameWithIcon) {
                html += '<div style="margin:1em 0;position:width:100%;">';
                html += virtualFolder.Name;
                html += '</div>';
            }

            html += '</h3>';
        }

        html += '</div>';
        html += '</div>';
        html += '<div class="cardFooter visualCardBox-cardFooter">'; // always show menu unless explicitly hidden

        if (virtualFolder.showMenu !== false) {
            html += '<div style="text-align:right; float:right;padding-top:5px;">';
            html += '<button type="button" is="paper-icon-button-light" class="btnCardMenu autoSize"><span class="material-icons more_vert"></span></button>';
            html += '</div>';
        }

        html += "<div class='cardText'>";

        if (virtualFolder.showNameWithIcon) {
            html += '&nbsp;';
        } else {
            html += virtualFolder.Name;
        }

        html += '</div>';
        let typeName = getCollectionTypeOptions().filter(function (t) {
            return t.value == virtualFolder.CollectionType;
        })[0];
        typeName = typeName ? typeName.name : globalize.translate('Other');
        html += "<div class='cardText cardText-secondary'>";

        if (virtualFolder.showType === false) {
            html += '&nbsp;';
        } else {
            html += typeName;
        }

        html += '</div>';

        if (virtualFolder.showLocations === false) {
            html += "<div class='cardText cardText-secondary'>";
            html += '&nbsp;';
            html += '</div>';
        } else if (virtualFolder.Locations.length && virtualFolder.Locations.length === 1) {
            html += "<div class='cardText cardText-secondary'>";
            html += virtualFolder.Locations[0];
            html += '</div>';
        } else {
            html += "<div class='cardText cardText-secondary'>";
            html += globalize.translate('NumLocationsValue', virtualFolder.Locations.length);
            html += '</div>';
        }

        html += '</div>';
        html += '</div>';
        html += '</div>';
        return html;
    }

    function getTabs() {
        return [{
            href: '#!/library.html',
            name: globalize.translate('HeaderLibraries')
        }, {
            href: '#!/librarydisplay.html',
            name: globalize.translate('Display')
        }, {
            href: '#!/metadataimages.html',
            name: globalize.translate('Metadata')
        }, {
            href: '#!/metadatanfo.html',
            name: globalize.translate('TabNfoSettings')
        }];
    }

    window.WizardLibraryPage = {
        next: function () {
            Dashboard.navigate('wizardsettings.html');
        }
    };
    pageClassOn('pageshow', 'mediaLibraryPage', function () {
        reloadLibrary(this);
    });
    pageIdOn('pageshow', 'mediaLibraryPage', function () {
        libraryMenu.setTabs('librarysetup', 0, getTabs);

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

/* eslint-enable indent */
