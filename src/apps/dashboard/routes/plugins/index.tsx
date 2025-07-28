import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
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
import { PluginStatusOption } from 'apps/dashboard/features/plugins/constants/pluginStatusOption';
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

export const Component = () => {
    const {
        data: pluginDetails,
        isError,
        isPending
    } = usePluginDetails();
    const [ category, setCategory ] = useState<string>();
    const [ searchQuery, setSearchQuery ] = useState('');
    const [ status, setStatus ] = useState<PluginStatusOption>(PluginStatusOption.Installed);

    const onSearchChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    }, []);

    const onViewAll = useCallback(() => {
        if (category) setCategory(undefined);
        else setStatus(PluginStatusOption.All);
    }, [ category ]);

    const filteredPlugins = useMemo(() => {
        if (pluginDetails) {
            let filtered = pluginDetails;

            if (status === PluginStatusOption.Installed) {
                filtered = filtered.filter(p => p.status);
            } else if (status === PluginStatusOption.Available) {
                filtered = filtered.filter(p => !p.status);
            }

            if (category) {
                if (category === PluginCategory.Other.toLowerCase()) {
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
    }, [ category, pluginDetails, searchQuery, status ]);

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
                        <Stack
                            direction='row'
                            sx={{
                                flexWrap: {
                                    xs: 'wrap',
                                    sm: 'nowrap'
                                }
                            }}
                        >
                            <Typography
                                variant='h1'
                                component='span'
                                sx={{
                                    flexGrow: 1,
                                    verticalAlign: 'middle'
                                }}
                            >
                                {globalize.translate('TabPlugins')}
                            </Typography>

                            <Button
                                component={Link}
                                to='/dashboard/plugins/repositories'
                                variant='outlined'
                                sx={{
                                    marginLeft: 2
                                }}
                            >
                                {globalize.translate('ManageRepositories')}
                            </Button>

                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'end',
                                    marginTop: {
                                        xs: 2,
                                        sm: 0
                                    },
                                    marginLeft: {
                                        xs: 0,
                                        sm: 2
                                    },
                                    width: {
                                        xs: '100%',
                                        sm: 'auto'
                                    }
                                }}
                            >
                                <SearchInput
                                    label={globalize.translate('Search')}
                                    value={searchQuery}
                                    onChange={onSearchChange}
                                />
                            </Box>
                        </Stack>

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
                                    color={status === PluginStatusOption.All ? 'primary' : undefined}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => setStatus(PluginStatusOption.All)}
                                    label={globalize.translate('All')}
                                />

                                <Chip
                                    color={status === PluginStatusOption.Available ? 'primary' : undefined}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => setStatus(PluginStatusOption.Available)}
                                    label={globalize.translate('LabelAvailable')}
                                />

                                <Chip
                                    color={status === PluginStatusOption.Installed ? 'primary' : undefined}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => setStatus(PluginStatusOption.Installed)}
                                    label={globalize.translate('LabelInstalled')}
                                />

                                <Divider orientation='vertical' flexItem />

                                <Chip
                                    color={!category ? 'primary' : undefined}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => setCategory(undefined)}
                                    label={globalize.translate('All')}
                                />

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
                                // NOTE: Legacy Grid is required due to lack of gap support in JMP on some OSs
                                // eslint-disable-next-line @typescript-eslint/no-deprecated
                                <Grid container spacing={2}>
                                    {filteredPlugins.map(plugin => (
                                        // NOTE: Legacy Grid is required due to lack of gap support in JMP on some OSs
                                        // eslint-disable-next-line @typescript-eslint/no-deprecated
                                        <Grid
                                            key={plugin.id}
                                            item
                                            xs={12}
                                            sm={6}
                                            md={4}
                                            lg={3}
                                            xl={2}
                                        >
                                            <PluginCard
                                                plugin={plugin}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <NoPluginResults
                                    isFiltered={!!category || status !== PluginStatusOption.All}
                                    onViewAll={onViewAll}
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
