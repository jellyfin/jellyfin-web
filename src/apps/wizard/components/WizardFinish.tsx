import React, { useState } from 'react';

import { Button } from 'ui-primitives/Button';
import { Text, Heading } from 'ui-primitives/Text';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import Loading from '../../../components/loading/LoadingComponent';
import * as styles from './WizardFinish.css';

const WizardFinish = () => {
    const [isLoading, setIsLoading] = useState(false);
    const apiClient = ServerConnections.currentApiClient();

    const handleFinish = async () => {
        setIsLoading(true);
        const client = apiClient;
        if (!client) {
            setIsLoading(false);
            return;
        }
        await client.ajax({
            url: client.getUrl('Startup/Complete'),
            type: 'POST'
        });
        window.location.href = '';
    };

    if (isLoading) return <Loading />;

    return (
        <div className={styles.container}>
            <Heading.H1 className={styles.title}>{globalize.translate('HeaderAllDone')}</Heading.H1>
            <Text size="lg" className={styles.helpText}>{globalize.translate('HeaderAllDoneHelp')}</Text>
            
            <Button size="lg" onClick={handleFinish} className={styles.finishButton}>
                {globalize.translate('ButtonFinish')}
            </Button>
        </div>
    );
};

export default WizardFinish;
