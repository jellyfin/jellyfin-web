import { Component2Icon, FileIcon } from '@radix-ui/react-icons';
import React, { useEffect } from 'react';

import ListItemLink from 'components/ListItemLink';
import globalize from 'lib/globalize';
import Dashboard from 'utils/dashboard';
import { List, ListItemDecorator, ListSubheader } from 'ui-primitives/List';
import { useConfigurationPages } from 'apps/dashboard/features/plugins/api/useConfigurationPages';
import { logger } from 'utils/logger';

const PluginDrawerSection = (): React.ReactElement => {
    const { data: pagesInfo, error } = useConfigurationPages({ enableInMainMenu: true });

    useEffect(() => {
        if (error) logger.error('[PluginDrawerSection] unable to fetch plugin config pages', { error });
    }, [error]);

    return (
        <List
            aria-labelledby='plugins-subheader'
            subheader={<ListSubheader id='plugins-subheader'>{globalize.translate('TabPlugins')}</ListSubheader>}
        >
            <ListItemLink
                to='/dashboard/plugins'
                includePaths={['/configurationpage', '/dashboard/plugins/repositories']}
                excludePaths={
                    Array.isArray(pagesInfo) ? pagesInfo.map(p => `/${Dashboard.getPluginUrl(p.Name ?? '')}`) : []
                }
            >
                <ListItemDecorator>
                    <Component2Icon />
                </ListItemDecorator>
                {globalize.translate('TabPlugins')}
            </ListItemLink>

            {Array.isArray(pagesInfo)
                && pagesInfo.map(pageInfo => (
                    <ListItemLink key={pageInfo.PluginId} to={`/${Dashboard.getPluginUrl(pageInfo.Name ?? '')}`}>
                        <ListItemDecorator>
                            <FileIcon />
                        </ListItemDecorator>
                        {pageInfo.DisplayName}
                    </ListItemLink>
                ))}
        </List>
    );
};

export default PluginDrawerSection;
