import React, { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import { usePlugins } from 'apps/dashboard/features/plugins/api/usePlugins';
import Loading from 'components/loading/LoadingComponent';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid2';
import PluginCard from 'apps/dashboard/features/plugins/components/PluginCard';
import { useConfigurationPages } from 'apps/dashboard/features/plugins/api/useConfigurationPages';
import { findBestConfigurationPage } from 'apps/dashboard/features/plugins/api/configurationPage';

export const Component = () => {
    const {
        data: plugins,
        isPending,
        isError } = usePlugins();
    const {
        data: configurationPages,
        isError: isConfigurationPagesError,
        isPending: isConfigurationPagesPending
    } = useConfigurationPages();
    const [ searchQuery, setSearchQuery ] = useState('');

    const onSearchChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    }, []);

    const filteredPlugins = useMemo(() => {
        if (plugins) {
            return plugins.filter(i => i.Name?.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()));
        } else {
            return [];
        }
    }, [ plugins, searchQuery ]);

    if (isPending || isConfigurationPagesPending) {
        return <Loading />;
    }

    return (
        <Page
            id='pluginsPage'
            title={globalize.translate('TabPlugins')}
            className='type-interior mainAnimatedPage'
        >
            <Box className='content-primary'>
                {isError || isConfigurationPagesError ? (
                    <Alert severity='error'>{globalize.translate('PluginsLoadError')}</Alert>
                ) : (
                    <Stack spacing={3}>
                        <Typography variant='h1'>
                            {globalize.translate('TabMyPlugins')}
                        </Typography>

                        <TextField
                            label={globalize.translate('Search')}
                            value={searchQuery}
                            onChange={onSearchChange}
                        />

                        <Box>
                            <Grid container spacing={2} columns={{ xs: 1, sm: 4, md: 9, lg: 10 }}>
                                {filteredPlugins.map(plugin => {
                                    return (
                                        <Grid key={plugin.Id} size={{ xs: 1, sm: 2, md: 3, lg: 2 }}>
                                            <PluginCard
                                                plugin={plugin}
                                                configurationPage={findBestConfigurationPage(configurationPages, plugin.Id || '')}
                                            />
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Box>
                    </Stack>
                )}
            </Box>
        </Page>
    );
};

Component.displayName = 'InstalledPlugins';
