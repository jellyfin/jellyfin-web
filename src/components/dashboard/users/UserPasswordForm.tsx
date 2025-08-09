import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef } from 'react';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import Dashboard from '../../../utils/dashboard';
import globalize from '../../../lib/globalize';
import confirm from '../../confirm/confirm';
import loading from '../../loading/loading';
import toast from '../../toast/toast';
import Button from '../../../elements/emby-button/Button';
import Input from '../../../elements/emby-input/Input';

type IProps = {
    userId: string | null;
};

const UserPasswordForm: FunctionComponent<IProps> = ({ userId }: IProps) => {
    const element = useRef<HTMLDivElement>(null);
    const user = useRef<UserDto>();
    const libraryMenu = useMemo(async () => ((await import('../../../scripts/libraryMenu')).default), []);

    const loadUser = useCallback(async () => {
        const page = element.current;

        if (!page) {
            console.error('[UserPasswordForm] Unexpected null page reference');
            return;
        }

        if (!userId) {
            console.error('[UserPasswordForm] missing user id');
            return;
        }

        user.current = await window.ApiClient.getUser(userId);
        const loggedInUser = await Dashboard.getCurrentUser();

        if (!user.current.Policy || !user.current.Configuration) {
            throw new Error('Unexpected null user policy or configuration');
        }

        (await libraryMenu).setTitle(user.current.Name);

        if (user.current.HasConfiguredPassword) {
            if (!user.current.Policy?.IsAdministrator) {
                (page.querySelector('#btnResetPassword') as HTMLDivElement).classList.remove('hide');
            }
            (page.querySelector('#fldCurrentPassword') as HTMLDivElement).classList.remove('hide');
        } else {
            (page.querySelector('#btnResetPassword') as HTMLDivElement).classList.add('hide');
            (page.querySelector('#fldCurrentPassword') as HTMLDivElement).classList.add('hide');
        }

        const canChangePassword = loggedInUser?.Policy?.IsAdministrator || user.current.Policy.EnableUserPreferenceAccess;
        (page.querySelector('.passwordSection') as HTMLDivElement).classList.toggle('hide', !canChangePassword);

        import('../../autoFocuser').then(({ default: autoFocuser }) => {
            autoFocuser.autoFocus(page);
        }).catch(err => {
            console.error('[UserPasswordForm] failed to load autofocuser', err);
        });

        (page.querySelector('#txtCurrentPassword') as HTMLInputElement).value = '';
        (page.querySelector('#txtNewPassword') as HTMLInputElement).value = '';
        (page.querySelector('#txtNewPasswordConfirm') as HTMLInputElement).value = '';
    }, [userId]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('[UserPasswordForm] Unexpected null page reference');
            return;
        }

        loadUser().catch(err => {
            console.error('[UserPasswordForm] failed to load user', err);
        });

        const onSubmit = (e: Event) => {
            if ((page.querySelector('#txtNewPassword') as HTMLInputElement).value != (page.querySelector('#txtNewPasswordConfirm') as HTMLInputElement).value) {
                toast(globalize.translate('PasswordMatchError'));
            } else if ((page.querySelector('#txtNewPassword') as HTMLInputElement).value == '' && user.current?.Policy?.IsAdministrator) {
                toast(globalize.translate('PasswordMissingSaveError'));
            } else {
                loading.show();
                savePassword();
            }

            e.preventDefault();
            return false;
        };

        const savePassword = () => {
            if (!userId) {
                console.error('[UserPasswordForm.savePassword] missing user id');
                return;
            }

            let currentPassword = (page.querySelector('#txtCurrentPassword') as HTMLInputElement).value;
            const newPassword = (page.querySelector('#txtNewPassword') as HTMLInputElement).value;

            if ((page.querySelector('#fldCurrentPassword') as HTMLDivElement).classList.contains('hide')) {
                // Firefox does not respect autocomplete=off, so clear it if the field is supposed to be hidden (and blank)
                // This should only happen when user.HasConfiguredPassword is false, but this information is not passed on
                currentPassword = '';
            }

            window.ApiClient.updateUserPassword(userId, currentPassword, newPassword).then(() => {
                loading.hide();
                toast(globalize.translate('PasswordSaved'));

                loadUser().catch(err => {
                    console.error('[UserPasswordForm] failed to load user', err);
                });
            }, () => {
                loading.hide();
                Dashboard.alert({
                    title: globalize.translate('HeaderLoginFailure'),
                    message: globalize.translate('MessageInvalidUser')
                });
            });
        };

        const resetPassword = () => {
            if (!userId) {
                console.error('[UserPasswordForm.resetPassword] missing user id');
                return;
            }

            const msg = globalize.translate('PasswordResetConfirmation');
            confirm(msg, globalize.translate('ResetPassword')).then(() => {
                loading.show();
                window.ApiClient.resetUserPassword(userId).then(() => {
                    loading.hide();
                    Dashboard.alert({
                        message: globalize.translate('PasswordResetComplete'),
                        title: globalize.translate('ResetPassword')
                    });
                    loadUser().catch(err => {
                        console.error('[UserPasswordForm] failed to load user', err);
                    });
                }).catch(err => {
                    console.error('[UserPasswordForm] failed to reset user password', err);
                });
            }).catch(() => {
                // confirm dialog was closed
            });
        };

        (page.querySelector('.updatePasswordForm') as HTMLFormElement).addEventListener('submit', onSubmit);
        (page.querySelector('#btnResetPassword') as HTMLButtonElement).addEventListener('click', resetPassword);
    }, [loadUser, userId]);

    return (
        <div ref={element}>
            <form
                className='updatePasswordForm passwordSection hide'
                style={{ margin: '0 auto 2em' }}
            >
                <div className='detailSection'>
                    <div id='fldCurrentPassword' className='inputContainer hide'>
                        <Input
                            type='password'
                            id='txtCurrentPassword'
                            label={globalize.translate('LabelCurrentPassword')}
                            autoComplete='off'
                        />
                    </div>
                    <div className='inputContainer'>
                        <Input
                            type='password'
                            id='txtNewPassword'
                            label={globalize.translate('LabelNewPassword')}
                            autoComplete='off'
                        />
                    </div>
                    <div className='inputContainer'>
                        <Input
                            type='password'
                            id='txtNewPasswordConfirm'
                            label={globalize.translate('LabelNewPasswordConfirm')}
                            autoComplete='off'
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
                            className='raised button-cancel block hide'
                            title={globalize.translate('ResetPassword')}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UserPasswordForm;
