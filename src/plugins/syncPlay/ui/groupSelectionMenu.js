import SyncPlaySettingsEditor from './settings/SettingsEditor';
import loading from '../../../components/loading/loading';
import toast from '../../../components/toast/toast';
import actionsheet from '../../../components/actionSheet/actionSheet';
import globalize from '../../../lib/globalize';
import playbackPermissionManager from './playbackPermissionManager';
import { pluginManager } from '../../../components/pluginManager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { PluginType } from '../../../types/plugin.ts';
import Events from '../../../utils/events.ts';

import './groupSelectionMenu.scss';

/**
 * Class that manages the SyncPlay group selection menu.
 */
class GroupSelectionMenu {
    constructor() {
        // Register to SyncPlay events.
        this.syncPlayEnabled = false;
        this.SyncPlay = pluginManager.firstOfType(PluginType.SyncPlay)?.instance;

        if (this.SyncPlay) {
            Events.on(this.SyncPlay.Manager, 'enabled', (_event, enabled) => {
                this.syncPlayEnabled = enabled;
            });
        }

        Events.on(pluginManager, 'registered', (_event0, plugin) => {
            if (plugin.type === PluginType.SyncPlay) {
                this.SyncPlay = plugin.instance;

                Events.on(plugin.instance.Manager, 'enabled', (_event1, enabled) => {
                    this.syncPlayEnabled = enabled;
                });
            }
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

        apiClient.getSyncPlayGroups().then((response) => {
            response.json().then((groups) => {
                const menuItems = groups.map((group) => ({
                    name: group.GroupName,
                    icon: 'person',
                    id: group.GroupId,
                    selected: false,
                    secondaryText: group.Participants.join(', ')
                }));

                if (policy.SyncPlayAccess === 'CreateAndJoinGroups') {
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
                    border: true,
                    dialogClass: 'syncPlayGroupMenu'
                };

                actionsheet.show(menuOptions).then((id) => {
                    if (id == 'new-group') {
                        apiClient.createSyncPlayGroup({
                            GroupName: globalize.translate('SyncPlayGroupDefaultTitle', user.localUser.Name)
                        });
                    } else if (id) {
                        apiClient.joinSyncPlayGroup({
                            GroupId: id
                        });
                    }
                }).catch((error) => {
                    if (error) {
                        console.error('SyncPlay: unexpected error listing groups:', error);
                    }
                });

                loading.hide();
            });
        }).catch((error) => {
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
        const groupInfo = this.SyncPlay?.Manager.getGroupInfo();
        const menuItems = [];

        if (!this.SyncPlay?.Manager.isPlaylistEmpty()
            && !this.SyncPlay?.Manager.isPlaybackActive()) {
            menuItems.push({
                name: globalize.translate('LabelSyncPlayResumePlayback'),
                icon: 'play_circle_filled',
                id: 'resume-playback',
                selected: false,
                secondaryText: globalize.translate('LabelSyncPlayResumePlaybackDescription')
            });
        } else if (this.SyncPlay?.Manager.isPlaybackActive()) {
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
            text: groupInfo.Participants.join(', '),
            dialogClass: 'syncPlayGroupMenu',
            items: menuItems,
            positionTo: button,
            border: true
        };

        actionsheet.show(menuOptions).then((id) => {
            if (id == 'resume-playback') {
                this.SyncPlay?.Manager.resumeGroupPlayback(apiClient);
            } else if (id == 'halt-playback') {
                this.SyncPlay?.Manager.haltGroupPlayback(apiClient);
            } else if (id == 'leave-group') {
                apiClient.leaveSyncPlayGroup();
            } else if (id == 'settings') {
                new SyncPlaySettingsEditor(apiClient, this.SyncPlay?.Manager.getTimeSyncCore(), { groupInfo: groupInfo })
                    .embed()
                    .catch(error => {
                        if (error) {
                            console.error('Error creating SyncPlay settings editor', error);
                        }
                    });
            }
        }).catch((error) => {
            if (error) {
                console.error('SyncPlay: unexpected error showing group menu:', error);
            }
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
