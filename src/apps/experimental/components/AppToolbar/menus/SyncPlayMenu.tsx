/**
 * SyncPlay menu used by the experimental toolbar.
 *
 * This component is a thin UI orchestration layer:
 * - Reads current local SyncPlay manager state.
 * - Triggers V2 membership actions (create/join/leave).
 * - Opens SyncPlay settings and playback follow/stop actions.
 */
import type { GroupInfoDto } from '@jellyfin/sdk/lib/generated-client/models/group-info-dto';
import { SyncPlayUserAccessType } from '@jellyfin/sdk/lib/generated-client/models/sync-play-user-access-type';
import GroupAdd from '@mui/icons-material/GroupAdd';
import PersonAdd from '@mui/icons-material/PersonAdd';
import PersonOff from '@mui/icons-material/PersonOff';
import PersonRemove from '@mui/icons-material/PersonRemove';
import PlayCircle from '@mui/icons-material/PlayCircle';
import StopCircle from '@mui/icons-material/StopCircle';
import Tune from '@mui/icons-material/Tune';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type { ApiClient } from 'jellyfin-apiclient';
import React, { FC, useCallback, useEffect, useState } from 'react';

import { pluginManager } from 'components/pluginManager';
import { useApi } from 'hooks/useApi';
import { useSyncPlayGroups } from 'hooks/useSyncPlayGroups';
import globalize from 'lib/globalize';
import { PluginType } from 'types/plugin';
import { queryClient } from 'utils/query/queryClient';
import Events from 'utils/events';

export const ID = 'app-sync-play-menu';

interface SyncPlayMenuProps extends MenuProps {
    onMenuClose: () => void
}

interface SyncPlayInstance {
    Manager: {
        getGroupInfo: () => GroupInfoDto | null | undefined
        getTimeSyncCore: () => object
        isPlaybackActive: () => boolean
        isPlaylistEmpty: () => boolean
        haltGroupPlayback: (apiClient: ApiClient) => void
        resumeGroupPlayback: (apiClient: ApiClient) => void
        enableSyncPlay: (apiClient: ApiClient, groupInfo: GroupInfoDto, showMessage: boolean) => void
    }
}

/* eslint-disable sonarjs/cognitive-complexity */
const SyncPlayMenu: FC<SyncPlayMenuProps> = ({
    anchorEl,
    open,
    onMenuClose
}) => {
    const [ syncPlay, setSyncPlay ] = useState<SyncPlayInstance>();
    const { __legacyApiClient__, user } = useApi();
    const [ currentGroup, setCurrentGroup ] = useState<GroupInfoDto>();
    const isSyncPlayEnabled = Boolean(currentGroup);

    useEffect(() => {
        // Resolve SyncPlay plugin instance once and keep using its manager as source of truth.
        setSyncPlay(pluginManager.firstOfType(PluginType.SyncPlay)?.instance);
    }, []);

    const updateSyncPlayGroup = useCallback(() => {
        const group = syncPlay?.Manager.getGroupInfo() ?? undefined;
        setCurrentGroup(group);
    }, [ syncPlay ]);

    const enableSyncPlayGroup = useCallback((groupInfo?: GroupInfoDto) => {
        if (!groupInfo?.GroupId || !syncPlay || !__legacyApiClient__) {
            return false;
        }

        // Normalize timestamps because manager logic expects Date instances.
        const normalizedGroupInfo = { ...groupInfo } as Record<string, unknown>;
        normalizedGroupInfo.LastUpdatedAt = groupInfo.LastUpdatedAt ?
            new Date(groupInfo.LastUpdatedAt) :
            new Date();
        syncPlay.Manager.enableSyncPlay(__legacyApiClient__, normalizedGroupInfo as GroupInfoDto, false);
        setCurrentGroup(normalizedGroupInfo as GroupInfoDto);
        return true;
    }, [ __legacyApiClient__, syncPlay ]);

    const postSyncPlayV2 = useCallback((path: string, payload?: unknown) => {
        if (!__legacyApiClient__) {
            throw new Error('ApiClient is not available');
        }

        const request = {
            type: 'POST',
            url: __legacyApiClient__.getUrl(`SyncPlay/V2/${path}`),
            data: payload === undefined ? undefined : JSON.stringify(payload),
            contentType: payload === undefined ? undefined : 'application/json'
        };

        // Menu endpoints are membership/control events and do not require response payload decoding by default.
        return __legacyApiClient__.ajax(request);
    }, [ __legacyApiClient__ ]);

    const fetchAndEnableSyncPlayGroup = useCallback(async (groupId?: string) => {
        if (!groupId || !__legacyApiClient__) {
            return false;
        }

        try {
            const url = __legacyApiClient__.getUrl(`SyncPlay/V2/${groupId}`, { _: Date.now() });
            // Pull authoritative snapshot for this group before enabling local state.
            const state = await __legacyApiClient__.getJSON(url) as { Snapshot?: { GroupInfo?: GroupInfoDto } };
            return enableSyncPlayGroup(state?.Snapshot?.GroupInfo);
        } catch (err) {
            console.error('[SyncPlayMenu] failed to fetch SyncPlay group details', err);
            return false;
        }
    }, [ __legacyApiClient__, enableSyncPlayGroup ]);

    const { data: groups } = useSyncPlayGroups({
        // Poll available groups while menu is open and user is not currently joined.
        enabled: open && !isSyncPlayEnabled,
        refetchInterval: open && !isSyncPlayEnabled ? 2000 : false
    });

    const onGroupAddClick = useCallback(async () => {
        if (__legacyApiClient__ && user) {
            try {
                const response = await postSyncPlayV2('New', {
                    GroupName: globalize.translate('SyncPlayGroupDefaultTitle', user.Name)
                });
                const groupInfo = response && typeof response.json === 'function' ?
                    await response.json() as GroupInfoDto :
                    undefined;
                if (groupInfo?.GroupId) {
                    enableSyncPlayGroup(groupInfo);
                }
            } catch (err) {
                console.error('[SyncPlayMenu] failed to create a SyncPlay group', err);
            } finally {
                void queryClient.invalidateQueries({
                    queryKey: [ 'SyncPlay', 'Groups' ]
                });
            }

            onMenuClose();
        }
    }, [ __legacyApiClient__, enableSyncPlayGroup, onMenuClose, postSyncPlayV2, user ]);

    const onGroupLeaveClick = useCallback(() => {
        if (__legacyApiClient__) {
            postSyncPlayV2('Leave')
                .catch(err => {
                    console.error('[SyncPlayMenu] failed to leave SyncPlay group', err);
                });

            onMenuClose();
        }
    }, [ __legacyApiClient__, onMenuClose, postSyncPlayV2 ]);

    const onGroupJoinClick = useCallback(async (GroupId: string) => {
        if (__legacyApiClient__) {
            try {
                await postSyncPlayV2('Join', {
                    GroupId
                });
                await fetchAndEnableSyncPlayGroup(GroupId);
            } catch (err) {
                console.error('[SyncPlayMenu] failed to join SyncPlay group', err);
            } finally {
                void queryClient.invalidateQueries({
                    queryKey: [ 'SyncPlay', 'Groups' ]
                });
            }

            onMenuClose();
        }
    }, [ __legacyApiClient__, fetchAndEnableSyncPlayGroup, onMenuClose, postSyncPlayV2 ]);

    const onGroupSettingsClick = useCallback(async () => {
        if (!syncPlay) return;

        // TODO: Rewrite settings UI
        const SyncPlaySettingsEditor = (await import('../../../../../plugins/syncPlay/ui/settings/SettingsEditor')).default;
        new SyncPlaySettingsEditor(
            __legacyApiClient__,
            syncPlay.Manager.getTimeSyncCore(),
            {
                groupInfo: currentGroup
            })
            .embed()
            .catch(err => {
                if (err) {
                    console.error('[SyncPlayMenu] Error creating SyncPlay settings editor', err);
                }
            });

        onMenuClose();
    }, [ __legacyApiClient__, currentGroup, onMenuClose, syncPlay ]);

    const onStartGroupPlaybackClick = useCallback(() => {
        if (__legacyApiClient__) {
            syncPlay?.Manager.resumeGroupPlayback(__legacyApiClient__);
            onMenuClose();
        }
    }, [ __legacyApiClient__, onMenuClose, syncPlay ]);

    const onStopGroupPlaybackClick = useCallback(() => {
        if (__legacyApiClient__) {
            syncPlay?.Manager.haltGroupPlayback(__legacyApiClient__);
            onMenuClose();
        }
    }, [ __legacyApiClient__, onMenuClose, syncPlay ]);

    useEffect(() => {
        if (!syncPlay) return;

        // Keep UI state in sync with manager lifecycle and player transitions.
        updateSyncPlayGroup();
        Events.on(syncPlay.Manager, 'enabled', updateSyncPlayGroup);
        Events.on(syncPlay.Manager, 'group-state-update', updateSyncPlayGroup);
        Events.on(syncPlay.Manager, 'playerchange', updateSyncPlayGroup);

        return () => {
            Events.off(syncPlay.Manager, 'enabled', updateSyncPlayGroup);
            Events.off(syncPlay.Manager, 'group-state-update', updateSyncPlayGroup);
            Events.off(syncPlay.Manager, 'playerchange', updateSyncPlayGroup);
        };
    }, [ updateSyncPlayGroup, syncPlay ]);

    useEffect(() => {
        if (open) {
            updateSyncPlayGroup();
        }
    }, [ open, updateSyncPlayGroup ]);

    const menuItems = [];
    if (isSyncPlayEnabled) {
        if (!syncPlay?.Manager.isPlaylistEmpty() && !syncPlay?.Manager.isPlaybackActive()) {
            menuItems.push(
                <MenuItem
                    key='sync-play-start-playback'
                    onClick={onStartGroupPlaybackClick}
                >
                    <ListItemIcon>
                        <PlayCircle />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('LabelSyncPlayResumePlayback')} />
                </MenuItem>
            );
        } else if (syncPlay?.Manager.isPlaybackActive()) {
            menuItems.push(
                <MenuItem
                    key='sync-play-stop-playback'
                    onClick={onStopGroupPlaybackClick}
                >
                    <ListItemIcon>
                        <StopCircle />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('LabelSyncPlayHaltPlayback')} />
                </MenuItem>
            );
        }

        menuItems.push(
            <MenuItem
                key='sync-play-settings'
                onClick={onGroupSettingsClick}
            >
                <ListItemIcon>
                    <Tune />
                </ListItemIcon>
                <ListItemText
                    primary={globalize.translate('Settings')}
                />
            </MenuItem>
        );

        menuItems.push(
            <Divider key='sync-play-controls-divider' />
        );

        menuItems.push(
            <MenuItem
                key='sync-play-exit'
                onClick={onGroupLeaveClick}
            >
                <ListItemIcon>
                    <PersonRemove />
                </ListItemIcon>
                <ListItemText
                    primary={globalize.translate('LabelSyncPlayLeaveGroup')}
                />
            </MenuItem>
        );
    } else if (!groups?.length && user?.Policy?.SyncPlayAccess !== SyncPlayUserAccessType.CreateAndJoinGroups) {
        menuItems.push(
            <MenuItem key='sync-play-unavailable' disabled>
                <ListItemIcon>
                    <PersonOff />
                </ListItemIcon>
                <ListItemText primary={globalize.translate('LabelSyncPlayNoGroups')} />
            </MenuItem>
        );
    } else {
        if (groups && groups.length > 0) {
            groups.forEach(group => {
                menuItems.push(
                    <MenuItem
                        key={group.GroupId}
                        // Since we are looping over groups there is no good way to avoid creating a new function here
                        // eslint-disable-next-line react/jsx-no-bind
                        onClick={() => group.GroupId && onGroupJoinClick(group.GroupId)}
                    >
                        <ListItemIcon>
                            <PersonAdd />
                        </ListItemIcon>
                        <ListItemText
                            primary={group.GroupName}
                            secondary={group.Participants?.join(', ')}
                        />
                    </MenuItem>
                );
            });

            menuItems.push(
                <Divider key='sync-play-groups-divider' />
            );
        }

        if (user?.Policy?.SyncPlayAccess === SyncPlayUserAccessType.CreateAndJoinGroups) {
            menuItems.push(
                <MenuItem
                    key='sync-play-new-group'
                    onClick={onGroupAddClick}
                >
                    <ListItemIcon>
                        <GroupAdd />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('LabelSyncPlayNewGroupDescription')} />
                </MenuItem>
            );
        }
    }

    const MenuListProps = isSyncPlayEnabled ? {
        'aria-labelledby': 'sync-play-active-subheader',
        subheader: (
            <ListSubheader component='div' id='sync-play-active-subheader'>
                {currentGroup?.GroupName}
            </ListSubheader>
        )
    } : undefined;

    return (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
            }}
            id={ID}
            keepMounted
            open={open}
            onClose={onMenuClose}
            slotProps={{
                list: MenuListProps
            }}
        >
            {menuItems}
        </Menu>
    );
};
/* eslint-enable sonarjs/cognitive-complexity */

export default SyncPlayMenu;
