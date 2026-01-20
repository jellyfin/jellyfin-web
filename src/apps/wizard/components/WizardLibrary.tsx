import React, { useEffect, useState } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import Grid from '@mui/joy/Grid';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { useNavigate } from 'react-router-dom';
import Loading from '../../../components/loading/LoadingComponent';
import AddIcon from '@mui/icons-material/Add';
import BaseCard from '../../dashboard/components/BaseCard';
import imageHelper from '../../../utils/image';

const WizardLibrary = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [libraries, setLibraries] = useState<any[]>([]);
    const navigate = useNavigate();
    const apiClient = ServerConnections.currentApiClient();

    const loadLibraries = () => {
        apiClient.getVirtualFolders().then((result: any) => {
            setLibraries(result);
            setIsLoading(false);
        });
    };

    useEffect(() => {
        loadLibraries();
    }, [apiClient]);

    const handleAddLibrary = () => {
        import('../../../components/mediaLibraryCreator/mediaLibraryCreator').then(({ default: MediaLibraryCreator }: any) => {
            new MediaLibraryCreator({
                collectionTypeOptions: [
                    { name: globalize.translate('Movies'), value: 'movies' },
                    { name: globalize.translate('TabMusic'), value: 'music' },
                    { name: globalize.translate('Shows'), value: 'tvshows' },
                    { name: globalize.translate('Books'), value: 'books' },
                    { name: globalize.translate('HomeVideosPhotos'), value: 'homevideos' }
                ],
                refresh: false
            }).then((hasChanges: boolean) => {
                if (hasChanges) loadLibraries();
            });
        });
    };

    if (isLoading) return <Loading />;

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 8, p: 3 }}>
            <Typography level="h2" sx={{ mb: 1 }}>{globalize.translate('HeaderSetupLibraries')}</Typography>
            <Typography level="body-md" sx={{ mb: 4 }}>{globalize.translate('HeaderSetupLibrariesHelp')}</Typography>
            
            <Grid container spacing={3}>
                <Grid xs={12} sm={6} md={4}>
                    <BaseCard
                        title={globalize.translate('ButtonAddMediaLibrary')}
                        onClick={handleAddLibrary}
                        icon={<AddIcon sx={{ fontSize: 48 }} />}
                    />
                </Grid>
                {libraries.map(lib => (
                    <Grid key={lib.ItemId} xs={12} sm={6} md={4}>
                        <BaseCard
                            title={lib.Name}
                            text={lib.CollectionType}
                            image={lib.PrimaryImageItemId ? apiClient.getScaledImageUrl(lib.PrimaryImageItemId, { maxWidth: 400, type: 'Primary' }) : null}
                            icon={<span className={`material-icons ${imageHelper.getLibraryIcon(lib.CollectionType)}`} style={{ fontSize: 48 }} />}
                        />
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="lg" onClick={() => navigate('/wizard/settings')}>
                    {globalize.translate('ButtonNext')}
                </Button>
            </Box>
        </Box>
    );
};

export default WizardLibrary;
