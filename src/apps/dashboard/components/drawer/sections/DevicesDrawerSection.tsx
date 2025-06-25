import Analytics from '@mui/icons-material/Analytics';
import Devices from '@mui/icons-material/Devices';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';

import ListItemLink from 'components/ListItemLink';
import globalize from 'lib/globalize';

const DevicesDrawerSection = () => {
    return (
        <List
            aria-labelledby='devices-subheader'
            subheader={
                <ListSubheader component='div' id='devices-subheader'>
                    {globalize.translate('HeaderDevices')}
                </ListSubheader>
            }
        >
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/devices'>
                    <ListItemIcon>
                        <Devices />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('HeaderDevices')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/activity'>
                    <ListItemIcon>
                        <Analytics />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('HeaderActivity')} />
                </ListItemLink>
            </ListItem>
        </List>
    );
};

export default DevicesDrawerSection;
