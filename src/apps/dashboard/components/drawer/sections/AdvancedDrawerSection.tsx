import { ArchiveIcon, CalendarIcon, FileTextIcon, GlobeIcon, LockClosedIcon } from '@radix-ui/react-icons';
import React from 'react';

import ListItemLink from 'components/ListItemLink';
import globalize from 'lib/globalize';
import { List, ListItem, ListItemDecorator, ListSubheader } from 'ui-primitives';

function AdvancedDrawerSection(): React.ReactElement {
    return (
        <List
            aria-labelledby='advanced-subheader'
            subheader={<ListSubheader id='advanced-subheader'>{globalize.translate('TabAdvanced')}</ListSubheader>}
        >
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/networking'>
                    <ListItemDecorator>
                        <GlobeIcon />
                    </ListItemDecorator>
                    {globalize.translate('TabNetworking')}
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/keys'>
                    <ListItemDecorator>
                        <LockClosedIcon />
                    </ListItemDecorator>
                    {globalize.translate('HeaderApiKeys')}
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/backups'>
                    <ListItemDecorator>
                        <ArchiveIcon />
                    </ListItemDecorator>
                    {globalize.translate('HeaderBackups')}
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/logs'>
                    <ListItemDecorator>
                        <FileTextIcon />
                    </ListItemDecorator>
                    {globalize.translate('TabLogs')}
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/tasks'>
                    <ListItemDecorator>
                        <CalendarIcon />
                    </ListItemDecorator>
                    {globalize.translate('TabScheduledTasks')}
                </ListItemLink>
            </ListItem>
        </List>
    );
}

export default AdvancedDrawerSection;
