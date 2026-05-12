import { SyncPlayUserAccessType } from '@jellyfin/sdk/lib/generated-client/models/sync-play-user-access-type';
import Badge from '@mui/material/Badge';
import Groups from '@mui/icons-material/Groups';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import React, { useCallback, useState } from 'react';

import { QUERY_KEY, useSyncPlayGroups } from 'apps/experimental/features/syncPlay/hooks/api/useSyncPlayGroups';
import { useSyncPlay } from 'apps/experimental/features/syncPlay/hooks/useSyncPlay';
import { pluginManager } from 'components/pluginManager';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { PluginType } from 'types/plugin';
import { queryClient } from 'utils/query/queryClient';

import AppSyncPlayMenu, { ID } from './menus/SyncPlayMenu';

const SyncPlayButton = () => {
    const { user } = useApi();
    const { isActive } = useSyncPlay();
    const { data: groups } = useSyncPlayGroups();
    const isAvailable = Boolean(groups && groups.length > 0);

    const [ syncPlayMenuAnchorEl, setSyncPlayMenuAnchorEl ] = useState<null | HTMLElement>(null);
    const isSyncPlayMenuOpen = Boolean(syncPlayMenuAnchorEl);

    const onSyncPlayButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        // Refresh SyncPlay groups when opening the menu
        void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        setSyncPlayMenuAnchorEl(event.currentTarget);
    }, [ setSyncPlayMenuAnchorEl ]);

    const onSyncPlayMenuClose = useCallback(() => {
        setSyncPlayMenuAnchorEl(null);
    }, [ setSyncPlayMenuAnchorEl ]);

    if (
        // SyncPlay not enabled for user
        (user?.Policy && user.Policy.SyncPlayAccess === SyncPlayUserAccessType.None)
        // SyncPlay plugin is not loaded
        || pluginManager.ofType(PluginType.SyncPlay).length === 0
    ) {
        return null;
    }

    return (
        <>
            <Tooltip title={globalize.translate('ButtonSyncPlay')}>
                <IconButton
                    size='large'
                    aria-label={globalize.translate('ButtonSyncPlay')}
                    aria-controls={ID}
                    aria-haspopup='true'
                    onClick={onSyncPlayButtonClick}
                    color='inherit'
                >
                    <Badge
                        color={isActive ? 'primary' : 'success'}
                        badgeContent={1} // Use visibility of badge to indicate status
                        invisible={!isActive && !isAvailable}
                        variant='dot'
                    >
                        <Groups />
                    </Badge>
                </IconButton>
            </Tooltip>

            <AppSyncPlayMenu
                open={isSyncPlayMenuOpen}
                anchorEl={syncPlayMenuAnchorEl}
                onMenuClose={onSyncPlayMenuClose}
            />
        </>
    );
};

export default SyncPlayButton;
