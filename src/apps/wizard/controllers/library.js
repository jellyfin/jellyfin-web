import escapeHtml from 'escape-html';

import { getDefaultBackgroundClass } from 'components/cardbuilder/utils/builder';
import confirm from 'components/confirm/confirm';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import dom from 'utils/dom';
import imageHelper from 'utils/image';
import { initWizardStep, updateNextButtonLabel } from 'apps/wizard/controllers/wizardProgress';
import { goToNextWizardStep } from 'apps/wizard/controllers/wizardSteps';
import { getWizardDraft } from 'apps/wizard/controllers/wizardDraft';

import 'components/cardbuilder/card.scss';

function addVirtualFolder(page) {
    import('components/mediaLibraryCreator/mediaLibraryCreator').then(({ default: MediaLibraryCreator }) => {
        new MediaLibraryCreator({
            collectionTypeOptions: getCollectionTypeOptions().filter(function (f) {
                return !f.hidden;
            }),
            onCreate(library) {
                const draft = getWizardDraft();
                const isDuplicate = draft.libraries.some(l => l.Name.toLowerCase() === library.Name.toLowerCase());
                if (isDuplicate) {
                    toast(globalize.translate('ErrorDefault'));
                    return false;
                }
                draft.libraries.push(library);
            }
        }).then(function (hasChanges) {
            if (hasChanges) {
                renderVirtualFolders(page);
            }
        });
    });
}

function deleteVirtualFolder(page, index) {
    const draft = getWizardDraft();
    const virtualFolder = draft.libraries[index];
    let msg = globalize.translate('MessageAreYouSureYouWishToRemoveMediaFolder');

    const locations = virtualFolder.LibraryOptions.PathInfos.map(p => p.Path);
    if (locations.length) {
        msg += '<br/><br/>' + globalize.translate('MessageTheFollowingLocationWillBeRemovedFromLibrary') + '<br/><br/>';
        msg += locations.join('<br/>');
    }

    confirm({
        text: msg,
        title: globalize.translate('HeaderRemoveMediaFolder'),
        confirmText: globalize.translate('Delete'),
        primary: 'delete'
    }).then(function () {
        draft.libraries.splice(index, 1);
        renderVirtualFolders(page);
    });
}

function renameVirtualFolder(page, index) {
    import('components/prompt/prompt').then(({ default: prompt }) => {
        const draft = getWizardDraft();
        const virtualFolder = draft.libraries[index];
        prompt({
            label: globalize.translate('LabelNewName'),
            description: globalize.translate('MessageRenameMediaFolder'),
            confirmText: globalize.translate('ButtonRename')
        }).then(function (newName) {
            if (newName && newName != virtualFolder.Name) {
                virtualFolder.Name = newName;
                renderVirtualFolders(page);
            }
        });
    });
}

function showCardMenu(page, elem) {
    const card = dom.parentWithClass(elem, 'card');
    const index = parseInt(card.getAttribute('data-index'), 10);
    const menuItems = [];
    menuItems.push({
        name: globalize.translate('ButtonRename'),
        id: 'rename',
        icon: 'mode_edit'
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
                    case 'rename':
                        renameVirtualFolder(page, index);
                        break;

                    case 'delete':
                        deleteVirtualFolder(page, index);
                        break;
                }
            }
        });
    });
}

function renderVirtualFolders(page) {
    const draft = getWizardDraft();
    const virtualFolders = draft.libraries.map(function (library) {
        return {
            Name: library.Name,
            CollectionType: library.CollectionType,
            Locations: library.LibraryOptions.PathInfos.map(p => p.Path)
        };
    });

    let html = '';
    updateNextButtonLabel(page, virtualFolders.length > 0);
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
        html += getVirtualFolderHtml(virtualFolder, i);
    }

    const divVirtualFolders = page.querySelector('#divVirtualFolders');
    divVirtualFolders.innerHTML = html;
    divVirtualFolders.classList.add('itemsContainer');
    divVirtualFolders.classList.add('vertical-wrap');
    const btnCardMenuElements = divVirtualFolders.querySelectorAll('.btnCardMenu');
    btnCardMenuElements.forEach(function (btn) {
        btn.addEventListener('click', function () {
            showCardMenu(page, btn);
        });
    });
    divVirtualFolders.querySelector('#addLibrary').addEventListener('click', function () {
        addVirtualFolder(page);
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

function getVirtualFolderHtml(virtualFolder, index) {
    let html = '';

    const elementId = virtualFolder.elementId ? `id="${virtualFolder.elementId}" ` : '';
    html += '<div ' + elementId + 'class="card backdropCard scalableCard backdropCard-scalable" style="min-width:33.3%;" data-index="' + index + '">';

    html += '<div class="cardBox visualCardBox">';
    html += '<div class="cardScalable visualCardBox-cardScalable">';
    html += '<div class="cardPadder cardPadder-backdrop"></div>';
    html += '<div class="cardContent">';

    let hasCardImageContainer;

    if (!virtualFolder.showNameWithIcon) {
        html += `<div class="cardImageContainer ${getDefaultBackgroundClass()}">`;
        html += '<span class="cardImageIcon material-icons ' + (virtualFolder.icon || imageHelper.getLibraryIcon(virtualFolder.CollectionType)) + '" aria-hidden="true"></span>';
        hasCardImageContainer = true;
    }

    if (hasCardImageContainer) {
        html += '<div class="cardIndicators backdropCardIndicators">';
        html += '</div>';
        html += '</div>';
    }

    if (virtualFolder.showNameWithIcon) {
        html += '<h3 class="cardImageContainer addLibrary" style="position:absolute;top:0;left:0;right:0;bottom:0;cursor:pointer;flex-direction:column;">';
        html += '<span class="cardImageIcon material-icons ' + (virtualFolder.icon || imageHelper.getLibraryIcon(virtualFolder.CollectionType)) + '" aria-hidden="true"></span>';

        if (virtualFolder.showNameWithIcon) {
            html += '<div style="margin:1em 0;position:width:100%;">';
            html += escapeHtml(virtualFolder.Name);
            html += '</div>';
        }

        html += '</h3>';
    }

    html += '</div>';
    html += '</div>';
    html += '<div class="cardFooter visualCardBox-cardFooter">'; // always show menu unless explicitly hidden

    if (virtualFolder.showMenu !== false) {
        const dirTextAlign = globalize.getIsRTL() ? 'left' : 'right';
        html += '<div style="text-align:' + dirTextAlign + '; float:' + dirTextAlign + ';padding-top:5px;">';
        html += '<button type="button" is="paper-icon-button-light" class="btnCardMenu autoSize"><span class="material-icons more_vert" aria-hidden="true"></span></button>';
        html += '</div>';
    }

    html += "<div class='cardText'>";

    if (virtualFolder.showNameWithIcon) {
        html += '&nbsp;';
    } else {
        html += escapeHtml(virtualFolder.Name);
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
        html += "<div class='cardText cardText-secondary' dir='ltr' style='text-align:left;'>";
        html += escapeHtml(virtualFolder.Locations[0]);
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

export default function (view) {
    view.querySelector('.btnWizardNext').addEventListener('click', function () {
        goToNextWizardStep('library');
    });
    initWizardStep(view, 'library', {
        onShow() { renderVirtualFolders(this); }
    });
}
