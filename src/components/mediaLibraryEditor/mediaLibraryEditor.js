
/**
 * Module for media library editor.
 * @module components/mediaLibraryEditor/mediaLibraryEditor
 */

import escapeHtml from 'escape-html';
import loading from '../loading/loading';
import dialogHelper from '../dialogHelper/dialogHelper';
import dom from '../../utils/dom';
import libraryoptionseditor from '../libraryoptionseditor/libraryoptionseditor';
import globalize from '../../lib/globalize';
import '../../elements/emby-button/emby-button';
import '../listview/listview.scss';
import '../../elements/emby-button/paper-icon-button-light';
import '../formdialog.scss';
import '../../elements/emby-toggle/emby-toggle';
import './style.scss';
import alert from '../alert';
import toast from '../toast/toast';
import confirm from '../confirm/confirm';
import template from './mediaLibraryEditor.template.html?raw';

// eslint-disable-next-line sonarjs/no-invariant-returns
function onEditLibrary() {
    if (isCreating) {
        return false;
    }

    isCreating = true;
    loading.show();
    const dlg = dom.parentWithClass(this, 'dlg-libraryeditor');
    // when the library has moved or symlinked, the ItemId is not correct anymore
    // this can lead to a forever spinning value on edit the library parameters
    if (!currentOptions.library.ItemId) {
        loading.hide();
        dialogHelper.close(dlg);
        alert({
            text: globalize.translate('LibraryInvalidItemIdError')
        });
        return false;
    }
    let libraryOptions = libraryoptionseditor.getLibraryOptions(dlg.querySelector('.libraryOptions'));
    libraryOptions = Object.assign(currentOptions.library.LibraryOptions || {}, libraryOptions);
    ApiClient.updateVirtualFolderOptions(currentOptions.library.ItemId, libraryOptions).then(() => {
        hasChanges = true;
        isCreating = false;
        loading.hide();
        dialogHelper.close(dlg);
    }, () => {
        isCreating = false;
        loading.hide();
    });
    return false;
}

function addMediaLocation(page, path) {
    const virtualFolder = currentOptions.library;
    const refreshAfterChange = currentOptions.refresh;
    ApiClient.addMediaPath(virtualFolder.Name, path, null, refreshAfterChange).then(() => {
        hasChanges = true;
        refreshLibraryFromServer(page);
    }, () => {
        toast(globalize.translate('ErrorAddingMediaPathToVirtualFolder'));
    });
}

function updateMediaLocation(page, path) {
    const virtualFolder = currentOptions.library;
    ApiClient.updateMediaPath(virtualFolder.Name, {
        Path: path
    }).then(() => {
        hasChanges = true;
        refreshLibraryFromServer(page);
    }, () => {
        toast(globalize.translate('ErrorAddingMediaPathToVirtualFolder'));
    });
}

function onRemoveClick(btnRemovePath, location) {
    const button = btnRemovePath;
    const virtualFolder = currentOptions.library;

    confirm({
        title: globalize.translate('HeaderRemoveMediaLocation'),
        text: globalize.translate('MessageConfirmRemoveMediaLocation'),
        confirmText: globalize.translate('Delete'),
        primary: 'delete'
    }).then(() => {
        const refreshAfterChange = currentOptions.refresh;
        ApiClient.removeMediaPath(virtualFolder.Name, location, refreshAfterChange).then(() => {
            hasChanges = true;
            refreshLibraryFromServer(dom.parentWithClass(button, 'dlg-libraryeditor'));
        }, () => {
            toast(globalize.translate('ErrorDefault'));
        });
    });
}

function onListItemClick(e) {
    const listItem = dom.parentWithClass(e.target, 'listItem');

    if (listItem) {
        const index = parseInt(listItem.getAttribute('data-index'), 10);
        const pathInfos = currentOptions.library.LibraryOptions?.PathInfos || [];
        const pathInfo = index == null ? {} : pathInfos[index] || {};
        const originalPath = pathInfo.Path || (index == null ? null : currentOptions.library.Locations[index]);
        const btnRemovePath = dom.parentWithClass(e.target, 'btnRemovePath');

        if (btnRemovePath) {
            onRemoveClick(btnRemovePath, originalPath);
            return;
        }

        showDirectoryBrowser(dom.parentWithClass(listItem, 'dlg-libraryeditor'), originalPath);
    }
}

function getFolderHtml(pathInfo, index) {
    let html = '';
    html += `<div class="listItem listItem-border lnkPath" data-index="${index}">`;
    html += `<div class="${pathInfo.NetworkPath ? 'listItemBody two-line' : 'listItemBody'}">`;
    html += '<h3 class="listItemBodyText">';
    html += escapeHtml(pathInfo.Path);
    html += '</h3>';

    if (pathInfo.NetworkPath) {
        html += `<div class="listItemBodyText secondary">${escapeHtml(pathInfo.NetworkPath)}</div>`;
    }

    html += '</div>';
    html += `<button type="button" is="paper-icon-button-light" class="listItemButton btnRemovePath" data-index="${index}"><span class="material-icons remove_circle" aria-hidden="true"></span></button>`;
    html += '</div>';
    return html;
}

function refreshLibraryFromServer(page) {
    ApiClient.getVirtualFolders().then(result => {
        const library = result.filter(f => {
            return f.Name === currentOptions.library.Name;
        })[0];

        if (library) {
            currentOptions.library = library;
            renderLibrary(page, currentOptions);
        }
    });
}

function renderLibrary(page, options) {
    let pathInfos = options.library.LibraryOptions?.PathInfos || [];

    if (!pathInfos.length) {
        pathInfos = options.library.Locations.map(p => {
            return {
                Path: p
            };
        });
    }

    if (options.library.CollectionType === 'boxsets') {
        page.querySelector('.folders').classList.add('hide');
    } else {
        page.querySelector('.folders').classList.remove('hide');
    }

    page.querySelector('.folderList').innerHTML = pathInfos.map(getFolderHtml).join('');
}

function onAddButtonClick() {
    showDirectoryBrowser(dom.parentWithClass(this, 'dlg-libraryeditor'));
}

function showDirectoryBrowser(context, originalPath) {
    import('../directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
        const picker = new DirectoryBrowser();
        picker.show({
            pathReadOnly: originalPath != null,
            path: originalPath,
            callback: function (path) {
                if (path) {
                    if (originalPath) {
                        updateMediaLocation(context, originalPath);
                    } else {
                        addMediaLocation(context, path);
                    }
                }

                picker.close();
            }
        });
    });
}

function initEditor(dlg, options) {
    renderLibrary(dlg, options);
    dlg.querySelector('.btnAddFolder').addEventListener('click', onAddButtonClick);
    dlg.querySelector('.folderList').addEventListener('click', onListItemClick);
    dlg.querySelector('.btnSubmit').addEventListener('click', onEditLibrary);
    libraryoptionseditor.embed(dlg.querySelector('.libraryOptions'), options.library.CollectionType, options.library.LibraryOptions);
}

function onDialogClosed() {
    if (currentResolve !== null) {
        currentResolve(hasChanges);
        currentResolve = null;
    }
}

export class MediaLibraryEditor {
    constructor(options) {
        currentOptions = options;
        hasChanges = false;
        const dlg = dialogHelper.createDialog({
            size: 'small',
            modal: false,
            removeOnClose: true,
            scrollY: false
        });
        dlg.classList.add('dlg-libraryeditor');
        dlg.classList.add('ui-body-a');
        dlg.classList.add('background-theme-a');
        dlg.classList.add('formDialog');
        dlg.innerHTML = globalize.translateHtml(template);
        dlg.querySelector('.formDialogHeaderTitle').innerText = options.library.Name;
        initEditor(dlg, options);
        dlg.addEventListener('close', onDialogClosed);
        dialogHelper.open(dlg);
        dlg.querySelector('.btnCancel').addEventListener('click', () => {
            dialogHelper.close(dlg);
        });
        refreshLibraryFromServer(dlg);

        return new Promise((resolve) => {
            currentResolve = resolve;
        });
    }
}

let currentResolve = null;
let currentOptions;
let hasChanges = false;
let isCreating = false;

export default MediaLibraryEditor;
