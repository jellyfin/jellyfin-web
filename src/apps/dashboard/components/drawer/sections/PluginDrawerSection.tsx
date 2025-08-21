import Extension from '@mui/icons-material/Extension';
import Folder from '@mui/icons-material/Folder';
import List from '@mui/material/List';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React, { useEffect } from 'react';

import ListItemLink from 'components/ListItemLink';
import globalize from 'lib/globalize';
import Dashboard from 'utils/dashboard';
import { useConfigurationPages } from 'apps/dashboard/features/plugins/api/useConfigurationPages';

const PluginDrawerSection = () => {
    const {
        data: pagesInfo,
        error
    } = useConfigurationPages({ enableInMainMenu: true });

    useEffect(() => {
        if (error) console.error('[PluginDrawerSection] unable to fetch plugin config pages', error);
    }, [ error ]);

    return (
        <List
            aria-labelledby='plugins-subheader'
            subheader={
                <ListSubheader component='div' id='plugins-subheader'>
                    {globalize.translate('TabPlugins')}
                </ListSubheader>
            }
        >
            <ListItemLink
                to='/dashboard/plugins'
                includePaths={[
                    '/configurationpage',
                    '/dashboard/plugins/repositories'
                ]}
                excludePaths={pagesInfo?.map(p => `/${Dashboard.getPluginUrl(p.Name)}`)}
            >
                <ListItemIcon>
                    <Extension />
                </ListItemIcon>
                <ListItemText primary={globalize.translate('TabPlugins')} />
            </ListItemLink>

            {pagesInfo?.map(pageInfo => (
                <ListItemLink
                    key={pageInfo.PluginId}
                    to={`/${Dashboard.getPluginUrl(pageInfo.Name)}`}
                >
                    <ListItemIcon>
                        {/* TODO: Support different icons? */}
                        <Folder />
                    </ListItemIcon>
                    <ListItemText primary={pageInfo.DisplayName} />
                </ListItemLink>
            ))}
        </List>
    );
};

export default PluginDrawerSection;
