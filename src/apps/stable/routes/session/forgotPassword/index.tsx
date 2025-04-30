import React, { useCallback, useState } from 'react';
import Page from 'components/Page';
import { useNavigate } from 'react-router-dom';
import globalize from 'lib/globalize';
import Button from 'elements/emby-button/Button';
import Input from 'elements/emby-input/Input';
import { useMutation } from '@tanstack/react-query';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { ForgotPasswordAction } from '@jellyfin/sdk/lib/generated-client/models/forgot-password-action';
import ServerConnections from 'components/ServerConnections';
import SimpleAlert from 'components/SimpleAlert';

export const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string>('');
    const [alertCallback, setAlertCallback] = useState<(() => void) | undefined>(undefined);

    const forgotPasswordMutation = useMutation({
        mutationFn: async (enteredUsername: string) => {
            const currentApi = ServerConnections.getCurrentApi();
            if (!currentApi) {
                throw new Error('API not available');
            }
            const response = await getUserApi(currentApi).forgotPassword({
                forgotPasswordDto: {
                    EnteredUsername: enteredUsername
                }
            });

            return response.data;
        },
        onSuccess: (result) => {
            let msg = '';
            let callback: () => void | undefined = () => undefined;

            switch (result.Action) {
                case ForgotPasswordAction.ContactAdmin:
                    msg = globalize.translate('MessageContactAdminToResetPassword');
                    break;
                case ForgotPasswordAction.InNetworkRequired:
                    msg = globalize.translate('MessageForgotPasswordInNetworkRequired');
                    break;
                case ForgotPasswordAction.PinCode:
                    msg = globalize.translate('MessageForgotPasswordFileCreated');
                    msg += ': ';
                    msg += result.PinFile;
                    callback = () => navigate('/forgotpasswordpin');
                    break;
                default:
                    return;
            }

            setAlertMessage(msg);
            setAlertCallback(() => callback);
            setIsAlertOpen(true);
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

    const handleAlertClose = useCallback(() => {
        setIsAlertOpen(false);
        if (alertCallback) {
            alertCallback();
        }
    }, [alertCallback]);

    return (
        <Page
            id='forgotPasswordPage'
            className='page standalonePage forgotPasswordPage mainAnimatedPage'
        >
            <SimpleAlert
                open={isAlertOpen}
                text={alertMessage}
                onClose={handleAlertClose}
            />
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
