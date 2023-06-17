import { Dvr, LiveTv } from '@mui/icons-material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React from 'react';

import globalize from 'scripts/globalize';

import ListItemLink from '../ListItemLink';

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
                <ListItemLink to='/livetvstatus.html'>
                    <ListItemIcon>
                        <LiveTv />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('LiveTV')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/livetvsettings.html'>
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
