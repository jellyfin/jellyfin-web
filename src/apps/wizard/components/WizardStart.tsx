import React, { useEffect, useState } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { EmbyInput, EmbySelect } from '../../../elements';
import { useNavigate } from 'react-router-dom';
import Loading from '../../../components/loading/LoadingComponent';

const WizardStart = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [serverName, setServerName] = useState('');
    const [uiCulture, setUiCulture] = useState('');
    const [languages, setLanguages] = useState<any[]>([]);
    const navigate = useNavigate();
    const apiClient = ServerConnections.currentApiClient();

    useEffect(() => {
        Promise.all([
            apiClient.getPublicSystemInfo(),
            apiClient.ajax({ url: apiClient.getUrl('Startup/Configuration'), type: 'GET' }).then((r: any) => r.json()),
            apiClient.ajax({ url: apiClient.getUrl('Localization/Options'), type: 'GET' }).then((r: any) => r.json())
        ]).then(([systemInfo, config, languageOptions]) => {
            setServerName(config.ServerName || systemInfo.ServerName);
            setUiCulture(config.UICulture);
            setLanguages(languageOptions);
            setIsLoading(false);
        });
    }, [apiClient]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const config = await apiClient.ajax({ url: apiClient.getUrl('Startup/Configuration'), type: 'GET' }).then((r: any) => r.json());
        config.ServerName = serverName;
        config.UICulture = uiCulture;

        await apiClient.ajax({
            type: 'POST',
            data: JSON.stringify(config),
            url: apiClient.getUrl('Startup/Configuration'),
            contentType: 'application/json'
        });
        navigate('/wizard/user');
    };

    if (isLoading) return <Loading />;

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, p: 3 }}>
            <Typography level="h2" sx={{ mb: 1 }}>{globalize.translate('HeaderWelcome')}</Typography>
            <Typography level="body-md" sx={{ mb: 4 }}>{globalize.translate('HeaderWelcomeHelp')}</Typography>
            
            <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    <EmbyInput
                        label={globalize.translate('LabelServerName')}
                        value={serverName}
                        onChange={(e: any) => setServerName(e.target.value)}
                        required
                    />
                    <EmbySelect
                        label={globalize.translate('LabelPreferredDisplayLanguage')}
                        value={uiCulture}
                        onChange={(_: any, val: any) => setUiCulture(val)}
                        options={languages.map(l => ({ label: l.Name, value: l.Value }))}
                    />
                    <Button type="submit" size="lg" sx={{ mt: 2 }}>
                        {globalize.translate('ButtonNext')}
                    </Button>
                </Stack>
            </form>
        </Box>
    );
};

export default WizardStart;
