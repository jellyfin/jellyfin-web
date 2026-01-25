import { CameraIcon, VideoIcon } from '@radix-ui/react-icons';
import React from 'react';

import ListItemLink from 'components/ListItemLink';
import { List, ListItem, ListItemDecorator, ListSubheader } from 'ui-primitives/List';
import globalize from 'lib/globalize';

const LiveTvDrawerSection = (): React.ReactElement => {
    return (
        <List
            aria-labelledby='livetv-subheader'
            subheader={<ListSubheader id='livetv-subheader'>{globalize.translate('LiveTV')}</ListSubheader>}
        >
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/livetv'>
                    <ListItemDecorator>
                        <VideoIcon />
                    </ListItemDecorator>
                    {globalize.translate('LiveTV')}
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/livetv/recordings'>
                    <ListItemDecorator>
                        <CameraIcon />
                    </ListItemDecorator>
                    {globalize.translate('HeaderDVR')}
                </ListItemLink>
            </ListItem>
        </List>
    );
};

export default LiveTvDrawerSection;
