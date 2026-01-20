import Alert from '@mui/joy/Alert';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Chip from '@mui/joy/Chip';
import Divider from '@mui/joy/Divider';
import Grid from '@mui/joy/Grid';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import React, { useCallback, useMemo } from 'react';
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
import useSearchParam from 'hooks/useSearchParam';
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

const CATEGORY_PARAM = 'category';
const QUERY_PARAM = 'query';
const STATUS_PARAM = 'status';

export const Component = () => {
    const {
        data: pluginDetails,
        isError,
        isPending
    } = usePluginDetails();
    const [ category, setCategory ] = useSearchParam(CATEGORY_PARAM);
    const [ searchQuery, setSearchQuery ] = useSearchParam(QUERY_PARAM);
    const [ status, setStatus ] = useSearchParam(STATUS_PARAM, PluginStatusOption.Installed);

    const onSearchChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    }, [setSearchQuery]);

    const onViewAll = useCallback(() => {
        if (category) setCategory('');
        else setStatus(PluginStatusOption.All);
    }, [ category, setCategory, setStatus ]);

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
            <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
                <Stack spacing={3}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                        <Typography level='h2' sx={{ flexGrow: 1 }}>
                            {globalize.translate('TabPlugins')}
                        </Typography>

                        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            <Button
                                component={Link}
                                to='/dashboard/plugins/repositories'
                                variant='outlined'
                                color="neutral"
                            >
                                {globalize.translate('ManageRepositories')}
                            </Button>

                            <SearchInput
                                label={globalize.translate('Search')}
                                value={searchQuery}
                                onChange={onSearchChange}
                            />
                        </Stack>
                    </Stack>

                    {isError ? (
                        <Alert color='danger'>
                            {globalize.translate('PluginsLoadError')}
                        </Alert>
                    ) : (
                        <>
                            <Box sx={{ overflowX: 'auto', mx: -3, px: 3, pb: 1 }}>
                                <Stack direction='row' spacing={1}>
                                    <Chip
                                        variant={status === PluginStatusOption.All ? 'solid' : 'soft'}
                                        color={status === PluginStatusOption.All ? 'primary' : 'neutral'}
                                        onClick={() => setStatus(PluginStatusOption.All)}
                                    >
                                        {globalize.translate('All')}
                                    </Chip>

                                    <Chip
                                        variant={status === PluginStatusOption.Available ? 'solid' : 'soft'}
                                        color={status === PluginStatusOption.Available ? 'primary' : 'neutral'}
                                        onClick={() => setStatus(PluginStatusOption.Available)}
                                    >
                                        {globalize.translate('LabelAvailable')}
                                    </Chip>

                                    <Chip
                                        variant={status === PluginStatusOption.Installed ? 'solid' : 'soft'}
                                        color={status === PluginStatusOption.Installed ? 'primary' : 'neutral'}
                                        onClick={() => setStatus(PluginStatusOption.Installed)}
                                    >
                                        {globalize.translate('LabelInstalled')}
                                    </Chip>

                                    <Divider orientation='vertical' />

                                    <Chip
                                        variant={!category ? 'solid' : 'soft'}
                                        color={!category ? 'primary' : 'neutral'}
                                        onClick={() => setCategory('')}
                                    >
                                        {globalize.translate('All')}
                                    </Chip>

                                    {Object.values(PluginCategory).map(c => (
                                        <Chip
                                            key={c}
                                            variant={category === c.toLowerCase() ? 'solid' : 'soft'}
                                            color={category === c.toLowerCase() ? 'primary' : 'neutral'}
                                            onClick={() => setCategory(c.toLowerCase())}
                                        >
                                            {globalize.translate(CATEGORY_LABELS[c as PluginCategory])}
                                        </Chip>
                                    ))}
                                </Stack>
                            </Box>

                            <Box>
                                {filteredPlugins.length > 0 ? (
                                    <Grid container spacing={3}>
                                        {filteredPlugins.map(plugin => (
                                            <Grid
                                                key={plugin.id}
                                                xs={12}
                                                sm={6}
                                                md={4}
                                                lg={3}
                                                xl={2}
                                            >
                                                <PluginCard plugin={plugin} />
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
                        </>
                    )}
                </Stack>
            </Box>
        </Page>
    );
};

Component.displayName = 'InstalledPlugins';