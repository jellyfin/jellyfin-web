import React, { useEffect, useState } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { EmbySelect } from '../../../elements';
import { useNavigate } from 'react-router-dom';
import Loading from '../../../components/loading/LoadingComponent';

const WizardSettings = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [language, setLanguage] = useState('');
    const [country, setCountry] = useState('');
    const [languages, setLanguages] = useState<any[]>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const navigate = useNavigate();
    const apiClient = ServerConnections.currentApiClient();

    useEffect(() => {
        Promise.all([
            apiClient.ajax({ url: apiClient.getUrl('Startup/Configuration'), type: 'GET' }).then((r: any) => r.json()),
            apiClient.getCultures(),
            apiClient.getCountries()
        ]).then(([config, cultureList, countryList]) => {
            setLanguage(config.PreferredMetadataLanguage || '');
            setCountry(config.MetadataCountryCode || '');
            setLanguages(cultureList);
            setCountries(countryList);
            setIsLoading(false);
        });
    }, [apiClient]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const config = await apiClient.ajax({ url: apiClient.getUrl('Startup/Configuration'), type: 'GET' }).then((r: any) => r.json());
        config.PreferredMetadataLanguage = language;
        config.MetadataCountryCode = country;

        await apiClient.ajax({
            type: 'POST',
            data: JSON.stringify(config),
            url: apiClient.getUrl('Startup/Configuration'),
            contentType: 'application/json'
        });
        navigate('/wizard/remoteaccess');
    };

    if (isLoading) return <Loading />;

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, p: 3 }}>
            <Typography level="h2" sx={{ mb: 1 }}>{globalize.translate('HeaderMetadataSettings')}</Typography>
            <Typography level="body-md" sx={{ mb: 4 }}>{globalize.translate('HeaderMetadataSettingsHelp')}</Typography>
            
            <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    <EmbySelect
                        label={globalize.translate('LabelPreferredMetadataLanguage')}
                        value={language}
                        onChange={(_: any, val: any) => setLanguage(val)}
                        options={languages.map(l => ({ label: l.DisplayName, value: l.TwoLetterISOLanguageName }))}
                    />
                    <EmbySelect
                        label={globalize.translate('LabelCountry')}
                        value={country}
                        onChange={(_: any, val: any) => setCountry(val)}
                        options={countries.map(c => ({ label: c.DisplayName, value: c.TwoLetterISORegionName }))}
                    />
                    <Button type="submit" size="lg" sx={{ mt: 2 }}>
                        {globalize.translate('ButtonNext')}
                    </Button>
                </Stack>
            </form>
        </Box>
    );
};

export default WizardSettings;
