import { ForgotPasswordAction } from '@jellyfin/sdk/lib/generated-client/models/forgot-password-action';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useMutation } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';

import alert from 'components/alert';
import Page from 'components/Page';
import { Button } from 'ui-primitives/Button';
import { Input } from 'ui-primitives/Input';
import globalize from 'lib/globalize';
import ServerConnections from 'lib/jellyfin-apiclient/ServerConnections';

export const ForgotPasswordPage = () => {
    const router = useRouter();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');

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
        onSuccess: result => {
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
                    msg += '<br/><br/>';
                    msg += globalize.translate('MessageForgotPasswordPinReset');
                    msg += '<br/><br/>';
                    msg += result.PinFile;
                    msg += '<br/>';
                    callback = () => {
                        void navigate({ to: '/forgotpasswordpin' });
                    };
                    break;
                default:
                    return;
            }

            return alert({
                text: msg,
                title: globalize.translate('ButtonForgotPassword')
            }).then(() => {
                if (callback) callback();
            });
        }
    });

    const handleCancel = useCallback(() => {
        router.history.back();
    }, [router.history]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            forgotPasswordMutation.mutate(username);
        },
        [username, forgotPasswordMutation]
    );

    const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    }, []);

    return (
        <Page id="forgotPasswordPage" className="standalonePage forgotPasswordPage mainAnimatedPage" shouldAutoFocus>
            <div className="padded-left padded-right padded-bottom-page">
                <form
                    className="forgotPasswordForm"
                    style={{ textAlign: 'center', margin: '0 auto' }}
                    onSubmit={handleSubmit}
                >
                    <div style={{ textAlign: 'left' }}>
                        <h1>{globalize.translate('ButtonForgotPassword')}</h1>

                        <div className="inputContainer">
                            <Input
                                type="text"
                                id="txtName"
                                label={globalize.translate('LabelUser')}
                                autoComplete="off"
                                value={username}
                                onChange={handleUsernameChange}
                            />
                            <div className="fieldDescription">
                                {globalize.translate('LabelForgotPasswordUsernameHelp')}
                            </div>
                        </div>

                        <div>
                            <Button type="submit" id="btnSubmit" className="raised submit block">
                                {globalize.translate('ButtonSubmit')}
                            </Button>

                            <Button
                                type="button"
                                id="btnCancel"
                                className="raised cancel block btnCancel"
                                onClick={handleCancel}
                            >
                                {globalize.translate('ButtonCancel')}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </Page>
    );
};

export default ForgotPasswordPage;
