import type { GroupInfoDto } from '@jellyfin/sdk/lib/generated-client/models/group-info-dto';
import { SyncPlayUserAccessType } from '@jellyfin/sdk/lib/generated-client/models/sync-play-user-access-type';
import { getSyncPlayApi } from '@jellyfin/sdk/lib/utils/api/sync-play-api';
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
import globalize from 'scripts/globalize';
import { PluginType } from 'types/plugin';
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
    }
}

const SyncPlayMenu: FC<SyncPlayMenuProps> = ({
    anchorEl,
    open,
    onMenuClose
}) => {
    const [ syncPlay, setSyncPlay ] = useState<SyncPlayInstance>();
    const { __legacyApiClient__, api, user } = useApi();
    const [ currentGroup, setCurrentGroup ] = useState<GroupInfoDto>();
    const isSyncPlayEnabled = Boolean(currentGroup);

    useEffect(() => {
        setSyncPlay(pluginManager.firstOfType(PluginType.SyncPlay)?.instance);
    }, []);

    const { data: groups } = useSyncPlayGroups();

    const onGroupAddClick = useCallback(() => {
        if (api && user) {
            getSyncPlayApi(api)
                .syncPlayCreateGroup({
                    newGroupRequestDto: {
                        GroupName: globalize.translate('SyncPlayGroupDefaultTitle', user.Name)
                    }
                })
                .catch(err => {
                    console.error('[SyncPlayMenu] failed to create a SyncPlay group', err);
                });

            onMenuClose();
        }
    }, [ api, onMenuClose, user ]);

    const onGroupLeaveClick = useCallback(() => {
        if (api) {
            getSyncPlayApi(api)
                .syncPlayLeaveGroup()
                .catch(err => {
                    console.error('[SyncPlayMenu] failed to leave SyncPlay group', err);
                });

            onMenuClose();
        }
    }, [ api, onMenuClose ]);

    const onGroupJoinClick = useCallback((GroupId: string) => {
        if (api) {
            getSyncPlayApi(api)
                .syncPlayJoinGroup({
                    joinGroupRequestDto: {
                        GroupId
                    }
                })
                .catch(err => {
                    console.error('[SyncPlayMenu] failed to join SyncPlay group', err);
                });

            onMenuClose();
        }
    }, [ api, onMenuClose ]);

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

    const updateSyncPlayGroup = useCallback((_e, enabled) => {
        if (syncPlay && enabled) {
            setCurrentGroup(syncPlay.Manager.getGroupInfo() ?? undefined);
        } else {
            setCurrentGroup(undefined);
        }
    }, [ syncPlay ]);

    useEffect(() => {
        if (!syncPlay) return;

        Events.on(syncPlay.Manager, 'enabled', updateSyncPlayGroup);

        return () => {
            Events.off(syncPlay.Manager, 'enabled', updateSyncPlayGroup);
        };
    }, [ updateSyncPlayGroup, syncPlay ]);

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
            MenuListProps={MenuListProps}
        >
            {menuItems}
        </Menu>
    );
};

export default SyncPlayMenu;
