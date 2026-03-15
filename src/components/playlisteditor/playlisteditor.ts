import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import escapeHtml from 'escape-html';

import toast from 'components/toast/toast';
import dom from 'utils/dom';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { currentSettings as userSettings } from 'scripts/settings/userSettings';
import { PluginType } from 'types/plugin';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import { isBlank } from 'utils/string';

import dialogHelper from '../dialogHelper/dialogHelper';
import loading from '../loading/loading';
import layoutManager from '../layoutManager';
import { playbackManager } from '../playback/playbackmanager';
import { pluginManager } from '../pluginManager';
import { appRouter } from '../router/appRouter';

import 'elements/emby-button/emby-button';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/paper-icon-button-light';
import 'elements/emby-select/emby-select';

import 'material-design-icons-iconfont';
import '../formdialog.scss';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { PlaylistUserPermissions } from '@jellyfin/sdk/lib/generated-client/models/playlist-user-permissions';

interface DialogElement extends HTMLDivElement {
    playlistId?: string
    submitted?: boolean
}

interface PlaylistEditorOptions {
    items: string[],
    id?: string,
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
                    toast(globalize.translate('PlaylistError.AddFailed'));
                })
                .finally(loading.hide);
        } else if (panel.playlistId) {
            updatePlaylist(panel)
                .catch(err => {
                    console.error('[PlaylistEditor] Failed to update to playlist %s', panel.playlistId, err);
                    toast(globalize.translate('PlaylistError.UpdateFailed'));
                })
                .finally(loading.hide);
        } else {
            createPlaylist(panel)
                .catch(err => {
                    console.error('[PlaylistEditor] Failed to create playlist', err);
                    toast(globalize.translate('PlaylistError.CreateFailed'));
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
    const name = dlg.querySelector<HTMLInputElement>('#txtNewPlaylistName')?.value;
    if (isBlank(name)) return Promise.reject(new Error('Playlist name should not be blank'));

    const apiClient = ServerConnections.getApiClient(currentServerId);
    const api = toApi(apiClient);

    const itemIds = dlg.querySelector<HTMLInputElement>('.fldSelectedItemIds')?.value || undefined;

    return getPlaylistsApi(api)
        .createPlaylist({
            createPlaylistDto: {
                Name: name ?? '',
                IsPublic: dlg.querySelector<HTMLInputElement>('#chkPlaylistPublic')?.checked,
                Users: getUsers(dlg),
                Ids: itemIds?.split(','),
                UserId: apiClient.getCurrentUserId()
            }
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

function updatePlaylist(dlg: DialogElement) {
    if (!dlg.playlistId) return Promise.reject(new Error('Missing playlist ID'));

    const name = dlg.querySelector<HTMLInputElement>('#txtNewPlaylistName')?.value;
    if (isBlank(name)) return Promise.reject(new Error('Playlist name should not be blank'));

    const apiClient = ServerConnections.getApiClient(currentServerId);
    const api = toApi(apiClient);

    return getPlaylistsApi(api)
        .updatePlaylist({
            playlistId: dlg.playlistId,
            updatePlaylistDto: {
                Name: name,
                Users: getUsers(dlg),
                IsPublic: dlg.querySelector<HTMLInputElement>('#chkPlaylistPublic')?.checked
            }
        })
        .then(() => {
            dlg.submitted = true;
            dialogHelper.close(dlg);
        });
}

function addToPlaylist(dlg: DialogElement, id: string) {
    const apiClient = ServerConnections.getApiClient(currentServerId);
    const api = toApi(apiClient);
    const itemIds = dlg.querySelector<HTMLInputElement>('.fldSelectedItemIds')?.value || '';

    if (id === 'queue') {
        playbackManager.queue({
            serverId: currentServerId,
            ids: itemIds.split(',')
        }).catch(err => {
            console.error('[PlaylistEditor] failed to add to queue', err);
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
            return Promise.all((data.Items || []).map(item => {
                const playlist = {
                    item,
                    permissions: undefined
                };

                if (!item.Id) return playlist;

                return getPlaylistsApi(api)
                    .getPlaylistUser({
                        playlistId: item.Id,
                        userId: apiClient.getCurrentUserId()
                    })
                    .then(({ data: permissions }) => ({
                        ...playlist,
                        permissions
                    }))
                    .catch(err => {
                        // If a user doesn't have access, then the request will 404 and throw
                        console.info('[PlaylistEditor] Failed to fetch playlist permissions', err);

                        return playlist;
                    });
            }));
        })
        .then(playlists => {
            let html = '';

            if ((editorOptions.enableAddToPlayQueue !== false && playbackManager.isPlaying()) || SyncPlay?.Manager.isSyncPlayEnabled()) {
                html += `<option value="queue">${globalize.translate('AddToPlayQueue')}</option>`;
            }

            html += `<option value="">${globalize.translate('OptionNew')}</option>`;

            html += playlists.map(({ item, permissions }) => {
                if (!permissions?.CanEdit) return '';

                return `<option value="${item.Id}">${escapeHtml(item.Name)}</option>`;
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

function getEditorHtml(items: string[], options: PlaylistEditorOptions) {
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

    html += `
    <div class="checkboxContainer checkboxContainer-withDescription">
        <label>
            <input type="checkbox" is="emby-checkbox" id="chkPlaylistPublic" />
            <span>${globalize.translate('PlaylistPublic')}</span>
        </label>
        <div class="fieldDescription checkboxFieldDescription">
            ${globalize.translate('PlaylistPublicDescription')}
        </div>
    </div>`;

    html += `
    <div>
        <div class="sectionTitleContainer flex align-items-center">
            <h2 className='sectionTitle'>
                Users
            </h2>
            <button id="btnAddUser" is="emby-button" class="fab submit sectionTitleButton">
                <span class="material-icons add" aria-hidden="true"></span>
            </button>
        </div>

        <div class="sharesList paperList"></div>
    </div>
    `;

    // newPlaylistInfo
    html += '</div>';

    html += '<div class="formDialogFooter">';
    html += `<button is="emby-button" type="submit" class="raised btnSubmit block formDialogFooterItem button-submit">${options.id ? globalize.translate('Save') : globalize.translate('Add')}</button>`;
    html += '</div>';

    html += '<input type="hidden" class="fldSelectedItemIds" />';

    html += '</form>';
    html += '</div>';
    html += '</div>';

    return html;
}

function getPlaylistPermissionsHtml() {
    let html = '';

    html += '<div class="selectContainer-inline">';

    html += '<select is="emby-select">';

    html += '<option value="0">Read</option>';
    html += '<option value="1">Edit</option>';

    html += '</select>';

    html += '</div>';

    return html;
}

function getUsers(page: DialogElement): PlaylistUserPermissions[] {
    return Array.prototype.map.call(page.querySelectorAll('.playlistUser'), function (elem) {
        return {
            UserId: elem.getAttribute('data-user-id'),
            CanEdit: Boolean(parseInt(elem.querySelector('select').value, 10))
        };
    }) as PlaylistUserPermissions[];
}

function getUserImage(user: UserDto) {
    const apiClient = ServerConnections.currentApiClient();

    let html = '';

    if (apiClient && user.Id) {
        let imageUrl = 'assets/img/avatar.png';
        if (user.PrimaryImageTag) {
            imageUrl = apiClient.getUserImageUrl(user.Id, {
                width: 35,
                tag: user.PrimaryImageTag,
                type: 'Primary'
            });
        }

        html += `<img src="${imageUrl}" width="35" height="35" style="border-radius: 100em">`;
    }

    return html;
}

function addUser(content: DialogElement, user: UserDto, canEdit?: boolean) {
    const sharesList = content.querySelector('.sharesList');
    if (sharesList) {
        let html = '';

        html += `<div class="listItem playlistUser" data-user-id="${user.Id}">`;

        html += '<div class="listItemBody">';

        html += `
        <div style="display: flex; align-items: center; gap: 10px;">
            ${getUserImage(user)}
            ${user.Name}
        </div>`;

        html += '</div>';

        html += `
        ${getPlaylistPermissionsHtml()}
        <button class="btnDelete listItemButton" is="paper-icon-button-light" type="button" title="Delete">
            <span class="material-icons delete" aria-hidden="true"></span>
        </button>`;

        html += '</div>';

        sharesList.insertAdjacentHTML('beforeend', html);
        const userElement = sharesList.querySelector(`[data-user-id="${user.Id}"]`);

        userElement?.querySelector('.btnDelete')?.addEventListener('click', () => {
            userElement.remove();
        });

        if (canEdit) {
            const selectElement = userElement?.querySelector('select');
            if (selectElement) {
                selectElement.value = canEdit ? '1' : '0';
            }
        }
    }
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

    const apiClient = ServerConnections.getApiClient(currentServerId);
    const api = toApi(apiClient);

    content.querySelector('form')?.addEventListener('submit', onSubmit);
    content.querySelector('#btnAddUser')?.addEventListener('click', (e) => {
        e.preventDefault();

        const shareUsers = getUsers(content).map(user => user.UserId);

        const users = getUserApi(api).getUsers().then(req => {
            return req.data.filter(user => user.Id != apiClient.getCurrentUserId() && !shareUsers.includes(user.Id));
        }).catch(err => {
            console.error('[PlaylistEditor] failed to fetch users', err);
        });

        import('../userpicker/userpicker').then(({ default: UserPicker }) => {
            const picker = new UserPicker();

            picker.show({
                users: users,
                callback: function (selectedUser: UserDto) {
                    addUser(content, selectedUser);
                    picker.close();
                }
            });
        }).catch(() => {
            console.error('[PlaylistEditor] failed to show user picker');
        });
    });

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
    } else if (options.id) {
        content.querySelector('.fldSelectPlaylist')?.classList.add('hide');
        const panel = dom.parentWithClass(content, 'dialog') as DialogElement | null;
        if (!panel) {
            console.error('[PlaylistEditor] could not find dialog element');
            return;
        }
        Promise.all([
            getUserLibraryApi(api)
                .getItem({ itemId: options.id }),
            getPlaylistsApi(api)
                .getPlaylist({ playlistId: options.id }),
            getUserApi(api)
                .getUsers()
        ])
            .then(([ { data: playlistItem }, { data: playlist }, { data: users } ]) => {
                panel.playlistId = options.id;

                const nameField = panel.querySelector<HTMLInputElement>('#txtNewPlaylistName');
                if (nameField) nameField.value = playlistItem.Name || '';

                const publicField = panel.querySelector<HTMLInputElement>('#chkPlaylistPublic');
                if (publicField) publicField.checked = !!playlist.OpenAccess;

                playlist.Shares?.forEach(shareUser => {
                    const user = users.find(u => u.Id == shareUser.UserId);

                    if (user) {
                        addUser(panel, user, shareUser.CanEdit);
                    }
                });
            })
            .catch(err => {
                console.error('[playlistEditor] failed to get playlist details', err);
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
        html += '<div class="formDialogHeader">';
        html += `<button is="paper-icon-button-light" class="btnCancel autoSize" tabindex="-1" title="${globalize.translate('ButtonBack')}"><span class="material-icons arrow_back" aria-hidden="true"></span></button>`;
        html += '<h3 class="formDialogHeaderTitle">';
        if (items.length) {
            html += globalize.translate('HeaderAddToPlaylist');
        } else if (options.id) {
            html += globalize.translate('HeaderEditPlaylist');
        } else {
            html += globalize.translate('HeaderNewPlaylist');
        }
        html += '</h3>';

        html += '</div>';

        html += getEditorHtml(items, options);

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
