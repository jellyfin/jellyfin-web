import React, { useEffect, useState } from 'react';

import { Button } from 'ui-primitives/Button';
import { Text, Heading } from 'ui-primitives/Text';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { EmbyInput, EmbySelect } from '../../../elements';
import { useNavigate } from 'react-router-dom';
import Loading from '../../../components/loading/LoadingComponent';
import * as styles from './WizardStart.css';

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
        const config = await client.ajax({ url: client.getUrl('Startup/Configuration'), type: 'GET' }).then((r: any) => r.json());
        config.ServerName = serverName;
        config.UICulture = uiCulture;

        await client.ajax({
            type: 'POST',
            data: JSON.stringify(config),
            url: client.getUrl('Startup/Configuration'),
            contentType: 'application/json'
        });
        navigate('/wizard/user');
    };

    if (isLoading) return <Loading />;

    return (
        <div className={styles.container}>
            <Heading.H2 className={styles.title}>{globalize.translate('HeaderWelcome')}</Heading.H2>
            <Text className={styles.helpText}>{globalize.translate('HeaderWelcomeHelp')}</Text>
            
            <form onSubmit={handleSubmit}>
                <div className={styles.formStack}>
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
                    <Button type="submit" size="lg" className={styles.submitButton}>
                        {globalize.translate('ButtonNext')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default WizardStart;
