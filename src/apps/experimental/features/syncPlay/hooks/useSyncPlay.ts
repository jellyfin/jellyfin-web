import type { GroupInfoDto } from '@jellyfin/sdk/lib/generated-client/models/group-info-dto';
import type { ApiClient } from 'jellyfin-apiclient';
import { useCallback, useEffect, useState } from 'react';

import { pluginManager } from 'components/pluginManager';
import { PluginType } from 'types/plugin';
import Events, { type Event } from 'utils/events';

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

/** Hook to access SyncPlay instance and current group info. */
export function useSyncPlay() {
    const [ syncPlay, setSyncPlay ] = useState<SyncPlayInstance>();
    const [ currentGroup, setCurrentGroup ] = useState<GroupInfoDto>();

    useEffect(() => {
        setSyncPlay(pluginManager.firstOfType(PluginType.SyncPlay)?.instance);
    }, []);

    const changeGroup = useCallback((_e: Event, enabled: boolean) => {
        if (syncPlay && enabled) {
            setCurrentGroup(syncPlay.Manager.getGroupInfo() ?? undefined);
        } else {
            setCurrentGroup(undefined);
        }
    }, [ syncPlay ]);

    const updateGroupInfo = useCallback((_e: Event, groupInfo: GroupInfoDto) => {
        setCurrentGroup(groupInfo);
    }, []);

    useEffect(() => {
        if (!syncPlay) return;

        Events.on(syncPlay.Manager, 'enabled', changeGroup);

        return () => {
            Events.off(syncPlay.Manager, 'enabled', changeGroup);
        };
    }, [ changeGroup, syncPlay ]);

    useEffect(() => {
        if (!syncPlay) return;

        Events.on(syncPlay.Manager, 'group-update', updateGroupInfo);

        return () => {
            Events.off(syncPlay.Manager, 'group-update', updateGroupInfo);
        };
    }, [ updateGroupInfo, syncPlay ]);

    // Set initial group info
    useEffect(() => {
        if (syncPlay) {
            setCurrentGroup(syncPlay.Manager.getGroupInfo() ?? undefined);
        }
    }, [ syncPlay ]);

    return {
        isActive: Boolean(currentGroup),
        currentGroup,
        syncPlay
    };
}
