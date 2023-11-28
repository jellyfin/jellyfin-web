import Box from '@mui/material/Box';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import React from 'react';

import { useApi } from 'hooks/useApi';
import { useSystemInfo } from 'hooks/useSystemInfo';
import ListItemLink from 'components/ListItemLink';

import appIcon from 'assets/img/icon-transparent.png';

const DrawerHeaderLink = () => {
    const { api } = useApi();
    const { data: systemInfo } = useSystemInfo(api);

    return (
        <ListItemLink to='/'>
            <ListItemIcon sx={{ minWidth: 56 }}>
                <Box
                    component='img'
                    src={appIcon}
                    sx={{ height: '2.5rem' }}
                />
            </ListItemIcon>
            <ListItemText
                primary={systemInfo?.ServerName || 'Jellyfin'}
                primaryTypographyProps={{ variant: 'h6' }}
                secondary={systemInfo?.Version}
            />
        </ListItemLink>);
};

export default DrawerHeaderLink;
