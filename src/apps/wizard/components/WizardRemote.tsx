import React, { useState } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { EmbyCheckbox } from '../../../elements';
import { useNavigate } from 'react-router-dom';
import Loading from '../../../components/loading/LoadingComponent';

const WizardRemote = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [remoteAccess, setRemoteAccess] = useState(true);
    const navigate = useNavigate();
    const apiClient = ServerConnections.currentApiClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const config = { EnableRemoteAccess: remoteAccess };

        await apiClient.ajax({
            type: 'POST',
            data: JSON.stringify(config),
            url: apiClient.getUrl('Startup/RemoteAccess'),
            contentType: 'application/json'
        });
        navigate('/wizard/finish');
    };

    if (isLoading) return <Loading />;

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, p: 3 }}>
            <Typography level="h2" sx={{ mb: 1 }}>{globalize.translate('HeaderRemoteAccess')}</Typography>
            <Typography level="body-md" sx={{ mb: 4 }}>{globalize.translate('HeaderRemoteAccessHelp')}</Typography>
            
            <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    <EmbyCheckbox
                        label={globalize.translate('LabelEnableAutomaticPortMapping')}
                        checked={remoteAccess}
                        onChange={(e) => setRemoteAccess(e.target.checked)}
                    />
                    <Button type="submit" size="lg" sx={{ mt: 2 }}>
                        {globalize.translate('ButtonNext')}
                    </Button>
                </Stack>
            </form>
        </Box>
    );
};

export default WizardRemote;
