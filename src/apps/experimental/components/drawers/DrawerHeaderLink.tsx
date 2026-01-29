import appIcon from '@jellyfin/ux-web/icon-transparent.png';
import ListItemLink from 'components/ListItemLink';
import { useSystemInfo } from 'hooks/useSystemInfo';
import React from 'react';
import { Box, ListItemContent, ListItemDecorator, Text } from 'ui-primitives';

const DrawerHeaderLink = () => {
    const { data: systemInfo } = useSystemInfo();

    return (
        <ListItemLink to="/">
            <ListItemDecorator>
                <Box as="img" src={appIcon} style={{ height: '2.5rem' }} />
            </ListItemDecorator>
            <ListItemContent>
                <Text weight="bold">{systemInfo?.ServerName || 'Jellyfin'}</Text>
                <Text size="sm" color="secondary">
                    {systemInfo?.Version}
                </Text>
            </ListItemContent>
        </ListItemLink>
    );
};

export default DrawerHeaderLink;
