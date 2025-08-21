import dialogHelper from '../dialogHelper/dialogHelper';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import layoutManager from '../layoutManager';
import loading from '../loading/loading';
import scrollHelper from '../../scripts/scrollHelper';
import datetime from '../../scripts/datetime';

import '../../styles/scrollstyles.scss';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-input/emby-input';
import '../../elements/emby-select/emby-select';
import '../../elements/emby-button/paper-icon-button-light';
import '../formdialog.scss';
import './recordingcreator.scss';
import 'material-design-icons-iconfont';
import '../../styles/flexstyles.scss';
import template from './seriesrecordingeditor.template.html';

let currentDialog;
let recordingUpdated = false;
let recordingDeleted = false;
let currentItemId;
let currentServerId;

function deleteTimer(apiClient, timerId) {
    return new Promise(function (resolve, reject) {
        import('./recordinghelper').then(({ default: recordingHelper }) => {
            recordingHelper.cancelSeriesTimerWithConfirmation(timerId, apiClient.serverId()).then(resolve, reject);
        });
    });
}

function renderTimer(context, item) {
    context.querySelector('#txtPrePaddingMinutes').value = item.PrePaddingSeconds / 60;
    context.querySelector('#txtPostPaddingMinutes').value = item.PostPaddingSeconds / 60;

    context.querySelector('.selectChannels').value = item.RecordAnyChannel ? 'all' : 'one';
    context.querySelector('.selectAirTime').value = item.RecordAnyTime ? 'any' : 'original';

    context.querySelector('.selectShowType').value = item.RecordNewOnly ? 'new' : 'all';
    context.querySelector('.chkSkipEpisodesInLibrary').checked = item.SkipEpisodesInLibrary;
    context.querySelector('.selectKeepUpTo').value = item.KeepUpTo || 0;

    if (item.ChannelName || item.ChannelNumber) {
        context.querySelector('.optionChannelOnly').innerText = globalize.translate('ChannelNameOnly', item.ChannelName || item.ChannelNumber);
    } else {
        context.querySelector('.optionChannelOnly').innerHTML = globalize.translate('OneChannel');
    }

    context.querySelector('.optionAroundTime').innerHTML = globalize.translate('AroundTime', datetime.getDisplayTime(datetime.parseISO8601Date(item.StartDate)));

    loading.hide();
}

function closeDialog(isDeleted) {
    recordingUpdated = true;
    recordingDeleted = isDeleted;

    dialogHelper.close(currentDialog);
}

function onSubmit(e) {
    const form = this;

    const apiClient = ServerConnections.getApiClient(currentServerId);

    apiClient.getLiveTvSeriesTimer(currentItemId).then(function (item) {
        item.PrePaddingSeconds = form.querySelector('#txtPrePaddingMinutes').value * 60;
        item.PostPaddingSeconds = form.querySelector('#txtPostPaddingMinutes').value * 60;
        item.RecordAnyChannel = form.querySelector('.selectChannels').value === 'all';
        item.RecordAnyTime = form.querySelector('.selectAirTime').value === 'any';
        item.RecordNewOnly = form.querySelector('.selectShowType').value === 'new';
        item.SkipEpisodesInLibrary = form.querySelector('.chkSkipEpisodesInLibrary').checked;
        item.KeepUpTo = form.querySelector('.selectKeepUpTo').value;

        apiClient.updateLiveTvSeriesTimer(item);
    });

    e.preventDefault();

    // Disable default form submission
    return false;
}

function init(context) {
    fillKeepUpTo(context);

    context.querySelector('.btnCancel').addEventListener('click', function () {
        closeDialog(false);
    });

    context.querySelector('.btnCancelRecording').addEventListener('click', function () {
        const apiClient = ServerConnections.getApiClient(currentServerId);
        deleteTimer(apiClient, currentItemId).then(function () {
            closeDialog(true);
        });
    });

    context.querySelector('form').addEventListener('submit', onSubmit);
}

function reload(context, id) {
    const apiClient = ServerConnections.getApiClient(currentServerId);

    loading.show();
    if (typeof id === 'string') {
        currentItemId = id;

        apiClient.getLiveTvSeriesTimer(id).then(function (result) {
            renderTimer(context, result);
            loading.hide();
        });
    } else if (id) {
        currentItemId = id.Id;

        renderTimer(context, id);
        loading.hide();
    }
}

function fillKeepUpTo(context) {
    let html = '';

    for (let i = 0; i <= 50; i++) {
        let text;

        if (i === 0) {
            text = globalize.translate('AsManyAsPossible');
        } else if (i === 1) {
            text = globalize.translate('ValueOneEpisode');
        } else {
            text = globalize.translate('ValueEpisodeCount', i);
        }

        html += '<option value="' + i + '">' + text + '</option>';
    }

    context.querySelector('.selectKeepUpTo').innerHTML = html;
}

function onFieldChange() {
    this.querySelector('.btnSubmit').click();
}

function embed(itemId, serverId, options) {
    recordingUpdated = false;
    recordingDeleted = false;
    currentServerId = serverId;
    loading.show();
    options = options || {};

    const dialogOptions = {
        removeOnClose: true,
        scrollY: false
    };

    if (layoutManager.tv) {
        dialogOptions.size = 'fullscreen';
    } else {
        dialogOptions.size = 'small';
    }

    const dlg = options.context;

    dlg.classList.add('hide');
    dlg.innerHTML = globalize.translateHtml(template, 'core');

    dlg.querySelector('.formDialogHeader').classList.add('hide');
    dlg.querySelector('.formDialogFooter').classList.add('hide');
    dlg.querySelector('.formDialogContent').className = '';
    dlg.querySelector('.dialogContentInner').className = '';
    dlg.classList.remove('hide');

    dlg.removeEventListener('change', onFieldChange);
    dlg.addEventListener('change', onFieldChange);

    currentDialog = dlg;

    init(dlg);

    reload(dlg, itemId);
}

function showEditor(itemId, serverId, options) {
    return new Promise(function (resolve, reject) {
        recordingUpdated = false;
        recordingDeleted = false;
        currentServerId = serverId;
        loading.show();
        options = options || {};

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
        dlg.classList.add('recordingDialog');

        if (!layoutManager.tv) {
            dlg.style['min-width'] = '20%';
        }

        let html = '';

        html += globalize.translateHtml(template, 'core');

        dlg.innerHTML = html;

        if (options.enableCancel === false) {
            dlg.querySelector('.formDialogFooter').classList.add('hide');
        }

        currentDialog = dlg;

        dlg.addEventListener('closing', function () {
            if (!recordingDeleted) {
                this.querySelector('.btnSubmit').click();
            }
        });

        dlg.addEventListener('close', function () {
            if (recordingUpdated) {
                resolve({
                    updated: true,
                    deleted: recordingDeleted
                });
            } else {
                reject();
            }
        });

        if (layoutManager.tv) {
            scrollHelper.centerFocus.on(dlg.querySelector('.formDialogContent'), false);
        }

        init(dlg);

        reload(dlg, itemId);

        dialogHelper.open(dlg);
    });
}

export default {
    show: showEditor,
    embed: embed
};
