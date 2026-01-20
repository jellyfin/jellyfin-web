import React, { useEffect, useState } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { EmbyInput } from '../../../elements';
import { useNavigate } from 'react-router-dom';
import Loading from '../../../components/loading/LoadingComponent';
import toast from '../../../components/toast/toast';

const WizardUser = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();
    const apiClient = ServerConnections.currentApiClient();

    useEffect(() => {
        apiClient.ajax({ url: apiClient.getUrl('Startup/User'), type: 'GET' })
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
        try {
            await apiClient.ajax({
                type: 'POST',
                data: JSON.stringify({ Name: username.trim(), Password: password }),
                url: apiClient.getUrl('Startup/User'),
                contentType: 'application/json'
            });
            navigate('/wizard/library');
        } catch (err) {
            toast(globalize.translate('ErrorDefault'));
            setIsLoading(false);
        }
    };

    if (isLoading) return <Loading />;

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, p: 3 }}>
            <Typography level="h2" sx={{ mb: 1 }}>{globalize.translate('HeaderCreateUser')}</Typography>
            <Typography level="body-md" sx={{ mb: 4 }}>{globalize.translate('HeaderCreateUserHelp')}</Typography>
            
            <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    <EmbyInput
                        label={globalize.translate('LabelUsername')}
                        value={username}
                        onChange={(e: any) => setUsername(e.target.value)}
                        required
                        autoFocus
                    />
                    <EmbyInput
                        type="password"
                        label={globalize.translate('LabelPassword')}
                        value={password}
                        onChange={(e: any) => setPassword(e.target.value)}
                    />
                    <EmbyInput
                        type="password"
                        label={globalize.translate('LabelPasswordConfirm')}
                        value={confirmPassword}
                        onChange={(e: any) => setConfirmPassword(e.target.value)}
                    />
                    <Button type="submit" size="lg" sx={{ mt: 2 }}>
                        {globalize.translate('ButtonNext')}
                    </Button>
                </Stack>
            </form>
        </Box>
    );
};

export default WizardUser;
