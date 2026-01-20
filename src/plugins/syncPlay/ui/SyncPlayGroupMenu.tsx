import React, { useCallback, useEffect, useState } from 'react';
import globalize from '../../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { useSyncPlayStore } from '../../../store/syncPlayStore';
import ActionMenu, { ActionMenuItem } from '../../../components/joy-ui/action/ActionMenu';
import SyncPlaySettingsDialog from './settings/SyncPlaySettingsDialog';
import { pluginManager } from '../../../components/pluginManager';
import { PluginType } from '../../../types/plugin';

interface SyncPlayGroupMenuProps {
    open: boolean;
    anchorEl: HTMLElement | null;
    onClose: () => void;
}

const SyncPlayGroupMenu: React.FC<SyncPlayGroupMenuProps> = ({ open, anchorEl, onClose }) => {
    const isEnabled = useSyncPlayStore(state => state.isEnabled);
    const groupInfo = useSyncPlayStore(state => state.groupInfo);
    const [ groups, setGroups ] = useState<any[]>([]);
    const [ settingsOpen, setSettingsOpen ] = useState(false);
    
    const syncPlay = pluginManager.firstOfType(PluginType.SyncPlay)?.instance;
    const apiClient = ServerConnections.currentApiClient();

    useEffect(() => {
        if (open && !isEnabled) {
            apiClient.getSyncPlayGroups().then((response: any) => {
                response.json().then((data: any[]) => {
                    setGroups(data);
                });
            });
        }
    }, [ open, isEnabled, apiClient ]);

    const handleSelect = useCallback((id: string) => {
        if (!isEnabled) {
            if (id === 'new-group') {
                ServerConnections.user(apiClient).then((user: any) => {
                    apiClient.createSyncPlayGroup({
                        GroupName: globalize.translate('SyncPlayGroupDefaultTitle', user.Name)
                    });
                });
            } else {
                apiClient.joinSyncPlayGroup({ GroupId: id });
            }
        } else {
            switch (id) {
                case 'resume-playback':
                    syncPlay?.Manager.resumeGroupPlayback(apiClient);
                    break;
                case 'halt-playback':
                    syncPlay?.Manager.haltGroupPlayback(apiClient);
                    break;
                case 'settings':
                    setSettingsOpen(true);
                    return; // Don't close main menu yet
                case 'leave-group':
                    apiClient.leaveSyncPlayGroup();
                    break;
            }
        }
        onClose();
    }, [ isEnabled, apiClient, syncPlay, onClose ]);

    const menuItems: ActionMenuItem[] = [];

    if (!isEnabled) {
        groups.forEach(group => {
            menuItems.push({
                id: group.GroupId,
                name: group.GroupName,
                secondaryText: group.Participants.join(', '),
                icon: 'person'
            });
        });
        menuItems.push({
            id: 'new-group',
            name: globalize.translate('LabelSyncPlayNewGroup'),
            secondaryText: globalize.translate('LabelSyncPlayNewGroupDescription'),
            icon: 'add'
        });
    } else if (groupInfo) {
        if (!syncPlay?.Manager.isPlaylistEmpty() && !syncPlay?.Manager.isPlaybackActive()) {
            menuItems.push({
                id: 'resume-playback',
                name: globalize.translate('LabelSyncPlayResumePlayback'),
                icon: 'play_circle_filled'
            });
        } else if (syncPlay?.Manager.isPlaybackActive()) {
            menuItems.push({
                id: 'halt-playback',
                name: globalize.translate('LabelSyncPlayHaltPlayback'),
                icon: 'pause_circle_filled'
            });
        }
        menuItems.push({
            id: 'settings',
            name: globalize.translate('Settings'),
            icon: 'settings'
        });
        menuItems.push({
            id: 'leave-group',
            name: globalize.translate('LabelSyncPlayLeaveGroup'),
            icon: 'meeting_room'
        });
    }

    return (
        <>
            <ActionMenu
                open={open}
                anchorEl={anchorEl}
                items={menuItems}
                onClose={onClose}
                onSelect={handleSelect}
                title={isEnabled ? groupInfo?.groupName : globalize.translate('HeaderSyncPlaySelectGroup')}
                text={isEnabled ? groupInfo?.participants.join(', ') : undefined}
            />
            <SyncPlaySettingsDialog
                open={settingsOpen}
                onClose={() => {
                    setSettingsOpen(false);
                    onClose();
                }}
            />
        </>
    );
};

export default SyncPlayGroupMenu;
