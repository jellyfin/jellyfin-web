import Settings from '@mui/icons-material/Settings';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import SearchInput from 'apps/dashboard/components/SearchInput';
import { usePluginDetails } from 'apps/dashboard/features/plugins/api/usePluginDetails';
import NoPluginResults from 'apps/dashboard/features/plugins/components/NoPluginResults';
import PluginCard from 'apps/dashboard/features/plugins/components/PluginCard';
import { CATEGORY_LABELS } from 'apps/dashboard/features/plugins/constants/categoryLabels';
import { PluginCategory } from 'apps/dashboard/features/plugins/constants/pluginCategory';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import globalize from 'lib/globalize';

/**
 * The list of primary/main categories.
 * Any category not in this list will be added to the "other" category.
 */
const MAIN_CATEGORIES = [
    PluginCategory.Administration.toLowerCase(),
    PluginCategory.General.toLowerCase(),
    PluginCategory.Anime.toLowerCase(),
    PluginCategory.Books.toLowerCase(),
    PluginCategory.LiveTV.toLowerCase(),
    PluginCategory.MoviesAndShows.toLowerCase(),
    PluginCategory.Music.toLowerCase(),
    PluginCategory.Subtitles.toLowerCase()
];

/** The installed meta category. */
const INSTALLED_CATEGORY = 'installed';

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
                if (category === INSTALLED_CATEGORY) {
                    // Installed plugins will have a status
                    filtered = filtered.filter(p => p.status);
                } else if (category === PluginCategory.Other.toLowerCase()) {
                    filtered = filtered.filter(p => (
                        p.category && !MAIN_CATEGORIES.includes(p.category.toLowerCase())
                    ));
                } else {
                    filtered = filtered.filter(p => p.category?.toLowerCase() === category);
                }
            }
            return filtered
                .filter(i => i.name?.toLowerCase().includes(searchQuery.toLowerCase()));
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
                                    color={category === INSTALLED_CATEGORY ? 'primary' : undefined}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => setCategory(INSTALLED_CATEGORY)}
                                    label={globalize.translate('LabelInstalled')}
                                />

                                <Divider orientation='vertical' flexItem />

                                {Object.values(PluginCategory).map(c => (
                                    <Chip
                                        key={c}
                                        color={category === c.toLowerCase() ? 'primary' : undefined}
                                        // eslint-disable-next-line react/jsx-no-bind
                                        onClick={() => setCategory(c.toLowerCase())}
                                        label={globalize.translate(CATEGORY_LABELS[c as PluginCategory])}
                                    />
                                ))}
                            </Stack>
                            <Divider />
                        </Box>

                        <Box>
                            {filteredPlugins.length > 0 ? (
                                <Grid container spacing={2} columns={{ xs: 1, sm: 4, md: 9, lg: 8, xl: 10 }}>
                                    {filteredPlugins.map(plugin => (
                                        <Grid key={plugin.id} size={{ xs: 1, sm: 2, md: 3, lg: 2 }}>
                                            <PluginCard
                                                plugin={plugin}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <NoPluginResults
                                    isFiltered={!!category}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onViewAll={() => setCategory(undefined)}
                                    query={searchQuery}
                                />
                            )}
                        </Box>
                    </Stack>
                )}
            </Box>
        </Page>
    );
};

Component.displayName = 'InstalledPlugins';
