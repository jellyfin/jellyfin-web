import escapeHtml from 'escape-html';

import { getSubtitleApi } from '@jellyfin/sdk/lib/utils/api/subtitle-api';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import dialogHelper from '../../components/dialogHelper/dialogHelper';
import dom from '../../utils/dom';
import loading from '../../components/loading/loading';
import scrollHelper from '../../scripts/scrollHelper';
import layoutManager from '../layoutManager';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import template from './subtitleuploader.template.html';
import toast from '../toast/toast';

import '../../elements/emby-button/emby-button';
import '../../elements/emby-select/emby-select';
import '../formdialog.scss';
import './style.scss';
import { readFileAsBase64 } from 'utils/file';

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

function isValidSubtitleFile(file) {
    return file && ['.sub', '.srt', '.vtt', '.ass', '.ssa', '.mks']
        .some((ext) => {
            return file.name.endsWith(ext);
        });
}

function setFiles(page, files) {
    const file = files[0];

    if (!isValidSubtitleFile(file)) {
        page.querySelector('#subtitleOutput').innerHTML = '';
        page.querySelector('#fldUpload').classList.add('hide');
        page.querySelector('#labelDropSubtitle').classList.remove('hide');
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
            const html = `<div><span class="material-icons subtitles" aria-hidden="true" style="transform: translateY(25%);"></span><span>${escapeHtml(theFile.name)}</span></div>`;

            page.querySelector('#subtitleOutput').innerHTML = html;
            page.querySelector('#fldUpload').classList.remove('hide');
            page.querySelector('#labelDropSubtitle').classList.add('hide');
        };
    })(file);

    // Read in the subtitle file as a data URL.
    reader.readAsDataURL(file);
}

async function onSubmit(e) {
    e.preventDefault();

    const file = currentFile;

    if (!isValidSubtitleFile(file)) {
        toast(globalize.translate('MessageSubtitleFileTypeAllowed'));
        return;
    }

    loading.show();

    const dlg = dom.parentWithClass(this, 'dialog');
    const language = dlg.querySelector('#selectLanguage').value;
    const isForced = dlg.querySelector('#chkIsForced').checked;
    const isHearingImpaired = dlg.querySelector('#chkIsHearingImpaired').checked;

    const subtitleApi = getSubtitleApi(toApi(ServerConnections.getApiClient(currentServerId)));

    const data = await readFileAsBase64(file);
    const format = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();

    subtitleApi.uploadSubtitle({
        itemId: currentItemId,
        uploadSubtitleDto: { Data: data, Language: language, IsForced: isForced, Format: format, IsHearingImpaired: isHearingImpaired }
    }).then(() => {
        dlg.querySelector('#uploadSubtitle').value = '';
        loading.hide();
        hasChanges = true;
        dialogHelper.close(dlg);
    });
}

function initEditor(page) {
    page.querySelector('.uploadSubtitleForm').addEventListener('submit', onSubmit);
    page.querySelector('#uploadSubtitle').addEventListener('change', function () {
        setFiles(page, this.files);
    });
    page.querySelector('.btnBrowse').addEventListener('click', () => {
        page.querySelector('#uploadSubtitle').click();
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
    dlg.classList.add('subtitleUploaderDialog');

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

    const selectLanguage = dlg.querySelector('#selectLanguage');

    if (options.languages) {
        selectLanguage.innerHTML = options.languages.list || null;
        selectLanguage.value = options.languages.value || null;
    }

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
    show: show
};
