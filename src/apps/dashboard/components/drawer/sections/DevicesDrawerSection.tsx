import { BarChartIcon, DesktopIcon } from '@radix-ui/react-icons';
import React from 'react';

import ListItemLink from 'components/ListItemLink';
import { List, ListItem, ListItemDecorator, ListSubheader } from 'ui-primitives/List';
import globalize from 'lib/globalize';

const DevicesDrawerSection = (): React.ReactElement => {
    return (
        <List
            aria-labelledby="devices-subheader"
            subheader={<ListSubheader id="devices-subheader">{globalize.translate('HeaderDevices')}</ListSubheader>}
        >
            <ListItem disablePadding>
                <ListItemLink to="/dashboard/devices">
                    <ListItemDecorator>
                        <DesktopIcon />
                    </ListItemDecorator>
                    {globalize.translate('HeaderDevices')}
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to="/dashboard/activity">
                    <ListItemDecorator>
                        <BarChartIcon />
                    </ListItemDecorator>
                    {globalize.translate('HeaderActivity')}
                </ListItemLink>
            </ListItem>
        </List>
    );
};

export default DevicesDrawerSection;
