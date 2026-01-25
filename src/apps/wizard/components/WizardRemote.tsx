import React, { useState } from 'react';

import { Button } from 'ui-primitives/Button';
import { Text, Heading } from 'ui-primitives/Text';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { Checkbox } from 'ui-primitives/Checkbox';
import { useNavigate } from '@tanstack/react-router';
import Loading from '../../../components/loading/LoadingComponent';
import * as styles from './WizardRemote.css';

const WizardRemote = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [remoteAccess, setRemoteAccess] = useState(true);
    const navigate = useNavigate();
    const apiClient = ServerConnections.currentApiClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const client = apiClient;
        if (!client) {
            setIsLoading(false);
            return;
        }
        const config = { EnableRemoteAccess: remoteAccess };

        await client.ajax({
            type: 'POST',
            data: JSON.stringify(config),
            url: client.getUrl('Startup/RemoteAccess'),
            contentType: 'application/json'
        });
        navigate({ to: '/wizard/finish' });
    };

    if (isLoading) return <Loading />;

    return (
        <div className={styles.container}>
            <Heading.H2 className={styles.title}>{globalize.translate('HeaderRemoteAccess')}</Heading.H2>
            <Text className={styles.helpText}>{globalize.translate('HeaderRemoteAccessHelp')}</Text>

            <form onSubmit={handleSubmit}>
                <div className={styles.checkboxGroup}>
                    <Checkbox checked={remoteAccess} onChange={e => setRemoteAccess(e.target.checked)}>
                        {globalize.translate('LabelEnableAutomaticPortMapping')}
                    </Checkbox>
                    <Button type="submit" size="lg" className={styles.submitButton}>
                        {globalize.translate('ButtonNext')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default WizardRemote;
