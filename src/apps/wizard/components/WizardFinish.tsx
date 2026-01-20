import React, { useState } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import Loading from '../../../components/loading/LoadingComponent';

const WizardFinish = () => {
    const [isLoading, setIsLoading] = useState(false);
    const apiClient = ServerConnections.currentApiClient();

    const handleFinish = async () => {
        setIsLoading(true);
        await apiClient.ajax({
            url: apiClient.getUrl('Startup/Complete'),
            type: 'POST'
        });
        window.location.href = '';
    };

    if (isLoading) return <Loading />;

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, p: 3, textAlign: 'center' }}>
            <Typography level="h1" sx={{ mb: 2 }}>{globalize.translate('HeaderAllDone')}</Typography>
            <Typography level="body-lg" sx={{ mb: 6 }}>{globalize.translate('HeaderAllDoneHelp')}</Typography>
            
            <Button size="lg" onClick={handleFinish} sx={{ px: 6 }}>
                {globalize.translate('ButtonFinish')}
            </Button>
        </Box>
    );
};

export default WizardFinish;
