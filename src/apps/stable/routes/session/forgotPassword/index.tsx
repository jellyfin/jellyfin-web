import React, { useCallback, useState } from 'react';
import Page from 'components/Page';
import { useNavigate } from 'react-router-dom';
import globalize from 'lib/globalize';
import Button from 'elements/emby-button/Button';
import Input from 'elements/emby-input/Input';
import ServerConnections from 'components/ServerConnections';
import { useMutation } from '@tanstack/react-query';
import Dashboard from 'utils/dashboard';

export const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');

    const apiClient = ServerConnections.currentApiClient();

    const forgotPasswordMutation = useMutation({
        mutationFn: (enteredUsername: string) => {
            if (!apiClient) {
                throw new Error('API client is not available');
            }
            return apiClient.ajax({
                type: 'POST',
                url: apiClient.getUrl('Users/ForgotPassword'),
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({
                    EnteredUsername: enteredUsername
                })
            });
        },
        onSuccess: (result) => {
            if (result.Action == 'ContactAdmin') {
                Dashboard.alert({
                    message: globalize.translate('MessageContactAdminToResetPassword'),
                    title: globalize.translate('ButtonForgotPassword')
                });
            }

            if (result.Action == 'InNetworkRequired') {
                Dashboard.alert({
                    message: globalize.translate('MessageForgotPasswordInNetworkRequired'),
                    title: globalize.translate('ButtonForgotPassword')
                });
            }

            if (result.Action == 'PinCode') {
                navigate('/forgotpasswordpin');
            }
        }
    });

    const handleCancel = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        forgotPasswordMutation.mutate(username);
    }, [username, forgotPasswordMutation]);

    const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    }, []);

    return (
        <Page
            id='forgotPasswordPage'
            className='page standalonePage forgotPasswordPage mainAnimatedPage'
        >
            <div className='padded-left padded-right padded-bottom-page'>
                <form
                    className='forgotPasswordForm'
                    style={{ textAlign: 'center', margin: '0 auto' }}
                    onSubmit={handleSubmit}
                >
                    <div style={{ textAlign: 'left' }}>
                        <h1>{globalize.translate('ButtonForgotPassword')}</h1>

                        <div className='inputContainer'>
                            <Input
                                type='text'
                                id='txtName'
                                label={globalize.translate('LabelUser')}
                                autoComplete='off'
                                value={username}
                                onChange={handleUsernameChange}
                            />
                            <div className='fieldDescription'>
                                {globalize.translate('LabelForgotPasswordUsernameHelp')}
                            </div>
                        </div>

                        <div>
                            <Button
                                type='submit'
                                id='btnSubmit'
                                className='raised submit block'
                                title={globalize.translate('ButtonSubmit')}
                            />

                            <Button
                                type='button'
                                id='btnCancel'
                                className='raised cancel block btnCancel'
                                title={globalize.translate('ButtonCancel')}
                                onClick={handleCancel}
                            />
                        </div>
                    </div>
                </form>
            </div>
        </Page>
    );
};

export default ForgotPasswordPage;
