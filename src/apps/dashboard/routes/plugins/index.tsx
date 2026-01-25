import { Alert } from 'ui-primitives/Alert';
import { Box, Flex } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';
import { Chip } from 'ui-primitives/Chip';
import { Divider } from 'ui-primitives/Divider';
import { Grid, gridContainer, gridGap, gridXs, gridSm, gridMd, gridLg, gridXl } from 'ui-primitives/Grid';
import { Text, Heading } from 'ui-primitives/Text';
import React, { useCallback, useMemo } from 'react';
import { Link } from '@tanstack/react-router';

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

export const Component = (): React.ReactElement => {
    const { data: pluginDetails, isError, isPending } = usePluginDetails();
    const [category, setCategory] = useSearchParam(CATEGORY_PARAM);
    const [searchQuery, setSearchQuery] = useSearchParam(QUERY_PARAM);
    const [status, setStatus] = useSearchParam(STATUS_PARAM, PluginStatusOption.Installed);

    const onSearchChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
            setSearchQuery(event.target.value);
        },
        [setSearchQuery]
    );

    const onViewAll = useCallback(() => {
        if (category) setCategory('');
        else setStatus(PluginStatusOption.All);
    }, [category, setCategory, setStatus]);

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
                    filtered = filtered.filter(p => p.category && !MAIN_CATEGORIES.includes(p.category.toLowerCase()));
                } else {
                    filtered = filtered.filter(p => p.category?.toLowerCase() === category);
                }
            }
            return filtered.filter(i => i.name?.toLowerCase().includes(searchQuery.toLowerCase()));
        } else {
            return [];
        }
    }, [category, pluginDetails, searchQuery, status]);

    if (isPending) {
        return <Loading />;
    }

    return (
        <Page id='pluginsPage' title={globalize.translate('TabPlugins')} className='type-interior mainAnimatedPage'>
            <Box style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
                <Box className={`${Flex} ${Flex.col}`} style={{ gap: 24 }}>
                    <Box
                        className={`${Flex} ${Flex.row}`}
                        style={{
                            gap: 16,
                            alignItems: 'flex-start',
                            flexDirection: 'column'
                        }}
                    >
                        <Heading.H2 style={{ flexGrow: 1, margin: 0 }}>{globalize.translate('TabPlugins')}</Heading.H2>

                        <Box className={`${Flex} ${Flex.row}`} style={{ gap: 16, width: '100%' }}>
                            <Button
                                component={Link}
                                to='/dashboard/plugins/repositories'
                                variant='outlined'
                                color='neutral'
                            >
                                {globalize.translate('ManageRepositories')}
                            </Button>

                            <SearchInput
                                label={globalize.translate('Search')}
                                value={searchQuery}
                                onChange={onSearchChange}
                            />
                        </Box>
                    </Box>

                    {isError ? (
                        <Alert variant='error'>{globalize.translate('PluginsLoadError')}</Alert>
                    ) : (
                        <>
                            <Box
                                style={{
                                    overflowX: 'auto',
                                    marginLeft: -24,
                                    marginRight: -24,
                                    paddingLeft: 24,
                                    paddingBottom: 8
                                }}
                            >
                                <Box className={`${Flex} ${Flex.row}`} style={{ gap: 8 }}>
                                    <Chip
                                        variant={status === PluginStatusOption.All ? 'primary' : 'soft'}
                                        onClick={() => setStatus(PluginStatusOption.All)}
                                    >
                                        {globalize.translate('All')}
                                    </Chip>

                                    <Chip
                                        variant={status === PluginStatusOption.Available ? 'primary' : 'soft'}
                                        onClick={() => setStatus(PluginStatusOption.Available)}
                                    >
                                        {globalize.translate('LabelAvailable')}
                                    </Chip>

                                    <Chip
                                        variant={status === PluginStatusOption.Installed ? 'primary' : 'soft'}
                                        onClick={() => setStatus(PluginStatusOption.Installed)}
                                    >
                                        {globalize.translate('LabelInstalled')}
                                    </Chip>

                                    <Divider />

                                    <Chip variant={!category ? 'primary' : 'soft'} onClick={() => setCategory('')}>
                                        {globalize.translate('All')}
                                    </Chip>

                                    {Object.values(PluginCategory).map(c => (
                                        <Chip
                                            key={c}
                                            variant={category === c.toLowerCase() ? 'primary' : 'soft'}
                                            onClick={() => setCategory(c.toLowerCase())}
                                        >
                                            {globalize.translate(CATEGORY_LABELS[c as PluginCategory])}
                                        </Chip>
                                    ))}
                                </Box>
                            </Box>

                            <Box>
                                {filteredPlugins.length > 0 ? (
                                    <Grid className={`${gridContainer} ${gridGap.lg}`}>
                                        {filteredPlugins.map(plugin => (
                                            <Grid
                                                key={plugin.id}
                                                className={`${gridXs[12]} ${gridSm[6]} ${gridMd[4]} ${gridLg[3]} ${gridXl[2]}`}
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
                </Box>
            </Box>
        </Page>
    );
};

Component.displayName = 'InstalledPlugins';
