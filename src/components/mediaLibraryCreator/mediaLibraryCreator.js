/* eslint-disable indent */

/**
 * Module for media library creator.
 * @module components/mediaLibraryCreator/mediaLibraryCreator
 */

import loading from '../loading/loading';
import dialogHelper from '../dialogHelper/dialogHelper';
import dom from '../../scripts/dom';
import 'jquery';
import libraryoptionseditor from '../libraryoptionseditor/libraryoptionseditor';
import globalize from '../../scripts/globalize';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-input/emby-input';
import '../../elements/emby-select/emby-select';
import '../../elements/emby-toggle/emby-toggle';
import '../listview/listview.scss';
import '../formdialog.scss';
import '../../assets/css/flexstyles.scss';
import toast from '../toast/toast';
import alert from '../alert';
import template from './mediaLibraryCreator.template.html';

    function onAddLibrary() {
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
        const name = $('#txtValue', dlg).val();
        let type = $('#selectCollectionType', dlg).val();

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
        return false;
    }

    function getCollectionTypeOptionsHtml(collectionTypeOptions) {
        return collectionTypeOptions.map(i => {
            return `<option value="${i.value}">${i.name}</option>`;
        }).join('');
    }

    function initEditor(page, collectionTypeOptions) {
        $('#selectCollectionType', page).html(getCollectionTypeOptionsHtml(collectionTypeOptions)).val('').on('change', function () {
            const value = this.value;
            const dlg = $(this).parents('.dialog')[0];
            libraryoptionseditor.setContentType(dlg.querySelector('.libraryOptions'), value == 'mixed' ? '' : value);

            if (value) {
                dlg.querySelector('.libraryOptions').classList.remove('hide');
            } else {
                dlg.querySelector('.libraryOptions').classList.add('hide');
            }

            if (value != 'mixed') {
                const index = this.selectedIndex;

                if (index != -1) {
                    const name = this.options[index].innerHTML.replace('*', '').replace('&amp;', '&');
                    $('#txtValue', dlg).val(name);
                    const folderOption = collectionTypeOptions.filter(i => {
                        return i.value == value;
                    })[0];
                    $('.collectionTypeFieldDescription', dlg).html(folderOption.message || '');
                }
            }
        });
        page.querySelector('.btnAddFolder').addEventListener('click', onAddButtonClick);
        page.querySelector('.btnSubmit').addEventListener('click', onAddLibrary);
        page.querySelector('.folderList').addEventListener('click', onRemoveClick);
    }

    function onAddButtonClick() {
        const page = dom.parentWithClass(this, 'dlg-librarycreator');

        import('../directorybrowser/directorybrowser').then(({default: directoryBrowser}) => {
            const picker = new directoryBrowser();
            picker.show({
                enableNetworkSharePath: true,
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
        html += '<div class="listItem listItem-border lnkPath" style="padding-left:.5em;">';
        html += `<div class="${pathInfo.NetworkPath ? 'listItemBody two-line' : 'listItemBody'}">`;
        html += `<div class="listItemBodyText">${pathInfo.Path}</div>`;

        if (pathInfo.NetworkPath) {
            html += `<div class="listItemBodyText secondary">${pathInfo.NetworkPath}</div>`;
        }

        html += '</div>';
        html += `<button type="button" is="paper-icon-button-light"" class="listItemButton btnRemovePath" data-index="${index}"><span class="material-icons remove_circle"></span></button>`;
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
        const index = parseInt(button.getAttribute('data-index'));
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
            $('#selectCollectionType', dlg).trigger('change');
        });
    }

export class showEditor {
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

/* eslint-enable indent */
export default showEditor;
