import { SyncPlayUserAccessType } from '@jellyfin/sdk/lib/generated-client/models/sync-play-user-access-type';
import Groups from '@mui/icons-material/Groups';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import React, { useCallback, useState } from 'react';

import { pluginManager } from 'components/pluginManager';
import { useApi } from 'hooks/useApi';
import globalize from 'scripts/globalize';
import { PluginType } from 'types/plugin';

import AppSyncPlayMenu, { ID } from './menus/SyncPlayMenu';

const SyncPlayButton = () => {
    const { user } = useApi();

    const [ syncPlayMenuAnchorEl, setSyncPlayMenuAnchorEl ] = useState<null | HTMLElement>(null);
    const isSyncPlayMenuOpen = Boolean(syncPlayMenuAnchorEl);

    const onSyncPlayButtonClick = useCallback((event) => {
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
                    <Groups />
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
