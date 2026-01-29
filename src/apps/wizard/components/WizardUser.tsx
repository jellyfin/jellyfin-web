import { useNavigate } from '@tanstack/react-router';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import React, { useEffect, useState } from 'react';
import { Button, Heading, Input, Text } from 'ui-primitives';
import Loading from '../../../components/loading/LoadingComponent';
import toast from '../../../components/toast/toast';
import * as styles from './WizardUser.css.ts';

const WizardUser = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();
    const apiClient = ServerConnections.currentApiClient();

    useEffect(() => {
        if (!apiClient) {
            setIsLoading(false);
            return;
        }
        apiClient
            .ajax({ url: apiClient.getUrl('Startup/User'), type: 'GET' })
            .then((r: any) => r.json())
            .then((user: any) => {
                setUsername(user.Name || '');
                setIsLoading(false);
            });
    }, [apiClient]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast(globalize.translate('PasswordMatchError'));
            return;
        }

        setIsLoading(true);
        const client = apiClient;
        if (!client) {
            toast(globalize.translate('ErrorDefault'));
            setIsLoading(false);
            return;
        }
        try {
            await client.ajax({
                type: 'POST',
                data: JSON.stringify({ Name: username.trim(), Password: password }),
                url: client.getUrl('Startup/User'),
                contentType: 'application/json'
            });
            navigate({ to: '/wizard/library' });
        } catch (err) {
            toast(globalize.translate('ErrorDefault'));
            setIsLoading(false);
        }
    };

    if (isLoading) return <Loading />;

    return (
        <div className={styles.container}>
            <Heading.H2 className={styles.title}>
                {globalize.translate('HeaderCreateUser')}
            </Heading.H2>
            <Text className={styles.helpText}>{globalize.translate('HeaderCreateUserHelp')}</Text>

            <form onSubmit={handleSubmit}>
                <div className={styles.formStack}>
                    <Input
                        label={globalize.translate('LabelUsername')}
                        value={username}
                        onChange={(e: any) => setUsername(e.target.value)}
                        required
                        autoFocus
                    />
                    <Input
                        type="password"
                        label={globalize.translate('LabelPassword')}
                        value={password}
                        onChange={(e: any) => setPassword(e.target.value)}
                    />
                    <Input
                        type="password"
                        label={globalize.translate('LabelPasswordConfirm')}
                        value={confirmPassword}
                        onChange={(e: any) => setConfirmPassword(e.target.value)}
                    />
                    <Button type="submit" size="lg" className={styles.submitButton}>
                        {globalize.translate('ButtonNext')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default WizardUser;
