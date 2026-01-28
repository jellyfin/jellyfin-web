import type { GroupInfoDto } from '@jellyfin/sdk/lib/generated-client/models/group-info-dto';
import { SyncPlayUserAccessType } from '@jellyfin/sdk/lib/generated-client/models/sync-play-user-access-type';
import { getSyncPlayApi } from '@jellyfin/sdk/lib/utils/api/sync-play-api';
import {
    Cross2Icon,
    GroupIcon,
    MinusIcon,
    MixerHorizontalIcon,
    PersonIcon,
    PlayIcon,
    StopIcon
} from '@radix-ui/react-icons';
import type { ApiClient } from 'jellyfin-apiclient';
import React, { type FC, useCallback, useEffect, useState } from 'react';
import { Box, Flex } from 'ui-primitives/Box';
import { Menu, MenuItem, MenuLabel, MenuSeparator } from 'ui-primitives/Menu';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

import { pluginManager } from 'components/pluginManager';
import { useApi } from 'hooks/useApi';
import { useSyncPlayGroups } from 'hooks/useSyncPlayGroups';
import globalize from 'lib/globalize';
import { PluginType } from 'types/plugin';
import Events, { type Event, type EventObject } from 'utils/events';

export const ID = 'app-sync-play-menu';

interface SyncPlayMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: React.ReactNode;
}

interface SyncPlayInstance {
    Manager: {
        getGroupInfo: () => GroupInfoDto | null | undefined;
        getTimeSyncCore: () => object;
        isPlaybackActive: () => boolean;
        isPlaylistEmpty: () => boolean;
        haltGroupPlayback: (apiClient: ApiClient) => void;
        resumeGroupPlayback: (apiClient: ApiClient) => void;
    };
}

const SyncPlayMenu: FC<SyncPlayMenuProps> = ({ open, onOpenChange, trigger }) => {
    const [syncPlay, setSyncPlay] = useState<SyncPlayInstance>();
    const { __legacyApiClient__, api, user } = useApi();
    const [currentGroup, setCurrentGroup] = useState<GroupInfoDto>();
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

            onOpenChange(false);
        }
    }, [api, onOpenChange, user]);

    const onGroupLeaveClick = useCallback(() => {
        if (api) {
            getSyncPlayApi(api)
                .syncPlayLeaveGroup()
                .catch(err => {
                    console.error('[SyncPlayMenu] failed to leave SyncPlay group', err);
                });

            onOpenChange(false);
        }
    }, [api, onOpenChange]);

    const onGroupJoinClick = useCallback(
        (GroupId: string) => {
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

                onOpenChange(false);
            }
        },
        [api, onOpenChange]
    );

    const onGroupSettingsClick = useCallback(async () => {
        if (!syncPlay) return;

        // TODO: Rewrite settings UI
        const SyncPlaySettingsEditor = (await import('../../../../../plugins/syncPlay/ui/settings/SettingsEditor'))
            .default;
        new SyncPlaySettingsEditor(__legacyApiClient__, syncPlay.Manager.getTimeSyncCore(), {
            groupInfo: currentGroup
        })
            .embed()
            .catch(err => {
                if (err) {
                    console.error('[SyncPlayMenu] Error creating SyncPlay settings editor', err);
                }
            });

        onOpenChange(false);
    }, [__legacyApiClient__, currentGroup, onOpenChange, syncPlay]);

    const onStartGroupPlaybackClick = useCallback(() => {
        if (__legacyApiClient__) {
            syncPlay?.Manager.resumeGroupPlayback(__legacyApiClient__);
            onOpenChange(false);
        }
    }, [__legacyApiClient__, onOpenChange, syncPlay]);

    const onStopGroupPlaybackClick = useCallback(() => {
        if (__legacyApiClient__) {
            syncPlay?.Manager.haltGroupPlayback(__legacyApiClient__);
            onOpenChange(false);
        }
    }, [__legacyApiClient__, onOpenChange, syncPlay]);

    const renderMenuItemContent = (icon: React.ReactNode, primary: string, secondary?: string) => (
        <Flex align="center" gap={vars.spacing['4']}>
            <Box style={{ width: vars.spacing['6'], display: 'flex', justifyContent: 'center' }}>{icon}</Box>
            <Box style={{ display: 'flex', flexDirection: 'column' }}>
                <Text size="md">{primary}</Text>
                {secondary && (
                    <Text size="sm" color="secondary">
                        {secondary}
                    </Text>
                )}
            </Box>
        </Flex>
    );

    const updateSyncPlayGroup = useCallback(
        (_e: Event, ...args: unknown[]) => {
            const enabled = args[0] as boolean;
            if (syncPlay && enabled) {
                setCurrentGroup(syncPlay.Manager.getGroupInfo() ?? undefined);
            } else {
                setCurrentGroup(undefined);
            }
        },
        [syncPlay]
    );

    useEffect(() => {
        if (!syncPlay) return;

        Events.on(syncPlay.Manager as EventObject, 'enabled', updateSyncPlayGroup);

        return () => {
            Events.off(syncPlay.Manager as EventObject, 'enabled', updateSyncPlayGroup);
        };
    }, [updateSyncPlayGroup, syncPlay]);

    const menuItems = [];
    if (isSyncPlayEnabled) {
        if (!syncPlay?.Manager.isPlaylistEmpty() && !syncPlay?.Manager.isPlaybackActive()) {
            menuItems.push(
                <MenuItem key="sync-play-start-playback" onClick={onStartGroupPlaybackClick}>
                    {renderMenuItemContent(<PlayIcon />, globalize.translate('LabelSyncPlayResumePlayback'))}
                </MenuItem>
            );
        } else if (syncPlay?.Manager.isPlaybackActive()) {
            menuItems.push(
                <MenuItem key="sync-play-stop-playback" onClick={onStopGroupPlaybackClick}>
                    {renderMenuItemContent(<StopIcon />, globalize.translate('LabelSyncPlayHaltPlayback'))}
                </MenuItem>
            );
        }

        menuItems.push(
            <MenuItem key="sync-play-settings" onClick={onGroupSettingsClick}>
                {renderMenuItemContent(<MixerHorizontalIcon />, globalize.translate('Settings'))}
            </MenuItem>
        );

        menuItems.push(<MenuSeparator key="sync-play-controls-divider" />);

        menuItems.push(
            <MenuItem key="sync-play-exit" onClick={onGroupLeaveClick}>
                {renderMenuItemContent(<MinusIcon />, globalize.translate('LabelSyncPlayLeaveGroup'))}
            </MenuItem>
        );
    } else if (!groups?.length && user?.Policy?.SyncPlayAccess !== SyncPlayUserAccessType.CreateAndJoinGroups) {
        menuItems.push(
            <MenuItem key="sync-play-unavailable" disabled>
                {renderMenuItemContent(<Cross2Icon />, globalize.translate('LabelSyncPlayNoGroups'))}
            </MenuItem>
        );
    } else {
        if (Array.isArray(groups) && groups.length > 0) {
            groups.forEach(group => {
                menuItems.push(
                    <MenuItem
                        key={group.GroupId}
                        // Since we are looping over groups there is no good way to avoid creating a new function here
                        // eslint-disable-next-line react/jsx-no-bind
                        onClick={() => group.GroupId && onGroupJoinClick(group.GroupId)}
                    >
                        {renderMenuItemContent(<PersonIcon />, group.GroupName ?? '', group.Participants?.join(', '))}
                    </MenuItem>
                );
            });

            menuItems.push(<MenuSeparator key="sync-play-groups-divider" />);
        }

        if (user?.Policy?.SyncPlayAccess === SyncPlayUserAccessType.CreateAndJoinGroups) {
            menuItems.push(
                <MenuItem key="sync-play-new-group" onClick={onGroupAddClick}>
                    {renderMenuItemContent(<GroupIcon />, globalize.translate('LabelSyncPlayNewGroupDescription'))}
                </MenuItem>
            );
        }
    }

    return (
        <Menu open={open} onOpenChange={onOpenChange} trigger={trigger} align="end" id={ID}>
            {isSyncPlayEnabled && currentGroup?.GroupName && <MenuLabel>{currentGroup.GroupName}</MenuLabel>}
            {menuItems}
        </Menu>
    );
};

export default SyncPlayMenu;
