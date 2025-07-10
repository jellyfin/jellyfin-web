import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { useCallback, useMemo, useState } from 'react';

import PluginCard from 'apps/dashboard/features/plugins/components/PluginCard';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import { usePluginDetails } from 'apps/dashboard/features/plugins/api/usePluginDetails';
import { Link } from 'react-router-dom';
import IconButton from '@mui/material/IconButton/IconButton';
import Settings from '@mui/icons-material/Settings';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { CATEGORY_LABELS } from 'apps/dashboard/features/plugins/constants/categoryLabels';
import SearchInput from 'apps/dashboard/components/SearchInput';

const MAIN_CATEGORIES = [
    'administration',
    'general',
    'anime',
    'books',
    'livetv',
    'moviesandshows',
    'music',
    'subtitles'
];

export const Component = () => {
    const {
        data: pluginDetails,
        isError,
        isPending
    } = usePluginDetails();
    const [ category, setCategory ] = useState<string>();
    const [ searchQuery, setSearchQuery ] = useState('');

    const onSearchChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    }, []);

    const filteredPlugins = useMemo(() => {
        if (pluginDetails) {
            let filtered = pluginDetails;

            if (category) {
                if (category === 'installed') {
                    filtered = filtered.filter(p => p.status);
                } else if (category === 'other') {
                    filtered = filtered.filter(p => (
                        p.category && !MAIN_CATEGORIES.includes(p.category.toLocaleLowerCase())
                    ));
                } else {
                    filtered = filtered.filter(p => p.category?.toLocaleLowerCase() === category);
                }
            }
            return filtered
                .filter(i => i.name?.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()));
        } else {
            return [];
        }
    }, [ category, pluginDetails, searchQuery ]);

    if (isPending) {
        return <Loading />;
    }

    return (
        <Page
            id='pluginsPage'
            title={globalize.translate('TabPlugins')}
            className='type-interior mainAnimatedPage'
        >
            <Box className='content-primary'>
                {isError ? (
                    <Alert
                        severity='error'
                        sx={{ marginBottom: 2 }}
                    >
                        {globalize.translate('PluginsLoadError')}
                    </Alert>
                ) : (
                    <Stack spacing={2}>
                        <Grid
                            container
                            spacing={2}
                        >
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <Typography
                                    variant='h1'
                                    component='span'
                                    sx={{
                                        marginRight: 2,
                                        verticalAlign: 'middle'
                                    }}
                                >
                                    {globalize.translate('TabPlugins')}
                                </Typography>

                                <IconButton
                                    component={Link}
                                    to='/dashboard/plugins/repositories'
                                >
                                    <Settings />
                                </IconButton>
                            </Grid>

                            <Grid
                                size={{ xs: 12, sm: 4 }}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'end'
                                }}
                            >
                                <SearchInput
                                    label={globalize.translate('Search')}
                                    value={searchQuery}
                                    onChange={onSearchChange}
                                />
                            </Grid>
                        </Grid>

                        <Box>
                            <Stack
                                direction='row'
                                spacing={1}
                                sx={{
                                    marginLeft: '-1rem',
                                    marginRight: '-1rem',
                                    paddingLeft: '1rem',
                                    paddingRight: '1rem',
                                    paddingBottom: {
                                        xs: 1,
                                        md: 0.5
                                    },
                                    overflowX: 'auto'
                                }}
                            >
                                <Chip
                                    color={!category ? 'primary' : undefined}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => setCategory(undefined)}
                                    label={globalize.translate('All')}
                                />

                                <Chip
                                    color={category === 'installed' ? 'primary' : undefined}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => setCategory('installed')}
                                    label={globalize.translate('LabelInstalled')}
                                />

                                <Divider orientation='vertical' flexItem />

                                {Object.keys(CATEGORY_LABELS).map(c => (
                                    <Chip
                                        key={c}
                                        color={category === c.toLocaleLowerCase() ? 'primary' : undefined}
                                        // eslint-disable-next-line react/jsx-no-bind
                                        onClick={() => setCategory(c.toLocaleLowerCase())}
                                        label={globalize.translate(CATEGORY_LABELS[c])}
                                    />
                                ))}
                            </Stack>
                            <Divider />
                        </Box>

                        <Box>
                            <Grid container spacing={2} columns={{ xs: 1, sm: 4, md: 9, lg: 8, xl: 10 }}>
                                {filteredPlugins.map(plugin => (
                                    <Grid key={plugin.id} size={{ xs: 1, sm: 2, md: 3, lg: 2 }}>
                                        <PluginCard
                                            plugin={plugin}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Stack>
                )}
            </Box>
        </Page>
    );
};

Component.displayName = 'InstalledPlugins';
