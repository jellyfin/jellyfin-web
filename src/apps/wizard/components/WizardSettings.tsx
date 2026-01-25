import React, { useEffect, useState } from 'react';

import { Button } from 'ui-primitives/Button';
import { Text, Heading } from 'ui-primitives/Text';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives/Select';
import { FormControl, FormLabel } from 'ui-primitives/FormControl';
import { useNavigate } from '@tanstack/react-router';
import Loading from '../../../components/loading/LoadingComponent';
import * as styles from './WizardSettings.css';

const WizardSettings = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [language, setLanguage] = useState('');
    const [country, setCountry] = useState('');
    const [languages, setLanguages] = useState<any[]>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const navigate = useNavigate();
    const apiClient = ServerConnections.currentApiClient();

    useEffect(() => {
        const client = apiClient;
        if (!client) {
            setIsLoading(false);
            return;
        }
        Promise.all([
            client.ajax({ url: client.getUrl('Startup/Configuration'), type: 'GET' }).then((r: any) => r.json()),
            client.getCultures(),
            client.getCountries()
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
        const client = apiClient;
        if (!client) {
            setIsLoading(false);
            return;
        }
        const config = await client
            .ajax({ url: client.getUrl('Startup/Configuration'), type: 'GET' })
            .then((r: any) => r.json());
        config.PreferredMetadataLanguage = language;
        config.MetadataCountryCode = country;

        await client.ajax({
            type: 'POST',
            data: JSON.stringify(config),
            url: client.getUrl('Startup/Configuration'),
            contentType: 'application/json'
        });
        navigate({ to: '/wizard/remoteaccess' });
    };

    if (isLoading) return <Loading />;

    return (
        <div className={styles.container}>
            <Heading.H2 className={styles.title}>{globalize.translate('HeaderMetadataSettings')}</Heading.H2>
            <Text className={styles.helpText}>{globalize.translate('HeaderMetadataSettingsHelp')}</Text>

            <form onSubmit={handleSubmit}>
                <div className={styles.formStack}>
                    <FormControl>
                        <FormLabel>{globalize.translate('LabelPreferredMetadataLanguage')}</FormLabel>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger>
                                <SelectValue placeholder={globalize.translate('LabelPreferredMetadataLanguage')} />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map(l => (
                                    <SelectItem key={l.TwoLetterISOLanguageName} value={l.TwoLetterISOLanguageName}>
                                        {l.DisplayName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormControl>
                    <FormControl>
                        <FormLabel>{globalize.translate('LabelCountry')}</FormLabel>
                        <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger>
                                <SelectValue placeholder={globalize.translate('LabelCountry')} />
                            </SelectTrigger>
                            <SelectContent>
                                {countries.map(c => (
                                    <SelectItem key={c.TwoLetterISORegionName} value={c.TwoLetterISORegionName}>
                                        {c.DisplayName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormControl>
                    <Button type="submit" size="lg" className={styles.submitButton}>
                        {globalize.translate('ButtonNext')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default WizardSettings;
