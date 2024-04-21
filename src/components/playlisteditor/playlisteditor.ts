import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import escapeHtml from 'escape-html';

import dom from 'scripts/dom';
import globalize from 'scripts/globalize';
import { currentSettings as userSettings } from 'scripts/settings/userSettings';
import { PluginType } from 'types/plugin';
import { toApi } from 'utils/jellyfin-apiclient/compat';

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

        loading.show();

        if (playlistId) {
            userSettings.set('playlisteditor-lastplaylistid', playlistId);
            addToPlaylist(panel, playlistId)
                .catch(err => {
                    console.error('[PlaylistEditor] Failed to add to playlist %s', playlistId, err);
                })
                .finally(loading.hide);
        } else {
            createPlaylist(panel)
                .catch(err => {
                    console.error('[PlaylistEditor] Failed to create playlist', err);
                })
                .finally(loading.hide);
        }
    } else {
        console.error('[PlaylistEditor] Dialog element is missing!');
    }

    e.preventDefault();
    return false;
}

function createPlaylist(dlg: DialogElement) {
    const apiClient = ServerConnections.getApiClient(currentServerId);
    const api = toApi(apiClient);

    const itemIds = dlg.querySelector<HTMLInputElement>('.fldSelectedItemIds')?.value || '';

    return getPlaylistsApi(api)
        .createPlaylist({
            name: dlg.querySelector<HTMLInputElement>('#txtNewPlaylistName')?.value,
            ids: itemIds.split(','),
            userId: apiClient.getCurrentUserId()
        })
        .then(result => {
            dlg.submitted = true;
            dialogHelper.close(dlg);

            redirectToPlaylist(result.data.Id);
        });
}

function redirectToPlaylist(id: string | undefined) {
    appRouter.showItem(id, currentServerId);
}

function addToPlaylist(dlg: DialogElement, id: string) {
    const apiClient = ServerConnections.getApiClient(currentServerId);
    const api = toApi(apiClient);
    const itemIds = dlg.querySelector<HTMLInputElement>('.fldSelectedItemIds')?.value || '';

    if (id === 'queue') {
        playbackManager.queue({
            serverId: currentServerId,
            ids: itemIds.split(',')
        });
        dlg.submitted = true;
        dialogHelper.close(dlg);
        return Promise.resolve();
    }

    return getPlaylistsApi(api)
        .addItemToPlaylist({
            playlistId: id,
            ids: itemIds.split(','),
            userId: apiClient.getCurrentUserId()
        })
        .then(() => {
            dlg.submitted = true;
            dialogHelper.close(dlg);
        });
}

function triggerChange(select: HTMLSelectElement) {
    select.dispatchEvent(new CustomEvent('change', {}));
}

function populatePlaylists(editorOptions: PlaylistEditorOptions, panel: DialogElement) {
    const select = panel.querySelector<HTMLSelectElement>('#selectPlaylistToAddTo');

    if (!select) {
        return Promise.reject(new Error('Playlist <select> element is missing'));
    }

    loading.show();

    panel.querySelector('.newPlaylistInfo')?.classList.add('hide');

    const apiClient = ServerConnections.getApiClient(currentServerId);
    const api = toApi(apiClient);
    const SyncPlay = pluginManager.firstOfType(PluginType.SyncPlay)?.instance;

    return getItemsApi(api)
        .getItems({
            userId: apiClient.getCurrentUserId(),
            includeItemTypes: [ BaseItemKind.Playlist ],
            sortBy: [ ItemSortBy.SortName ],
            recursive: true
        })
        .then(({ data }) => {
            let html = '';

            if ((editorOptions.enableAddToPlayQueue !== false && playbackManager.isPlaying()) || SyncPlay?.Manager.isSyncPlayEnabled()) {
                html += `<option value="queue">${globalize.translate('AddToPlayQueue')}</option>`;
            }

            html += `<option value="">${globalize.translate('OptionNew')}</option>`;

            html += data.Items?.map(i => {
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
            })
            .finally(loading.hide);
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

            return Promise.reject(new Error());
        });
    }
}

export default PlaylistEditor;
