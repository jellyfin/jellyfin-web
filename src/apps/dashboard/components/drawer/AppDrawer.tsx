import React, { type FC } from 'react';

import DrawerHeaderLink from 'apps/experimental/components/drawers/DrawerHeaderLink';
import ResponsiveDrawer from 'components/ResponsiveDrawer';
import type { ResponsiveDrawerProps } from 'components/ResponsiveDrawer';
import { List, ListItem } from 'ui-primitives/List';

import ServerDrawerSection from './sections/ServerDrawerSection';
import DevicesDrawerSection from './sections/DevicesDrawerSection';
import LiveTvDrawerSection from './sections/LiveTvDrawerSection';
import AdvancedDrawerSection from './sections/AdvancedDrawerSection';
import PluginDrawerSection from './sections/PluginDrawerSection';

const AppDrawer: FC<ResponsiveDrawerProps> = ({ open = false, onClose, onOpen }) => (
    <ResponsiveDrawer open={open} onClose={onClose} onOpen={onOpen}>
        <List style={{ '--list-padding': '0px' }}>
            <ListItem>
                <DrawerHeaderLink />
            </ListItem>
        </List>
        <ServerDrawerSection />
        <DevicesDrawerSection />
        <LiveTvDrawerSection />
        <PluginDrawerSection />
        <AdvancedDrawerSection />
    </ResponsiveDrawer>
);

export default AppDrawer;
