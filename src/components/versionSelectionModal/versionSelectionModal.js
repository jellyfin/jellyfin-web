
import dialogHelper from '../dialogHelper/dialogHelper';
import globalize from '../../lib/globalize';
import escapeHtml from 'escape-html';
import '../formdialog.scss';
import template from './versionSelectionModal.template.html';

const STORAGE_PREFIX = 'versionSelectionModal:';

function showVersionSelectionModal(item, onVersionSelected) {
    if (!item.MediaSources || item.MediaSources.length <= 1) {
        onVersionSelected(item.MediaSources?.[0]?.Id || null);
        return Promise.resolve();
    }

    const dlg = dialogHelper.createDialog({ removeOnClose: true });
    dlg.classList.add('formDialog');
    dlg.innerHTML = globalize.translateHtml(template, 'core');

    dlg.querySelector('.formDialogHeaderTitle').innerText = globalize.translate('SelectVersion');

    const versionSelect = dlg.querySelector('#versionSelect');
    const mediaSources = item.MediaSources;
    const storageKey = STORAGE_PREFIX + item.Id;
    const storedVersionId = localStorage.getItem(storageKey);
    const selectedId = storedVersionId && mediaSources.some(s => s.Id === storedVersionId) ?
        storedVersionId :
        mediaSources[0].Id;
    versionSelect.innerHTML = mediaSources.map(source =>
        `<option value="${source.Id}"${source.Id === selectedId ? ' selected' : ''}>${escapeHtml(source.Name)}</option>`
    ).join('');

    let dialogResult;

    dlg.querySelector('.btnPlay').addEventListener('click', () => {
        dialogResult = versionSelect.value;
        localStorage.setItem(storageKey, dialogResult);
        dialogHelper.close(dlg);
    });
    dlg.querySelector('.btnCancel').addEventListener('click', () => {
        dialogResult = null;
        dialogHelper.close(dlg);
    });

    return dialogHelper.open(dlg).then(() => {
        if (dialogResult) {
            onVersionSelected(dialogResult);
            return dialogResult;
        } else {
            return Promise.reject();
        }
    });
}

export default {
    show: showVersionSelectionModal
};