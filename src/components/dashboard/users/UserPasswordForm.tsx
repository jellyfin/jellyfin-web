import React, { type FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import Dashboard from '../../../utils/dashboard';
import globalize from '../../../lib/globalize';
import confirm from '../../confirm/confirm';
import loading from '../../loading/loading';
import toast from '../../toast/toast';
import Button from '../../../elements/emby-button/Button';
import Input from '../../../elements/emby-input/Input';
import { logger } from '../../../utils/logger';

interface UserPasswordFormProps {
    user: UserDto;
}

const UserPasswordForm: FunctionComponent<UserPasswordFormProps> = ({ user }) => {
    const element = useRef<HTMLDivElement>(null);
    const libraryMenu = useMemo(async () => ((await import('../../../scripts/libraryMenu')).default), []);

    // React state instead of DOM manipulation
    const [showResetButton, setShowResetButton] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

    const clearForm = useCallback(() => {
        setCurrentPassword('');
        setNewPassword('');
        setNewPasswordConfirm('');
    }, []);

    const loadUser = useCallback(async () => {
        const page = element.current;

        if (!page) {
            logger.error('Unexpected null page reference', { component: 'UserPasswordForm' });
            return;
        }

        const loggedInUser = await Dashboard.getCurrentUser();

        if (!user.Policy || !user.Configuration) {
            throw new Error('Unexpected null user policy or configuration');
        }

        (await libraryMenu).setTitle(user.Name);

        // Update visibility states based on user configuration
        if (user.HasConfiguredPassword) {
            setShowResetButton(!user.Policy?.IsAdministrator);
            setShowCurrentPassword(true);
        } else {
            setShowResetButton(false);
            setShowCurrentPassword(false);
        }

        const canChangePassword = loggedInUser?.Policy?.IsAdministrator || user.Policy.EnableUserPreferenceAccess;
        setShowPasswordSection(Boolean(canChangePassword));

        // Auto-focus
        import('../../autoFocuser').then(({ default: autoFocuser }) => {
            autoFocuser.autoFocus(page);
        }).catch(err => {
            logger.error('Failed to load autofocuser', { component: 'UserPasswordForm' }, err as Error);
        });

        clearForm();
    }, [user, libraryMenu, clearForm]);

    useEffect(() => {
        loadUser().catch(err => {
            logger.error('Failed to load user', { component: 'UserPasswordForm' }, err as Error);
        });
    }, [loadUser]);

    const savePassword = useCallback(() => {
        if (!user.Id) {
            logger.error('Missing user id', { component: 'UserPasswordForm.savePassword' });
            return;
        }

        // If current password field is hidden, don't send it
        const passwordToSend = showCurrentPassword ? currentPassword : '';

        window.ApiClient.updateUserPassword(user.Id, passwordToSend, newPassword).then(() => {
            loading.hide();
            toast(globalize.translate('PasswordSaved'));
            loadUser().catch(err => {
                logger.error('Failed to load user', { component: 'UserPasswordForm' }, err as Error);
            });
        }, () => {
            loading.hide();
            Dashboard.alert({
                title: globalize.translate('HeaderLoginFailure'),
                message: globalize.translate('MessageInvalidUser')
            });
        });
    }, [user.Id, showCurrentPassword, currentPassword, newPassword, loadUser]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== newPasswordConfirm) {
            toast(globalize.translate('PasswordMatchError'));
        } else if (newPassword === '' && user?.Policy?.IsAdministrator) {
            toast(globalize.translate('PasswordMissingSaveError'));
        } else {
            loading.show();
            savePassword();
        }
    }, [newPassword, newPasswordConfirm, user?.Policy?.IsAdministrator, savePassword]);

    const handleResetPassword = useCallback(() => {
        const msg = globalize.translate('PasswordResetConfirmation');
        confirm(msg, globalize.translate('ResetPassword')).then(() => {
            loading.show();
            if (user.Id) {
                window.ApiClient.resetUserPassword(user.Id).then(() => {
                    loading.hide();
                    Dashboard.alert({
                        message: globalize.translate('PasswordResetComplete'),
                        title: globalize.translate('ResetPassword')
                    });
                    loadUser().catch(err => {
                        logger.error('Failed to load user', { component: 'UserPasswordForm' }, err as Error);
                    });
                }).catch(err => {
                    logger.error('Failed to reset user password', { component: 'UserPasswordForm' }, err as Error);
                });
            }
        }).catch(() => {
            // confirm dialog was closed
        });
    }, [user.Id, loadUser]);

    return (
        <div ref={element}>
            <form
                className={`updatePasswordForm passwordSection${showPasswordSection ? '' : ' hide'}`}
                style={{ margin: '0 auto 2em' }}
                onSubmit={handleSubmit}
            >
                <div className='detailSection'>
                    <div className={`inputContainer${showCurrentPassword ? '' : ' hide'}`}>
                        <Input
                            type='password'
                            id='txtCurrentPassword'
                            label={globalize.translate('LabelCurrentPassword')}
                            autoComplete='off'
                            value={currentPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                        />
                    </div>
                    <div className='inputContainer'>
                        <Input
                            type='password'
                            id='txtNewPassword'
                            label={globalize.translate('LabelNewPassword')}
                            autoComplete='off'
                            value={newPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                        />
                    </div>
                    <div className='inputContainer'>
                        <Input
                            type='password'
                            id='txtNewPasswordConfirm'
                            label={globalize.translate('LabelNewPasswordConfirm')}
                            autoComplete='off'
                            value={newPasswordConfirm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPasswordConfirm(e.target.value)}
                        />
                    </div>
                    <br />
                    <div>
                        <Button
                            type='submit'
                            className='raised button-submit block'
                            title={globalize.translate('SavePassword')}
                        />
                        <Button
                            type='button'
                            id='btnResetPassword'
                            className={`raised button-cancel block${showResetButton ? '' : ' hide'}`}
                            title={globalize.translate('ResetPassword')}
                            onClick={handleResetPassword}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UserPasswordForm;
