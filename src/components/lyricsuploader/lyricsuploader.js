import escapeHtml from 'escape-html';

import { getLyricsApi } from '@jellyfin/sdk/lib/utils/api/lyrics-api';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import dialogHelper from '../../components/dialogHelper/dialogHelper';
import dom from '../../utils/dom';
import loading from '../../components/loading/loading';
import scrollHelper from '../../scripts/scrollHelper';
import layoutManager from '../layoutManager';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import template from './lyricsuploader.template.html?raw';
import toast from '../toast/toast';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-select/emby-select';
import '../formdialog.scss';
import './lyricsuploader.scss';
import { readFileAsText } from 'utils/file';

let currentItemId;
let currentServerId;
let currentFile;
let hasChanges = false;

function onFileReaderError(evt) {
    loading.hide();

    const error = evt.target.error;
    if (error.code !== error.ABORT_ERR) {
        toast(globalize.translate('MessageFileReadError'));
    }
}

function isValidLyricsFile(file) {
    return file && ['.lrc', '.txt']
        .some((ext) => {
            return file.name.endsWith(ext);
        });
}

function setFiles(page, files) {
    const file = files[0];

    if (!isValidLyricsFile(file)) {
        page.querySelector('#lyricsOutput').innerHTML = '';
        page.querySelector('#fldUpload').classList.add('hide');
        page.querySelector('#labelDropLyrics').classList.remove('hide');
        currentFile = null;
        return;
    }

    currentFile = file;

    const reader = new FileReader();

    reader.onerror = onFileReaderError;
    reader.onloadstart = function () {
        page.querySelector('#fldUpload').classList.add('hide');
    };
    reader.onabort = function () {
        loading.hide();
        console.debug('File read cancelled');
    };

    // Closure to capture the file information.
    reader.onload = (function (theFile) {
        return function () {
            // Render file.
            const html = `<div><span class="material-icons lyrics" aria-hidden="true" style="transform: translateY(25%);"></span><span>${escapeHtml(theFile.name)}</span></div>`;

            page.querySelector('#lyricsOutput').innerHTML = html;
            page.querySelector('#fldUpload').classList.remove('hide');
            page.querySelector('#labelDropLyrics').classList.add('hide');
        };
    })(file);

    // Read in the lyrics file as a data URL.
    reader.readAsDataURL(file);
}

async function onSubmit(e) {
    e.preventDefault();
    const file = currentFile;

    if (!isValidLyricsFile(file)) {
        toast(globalize.translate('MessageLyricsFileTypeAllowed'));
        return;
    }

    loading.show();
    const dlg = dom.parentWithClass(this, 'dialog');

    const api = toApi(ServerConnections.getApiClient(currentServerId));
    const lyricsApi = getLyricsApi(api);
    const data = await readFileAsText(file);

    lyricsApi.uploadLyrics({
        itemId: currentItemId, fileName: file.name, body: data
    }).then(() => {
        dlg.querySelector('#uploadLyrics').value = '';
        loading.hide();
        hasChanges = true;
        dialogHelper.close(dlg);
    });
}

function initEditor(page) {
    page.querySelector('.uploadLyricsForm').addEventListener('submit', onSubmit);
    page.querySelector('#uploadLyrics').addEventListener('change', function () {
        setFiles(page, this.files);
    });
    page.querySelector('.btnBrowse').addEventListener('click', () => {
        page.querySelector('#uploadLyrics').click();
    });
}

function showEditor(options, resolve) {
    options = options || {};
    currentItemId = options.itemId;
    currentServerId = options.serverId;

    const dialogOptions = {
        removeOnClose: true,
        scrollY: false
    };

    if (layoutManager.tv) {
        dialogOptions.size = 'fullscreen';
    } else {
        dialogOptions.size = 'small';
    }

    const dlg = dialogHelper.createDialog(dialogOptions);

    dlg.classList.add('formDialog');
    dlg.classList.add('lyricsUploaderDialog');

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

    dlg.querySelector('.btnCancel').addEventListener('click', () => {
        dialogHelper.close(dlg);
    });
}

export function show(options) {
    return new Promise((resolve) => {
        hasChanges = false;
        showEditor(options, resolve);
    });
}

export default {
    show
};
