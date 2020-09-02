import dialogHelper from 'dialogHelper';
import globalize from 'globalize';
import layoutManager from 'layoutManager';
import mediaInfo from 'mediaInfo';
import require from 'require';
import loading from 'loading';
import scrollHelper from 'scrollHelper';
import datetime from 'datetime';
import imageLoader from 'imageLoader';
import recordingFields from 'recordingFields';
import events from 'events';
import 'emby-checkbox';
import 'emby-button';
import 'emby-collapse';
import 'emby-input';
import 'paper-icon-button-light';
import 'css!./../formdialog';
import 'css!./recordingcreator';
import 'material-icons';

let currentDialog;
let closeAction;
let currentRecordingFields;

function closeDialog() {
    dialogHelper.close(currentDialog);
}

function init(context) {
    context.querySelector('.btnPlay').addEventListener('click', function () {
        closeAction = 'play';
        closeDialog();
    });

    context.querySelector('.btnCancel').addEventListener('click', function () {
        closeAction = null;
        closeDialog();
    });
}

function getImageUrl(item, apiClient, imageHeight) {
    const imageTags = item.ImageTags || {};

    if (item.PrimaryImageTag) {
        imageTags.Primary = item.PrimaryImageTag;
    }

    if (imageTags.Primary) {
        return apiClient.getScaledImageUrl(item.Id, {
            type: 'Primary',
            maxHeight: imageHeight,
            tag: item.ImageTags.Primary
        });
    } else if (imageTags.Thumb) {
        return apiClient.getScaledImageUrl(item.Id, {
            type: 'Thumb',
            maxHeight: imageHeight,
            tag: item.ImageTags.Thumb
        });
    }

    return null;
}

function renderRecording(context, defaultTimer, program, apiClient, refreshRecordingStateOnly) {
    if (!refreshRecordingStateOnly) {
        const imgUrl = getImageUrl(program, apiClient, 200);
        const imageContainer = context.querySelector('.recordingDialog-imageContainer');

        if (imgUrl) {
            imageContainer.innerHTML = '<img src="' + require.toUrl('.').split('?')[0] + '/empty.png" data-src="' + imgUrl + '" class="recordingDialog-img lazy" />';
            imageContainer.classList.remove('hide');

            imageLoader.lazyChildren(imageContainer);
        } else {
            imageContainer.innerHTML = '';
            imageContainer.classList.add('hide');
        }

        context.querySelector('.recordingDialog-itemName').innerHTML = program.Name;
        context.querySelector('.formDialogHeaderTitle').innerHTML = program.Name;
        context.querySelector('.itemGenres').innerHTML = (program.Genres || []).join(' / ');
        context.querySelector('.itemOverview').innerHTML = program.Overview || '';

        const formDialogFooter = context.querySelector('.formDialogFooter');
        const now = new Date();
        if (now >= datetime.parseISO8601Date(program.StartDate, true) && now < datetime.parseISO8601Date(program.EndDate, true)) {
            formDialogFooter.classList.remove('hide');
        } else {
            formDialogFooter.classList.add('hide');
        }

        context.querySelector('.itemMiscInfoPrimary').innerHTML = mediaInfo.getPrimaryMediaInfoHtml(program);
    }

    context.querySelector('.itemMiscInfoSecondary').innerHTML = mediaInfo.getSecondaryMediaInfoHtml(program, {
    });

    loading.hide();
}

function reload(context, programId, serverId, refreshRecordingStateOnly) {
    loading.show();

    const apiClient = window.connectionManager.getApiClient(serverId);

    const promise1 = apiClient.getNewLiveTvTimerDefaults({ programId: programId });
    const promise2 = apiClient.getLiveTvProgram(programId, apiClient.getCurrentUserId());

    Promise.all([promise1, promise2]).then(function (responses) {
        const defaults = responses[0];
        const program = responses[1];

        renderRecording(context, defaults, program, apiClient, refreshRecordingStateOnly);
    });
}

function executeCloseAction(action, programId, serverId) {
    if (action === 'play') {
        import('playbackManager').then(({ default: playbackManager }) => {
            const apiClient = window.connectionManager.getApiClient(serverId);

            apiClient.getLiveTvProgram(programId, apiClient.getCurrentUserId()).then(function (item) {
                playbackManager.play({
                    ids: [item.ChannelId],
                    serverId: serverId
                });
            });
        });
        return;
    }
}

function showEditor(itemId, serverId) {
    return new Promise(function (resolve, reject) {
        closeAction = null;

        loading.show();

        import('text!./recordingcreator.template.html').then(({ default: template }) => {
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

            let html = '';

            html += globalize.translateHtml(template, 'core');

            dlg.innerHTML = html;

            currentDialog = dlg;

            function onRecordingChanged() {
                reload(dlg, itemId, serverId, true);
            }

            dlg.addEventListener('close', function () {
                events.off(currentRecordingFields, 'recordingchanged', onRecordingChanged);
                executeCloseAction(closeAction, itemId, serverId);

                if (currentRecordingFields && currentRecordingFields.hasChanged()) {
                    resolve();
                } else {
                    reject();
                }
            });

            if (layoutManager.tv) {
                scrollHelper.centerFocus.on(dlg.querySelector('.formDialogContent'), false);
            }

            init(dlg);

            reload(dlg, itemId, serverId);

            currentRecordingFields = new recordingFields({
                parent: dlg.querySelector('.recordingFields'),
                programId: itemId,
                serverId: serverId
            });

            events.on(currentRecordingFields, 'recordingchanged', onRecordingChanged);

            dialogHelper.open(dlg);
        });
    });
}

export default {
    show: showEditor
};
