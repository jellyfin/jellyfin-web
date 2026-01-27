import React from 'react';

import DrawerHeaderLink from 'apps/experimental/components/drawers/DrawerHeaderLink';
import ResponsiveDrawer, { type ResponsiveDrawerProps } from 'components/ResponsiveDrawer';
import { List, ListItem } from 'ui-primitives/List';

import AdvancedDrawerSection from './sections/AdvancedDrawerSection';
import DevicesDrawerSection from './sections/DevicesDrawerSection';
import LiveTvDrawerSection from './sections/LiveTvDrawerSection';
import PluginDrawerSection from './sections/PluginDrawerSection';
import ServerDrawerSection from './sections/ServerDrawerSection';

function AppDrawer({
    open = false,
    onClose,
    onOpen
}: Readonly<ResponsiveDrawerProps>): React.ReactElement {
    return (
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
}

export default AppDrawer;
