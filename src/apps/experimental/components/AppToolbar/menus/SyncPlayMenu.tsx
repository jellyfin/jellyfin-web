import type { GroupInfoDto } from '@jellyfin/sdk/lib/generated-client/models/group-info-dto';
import { SyncPlayUserAccessType } from '@jellyfin/sdk/lib/generated-client/models/sync-play-user-access-type';
import { getSyncPlayApi } from '@jellyfin/sdk/lib/utils/api/sync-play-api';
import Close from '@mui/icons-material/Close';
import GroupAdd from '@mui/icons-material/GroupAdd';
import PersonAdd from '@mui/icons-material/PersonAdd';
import PersonOff from '@mui/icons-material/PersonOff';
import Settings from '@mui/icons-material/Settings';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import React, { FC, useCallback, useEffect, useState } from 'react';

import { pluginManager } from 'components/pluginManager';
import { useApi } from 'hooks/useApi';
import globalize from 'scripts/globalize';
import { PluginType } from 'types/plugin';
import Events from 'utils/events';

export const ID = 'app-sync-play-menu';

interface SyncPlayMenuProps extends MenuProps {
    onMenuClose: () => void
}

interface SyncPlayInstance {
    Manager: {
        getGroupInfo: () => any
        getTimeSyncCore: () => any
    }
}

const SyncPlayMenu: FC<SyncPlayMenuProps> = ({
    anchorEl,
    open,
    onMenuClose
}) => {
    const SyncPlay: SyncPlayInstance | undefined = pluginManager.firstOfType(PluginType.SyncPlay)?.instance;
    const { __legacyApiClient__, api, user } = useApi();
    const [ groups, setGroups ] = useState<GroupInfoDto[]>([]);
    const [ currentGroup, setCurrentGroup ] = useState<GroupInfoDto>();
    const isSyncPlayEnabled = Boolean(currentGroup);

    useEffect(() => {
        const fetchGroups = async () => {
            if (api) {
                setGroups((await getSyncPlayApi(api).syncPlayGetGroups()).data);
            }
        };

        fetchGroups()
            .catch(err => {
                console.error('[SyncPlayMenu] unable to fetch SyncPlay groups', err);
            });
    }, [ api ]);

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
        if (!SyncPlay) return;

        // TODO: Rewrite settings UI
        const SyncPlaySettingsEditor = (await import('../../../../../plugins/syncPlay/ui/settings/SettingsEditor')).default;
        new SyncPlaySettingsEditor(
            __legacyApiClient__,
            SyncPlay.Manager.getTimeSyncCore(),
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
    }, [ __legacyApiClient__, currentGroup, onMenuClose, SyncPlay ]);

    const updateSyncPlayGroup = useCallback((_e, enabled) => {
        if (SyncPlay && enabled) {
            setCurrentGroup(SyncPlay.Manager.getGroupInfo());
        } else {
            setCurrentGroup(undefined);
        }
    }, [ SyncPlay ]);

    useEffect(() => {
        if (!SyncPlay) return;

        Events.on(SyncPlay.Manager, 'enabled', updateSyncPlayGroup);

        return () => {
            Events.off(SyncPlay.Manager, 'enabled', updateSyncPlayGroup);
        };
    }, [ updateSyncPlayGroup, SyncPlay ]);

    const menuItems = [];
    if (isSyncPlayEnabled) {
        // TODO: Add playback controls
        menuItems.push(
            <MenuItem
                key='sync-play-settings'
                onClick={onGroupSettingsClick}
            >
                <ListItemIcon>
                    <Settings />
                </ListItemIcon>
                <ListItemText
                    primary={globalize.translate('Settings')}
                />
            </MenuItem>
        );

        menuItems.push(
            <MenuItem
                key='sync-play-exit'
                onClick={onGroupLeaveClick}
            >
                <ListItemIcon>
                    <Close />
                </ListItemIcon>
                <ListItemText
                    primary={globalize.translate('LabelSyncPlayLeaveGroup')}
                />
            </MenuItem>
        );
    } else if (groups.length === 0 && user?.Policy?.SyncPlayAccess !== SyncPlayUserAccessType.CreateAndJoinGroups) {
        menuItems.push(
            <MenuItem key='sync-play-unavailable' disabled>
                <ListItemIcon>
                    <PersonOff />
                </ListItemIcon>
                {/* FIXME: Use localized message for this */}
                <ListItemText primary='No SyncPlay For You!' />
            </MenuItem>
        );
    } else {
        if (groups.length > 0) {
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
