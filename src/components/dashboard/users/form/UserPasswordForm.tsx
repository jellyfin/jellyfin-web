import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import { useQueryClient } from '@tanstack/react-query';
import { userHooks } from 'hooks/api';
import globalize from 'scripts/globalize';
import Dashboard from 'utils/dashboard';
import confirm from 'components/confirm/confirm';
import toast from 'components/toast/toast';

interface UserPasswordFormProps {
    user: UserDto;
}

const UserPasswordForm: FC<UserPasswordFormProps> = ({ user }) => {
    const queryClient = useQueryClient();
    const updateUserPassword = userHooks.useUpdateUserPassword();

    const [currentPassword, setCurrentPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState<string>('');

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
                        userId: user?.Id || '',
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
                                queryKey: ['UserById', user?.Id || '']
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
                        userId: user?.Id || '',
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
                                queryKey: ['UserById', user?.Id || '']
                            });
                        },
                        onError: (err) => {
                            console.error('[UserPasswordForm] failed to reset user password', err);
                        }
                    }
                );
            })
            .catch(() => {
                // confirm dialog closed
            });
    }, [queryClient, updateUserPassword, user?.Id]);

    return (
        <form className='updatePasswordForm' onSubmit={onUpdatePasswordSubmit}>
            <Box className='detailSection'>
                {user?.HasConfiguredPassword && (
                    <Box id='fldCurrentPassword' className='inputContainer'>
                        <InputLabel
                            className='inputLabel'
                            htmlFor='txtLoginAttemptsBeforeLockout'
                        >
                            {globalize.translate('LabelCurrentPassword')}
                        </InputLabel>
                        <OutlinedInput
                            id='txtCurrentPassword'
                            type='password'
                            inputProps={{
                                autoComplete: 'false'
                            }}
                            value={currentPassword}
                            onChange={onCurrentPasswordChange}
                            required
                            fullWidth
                        />
                    </Box>
                )}
                <Box className='inputContainer'>
                    <InputLabel
                        className='inputLabel'
                        htmlFor='txtLoginAttemptsBeforeLockout'
                    >
                        {globalize.translate('LabelNewPassword')}
                    </InputLabel>
                    <OutlinedInput
                        id='txtNewPassword'
                        type='password'
                        inputProps={{
                            autoComplete: 'false'
                        }}
                        value={newPassword}
                        onChange={onNewPasswordChange}
                        fullWidth
                    />
                </Box>
                <Box className='inputContainer'>
                    <InputLabel
                        className='inputLabel'
                        htmlFor='txtLoginAttemptsBeforeLockout'
                    >
                        {globalize.translate('LabelNewPasswordConfirm')}
                    </InputLabel>
                    <OutlinedInput
                        id='txtNewPasswordConfirm'
                        type='password'
                        inputProps={{
                            autoComplete: 'false'
                        }}
                        value={newPasswordConfirm}
                        onChange={onNewPasswordConfirmChange}
                        fullWidth
                    />
                </Box>
                <br />
                <Box>
                    <Stack spacing={2} direction='column'>
                        <Button
                            type='submit'
                            className='emby-button raised button-submit block'
                        >
                            {globalize.translate('Save')}
                        </Button>
                        {user?.HasConfiguredPassword
                            && !user?.Policy?.IsAdministrator && (
                            <Button
                                type='button'
                                id='btnResetPassword'
                                className='emby-button raised button-cancel block'
                                onClick={onBtnResetPasswordClick}
                            >
                                {globalize.translate('ResetPassword')}
                            </Button>
                        )}
                    </Stack>
                </Box>
            </Box>
        </form>
    );
};

export default UserPasswordForm;
