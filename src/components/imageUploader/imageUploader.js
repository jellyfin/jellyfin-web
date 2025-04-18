
/**
 * Module for imageUploader.
 * @module components/imageUploader/imageUploader
 */

import dialogHelper from '../dialogHelper/dialogHelper';
import dom from '../../scripts/dom';
import loading from '../loading/loading';
import scrollHelper from '../../scripts/scrollHelper';
import layoutManager from '../layoutManager';
import globalize from '../../lib/globalize';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-select/emby-select';
import '../formdialog.scss';
import './style.scss';
import ServerConnections from '../ServerConnections';
import toast from '../toast/toast';
import template from './imageUploader.template.html';

let currentItemId;
let currentServerId;
let currentFile;
let hasChanges = false;

function onFileReaderError(evt) {
    loading.hide();

    switch (evt.target.error.code) {
        case evt.target.error.NOT_FOUND_ERR:
            toast(globalize.translate('MessageFileReadError'));
            break;
        case evt.target.error.ABORT_ERR:
            break; // noop
        default:
            toast(globalize.translate('MessageFileReadError'));
            break;
    }
}

function setFiles(page, files) {
    const file = files[0];

    if (!file?.type.match('image.*')) {
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

// eslint-disable-next-line sonarjs/no-invariant-returns
function onSubmit(e) {
    const file = currentFile;

    if (!file) {
        return false;
    }

    if (!file.type.startsWith('image/')) {
        toast(globalize.translate('MessageImageFileTypeAllowed'));
        e.preventDefault();
        return false;
    }

    loading.show();

    const dlg = dom.parentWithClass(this, 'dialog');

    const imageType = dlg.querySelector('#selectImageType').value;
    if (imageType === 'None') {
        toast(globalize.translate('MessageImageTypeNotSelected'));
        e.preventDefault();
        return false;
    }

    ServerConnections.getApiClient(currentServerId).uploadItemImage(currentItemId, imageType, file).then(() => {
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
}

export function show(options) {
    return new Promise(resolve => {
        hasChanges = false;

        showEditor(options, resolve);
    });
}

export default {
    show: show
};
