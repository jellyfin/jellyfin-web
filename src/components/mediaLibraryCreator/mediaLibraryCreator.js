
/**
 * Module for media library creator.
 * @module components/mediaLibraryCreator/mediaLibraryCreator
 */

import escapeHtml from 'escape-html';
import loading from '../loading/loading';
import dialogHelper from '../dialogHelper/dialogHelper';
import dom from '../../utils/dom';
import libraryoptionseditor from '../libraryoptionseditor/libraryoptionseditor';
import globalize from '../../lib/globalize';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-input/emby-input';
import '../../elements/emby-select/emby-select';
import '../../elements/emby-toggle/emby-toggle';
import '../listview/listview.scss';
import '../formdialog.scss';
import '../../styles/flexstyles.scss';
import './style.scss';
import toast from '../toast/toast';
import alert from '../alert';
import template from './mediaLibraryCreator.template.html';

function onAddLibrary(e) {
    e.preventDefault();

    if (isCreating) {
        return false;
    }

    if (pathInfos.length == 0) {
        alert({
            text: globalize.translate('PleaseAddAtLeastOneFolder'),
            type: 'error'
        });

        return false;
    }

    isCreating = true;
    loading.show();
    const dlg = dom.parentWithClass(this, 'dlg-librarycreator');
    const name = dlg.querySelector('#txtValue').value.trim();
    let type = dlg.querySelector('#selectCollectionType').value;

    if (name.length === 0) {
        alert({
            text: globalize.translate('LibraryNameInvalid'),
            type: 'error'
        });

        isCreating = false;
        loading.hide();

        return false;
    }

    if (type == 'mixed') {
        type = null;
    }

    const libraryOptions = libraryoptionseditor.getLibraryOptions(dlg.querySelector('.libraryOptions'));
    libraryOptions.PathInfos = pathInfos;
    ApiClient.addVirtualFolder(name, type, currentOptions.refresh, libraryOptions).then(() => {
        hasChanges = true;
        isCreating = false;
        loading.hide();
        dialogHelper.close(dlg);
    }, () => {
        toast(globalize.translate('ErrorAddingMediaPathToVirtualFolder'));

        isCreating = false;
        loading.hide();
    });
}

function getCollectionTypeOptionsHtml(collectionTypeOptions) {
    return collectionTypeOptions.map(i => {
        return `<option value="${i.value}">${i.name}</option>`;
    }).join('');
}

function initEditor(page, collectionTypeOptions) {
    const selectCollectionType = page.querySelector('#selectCollectionType');
    selectCollectionType.innerHTML = getCollectionTypeOptionsHtml(collectionTypeOptions);
    selectCollectionType.value = '';
    selectCollectionType.addEventListener('change', function () {
        const value = this.value;
        const dlg = dom.parentWithClass(this, 'dialog');
        libraryoptionseditor.setContentType(dlg.querySelector('.libraryOptions'), value);

        if (value) {
            dlg.querySelector('.libraryOptions').classList.remove('hide');
        } else {
            dlg.querySelector('.libraryOptions').classList.add('hide');
        }

        if (value != 'mixed') {
            const index = this.selectedIndex;

            if (index != -1) {
                const name = this.options[index].innerHTML
                    .replaceAll('*', '')
                    .replaceAll('&amp;', '&');
                dlg.querySelector('#txtValue').value = name;
            }
        }

        const folderOption = collectionTypeOptions.find(i => i.value === value);
        dlg.querySelector('.collectionTypeFieldDescription').innerHTML = folderOption?.message || '';
    });
    page.querySelector('.btnAddFolder').addEventListener('click', onAddButtonClick);
    page.querySelector('.addLibraryForm').addEventListener('submit', onAddLibrary);
    page.querySelector('.folderList').addEventListener('click', onRemoveClick);
}

function onAddButtonClick() {
    const page = dom.parentWithClass(this, 'dlg-librarycreator');

    import('../directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
        const picker = new DirectoryBrowser();
        picker.show({
            callback: function (path, networkSharePath) {
                if (path) {
                    addMediaLocation(page, path, networkSharePath);
                }

                picker.close();
            }
        });
    });
}

function getFolderHtml(pathInfo, index) {
    let html = '';
    html += '<div class="listItem listItem-border lnkPath">';
    html += `<div class="${pathInfo.NetworkPath ? 'listItemBody two-line' : 'listItemBody'}">`;
    html += `<div class="listItemBodyText" dir="ltr">${escapeHtml(pathInfo.Path)}</div>`;

    if (pathInfo.NetworkPath) {
        html += `<div class="listItemBodyText secondary" dir="ltr">${escapeHtml(pathInfo.NetworkPath)}</div>`;
    }

    html += '</div>';
    html += `<button type="button" is="paper-icon-button-light"" class="listItemButton btnRemovePath" data-index="${index}"><span class="material-icons remove_circle" aria-hidden="true"></span></button>`;
    html += '</div>';
    return html;
}

function renderPaths(page) {
    const foldersHtml = pathInfos.map(getFolderHtml).join('');
    const folderList = page.querySelector('.folderList');
    folderList.innerHTML = foldersHtml;

    if (foldersHtml) {
        folderList.classList.remove('hide');
    } else {
        folderList.classList.add('hide');
    }
}

function addMediaLocation(page, path, networkSharePath) {
    const pathLower = path.toLowerCase();
    const pathFilter = pathInfos.filter(p => {
        return p.Path.toLowerCase() == pathLower;
    });

    if (!pathFilter.length) {
        const pathInfo = {
            Path: path
        };

        if (networkSharePath) {
            pathInfo.NetworkPath = networkSharePath;
        }

        pathInfos.push(pathInfo);
        renderPaths(page);
    }
}

function onRemoveClick(e) {
    const button = dom.parentWithClass(e.target, 'btnRemovePath');
    const index = parseInt(button.dataset.index, 10);
    const location = pathInfos[index].Path;
    const locationLower = location.toLowerCase();
    pathInfos = pathInfos.filter(p => {
        return p.Path.toLowerCase() != locationLower;
    });
    renderPaths(dom.parentWithClass(button, 'dlg-librarycreator'));
}

function onDialogClosed() {
    currentResolve(hasChanges);
}

function initLibraryOptions(dlg) {
    libraryoptionseditor.embed(dlg.querySelector('.libraryOptions')).then(() => {
        dlg.querySelector('#selectCollectionType').dispatchEvent(new Event('change'));
    });
}

export class MediaLibraryCreator {
    constructor(options) {
        return new Promise((resolve) => {
            currentOptions = options;
            currentResolve = resolve;
            hasChanges = false;
            const dlg = dialogHelper.createDialog({
                size: 'small',
                modal: false,
                removeOnClose: true,
                scrollY: false
            });
            dlg.classList.add('ui-body-a');
            dlg.classList.add('background-theme-a');
            dlg.classList.add('dlg-librarycreator');
            dlg.classList.add('formDialog');
            dlg.innerHTML = globalize.translateHtml(template);
            initEditor(dlg, options.collectionTypeOptions);
            dlg.addEventListener('close', onDialogClosed);
            dialogHelper.open(dlg);
            dlg.querySelector('.btnCancel').addEventListener('click', () => {
                dialogHelper.close(dlg);
            });
            pathInfos = [];
            renderPaths(dlg);
            initLibraryOptions(dlg);
        });
    }
}

let pathInfos = [];
let currentResolve;
let currentOptions;
let hasChanges = false;
let isCreating = false;

export default MediaLibraryCreator;
