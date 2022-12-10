import escapeHtml from 'escape-html';
import dom from '../../scripts/dom';
import dialogHelper from '../dialogHelper/dialogHelper';
import loading from '../loading/loading';
import layoutManager from '../layoutManager';
import { playbackManager } from '../playback/playbackmanager';
import SyncPlay from '../../plugins/syncPlay/core';
import * as userSettings from '../../scripts/settings/userSettings';
import { appRouter } from '../appRouter';
import globalize from '../../scripts/globalize';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-input/emby-input';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-select/emby-select';
import 'material-design-icons-iconfont';
import '../formdialog.scss';
import ServerConnections from '../ServerConnections';

/* eslint-disable indent */

    let currentServerId;

    function onSubmit(e) {
        const panel = dom.parentWithClass(this, 'dialog');

        const playlistId = panel.querySelector('#selectPlaylistToAddTo').value;
        const apiClient = ServerConnections.getApiClient(currentServerId);

        if (playlistId) {
            userSettings.set('playlisteditor-lastplaylistid', playlistId);
            addToPlaylist(apiClient, panel, playlistId);
        } else {
            createPlaylist(apiClient, panel);
        }

        e.preventDefault();
        return false;
    }

    function createPlaylist(apiClient, dlg) {
        loading.show();

        const url = apiClient.getUrl('Playlists', {
            Name: dlg.querySelector('#txtNewPlaylistName').value,
            Ids: dlg.querySelector('.fldSelectedItemIds').value || '',
            userId: apiClient.getCurrentUserId()

        });

        apiClient.ajax({
            type: 'POST',
            url: url,
            dataType: 'json',
            contentType: 'application/json'
        }).then(result => {
            loading.hide();

            const id = result.Id;
            dlg.submitted = true;
            dialogHelper.close(dlg);
            redirectToPlaylist(apiClient, id);
        });
    }

    function redirectToPlaylist(apiClient, id) {
        appRouter.showItem(id, apiClient.serverId());
    }

    function addToPlaylist(apiClient, dlg, id) {
        const itemIds = dlg.querySelector('.fldSelectedItemIds').value || '';

        if (id === 'queue') {
            playbackManager.queue({
                serverId: apiClient.serverId(),
                ids: itemIds.split(',')
            });
            dlg.submitted = true;
            dialogHelper.close(dlg);
            return;
        }

        loading.show();

        const url = apiClient.getUrl(`Playlists/${id}/Items`, {
            Ids: itemIds,
            userId: apiClient.getCurrentUserId()
        });

        apiClient.ajax({
            type: 'POST',
            url: url

        }).then(() => {
            loading.hide();

            dlg.submitted = true;
            dialogHelper.close(dlg);
        });
    }

    function triggerChange(select) {
        select.dispatchEvent(new CustomEvent('change', {}));
    }

    function populatePlaylists(editorOptions, panel) {
        const select = panel.querySelector('#selectPlaylistToAddTo');

        loading.hide();

        panel.querySelector('.newPlaylistInfo').classList.add('hide');

        const options = {
            Recursive: true,
            IncludeItemTypes: 'Playlist',
            SortBy: 'SortName',
            EnableTotalRecordCount: false
        };

        const apiClient = ServerConnections.getApiClient(currentServerId);
        apiClient.getItems(apiClient.getCurrentUserId(), options).then(result => {
            let html = '';

            if ((editorOptions.enableAddToPlayQueue !== false && playbackManager.isPlaying()) || SyncPlay.Manager.isSyncPlayEnabled()) {
                html += `<option value="queue">${globalize.translate('AddToPlayQueue')}</option>`;
            }

            html += `<option value="">${globalize.translate('OptionNew')}</option>`;

            html += result.Items.map(i => {
                return `<option value="${i.Id}">${escapeHtml(i.Name)}</option>`;
            });

            select.innerHTML = html;

            let defaultValue = editorOptions.defaultValue;
            if (!defaultValue) {
                defaultValue = userSettings.get('playlisteditor-lastplaylistid') || '';
            }
            select.value = defaultValue === 'new' ? '' : defaultValue;

            // If the value is empty set it again, in case we tried to set a lastplaylistid that is no longer valid
            if (!select.value) {
                select.value = '';
            }

            triggerChange(select);

            loading.hide();
        });
    }

    function getEditorHtml(items) {
        let html = '';

        html += '<div class="formDialogContent smoothScrollY" style="padding-top:2em;">';
        html += '<div class="dialogContentInner dialog-content-centered">';
        html += '<form style="margin:auto;">';

        html += '<div class="fldSelectPlaylist selectContainer">';
        let autoFocus = items.length ? ' autofocus' : '';
        html += `<select is="emby-select" id="selectPlaylistToAddTo" label="${globalize.translate('LabelPlaylist')}"${autoFocus}></select>`;
        html += '</div>';

        html += '<div class="newPlaylistInfo">';

        html += '<div class="inputContainer">';
        autoFocus = items.length ? '' : ' autofocus';
        html += `<input is="emby-input" type="text" id="txtNewPlaylistName" required="required" label="${globalize.translate('LabelName')}"${autoFocus} />`;
        html += '</div>';

        // newPlaylistInfo
        html += '</div>';

        html += '<div class="formDialogFooter">';
        html += `<button is="emby-button" type="submit" class="raised btnSubmit block formDialogFooterItem button-submit">${globalize.translate('Add')}</button>`;
        html += '</div>';

        html += '<input type="hidden" class="fldSelectedItemIds" />';

        html += '</form>';
        html += '</div>';
        html += '</div>';

        return html;
    }

    function initEditor(content, options, items) {
        content.querySelector('#selectPlaylistToAddTo').addEventListener('change', function () {
            if (this.value) {
                content.querySelector('.newPlaylistInfo').classList.add('hide');
                content.querySelector('#txtNewPlaylistName').removeAttribute('required');
            } else {
                content.querySelector('.newPlaylistInfo').classList.remove('hide');
                content.querySelector('#txtNewPlaylistName').setAttribute('required', 'required');
            }
        });

        content.querySelector('form').addEventListener('submit', onSubmit);

        content.querySelector('.fldSelectedItemIds', content).value = items.join(',');

        if (items.length) {
            content.querySelector('.fldSelectPlaylist').classList.remove('hide');
            populatePlaylists(options, content);
        } else {
            content.querySelector('.fldSelectPlaylist').classList.add('hide');

            const selectPlaylistToAddTo = content.querySelector('#selectPlaylistToAddTo');
            selectPlaylistToAddTo.innerHTML = '';
            selectPlaylistToAddTo.value = '';
            triggerChange(selectPlaylistToAddTo);
        }
    }

    function centerFocus(elem, horiz, on) {
        import('../../scripts/scrollHelper').then((scrollHelper) => {
            const fn = on ? 'on' : 'off';
            scrollHelper.centerFocus[fn](elem, horiz);
        });
    }

    export class showEditor {
        constructor(options) {
            const items = options.items || {};
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

            let html = '';
            const title = globalize.translate('HeaderAddToPlaylist');

            html += '<div class="formDialogHeader">';
            html += `<button is="paper-icon-button-light" class="btnCancel autoSize" tabindex="-1" title="${globalize.translate('ButtonBack')}"><span class="material-icons arrow_back" aria-hidden="true"></span></button>`;
            html += '<h3 class="formDialogHeaderTitle">';
            html += title;
            html += '</h3>';

            html += '</div>';

            html += getEditorHtml(items);

            dlg.innerHTML = html;

            initEditor(dlg, options, items);

            dlg.querySelector('.btnCancel').addEventListener('click', () => {
                dialogHelper.close(dlg);
            });

            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.formDialogContent'), false, true);
            }

            return dialogHelper.open(dlg).then(() => {
                if (layoutManager.tv) {
                    centerFocus(dlg.querySelector('.formDialogContent'), false, false);
                }

                if (dlg.submitted) {
                    return Promise.resolve();
                }

                return Promise.reject();
            });
        }
    }

/* eslint-enable indent */
export default showEditor;
