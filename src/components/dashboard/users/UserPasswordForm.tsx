import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef } from 'react';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import Dashboard from '@/utils/dashboard';
import globalize from '@/lib/globalize';
import confirm from '@/components/confirm/confirm';
import loading from '@/components/loading/loading';
import toast from '@/components/toast/toast';
import Button from '@/elements/emby-button/Button';
import Input from '@/elements/emby-input/Input';

type IProps = {
    user: UserDto
};

const UserPasswordForm: FunctionComponent<IProps> = ({ user }: IProps) => {
    const element = useRef<HTMLDivElement>(null);
    const libraryMenu = useMemo(async () => ((await import('../../../scripts/libraryMenu')).default), []);

    const loadUser = useCallback(async () => {
        const page = element.current;

        if (!page) {
            console.error('[UserPasswordForm] Unexpected null page reference');
            return;
        }

        const loggedInUser = await Dashboard.getCurrentUser();

        if (!user.Policy || !user.Configuration) {
            throw new Error('Unexpected null user policy or configuration');
        }

        (await libraryMenu).setTitle(user.Name);

        if (user.HasConfiguredPassword) {
            if (!user.Policy?.IsAdministrator) {
                (page.querySelector('#btnResetPassword') as HTMLDivElement).classList.remove('hide');
            }
            (page.querySelector('#fldCurrentPassword') as HTMLDivElement).classList.remove('hide');
        } else {
            (page.querySelector('#btnResetPassword') as HTMLDivElement).classList.add('hide');
            (page.querySelector('#fldCurrentPassword') as HTMLDivElement).classList.add('hide');
        }

        const canChangePassword = loggedInUser?.Policy?.IsAdministrator || user.Policy.EnableUserPreferenceAccess;
        (page.querySelector('.passwordSection') as HTMLDivElement).classList.toggle('hide', !canChangePassword);

        import('../../autoFocuser').then(({ default: autoFocuser }) => {
            autoFocuser.autoFocus(page);
        }).catch(err => {
            console.error('[UserPasswordForm] failed to load autofocuser', err);
        });

        (page.querySelector('#txtCurrentPassword') as HTMLInputElement).value = '';
        (page.querySelector('#txtNewPassword') as HTMLInputElement).value = '';
        (page.querySelector('#txtNewPasswordConfirm') as HTMLInputElement).value = '';
    }, [user, libraryMenu]);

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
            } else if ((page.querySelector('#txtNewPassword') as HTMLInputElement).value == '' && user?.Policy?.IsAdministrator) {
                toast(globalize.translate('PasswordMissingSaveError'));
            } else {
                loading.show();
                savePassword();
            }

            e.preventDefault();
            return false;
        };

        const savePassword = () => {
            if (!user.Id) {
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

            window.ApiClient.updateUserPassword(user.Id, currentPassword, newPassword).then(function () {
                loading.hide();
                toast(globalize.translate('PasswordSaved'));

                loadUser().catch(err => {
                    console.error('[UserPasswordForm] failed to load user', err);
                });
            }, function () {
                loading.hide();
                Dashboard.alert({
                    title: globalize.translate('HeaderLoginFailure'),
                    message: globalize.translate('MessageInvalidUser')
                });
            });
        };

        const resetPassword = () => {
            const msg = globalize.translate('PasswordResetConfirmation');
            confirm(msg, globalize.translate('ResetPassword')).then(function () {
                loading.show();
                if (user.Id) {
                    window.ApiClient.resetUserPassword(user.Id).then(function () {
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
                }
            }).catch(() => {
                // confirm dialog was closed
            });
        };

        (page.querySelector('.updatePasswordForm') as HTMLFormElement).addEventListener('submit', onSubmit);
        (page.querySelector('#btnResetPassword') as HTMLButtonElement).addEventListener('click', resetPassword);

        return () => {
            (page.querySelector('.updatePasswordForm') as HTMLFormElement).removeEventListener('submit', onSubmit);
            (page.querySelector('#btnResetPassword') as HTMLButtonElement).removeEventListener('click', resetPassword);
        };
    }, [loadUser, user]);

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
