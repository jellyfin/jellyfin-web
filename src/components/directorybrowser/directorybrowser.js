import escapeHtml from 'escape-html';
import { getEnvironmentApi } from '@jellyfin/sdk/lib/utils/api/environment-api';

import loading from '../loading/loading';
import dialogHelper from '../dialogHelper/dialogHelper';
import dom from '../../utils/dom';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import '../listview/listview.scss';
import '../../elements/emby-input/emby-input';
import '../../elements/emby-button/paper-icon-button-light';
import './directorybrowser.scss';
import '../formdialog.scss';
import '../../elements/emby-button/emby-button';
import alert from '../alert';

function onDialogClosed() {
    loading.hide();
}

function refreshDirectoryBrowser(page, path, fileOptions, updatePathOnError) {
    if (path && typeof path !== 'string') {
        throw new Error('invalid path');
    }

    loading.show();

    const api = ServerConnections.getApi();
    const promises = [];

    if (path) {
        promises.push(
            getEnvironmentApi(api).getDirectoryContents({ path, ...fileOptions }).then(({ data }) => data),
            getEnvironmentApi(api).getParentPath({ path }).then(({ data }) => data)
        );
    } else {
        promises.push(getEnvironmentApi(api).getDrives().then(({ data }) => data));
    }

    Promise.all(promises).then(
        responses => {
            const folders = responses[0];
            const parentPath = responses[1] || '';
            let html = '';

            page.querySelector('.results').scrollTop = 0;
            page.querySelector('#txtDirectoryPickerPath').value = path || '';

            if (path) {
                html += getItem('lnkPath lnkDirectory', '', parentPath, '...');
            }
            for (let i = 0, length = folders.length; i < length; i++) {
                const folder = folders[i];
                const cssClass = folder.Type === 'File' ? 'lnkPath lnkFile' : 'lnkPath lnkDirectory';
                html += getItem(cssClass, folder.Type, folder.Path, folder.Name);
            }

            page.querySelector('.results').innerHTML = html;
            loading.hide();
        }, () => {
            if (updatePathOnError) {
                page.querySelector('#txtDirectoryPickerPath').value = '';
                page.querySelector('.results').innerHTML = '';
                loading.hide();
            }
        }
    );
}

function getItem(cssClass, type, path, name) {
    let html = '';
    html += `<div class="listItem listItem-border ${cssClass}" data-type="${type}" data-path="${escapeHtml(path)}">`;
    html += '<div class="listItemBody" style="padding-left:0;padding-top:.5em;padding-bottom:.5em;">';
    html += '<div class="listItemBodyText">';
    html += escapeHtml(name);
    html += '</div>';
    html += '</div>';
    html += '<span class="material-icons arrow_forward" aria-hidden="true" style="font-size:inherit;"></span>';
    html += '</div>';
    return html;
}

function getEditorHtml(options) {
    let html = '';
    html += '<div class="formDialogContent scrollY">';
    html += '<div class="dialogContentInner dialog-content-centered" style="padding-top:2em;">';
    if (!options.pathReadOnly && options.instruction) {
        const instruction = `${escapeHtml(options.instruction)}<br/><br/>`;
        html += '<div class="infoBanner" style="margin-bottom:1.5em;">';
        html += instruction;
        html += '</div>';
    }
    html += '<form style="margin:auto;">';
    html += '<div class="inputContainer" style="display: flex; align-items: center;">';
    html += '<div style="flex-grow:1;">';
    let labelKey;
    if (options.includeFiles !== true) {
        labelKey = 'LabelFolder';
    } else {
        labelKey = 'LabelPath';
    }
    const readOnlyAttribute = options.pathReadOnly ? ' readonly' : '';
    html += `<input is="emby-input" id="txtDirectoryPickerPath" type="text" required="required" ${readOnlyAttribute} label="${globalize.translate(labelKey)}"/>`;
    html += '</div>';
    if (!readOnlyAttribute) {
        html += `<button type="button" is="paper-icon-button-light" class="btnRefreshDirectories emby-input-iconbutton" title="${globalize.translate('Refresh')}"><span class="material-icons search" aria-hidden="true"></span></button>`;
    }
    html += '</div>';
    if (!readOnlyAttribute) {
        html += '<div class="results paperList" style="max-height: 200px; overflow-y: auto;"></div>';
    }
    html += '<div class="formDialogFooter">';
    html += `<button is="emby-button" type="submit" class="raised button-submit block formDialogFooterItem">${globalize.translate('ButtonOk')}</button>`;
    html += '</div>';
    html += '</form>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    return html;
}

function alertText(text) {
    alertTextWithOptions({
        text: text
    });
}

function alertTextWithOptions(options) {
    alert(options);
}

async function validatePath(path, validateWriteable) {
    const api = ServerConnections.getApi();
    try {
        await getEnvironmentApi(api).validatePath({
            validatePathDto: {
                ValidateWritable: validateWriteable,
                Path: path
            }
        });
    } catch (e) {
        if (e.response) {
            if (e.response.status === 404) {
                alertText(globalize.translate('PathNotFound'));
                throw e;
            }
            if (e.response.status === 500) {
                if (validateWriteable) {
                    alertText(globalize.translate('WriteAccessRequired'));
                } else {
                    alertText(globalize.translate('PathNotFound'));
                }
                throw e;
            }
        }
    }
}

function initEditor(content, options, fileOptions) {
    content.addEventListener('click', e => {
        const lnkPath = dom.parentWithClass(e.target, 'lnkPath');
        if (lnkPath) {
            const path = lnkPath.getAttribute('data-path');
            if (lnkPath.classList.contains('lnkFile')) {
                content.querySelector('#txtDirectoryPickerPath').value = path;
            } else {
                refreshDirectoryBrowser(content, path, fileOptions, true);
            }
        }
    });

    content.addEventListener('click', e => {
        if (dom.parentWithClass(e.target, 'btnRefreshDirectories')) {
            const path = content.querySelector('#txtDirectoryPickerPath').value;
            refreshDirectoryBrowser(content, path, fileOptions);
        }
    });

    content.addEventListener('change', e => {
        const txtDirectoryPickerPath = dom.parentWithTag(e.target, 'INPUT');
        if (txtDirectoryPickerPath && txtDirectoryPickerPath.id === 'txtDirectoryPickerPath') {
            refreshDirectoryBrowser(content, txtDirectoryPickerPath.value, fileOptions);
        }
    });

    content.querySelector('form').addEventListener('submit', function(e) {
        if (options.callback) {
            const path = this.querySelector('#txtDirectoryPickerPath').value;
            validatePath(path, options.validateWriteable)
                .then(options.callback(path))
                .catch(() => { /* no-op */ });
        }
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
}

async function getDefaultPath(options) {
    if (options.path) {
        return options.path;
    } else {
        const api = ServerConnections.getApi();
        try {
            const { data } = await getEnvironmentApi(api).getDefaultDirectoryBrowser();
            return data.Path || '';
        } catch {
            return '';
        }
    }
}

class DirectoryBrowser {
    currentDialog;

    show = options => {
        options = options || {};
        const fileOptions = {
            includeDirectories: true
        };
        if (options.includeDirectories != null) {
            fileOptions.includeDirectories = options.includeDirectories;
        }
        if (options.includeFiles != null) {
            fileOptions.includeFiles = options.includeFiles;
        }
        getDefaultPath(options).then(
            fetchedInitialPath => {
                const dlg = dialogHelper.createDialog({
                    size: 'small',
                    removeOnClose: true,
                    scrollY: false
                });
                dlg.classList.add('ui-body-a');
                dlg.classList.add('background-theme-a');
                dlg.classList.add('directoryPicker');
                dlg.classList.add('formDialog');

                let html = '';
                html += '<div class="formDialogHeader">';
                html += `<button is="paper-icon-button-light" class="btnCloseDialog autoSize" tabindex="-1" title="${globalize.translate('ButtonBack')}"><span class="material-icons arrow_back" aria-hidden="true"></span></button>`;
                html += '<h3 class="formDialogHeaderTitle">';
                html += escapeHtml(options.header || '') || globalize.translate('HeaderSelectPath');
                html += '</h3>';
                html += '</div>';
                html += getEditorHtml(options);
                dlg.innerHTML = html;
                initEditor(dlg, options, fileOptions);
                dlg.addEventListener('close', onDialogClosed);
                dialogHelper.open(dlg);
                dlg.querySelector('.btnCloseDialog').addEventListener('click', () => {
                    dialogHelper.close(dlg);
                });
                this.currentDialog = dlg;
                dlg.querySelector('#txtDirectoryPickerPath').value = fetchedInitialPath;
                if (!options.pathReadOnly) {
                    refreshDirectoryBrowser(dlg, fetchedInitialPath, fileOptions, true);
                }
            }
        );
    };

    close = () => {
        if (this.currentDialog) {
            dialogHelper.close(this.currentDialog);
        }
    };
}

export default DirectoryBrowser;
