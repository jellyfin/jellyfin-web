import React, { useCallback, useMemo, useState } from 'react';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { usePackages } from 'apps/dashboard/features/plugins/api/usePackages';
import Loading from 'components/loading/LoadingComponent';
import getPackageCategories from 'apps/dashboard/features/plugins/utils/getPackageCategories';
import Stack from '@mui/material/Stack';
import getPackagesByCategory from 'apps/dashboard/features/plugins/utils/getPackagesByCategory';
import PackageCard from 'apps/dashboard/features/plugins/components/PackageCard';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Settings from '@mui/icons-material/Settings';
import { Link } from 'react-router-dom';

export const Component = () => {
    const { data: packages, isPending: isPackagesPending } = usePackages();
    const [ searchQuery, setSearchQuery ] = useState('');

    const filteredPackages = useMemo(() => {
        return packages?.filter(i => i.name?.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()));
    }, [ packages, searchQuery ]);

    const packageCategories = getPackageCategories(filteredPackages);

    const updateSearchQuery = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, []);

    if (isPackagesPending) {
        return <Loading />;
    }

    return (
        <Page
            id='pluginCatalogPage'
            className='mainAnimatedPage type-interior'
            title={globalize.translate('TabCatalog')}
        >
            <Box className='content-primary'>
                <Stack spacing={3}>
                    <Stack direction='row' gap={1}>
                        <Typography variant='h1'>{globalize.translate('TabCatalog')}</Typography>
                        <IconButton
                            component={Link}
                            to='/dashboard/plugins/repositories'
                            sx={{
                                backgroundColor: 'background.paper'
                            }}
                        >
                            <Settings />
                        </IconButton>
                    </Stack>

                    <TextField
                        label={globalize.translate('Search')}
                        value={searchQuery}
                        onChange={updateSearchQuery}
                    />

                    {packageCategories.map(category => (
                        <Stack key={category} spacing={2}>
                            <Typography variant='h2'>{category}</Typography>

                            <Grid container spacing={2} columns={{ xs: 1, sm: 4, md: 9, lg: 8, xl: 10 }}>
                                {getPackagesByCategory(filteredPackages, category).map(pkg => (
                                    <Grid key={pkg.guid} size={{ xs: 1, sm: 2, md: 3, lg: 2 }}>
                                        <PackageCard
                                            pkg={pkg}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Stack>
                    ))}
                </Stack>
            </Box>
        </Page>
    );
};

Component.displayName = 'PluginsCatalogPage';
