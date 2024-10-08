import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC, useCallback, useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useQueryClient } from '@tanstack/react-query';
import { userHooks } from 'hooks/api';
import globalize from 'lib/globalize';
import Dashboard from 'utils/dashboard';
import confirm from 'components/confirm/confirm';
import toast from 'components/toast/toast';

interface UserPasswordFormProps {
    user: UserDto;
    loggedInUser: UserDto | undefined;
}

const UserPasswordForm: FC<UserPasswordFormProps> = ({
    user,
    loggedInUser
}) => {
    const queryClient = useQueryClient();
    const updateUserPassword = userHooks.useUpdateUserPassword();

    const [currentPassword, setCurrentPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState<string>('');

    const isFormValid =
        (user?.HasConfiguredPassword ? currentPassword !== '' : true)
        && newPassword !== ''
        && newPasswordConfirm !== '';

    const onCurrentPasswordChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setCurrentPassword(event.target.value);
        },
        []
    );

    const onNewPasswordChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setNewPassword(event.target.value);
        },
        []
    );

    const onNewPasswordConfirmChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setNewPasswordConfirm(event.target.value);
        },
        []
    );

    const onUpdatePasswordSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            if (newPassword != newPasswordConfirm) {
                toast(globalize.translate('PasswordMatchError'));
            } else {
                updateUserPassword.mutate(
                    {
                        userId: user?.Id,
                        updateUserPassword: {
                            CurrentPw: currentPassword,
                            NewPw: newPassword
                        }
                    },
                    {
                        onSuccess: async () => {
                            toast(globalize.translate('PasswordSaved'));
                            setCurrentPassword('');
                            setNewPassword('');
                            setNewPasswordConfirm('');
                            await queryClient.invalidateQueries({
                                queryKey: ['UserById', user?.Id]
                            });
                        },
                        onError: () => {
                            Dashboard.alert({
                                title: globalize.translate(
                                    'HeaderLoginFailure'
                                ),
                                message:
                                    globalize.translate('MessageInvalidUser')
                            });
                        }
                    }
                );
            }

            e.preventDefault();
            e.stopPropagation();
            return false;
        },
        [
            currentPassword,
            user?.Id,
            newPassword,
            newPasswordConfirm,
            queryClient,
            updateUserPassword
        ]
    );

    const onBtnResetPasswordClick = useCallback(() => {
        const msg = globalize.translate('PasswordResetConfirmation');
        confirm(msg, globalize.translate('ResetPassword'))
            .then(function () {
                updateUserPassword.mutate(
                    {
                        userId: user?.Id,
                        updateUserPassword: {
                            ResetPassword: true
                        }
                    },
                    {
                        onSuccess: async () => {
                            Dashboard.alert({
                                message: globalize.translate(
                                    'PasswordResetComplete'
                                ),
                                title: globalize.translate('ResetPassword')
                            });
                            await queryClient.invalidateQueries({
                                queryKey: ['UserById', user?.Id]
                            });
                        },
                        onError: (err) => {
                            console.error(
                                '[UserPasswordForm] failed to reset user password',
                                err
                            );
                        }
                    }
                );
            })
            .catch(() => {
                // confirm dialog closed
            });
    }, [queryClient, updateUserPassword, user?.Id]);

    return (
        <Stack component='form' spacing={2} onSubmit={onUpdatePasswordSubmit}>
            {user?.HasConfiguredPassword
            && loggedInUser?.Policy?.IsAdministrator
                !== user?.Policy?.IsAdministrator ? (
                    <Button
                        type='button'
                        className='emby-button raised button-submit'
                        onClick={onBtnResetPasswordClick}
                    >
                        {globalize.translate('ResetPassword')}
                    </Button>
                ) : (
                    <>
                        {user?.HasConfiguredPassword && (
                            <TextField
                                id='txtCurrentPassword'
                                label={globalize.translate('LabelCurrentPassword')}
                                type='password'
                                inputProps={{
                                    autoComplete: 'false'
                                }}
                                value={currentPassword}
                                onChange={onCurrentPasswordChange}
                                required
                                fullWidth
                            />
                        )}
                        <TextField
                            id='txtNewPassword'
                            label={globalize.translate('LabelNewPassword')}
                            type='password'
                            inputProps={{
                                autoComplete: 'false'
                            }}
                            value={newPassword}
                            onChange={onNewPasswordChange}
                            fullWidth
                        />
                        <TextField
                            id='txtNewPasswordConfirm'
                            label={globalize.translate('LabelNewPasswordConfirm')}
                            type='password'
                            inputProps={{
                                autoComplete: 'false'
                            }}
                            value={newPasswordConfirm}
                            onChange={onNewPasswordConfirmChange}
                            fullWidth
                        />
                        <Button
                            type='submit'
                            className='emby-button raised button-submit'
                            disabled={!isFormValid}
                        >
                            {user?.HasConfiguredPassword ?
                                globalize.translate('LabelChangePassword') :
                                globalize.translate('SavePassword')}
                        </Button>
                    </>
                )}
        </Stack>
    );
};

export default UserPasswordForm;
