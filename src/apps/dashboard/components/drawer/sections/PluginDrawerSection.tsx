import { ConfigurationPageInfo } from '@jellyfin/sdk/lib/generated-client';
import { getDashboardApi } from '@jellyfin/sdk/lib/utils/api/dashboard-api';
import { Folder } from '@mui/icons-material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React, { useEffect, useState } from 'react';

import ListItemLink from 'components/ListItemLink';
import { useApi } from 'hooks/useApi';
import globalize from 'scripts/globalize';
import Dashboard from 'utils/dashboard';

const PluginDrawerSection = () => {
    const { api } = useApi();
    const [ pagesInfo, setPagesInfo ] = useState<ConfigurationPageInfo[]>([]);

    useEffect(() => {
        const fetchPluginPages = async () => {
            if (!api) return;

            const pagesResponse = await getDashboardApi(api)
                .getConfigurationPages({ enableInMainMenu: true });

            setPagesInfo(pagesResponse.data);
        };

        fetchPluginPages()
            .catch(err => {
                console.error('[PluginDrawerSection] unable to fetch plugin config pages', err);
            });
    }, [ api ]);

    if (!api || pagesInfo.length < 1) {
        return null;
    }

    return (
        <List
            aria-labelledby='plugins-subheader'
            subheader={
                <ListSubheader component='div' id='plugins-subheader'>
                    {globalize.translate('TabPlugins')}
                </ListSubheader>
            }
        >
            {
                pagesInfo.map(pageInfo => (
                    <ListItem key={pageInfo.PluginId} disablePadding>
                        <ListItemLink to={`/${Dashboard.getPluginUrl(pageInfo.Name)}`}>
                            <ListItemIcon>
                                {/* TODO: Support different icons? */}
                                <Folder />
                            </ListItemIcon>
                            <ListItemText primary={pageInfo.DisplayName} />
                        </ListItemLink>
                    </ListItem>
                ))
            }
        </List>
    );
};

export default PluginDrawerSection;
