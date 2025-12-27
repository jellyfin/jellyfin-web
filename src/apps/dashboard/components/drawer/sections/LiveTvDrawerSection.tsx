import Dvr from '@mui/icons-material/Dvr';
import LiveTv from '@mui/icons-material/LiveTv';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React from 'react';

import ListItemLink from '@/components/ListItemLink';
import globalize from '@/lib/globalize';

const LiveTvDrawerSection = () => {
    return (
        <List
            aria-labelledby='livetv-subheader'
            subheader={
                <ListSubheader component='div' id='livetv-subheader'>
                    {globalize.translate('LiveTV')}
                </ListSubheader>
            }
        >
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/livetv'>
                    <ListItemIcon>
                        <LiveTv />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('LiveTV')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/livetv/recordings'>
                    <ListItemIcon>
                        <Dvr />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('HeaderDVR')} />
                </ListItemLink>
            </ListItem>
        </List>
    );
};

export default LiveTvDrawerSection;
