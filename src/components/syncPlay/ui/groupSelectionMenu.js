import { Events } from 'jellyfin-apiclient';
import SyncPlay from '../core';
import SyncPlaySettingsEditor from './settings/SettingsEditor';
import loading from '../../loading/loading';
import toast from '../../toast/toast';
import actionsheet from '../../actionSheet/actionSheet';
import globalize from '../../../scripts/globalize';
import playbackPermissionManager from './playbackPermissionManager';
import ServerConnections from '../../ServerConnections';

/**
 * Class that manages the SyncPlay group selection menu.
 */
class GroupSelectionMenu {
    constructor() {
        // Register to SyncPlay events.
        this.syncPlayEnabled = false;
        Events.on(SyncPlay.Manager, 'enabled', (e, enabled) => {
            this.syncPlayEnabled = enabled;
        });
    }

    /**
     * Used when user needs to join a group.
     * @param {HTMLElement} button - Element where to place the menu.
     * @param {Object} user - Current user.
     * @param {Object} apiClient - ApiClient.
     */
    showNewJoinGroupSelection(button, user, apiClient) {
        const policy = user.localUser ? user.localUser.Policy : {};

        apiClient.getSyncPlayGroups().then(function (response) {
            response.json().then(function (groups) {
                const menuItems = groups.map(function (group) {
                    let icon = '';
                    if (group.Visibility === 'Private') {
                        icon = 'person';
                    } else if (group.Visibility === 'InviteOnly') {
                        icon = 'cake';
                    } else {
                        icon = 'public';
                    }

                    return {
                        name: group.GroupName,
                        icon: icon,
                        id: group.GroupId,
                        selected: false,
                        secondaryText: group.UserNames.join(', ')
                    };
                });

                if (policy.SyncPlayAccess === 'CreateAndJoinGroups') {
                    menuItems.unshift({
                        name: globalize.translate('LabelSyncPlayQuickGroup'),
                        icon: 'person_add_alt_1',
                        id: 'quick-private-group',
                        selected: true,
                        secondaryText: globalize.translate('LabelSyncPlayQuickGroupDescription')
                    });

                    menuItems.push({
                        name: globalize.translate('LabelSyncPlayNewGroup'),
                        icon: 'add',
                        id: 'new-group',
                        selected: true,
                        secondaryText: globalize.translate('LabelSyncPlayNewGroupDescription')
                    });
                }

                if (menuItems.length === 0 && policy.SyncPlayAccess === 'JoinGroups') {
                    toast({
                        text: globalize.translate('MessageSyncPlayCreateGroupDenied')
                    });
                    loading.hide();
                    return;
                }

                const menuOptions = {
                    title: globalize.translate('HeaderSyncPlaySelectGroup'),
                    items: menuItems,
                    positionTo: button,
                    resolveOnClick: true,
                    border: true
                };

                actionsheet.show(menuOptions).then(function (id) {
                    if (id == 'quick-private-group') {
                        apiClient.createSyncPlayGroup({
                            GroupName: globalize.translate('SyncPlayGroupDefaultTitle', user.localUser.Name),
                            Visibility: 'Private'
                        });
                    } else if (id == 'new-group') {
                        new SyncPlaySettingsEditor(apiClient, SyncPlay.Manager.getTimeSyncCore(), {
                            groupName: globalize.translate('SyncPlayGroupDefaultTitle', user.localUser.Name)
                        });
                    } else if (id) {
                        apiClient.joinSyncPlayGroup({
                            GroupId: id
                        });
                    }
                }).catch((error) => {
                    console.error('SyncPlay: unexpected error listing groups:', error);
                });

                loading.hide();
            });
        }).catch(function (error) {
            console.error(error);
            loading.hide();
            toast({
                text: globalize.translate('MessageSyncPlayErrorAccessingGroups')
            });
        });
    }

    /**
     * Used when user has joined a group.
     * @param {HTMLElement} button - Element where to place the menu.
     * @param {Object} user - Current user.
     * @param {Object} apiClient - ApiClient.
     */
    showLeaveGroupSelection(button, user, apiClient) {
        const groupInfo = SyncPlay.Manager.getGroupInfo();
        const menuItems = [];

        if (!SyncPlay.Manager.isPlaylistEmpty() && !SyncPlay.Manager.isPlaybackActive()) {
            menuItems.push({
                name: globalize.translate('LabelSyncPlayResumePlayback'),
                icon: 'play_circle_filled',
                id: 'resume-playback',
                selected: false,
                secondaryText: globalize.translate('LabelSyncPlayResumePlaybackDescription')
            });
        } else if (SyncPlay.Manager.isPlaybackActive()) {
            menuItems.push({
                name: globalize.translate('LabelSyncPlayHaltPlayback'),
                icon: 'pause_circle_filled',
                id: 'halt-playback',
                selected: false,
                secondaryText: globalize.translate('LabelSyncPlayHaltPlaybackDescription')
            });
        }

        menuItems.push({
            name: globalize.translate('Settings'),
            icon: 'video_settings',
            id: 'settings',
            selected: false,
            secondaryText: globalize.translate('LabelSyncPlaySettingsDescription')
        });

        menuItems.push({
            name: globalize.translate('LabelSyncPlayLeaveGroup'),
            icon: 'meeting_room',
            id: 'leave-group',
            selected: true,
            secondaryText: globalize.translate('LabelSyncPlayLeaveGroupDescription')
        });

        const menuOptions = {
            title: groupInfo.GroupName,
            items: menuItems,
            positionTo: button,
            resolveOnClick: true,
            border: true
        };

        actionsheet.show(menuOptions).then(function (id) {
            if (id == 'resume-playback') {
                SyncPlay.Manager.resumeGroupPlayback(apiClient);
            } else if (id == 'halt-playback') {
                SyncPlay.Manager.haltGroupPlayback(apiClient);
            } else if (id == 'leave-group') {
                apiClient.leaveSyncPlayGroup();
            } else if (id == 'settings') {
                new SyncPlaySettingsEditor(apiClient, SyncPlay.Manager.getTimeSyncCore(), {
                    groupInfo: groupInfo,
                    canEditGroup: SyncPlay.Manager.isAdministrator()
                });
            }
        }).catch((error) => {
            console.error('SyncPlay: unexpected error showing group menu:', error);
        });

        loading.hide();
    }

    /**
     * Shows a menu to handle SyncPlay groups.
     * @param {HTMLElement} button - Element where to place the menu.
     */
    show(button) {
        loading.show();

        // TODO: should feature be disabled if playback permission is missing?
        playbackPermissionManager.check().then(() => {
            console.debug('Playback is allowed.');
        }).catch((error) => {
            console.error('Playback not allowed!', error);
            toast({
                text: globalize.translate('MessageSyncPlayPlaybackPermissionRequired')
            });
        });

        const apiClient = ServerConnections.currentApiClient();
        ServerConnections.user(apiClient).then((user) => {
            if (this.syncPlayEnabled) {
                this.showLeaveGroupSelection(button, user, apiClient);
            } else {
                this.showNewJoinGroupSelection(button, user, apiClient);
            }
        }).catch((error) => {
            console.error(error);
            loading.hide();
            toast({
                text: globalize.translate('MessageSyncPlayNoGroupsAvailable')
            });
        });
    }
}

/** GroupSelectionMenu singleton. */
const groupSelectionMenu = new GroupSelectionMenu();
export default groupSelectionMenu;
