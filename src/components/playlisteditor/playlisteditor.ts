import escapeHtml from 'escape-html';
import type { ApiClient } from 'jellyfin-apiclient';

import dom from 'scripts/dom';
import globalize from 'scripts/globalize';
import * as userSettings from 'scripts/settings/userSettings';
import { PluginType } from 'types/plugin';

import dialogHelper from '../dialogHelper/dialogHelper';
import loading from '../loading/loading';
import layoutManager from '../layoutManager';
import { playbackManager } from '../playback/playbackmanager';
import { pluginManager } from '../pluginManager';
import { appRouter } from '../router/appRouter';
import ServerConnections from '../ServerConnections';

import 'elements/emby-button/emby-button';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/paper-icon-button-light';
import 'elements/emby-select/emby-select';

import 'material-design-icons-iconfont';
import '../formdialog.scss';

interface DialogElement extends HTMLDivElement {
    submitted?: boolean
}

interface PlaylistEditorOptions {
    items: string[],
    serverId: string,
    enableAddToPlayQueue?: boolean,
    defaultValue?: string
}

let currentServerId: string;

function onSubmit(this: HTMLElement, e: Event) {
    const panel = dom.parentWithClass(this, 'dialog') as DialogElement | null;

    if (panel) {
        const playlistId = panel.querySelector<HTMLSelectElement>('#selectPlaylistToAddTo')?.value;
        const apiClient = ServerConnections.getApiClient(currentServerId);

        if (playlistId) {
            userSettings.set('playlisteditor-lastplaylistid', playlistId);
            addToPlaylist(apiClient, panel, playlistId)
                ?.catch(err => {
                    console.error('[PlaylistEditor] Failed to add to playlist %s', playlistId, err);
                });
        } else {
            createPlaylist(apiClient, panel)
                ?.catch(err => {
                    console.error('[PlaylistEditor] Failed to create playlist', err);
                });
        }
    } else {
        console.error('[PlaylistEditor] Dialog element is missing!');
    }

    e.preventDefault();
    return false;
}

function createPlaylist(apiClient: ApiClient, dlg: DialogElement) {
    loading.show();

    const url = apiClient.getUrl('Playlists', {
        Name: dlg.querySelector<HTMLInputElement>('#txtNewPlaylistName')?.value,
        Ids: dlg.querySelector<HTMLInputElement>('.fldSelectedItemIds')?.value || '',
        userId: apiClient.getCurrentUserId()
    });

    return apiClient.ajax({
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

function redirectToPlaylist(apiClient: ApiClient, id: string) {
    appRouter.showItem(id, apiClient.serverId());
}

function addToPlaylist(apiClient: ApiClient, dlg: DialogElement, id: string) {
    const itemIds = dlg.querySelector<HTMLInputElement>('.fldSelectedItemIds')?.value || '';

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

    return apiClient.ajax({
        type: 'POST',
        url: url

    }).then(() => {
        loading.hide();

        dlg.submitted = true;
        dialogHelper.close(dlg);
    });
}

function triggerChange(select: HTMLSelectElement) {
    select.dispatchEvent(new CustomEvent('change', {}));
}

function populatePlaylists(editorOptions: PlaylistEditorOptions, panel: DialogElement) {
    const select = panel.querySelector<HTMLSelectElement>('#selectPlaylistToAddTo');

    loading.hide();

    if (!select) {
        return Promise.reject(new Error('Playlist <select> element is missing'));
    }

    panel.querySelector('.newPlaylistInfo')?.classList.add('hide');

    const options = {
        Recursive: true,
        IncludeItemTypes: 'Playlist',
        SortBy: 'SortName',
        EnableTotalRecordCount: false
    };

    const apiClient = ServerConnections.getApiClient(currentServerId);
    const SyncPlay = pluginManager.firstOfType(PluginType.SyncPlay)?.instance;

    return apiClient.getItems(apiClient.getCurrentUserId(), options).then(result => {
        let html = '';

        if ((editorOptions.enableAddToPlayQueue !== false && playbackManager.isPlaying()) || SyncPlay?.Manager.isSyncPlayEnabled()) {
            html += `<option value="queue">${globalize.translate('AddToPlayQueue')}</option>`;
        }

        html += `<option value="">${globalize.translate('OptionNew')}</option>`;

        html += result.Items?.map(i => {
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

function getEditorHtml(items: string[]) {
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

function initEditor(content: DialogElement, options: PlaylistEditorOptions, items: string[]) {
    content.querySelector('#selectPlaylistToAddTo')?.addEventListener('change', function(this: HTMLSelectElement) {
        if (this.value) {
            content.querySelector('.newPlaylistInfo')?.classList.add('hide');
            content.querySelector('#txtNewPlaylistName')?.removeAttribute('required');
        } else {
            content.querySelector('.newPlaylistInfo')?.classList.remove('hide');
            content.querySelector('#txtNewPlaylistName')?.setAttribute('required', 'required');
        }
    });

    content.querySelector('form')?.addEventListener('submit', onSubmit);

    const selectedItemsInput = content.querySelector<HTMLInputElement>('.fldSelectedItemIds');
    if (selectedItemsInput) {
        selectedItemsInput.value = items.join(',');
    }

    if (items.length) {
        content.querySelector('.fldSelectPlaylist')?.classList.remove('hide');
        populatePlaylists(options, content)
            .catch(err => {
                console.error('[PlaylistEditor] failed to populate playlists', err);
            });
    } else {
        content.querySelector('.fldSelectPlaylist')?.classList.add('hide');

        const selectPlaylistToAddTo = content.querySelector<HTMLSelectElement>('#selectPlaylistToAddTo');
        if (selectPlaylistToAddTo) {
            selectPlaylistToAddTo.innerHTML = '';
            selectPlaylistToAddTo.value = '';
            triggerChange(selectPlaylistToAddTo);
        }
    }
}

function centerFocus(elem: HTMLDivElement | null, horiz: boolean, on: boolean) {
    if (!elem) {
        console.error('[PlaylistEditor] cannot focus null element');
        return;
    }

    import('../../scripts/scrollHelper')
        .then((scrollHelper) => {
            const fn = on ? 'on' : 'off';
            scrollHelper.centerFocus[fn](elem, horiz);
        })
        .catch(err => {
            console.error('[PlaylistEditor] failed to load scroll helper', err);
        });
}

export class PlaylistEditor {
    show(options: PlaylistEditorOptions) {
        const items = options.items || [];
        currentServerId = options.serverId;

        const dialogOptions = {
            removeOnClose: true,
            scrollY: false,
            size: layoutManager.tv ? 'fullscreen' : 'small'
        };

        const dlg: DialogElement = dialogHelper.createDialog(dialogOptions);

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

        dlg.querySelector('.btnCancel')?.addEventListener('click', () => {
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

export default PlaylistEditor;
