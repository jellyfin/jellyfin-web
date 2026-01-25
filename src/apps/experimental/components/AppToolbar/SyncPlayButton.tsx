import { SyncPlayUserAccessType } from '@jellyfin/sdk/lib/generated-client/models/sync-play-user-access-type';
import { GroupIcon } from '@radix-ui/react-icons';
import React, { useCallback, useState } from 'react';
import { IconButton } from 'ui-primitives/IconButton';
import { Tooltip } from 'ui-primitives/Tooltip';

import { pluginManager } from 'components/pluginManager';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { PluginType } from 'types/plugin';
import SyncPlayGroupMenu from '../../../../plugins/syncPlay/ui/SyncPlayGroupMenu';

const SyncPlayButton = () => {
    const { user } = useApi();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const isOpen = Boolean(anchorEl);

    const onButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const onMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    if (
        user?.Policy?.SyncPlayAccess === SyncPlayUserAccessType.None ||
        pluginManager.ofType(PluginType.SyncPlay).length === 0
    ) {
        return null;
    }

    return (
        <>
            <Tooltip title={globalize.translate('ButtonSyncPlay')}>
                <IconButton
                    variant="plain"
                    color="neutral"
                    aria-label={globalize.translate('ButtonSyncPlay')}
                    onClick={onButtonClick}
                >
                    <GroupIcon />
                </IconButton>
            </Tooltip>

            <SyncPlayGroupMenu open={isOpen} anchorEl={anchorEl} onClose={onMenuClose} />
        </>
    );
};

export default SyncPlayButton;
