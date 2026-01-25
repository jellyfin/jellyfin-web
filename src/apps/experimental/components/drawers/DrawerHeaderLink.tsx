import React from 'react';
import { Box } from 'ui-primitives/Box';
import { ListItemContent, ListItemDecorator } from 'ui-primitives/List';
import { Text } from 'ui-primitives/Text';

import { useSystemInfo } from 'hooks/useSystemInfo';
import ListItemLink from 'components/ListItemLink';

import appIcon from '@jellyfin/ux-web/icon-transparent.png';

const DrawerHeaderLink = () => {
    const { data: systemInfo } = useSystemInfo();

    return (
        <ListItemLink to='/'>
            <ListItemDecorator>
                <Box
                    as='img'
                    src={appIcon}
                    style={{ height: '2.5rem' }}
                />
            </ListItemDecorator>
            <ListItemContent>
                <Text weight='bold'>{systemInfo?.ServerName || 'Jellyfin'}</Text>
                <Text size='sm' color='secondary'>{systemInfo?.Version}</Text>
            </ListItemContent>
        </ListItemLink>);
};

export default DrawerHeaderLink;
