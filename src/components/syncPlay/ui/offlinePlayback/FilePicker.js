/**
 * Module that displays a dialog for picking files for offline playback.
 * @module components/syncPlay/settings/SettingsEditor
 */

import dialogHelper from '../../../dialogHelper/dialogHelper';
import layoutManager from '../../../layoutManager';
import toast from '../../../toast/toast';
import globalize from '../../../../scripts/globalize';
import 'material-design-icons-iconfont';
import '../../../../elements/emby-input/emby-input';
import '../../../../elements/emby-select/emby-select';
import '../../../../elements/emby-button/emby-button';
import '../../../../elements/emby-button/paper-icon-button-light';
import '../../../../elements/emby-checkbox/emby-checkbox';
import '../../../listview/listview.css';
import '../../../formdialog.css';
import './style.css';

function centerFocus(elem, horiz, on) {
    import('../../../../scripts/scrollHelper').then((scrollHelper) => {
        const fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}

function getFileDuration(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = function () {
            URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };

        video.onerror = reject;

        video.src = URL.createObjectURL(file);
    });
}

/**
 * Class that displays a dialog for picking files for offline playback.
 */
class FilePicker {
    async show(items = [], offlineFiles = {}) {
        if (items.length === 0) {
            return Promise.reject();
        }

        this.items = items;
        this.result = offlineFiles;
        this.submitted = false;

        const dialogOptions = {
            removeOnClose: true,
            scrollY: true
        };

        if (layoutManager.tv) {
            dialogOptions.size = 'fullscreen';
        } else {
            dialogOptions.size = 'small';
        }

        this.context = dialogHelper.createDialog(dialogOptions);
        this.context.classList.add('formDialog');

        const { default: template } = await import('./filePicker.html');
        this.context.innerHTML = globalize.translateHtml(template, 'core');

        // Set callbacks for form submission
        this.context.querySelector('form').addEventListener('submit', (event) => {
            // Disable default form submission
            if (event) {
                event.preventDefault();
            }
            return false;
        });

        this.context.querySelector('.btnSave').addEventListener('click', () => {
            this.onSubmit();
        });

        this.context.querySelector('.btnCancel').addEventListener('click', () => {
            dialogHelper.close(this.context);
        });

        await this.initEditor();

        if (layoutManager.tv) {
            centerFocus(this.context.querySelector('.formDialogContent'), false, true);
        }

        return dialogHelper.open(this.context).then(() => {
            if (layoutManager.tv) {
                centerFocus(this.context.querySelector('.formDialogContent'), false, false);
            }

            if (this.submitted) {
                return Promise.resolve(this.result);
            }

            return Promise.reject();
        });
    }

    async refresh(openFiles) {
        if (this.items.length !== openFiles.length) {
            toast({
                text: globalize.translate('MessageNotEnoughFilesSelected')
            });
            return;
        }

        for (let i = 0; i < openFiles.length; i++) {
            const file = openFiles[i];
            const duration = await getFileDuration(file);
            file.duration = duration;
        }

        // Sort items and files by duration.
        const sortedItems = this.items.slice().sort((a, b) => (a.RunTimeTicks > b.RunTimeTicks) ? 1 : -1);
        openFiles.sort((a, b) => (a.duration > b.duration) ? 1 : -1);

        // Map files to items.
        const result = {};
        for (let i = 0; i < sortedItems.length; i++) {
            const item = sortedItems[i];
            result[item.Id] = openFiles[i];
        }

        // Prepare output.
        this.result = result;

        // Update playlist.
        await this.refreshPlayList();
    }

    async refreshPlayList() {
        const { context } = this;
        const groupPlaylist = context.querySelector('#groupPlaylist');
        groupPlaylist.innerHTML = '';

        for (let i = 0; i < this.items.length; i++) {
            const itemData = this.items[i];

            const { default: itemTemplate } = await import('./groupPlaylistItem.html');
            const item = this.translateTemplate(itemTemplate);

            const itemNameLabel = item.querySelector('#itemName');
            const fileNameLabel = item.querySelector('#fileName');
            const inputFile = item.querySelector('#inputFile');

            inputFile.addEventListener('change', async (event) => {
                const filesList = event.target.files;
                if (!filesList[0]) {
                    return;
                }

                const result = this.result || {};
                result[itemData.Id] = filesList[0];
                this.result = result;

                // Update playlist.
                await this.refreshPlayList();
            });

            itemNameLabel.id = 'itemName-' + itemData.Id;
            fileNameLabel.id = 'fileName-' + itemData.Id;
            inputFile.id = 'inputFile-' + itemData.Id;
            item.setAttribute('for', inputFile.id);

            const file = this.result ? this.result[itemData.Id] : null;

            itemNameLabel.innerHTML = itemData.Name;
            fileNameLabel.innerHTML = file ? file.name : globalize.translate('LabelNoFileSelected');

            groupPlaylist.appendChild(item);
        }
    }

    async initEditor() {
        const { context } = this;

        await this.refreshPlayList();

        context.querySelector('#files').addEventListener('change', (event) => {
            const filesList = event.target.files;
            const openFiles = [...filesList];
            this.refresh(openFiles);
        });
    }

    /**
     * @param {string} html HTML string representing a single element.
     * @return {Element} The element.
     */
    htmlToElement(html) {
        const template = document.createElement('template');
        html = html.trim(); // Avoid returning a text node of whitespace.
        template.innerHTML = html;
        return template.content.firstChild;
    }

    translateTemplate(template) {
        const translatedTemplate = globalize.translateHtml(template, 'core');
        return this.htmlToElement(translatedTemplate);
    }

    onSubmit() {
        if (!this.result) {
            return;
        }

        this.submitted = true;

        dialogHelper.close(this.context);
    }
}

export default FilePicker;
