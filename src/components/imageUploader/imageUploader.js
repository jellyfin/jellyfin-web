/* eslint-disable indent */

/**
 * Module for imageUploader.
 * @module components/imageUploader/imageUploader
 */

import dialogHelper from 'dialogHelper';
import dom from 'dom';
import loading from 'loading';
import scrollHelper from 'scrollHelper';
import layoutManager from 'layoutManager';
import globalize from 'globalize';
import 'emby-button';
import 'emby-select';
import 'formDialogStyle';
import 'css!./style';

    let currentItemId;
    let currentServerId;
    let currentFile;
    let hasChanges = false;

    function onFileReaderError(evt) {
        loading.hide();

        switch (evt.target.error.code) {
            case evt.target.error.NOT_FOUND_ERR:
                import('toast').then(({default: toast}) => {
                    toast(globalize.translate('MessageFileReadError'));
                });
                break;
            case evt.target.error.ABORT_ERR:
                break; // noop
            default:
                import('toast').then(({default: toast}) => {
                    toast(globalize.translate('MessageFileReadError'));
                });
                break;
        }
    }

    function setFiles(page, files) {
        const file = files[0];

        if (!file || !file.type.match('image.*')) {
            page.querySelector('#imageOutput').innerHTML = '';
            page.querySelector('#fldUpload').classList.add('hide');
            currentFile = null;
            return;
        }

        currentFile = file;

        const reader = new FileReader();

        reader.onerror = onFileReaderError;
        reader.onloadstart = () => {
            page.querySelector('#fldUpload').classList.add('hide');
        };
        reader.onabort = () => {
            loading.hide();
            console.debug('File read cancelled');
        };

        // Closure to capture the file information.
        reader.onload = (theFile => {
            return e => {
                // Render thumbnail.
                const html = ['<img style="max-width:100%;max-height:100%;" src="', e.target.result, '" title="', escape(theFile.name), '"/>'].join('');

                page.querySelector('#imageOutput').innerHTML = html;
                page.querySelector('#dropImageText').classList.add('hide');
                page.querySelector('#fldUpload').classList.remove('hide');
            };
        })(file);

        // Read in the image file as a data URL.
        reader.readAsDataURL(file);
    }

    function onSubmit(e) {
        const file = currentFile;

        if (!file) {
            return false;
        }

        if (!file.type.startsWith('image/')) {
            import('toast').then(({default: toast}) => {
                toast(globalize.translate('MessageImageFileTypeAllowed'));
            });
            e.preventDefault();
            return false;
        }

        loading.show();

        const dlg = dom.parentWithClass(this, 'dialog');

        const imageType = dlg.querySelector('#selectImageType').value;
        if (imageType === 'None') {
            import('toast').then(({default: toast}) => {
                toast(globalize.translate('MessageImageTypeNotSelected'));
            });
            e.preventDefault();
            return false;
        }

        window.connectionManager.getApiClient(currentServerId).uploadItemImage(currentItemId, imageType, file).then(() => {
            dlg.querySelector('#uploadImage').value = '';

            loading.hide();
            hasChanges = true;
            dialogHelper.close(dlg);
        });

        e.preventDefault();
        return false;
    }

    function initEditor(page) {
        page.querySelector('form').addEventListener('submit', onSubmit);

        page.querySelector('#uploadImage').addEventListener('change', function () {
            setFiles(page, this.files);
        });

        page.querySelector('.btnBrowse').addEventListener('click', () => {
            page.querySelector('#uploadImage').click();
        });
    }

    function showEditor(options, resolve) {
        options = options || {};

        return import('text!./imageUploader.template.html').then(({default: template}) => {
            currentItemId = options.itemId;
            currentServerId = options.serverId;

            const dialogOptions = {
                removeOnClose: true
            };

            if (layoutManager.tv) {
                dialogOptions.size = 'fullscreen';
            } else {
                dialogOptions.size = 'small';
            }

            const dlg = dialogHelper.createDialog(dialogOptions);

            dlg.classList.add('formDialog');

            dlg.innerHTML = globalize.translateHtml(template, 'core');

            if (layoutManager.tv) {
                scrollHelper.centerFocus.on(dlg, false);
            }

            // Has to be assigned a z-index after the call to .open()
            dlg.addEventListener('close', () => {
                if (layoutManager.tv) {
                    scrollHelper.centerFocus.off(dlg, false);
                }

                loading.hide();
                resolve(hasChanges);
            });

            dialogHelper.open(dlg);

            initEditor(dlg);

            dlg.querySelector('#selectImageType').value = options.imageType || 'Primary';

            dlg.querySelector('.btnCancel').addEventListener('click', () => {
                dialogHelper.close(dlg);
            });
        });
    }

    export function show(options) {
        return new Promise(resolve => {
            hasChanges = false;

            showEditor(options, resolve);
        });
    }

/* eslint-enable indent */
export default {
    show: show
};
