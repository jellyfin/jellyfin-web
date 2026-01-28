import React, { useEffect, useState } from 'react';

import { Button } from 'ui-primitives';
import { Text, Heading } from 'ui-primitives';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { Input } from 'ui-primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives';
import { FormControl, FormLabel } from 'ui-primitives';
import { useNavigate } from '@tanstack/react-router';
import Loading from '../../../components/loading/LoadingComponent';
import * as styles from './WizardStart.css.ts';

const WizardStart = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [serverName, setServerName] = useState('');
    const [uiCulture, setUiCulture] = useState('');
    const [languages, setLanguages] = useState<any[]>([]);
    const navigate = useNavigate();
    const apiClient = ServerConnections.currentApiClient();

    useEffect(() => {
        const client = apiClient;
        if (!client) {
            setIsLoading(false);
            return;
        }
        Promise.all([
            client.getPublicSystemInfo(),
            client.ajax({ url: client.getUrl('Startup/Configuration'), type: 'GET' }).then((r: any) => r.json()),
            client.ajax({ url: client.getUrl('Localization/Options'), type: 'GET' }).then((r: any) => r.json())
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
        const client = apiClient;
        if (!client) {
            setIsLoading(false);
            return;
        }
        const config = await client
            .ajax({ url: client.getUrl('Startup/Configuration'), type: 'GET' })
            .then((r: any) => r.json());
        config.ServerName = serverName;
        config.UICulture = uiCulture;

        await client.ajax({
            type: 'POST',
            data: JSON.stringify(config),
            url: client.getUrl('Startup/Configuration'),
            contentType: 'application/json'
        });
        navigate({ to: '/wizard/user' });
    };

    if (isLoading) return <Loading />;

    return (
        <div className={styles.container}>
            <Heading.H2 className={styles.title}>{globalize.translate('HeaderWelcome')}</Heading.H2>
            <Text className={styles.helpText}>{globalize.translate('HeaderWelcomeHelp')}</Text>

            <form onSubmit={handleSubmit}>
                <div className={styles.formStack}>
                    <Input
                        label={globalize.translate('LabelServerName')}
                        value={serverName}
                        onChange={(e: any) => setServerName(e.target.value)}
                        required
                    />
                    <FormControl>
                        <FormLabel>{globalize.translate('LabelPreferredDisplayLanguage')}</FormLabel>
                        <Select value={uiCulture} onValueChange={setUiCulture}>
                            <SelectTrigger>
                                <SelectValue placeholder={globalize.translate('LabelPreferredDisplayLanguage')} />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map(l => (
                                    <SelectItem key={l.Value} value={l.Value}>
                                        {l.Name}
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

export default WizardStart;
