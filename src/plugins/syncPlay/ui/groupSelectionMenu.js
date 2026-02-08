import SyncPlaySettingsEditor from './settings/SettingsEditor';
import loading from '../../../components/loading/loading';
import toast from '../../../components/toast/toast';
import actionsheet from '../../../components/actionSheet/actionSheet';
import dialogHelper from '../../../components/dialogHelper/dialogHelper';
import globalize from '../../../lib/globalize';
import playbackPermissionManager from './playbackPermissionManager';
import { pluginManager } from '../../../components/pluginManager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { PluginType } from '../../../types/plugin.ts';
import Events from '../../../utils/events.ts';
import { getSyncPlayV2Json, postSyncPlayV2 } from '../core/V2Api';

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
        const userName = user?.localUser?.Name || user?.Name || '';
        const resolveResponse = (response) => (response && typeof response.json === 'function' ? response.json() : response);
        const getSyncPlayManager = () => this.SyncPlay?.Manager || pluginManager.firstOfType(PluginType.SyncPlay)?.instance?.Manager;
        const fetchGroups = () => {
            return getSyncPlayV2Json(apiClient, 'List', { _: Date.now() }).catch((error) => {
                console.error('SyncPlay: error fetching groups list:', error);
                return [];
            });
        };
        const fetchGroupById = (groupId) => {
            if (!groupId) {
                return Promise.resolve(null);
            }

            return getSyncPlayV2Json(apiClient, groupId, { _: Date.now() }).then((state) => {
                if (state?.Snapshot?.GroupInfo) {
                    return state.Snapshot.GroupInfo;
                }

                return null;
            }).catch((error) => {
                console.error('SyncPlay: error fetching v2 group details:', error);
                return null;
            });
        };
        const buildMenuItems = (groups) => {
            const menuItems = (Array.isArray(groups) ? groups : []).map((group) => {
                return {
                    name: group.GroupName,
                    icon: 'person',
                    id: group.GroupId,
                    selected: false,
                    secondaryText: group.Participants.join(', ')
                };
            });

            if (policy.SyncPlayAccess === 'CreateAndJoinGroups') {
                menuItems.push({
                    name: globalize.translate('LabelSyncPlayNewGroup'),
                    icon: 'add',
                    id: 'new-group',
                    selected: true,
                    secondaryText: globalize.translate('LabelSyncPlayNewGroupDescription')
                });
            }

            return menuItems;
        };
        const createMenuItemsKey = (groups) => {
            if (!Array.isArray(groups)) {
                return '';
            }

            return groups
                .map((group) => {
                    const participants = Array.isArray(group.Participants) ? group.Participants.join('|') : '';
                    return `${group.GroupId}|${group.GroupName}|${participants}`;
                })
                .sort((a, b) => a.localeCompare(b))
                .join('||');
        };
        const findOpenDialog = () => {
            const dialogs = document.querySelectorAll('.actionSheet.syncPlayGroupMenu');
            return dialogs.length ? dialogs[dialogs.length - 1] : null;
        };
        const isDialogOpen = (dialog) => dialog && document.body.contains(dialog);
        const attachGroupPollingWhenReady = (initialGroupsKey) => {
            let attempts = 0;
            let attached = false;
            let observer = null;

            const attachOnce = (dialog) => {
                if (attached || !dialog) {
                    return;
                }
                attached = true;
                if (observer) {
                    observer.disconnect();
                    observer = null;
                }
                attachGroupPolling(dialog, initialGroupsKey);
            };

            const tryAttach = () => {
                const dialog = findOpenDialog();
                if (dialog) {
                    attachOnce(dialog);
                    return;
                }

                attempts += 1;
                if (attempts < 20) {
                    setTimeout(tryAttach, 100);
                }
            };

            if (window.MutationObserver) {
                observer = new MutationObserver(() => {
                    const dialog = findOpenDialog();
                    if (dialog) {
                        attachOnce(dialog);
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });

                setTimeout(() => {
                    if (observer) {
                        observer.disconnect();
                        observer = null;
                    }
                }, 5000);
            }

            tryAttach();
        };
        const attachGroupPolling = (dialog, initialGroupsKey) => {
            if (!dialog) {
                return;
            }

            let lastKey = initialGroupsKey;
            const interval = setInterval(() => {
                if (!isDialogOpen(dialog)) {
                    clearInterval(interval);
                    return;
                }

                fetchGroups().then((groups) => {
                    const nextKey = createMenuItemsKey(groups);
                    if (nextKey === lastKey) {
                        return;
                    }

                    lastKey = nextKey;
                    clearInterval(interval);
                    dialogHelper.close(dialog);
                    this.showNewJoinGroupSelection(button, user, apiClient);
                });
            }, 2500);

            dialog.addEventListener('close', () => {
                clearInterval(interval);
            }, { once: true });
        };
        const enableGroup = (syncPlayManager, groupInfo) => {
            if (!syncPlayManager || !groupInfo) {
                return;
            }

            groupInfo.LastUpdatedAt = new Date(groupInfo.LastUpdatedAt);
            syncPlayManager.enableSyncPlay(apiClient, groupInfo, true);
            if (syncPlayManager.refreshJoinedGroupStateV2) {
                syncPlayManager.refreshJoinedGroupStateV2(apiClient, { allowEnable: true });
            }
        };
        const selectGroup = (groups, { groupId, groupName }) => {
            if (!Array.isArray(groups) || groups.length === 0) {
                return null;
            }

            if (groupId) {
                return groups.find((group) => group.GroupId === groupId) || null;
            }

            const normalizedName = groupName ? groupName.toLowerCase() : null;
            const candidateGroups = groups.filter((group) => {
                if (!group || !Array.isArray(group.Participants)) {
                    return false;
                }

                const hasUser = userName && group.Participants.includes(userName);
                const nameMatches = !normalizedName
                    || group.GroupName === groupName
                    || group.GroupName?.toLowerCase() === normalizedName;

                return hasUser && nameMatches;
            });

            const pickMostRecent = (list) => list
                .slice()
                .sort((a, b) => new Date(b.LastUpdatedAt).getTime() - new Date(a.LastUpdatedAt).getTime())[0];

            if (candidateGroups.length > 0) {
                return pickMostRecent(candidateGroups);
            }

            const fallbackGroups = groups.filter((group) => Array.isArray(group.Participants) && group.Participants.includes(userName));
            return fallbackGroups.length > 0 ? pickMostRecent(fallbackGroups) : null;
        };

        fetchGroups().then((groups) => {
            const menuItems = buildMenuItems(groups);

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
                const syncPlayManager = getSyncPlayManager();

                if (id == 'new-group') {
                    const groupName = globalize.translate('SyncPlayGroupDefaultTitle', userName);
                    postSyncPlayV2(apiClient, 'New', {
                        GroupName: groupName
                    }).then(resolveResponse)
                        .then((groupInfo) => {
                            if (groupInfo?.GroupId) {
                                enableGroup(syncPlayManager, groupInfo);
                                return null;
                            }

                            return fetchGroups()
                                .then((updatedGroups) => {
                                    const selected = selectGroup(updatedGroups, { groupName });
                                    if (!selected) {
                                        console.warn('SyncPlay: created group not found in list.');
                                        return;
                                    }

                                    enableGroup(syncPlayManager, selected);
                                });
                        })
                        .catch((error) => {
                            if (error) {
                                console.error('SyncPlay: error creating group:', error);
                            }
                        });
                } else if (id) {
                    postSyncPlayV2(apiClient, 'Join', {
                        GroupId: id
                    }).then(() => fetchGroupById(id))
                        .then((groupInfo) => {
                            if (groupInfo?.GroupId) {
                                enableGroup(syncPlayManager, groupInfo);
                                return null;
                            }

                            return fetchGroups().then((updatedGroups) => {
                                const selected = selectGroup(updatedGroups, { groupId: id });
                                if (!selected) {
                                    console.warn('SyncPlay: joined group not found in list.');
                                    return;
                                }

                                enableGroup(syncPlayManager, selected);
                            });
                        })
                        .catch((error) => {
                            if (error) {
                                console.error('SyncPlay: error joining group:', error);
                            }
                        });
                }
            }).catch((error) => {
                if (error) {
                    console.error('SyncPlay: unexpected error listing groups:', error);
                }
            });

            const initialKey = createMenuItemsKey(groups);
            attachGroupPollingWhenReady(initialKey);

            loading.hide();
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
        const syncPlayManager = this.SyncPlay?.Manager;
        const groupInfo = syncPlayManager?.getGroupInfo();
        const menuItems = [];
        if (!groupInfo) {
            this.showNewJoinGroupSelection(button, user, apiClient);
            return;
        }

        const isFollowingGroupPlayback = syncPlayManager?.isFollowingGroupPlayback?.();
        const isPlaybackActive = syncPlayManager?.isPlaybackActive?.();

        if (!isFollowingGroupPlayback || !isPlaybackActive) {
            menuItems.push({
                name: globalize.translate('LabelSyncPlayResumePlayback'),
                icon: 'play_circle_filled',
                id: 'resume-playback',
                selected: false,
                secondaryText: globalize.translate('LabelSyncPlayResumePlaybackDescription')
            });
        }

        if (isFollowingGroupPlayback && isPlaybackActive) {
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
                postSyncPlayV2(apiClient, 'Leave');
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
        const getSyncPlayManager = () => this.SyncPlay?.Manager || pluginManager.firstOfType(PluginType.SyncPlay)?.instance?.Manager;
        const fetchGroups = () => {
            return getSyncPlayV2Json(apiClient, 'List', { _: Date.now() });
        };
        const selectGroupForUser = (groups, userName) => {
            if (!Array.isArray(groups) || !userName) {
                return null;
            }

            const matches = groups.filter((group) => Array.isArray(group.Participants) && group.Participants.includes(userName));
            if (matches.length === 0) {
                return null;
            }

            return matches
                .slice()
                .sort((a, b) => new Date(b.LastUpdatedAt).getTime() - new Date(a.LastUpdatedAt).getTime())[0];
        };
        const selectGroupById = (groups, groupId) => {
            if (!Array.isArray(groups) || !groupId) {
                return null;
            }

            return groups.find((group) => group?.GroupId === groupId) || null;
        };

        ServerConnections.user(apiClient).then((user) => {
            const syncPlayManager = getSyncPlayManager();
            const userName = user?.localUser?.Name || user?.Name || '';
            const localGroupInfo = syncPlayManager?.getGroupInfo?.();

            if (syncPlayManager?.isSyncPlayEnabled?.() && localGroupInfo) {
                if (syncPlayManager?.refreshJoinedGroupStateV2) {
                    syncPlayManager.refreshJoinedGroupStateV2(apiClient, { allowEnable: true }).catch((error) => {
                        console.debug('SyncPlay: background v2 rehydrate during menu open failed:', error);
                        return false;
                    });
                }

                this.showLeaveGroupSelection(button, user, apiClient);
                return;
            }

            let rehydratePromise = Promise.resolve(false);
            if (syncPlayManager?.refreshJoinedGroupStateV2) {
                rehydratePromise = syncPlayManager.refreshJoinedGroupStateV2(apiClient, { allowEnable: true });
            }

            rehydratePromise.catch((error) => {
                console.debug('SyncPlay: v2 rehydrate during menu open failed:', error);
                return false;
            }).then(() => {
                const rehydratedGroupInfo = syncPlayManager?.getGroupInfo?.();
                if (syncPlayManager?.isSyncPlayEnabled?.() && rehydratedGroupInfo) {
                    this.showLeaveGroupSelection(button, user, apiClient);
                    return;
                }

                fetchGroups().then((groups) => {
                    const fallbackGroupInfo = syncPlayManager?.getGroupInfo?.();
                    const groupInfo = selectGroupForUser(groups, userName) || selectGroupById(groups, fallbackGroupInfo?.GroupId);
                    if (groupInfo && syncPlayManager) {
                        groupInfo.LastUpdatedAt = new Date(groupInfo.LastUpdatedAt);
                        syncPlayManager.enableSyncPlay(apiClient, groupInfo, false);
                        this.showLeaveGroupSelection(button, user, apiClient);
                        return;
                    }

                    if (syncPlayManager?.isSyncPlayEnabled?.() && fallbackGroupInfo) {
                        this.showLeaveGroupSelection(button, user, apiClient);
                        return;
                    }

                    this.showNewJoinGroupSelection(button, user, apiClient);
                }).catch((error) => {
                    console.error('SyncPlay: failed to fetch groups during menu open:', error);
                    const enabledNow = syncPlayManager?.isSyncPlayEnabled?.() ?? this.syncPlayEnabled;
                    if (enabledNow && syncPlayManager?.getGroupInfo?.()) {
                        this.showLeaveGroupSelection(button, user, apiClient);
                    } else {
                        this.showNewJoinGroupSelection(button, user, apiClient);
                    }
                });
            });
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
