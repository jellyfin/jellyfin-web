import React, { useCallback } from 'react';
import WizardPage from 'apps/wizard/components/WizardPage';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import globalize from 'lib/globalize';
import Button from '@mui/material/Button';
import Add from '@mui/icons-material/Add';
import { useVirtualFolders } from 'apps/dashboard/features/libraries/api/useVirtualFolders';
import Loading from 'components/loading/LoadingComponent';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LibraryCard from 'apps/dashboard/features/libraries/components/LibraryCard';
import MediaLibraryCreator from 'components/mediaLibraryCreator/mediaLibraryCreator';
import getCollectionTypeOptions from 'apps/dashboard/features/libraries/utils/collectionTypeOptions';
import { queryClient } from 'utils/query/queryClient';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export const Component = () => {
    const { data: virtualFolders, isPending: isVirtualFoldersPending } = useVirtualFolders();
    const navigate = useNavigate();

    const showMediaLibraryCreator = useCallback(() => {
        const mediaLibraryCreator = new MediaLibraryCreator({
            collectionTypeOptions: getCollectionTypeOptions(),
            refresh: true
        }) as Promise<boolean>;

        void mediaLibraryCreator.then((hasChanges: boolean) => {
            if (hasChanges) {
                void queryClient.invalidateQueries({
                    queryKey: ['VirtualFolders']
                });
            }
        });
    }, []);

    const onPrevious = useCallback(() => {
        navigate('/wizard/user');
    }, [ navigate ]);

    const onNext = useCallback(() => {
        navigate('/wizard/settings');
    }, [ navigate ]);

    if (isVirtualFoldersPending) return <Loading />;

    return (
        <WizardPage
            id='wizardLibraryPage'
            onPrevious={onPrevious}
            onNext={onNext}
        >
            <Stack spacing={3}>
                <Stack direction='row' justifyContent={'space-between'} alignItems={'center'}>
                    <Typography variant='h1'>{globalize.translate('HeaderSetupLibrary')}</Typography>
                    <Button
                        startIcon={<HelpOutlineIcon />}
                        variant='outlined'
                        component={RouterLink}
                        to='https://jellyfin.org/docs/general/server/libraries/'
                        target='_blank'
                    >
                        {globalize.translate('Help')}
                    </Button>
                </Stack>

                <Button
                    startIcon={<Add />}
                    sx={{ alignSelf: 'flex-start' }}
                    onClick={showMediaLibraryCreator}
                >
                    {globalize.translate('ButtonAddMediaLibrary')}
                </Button>

                <Box>
                    <Grid container spacing={2}>
                        {virtualFolders?.map(virtualFolder => (
                            <Grid
                                key={virtualFolder?.ItemId}
                                item
                                xs={12}
                                sm={4}
                            >
                                <LibraryCard
                                    virtualFolder={virtualFolder}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Stack>
        </WizardPage>
    );
};

Component.displayName = 'StartupLibraryPage';
