import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import {
    type SubmitHandler,
    useForm,
    FieldError,
    PasswordElement,
    PasswordRepeatElement
} from 'react-hook-form-mui';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApi } from 'hooks/useApi';
import { userHooks } from 'hooks/api';
import globalize from 'lib/globalize';
import Dashboard from 'utils/dashboard';
import toast from 'components/toast/toast';
import ConfirmDialog from 'components/ConfirmDialog';

const userPasswordSchema = z
    .object({
        currentPassword: z.string().optional(),
        newPassword: z.string().min(1, { message: 'PasswordMissingSaveError' }),
        newPasswordConfirm: z
            .string()
            .min(1, { message: 'ErrorPasswordConfirmationRequired' })
    })
    .refine((data) => data.newPassword === data.newPasswordConfirm, {
        message: 'PasswordMatchError',
        path: ['newPasswordConfirm']
    });

type UserPasswordFormValues = z.infer<typeof userPasswordSchema>;

interface UserPasswordFormProps {
    currentUser: UserDto;
}

const UserPasswordForm: FC<UserPasswordFormProps> = ({ currentUser }) => {
    const { user: loggedInUser } = useApi();
    const queryClient = useQueryClient();
    const updateUserPasswordMutation = userHooks.useUpdateUserPassword();

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const hasConfiguredPassword = currentUser.HasConfiguredPassword;
    const isAdminPrivilegeDifferent =
        loggedInUser?.Policy?.IsAdministrator
        !== currentUser.Policy?.IsAdministrator;

    const { control, handleSubmit, reset, formState } =
        useForm<UserPasswordFormValues>({
            resolver: zodResolver(
                userPasswordSchema.superRefine((data, ctx) => {
                    if (hasConfiguredPassword && !data.currentPassword) {
                        ctx.addIssue({
                            path: ['currentPassword'],
                            message: 'ErrorPasswordRequired',
                            code: z.ZodIssueCode.custom
                        });
                    }
                })
            ),
            defaultValues: {
                currentPassword: '',
                newPassword: '',
                newPasswordConfirm: ''
            }
        });

    const handleParseError = useCallback((error: FieldError) => {
        return error.message ? globalize.translate(error.message) : '';
    }, []);

    const handleConfirmDialogOpen = useCallback(() => setConfirmDialogOpen(true), []);
    const handleConfirmDialogClose = useCallback(() => setConfirmDialogOpen(false), []);

    const handleResetPassword = useCallback(() => {
        setConfirmDialogOpen(false);
        updateUserPasswordMutation.mutate(
            {
                userId: currentUser.Id,
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
                        queryKey: ['UserById', currentUser.Id]
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
    }, [currentUser.Id, queryClient, updateUserPasswordMutation]);

    const onSubmit: SubmitHandler<UserPasswordFormValues> = useCallback(
        async (data) => {
            try {
                await updateUserPasswordMutation.mutateAsync({
                    userId: currentUser.Id,
                    updateUserPassword: {
                        CurrentPw: data.currentPassword,
                        NewPw: data.newPassword
                    }
                });

                toast(globalize.translate('PasswordSaved'));
                reset();
                await queryClient.invalidateQueries({
                    queryKey: ['UserById', currentUser.Id]
                });
            } catch (error) {
                Dashboard.alert({
                    title: globalize.translate('HeaderLoginFailure'),
                    message: globalize.translate('MessageInvalidUser')
                });
                console.error(
                    '[UserPasswordForm] error updating password',
                    error
                );
            }
        },
        [updateUserPasswordMutation, currentUser.Id, reset, queryClient]
    );

    return (
        <Stack
            component='form'
            spacing={2}
            autoComplete='off'
            onSubmit={handleSubmit(onSubmit)}
        >
            {hasConfiguredPassword && isAdminPrivilegeDifferent ? (
                <>
                    <Button onClick={handleConfirmDialogOpen}>
                        {globalize.translate('ResetPassword')}
                    </Button>

                    <ConfirmDialog
                        fullScreen={fullScreen}
                        fullWidth
                        maxWidth={'sm'}
                        open={confirmDialogOpen}
                        title={globalize.translate('ResetPassword')}
                        text={globalize.translate('PasswordResetConfirmation')}
                        onCancel={handleConfirmDialogClose}
                        onConfirm={handleResetPassword}
                    />
                </>
            ) : (
                <>
                    {hasConfiguredPassword && (
                        <PasswordElement
                            name='currentPassword'
                            label={globalize.translate('LabelCurrentPassword')}
                            autoComplete='off'
                            control={control}
                            fullWidth
                            parseError={handleParseError}
                        />
                    )}
                    <PasswordElement
                        name='newPassword'
                        label={globalize.translate('LabelNewPassword')}
                        autoComplete='off'
                        control={control}
                        fullWidth
                        parseError={handleParseError}
                    />
                    <PasswordRepeatElement
                        passwordFieldName={'newPassword'}
                        name='newPasswordConfirm'
                        label={globalize.translate('LabelNewPasswordConfirm')}
                        autoComplete='off'
                        control={control}
                        fullWidth
                        parseError={handleParseError}
                    />
                    <Button
                        type='submit'
                        disabled={!formState.isDirty || formState.isSubmitting}
                    >
                        {hasConfiguredPassword ?
                            globalize.translate('LabelChangePassword') :
                            globalize.translate('SavePassword')}
                    </Button>
                </>
            )}

        </Stack>
    );
};

export default UserPasswordForm;
