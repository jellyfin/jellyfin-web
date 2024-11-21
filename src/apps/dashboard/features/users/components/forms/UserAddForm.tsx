import type { CreateUserByName } from '@jellyfin/sdk/lib/generated-client/models/create-user-by-name';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import {
    type SubmitHandler,
    useForm,
    TextFieldElement,
    FieldError,
    PasswordElement
} from 'react-hook-form-mui';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { userHooks } from 'hooks/api';
import globalize from 'lib/globalize';
import toast from 'components/toast/toast';

const newUserSchema = z.object({
    Name: z.string().min(1, { message: 'ErrorNameRequired' }),
    Password: z.string()
});

const UserAddForm = () => {
    const navigate = useNavigate();
    const createUserMutation = userHooks.useCreateUserByName();

    const { control, reset, handleSubmit, formState } =
        useForm<CreateUserByName>({
            resolver: zodResolver(newUserSchema),
            defaultValues: {
                Name: '',
                Password: ''
            }
        });

    const handleParseError = useCallback((error: FieldError) => {
        return error.message ? globalize.translate(error.message) : '';
    }, []);

    const onSubmit: SubmitHandler<CreateUserByName> = useCallback(
        async (data) => {
            try {
                const newUser = await createUserMutation.mutateAsync({
                    createUserByName: data
                });

                const id = newUser?.Id;

                if (!id) {
                    throw new Error(
                        '[createUserByName] Unexpected null User ID'
                    );
                }

                reset();
                toast(globalize.translate('SettingsSaved'));
                navigate(`/dashboard/users/settings/profile?userId=${id}`);
            } catch (error) {
                toast(globalize.translate('ErrorDefault'));
                console.error('[UserAddForm] Error during submission:', error);
            }
        },
        [createUserMutation, navigate, reset]
    );

    const handleCancel = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    return (
        <Stack
            component='form'
            spacing={2}
            autoComplete='off'
            onSubmit={handleSubmit(onSubmit)}
        >
            <TextFieldElement
                name='Name'
                label={globalize.translate('LabelName')}
                autoComplete='off'
                control={control}
                fullWidth
                parseError={handleParseError}
            />
            <PasswordElement
                name='Password'
                label={globalize.translate('LabelPassword')}
                autoComplete='new-password'
                control={control}
                fullWidth
                parseError={handleParseError}
            />
            <Stack spacing={0.5}>
                <Button
                    type='submit'
                    className='emby-button raised button-submit'
                    disabled={!formState.isDirty || formState.isSubmitting}
                >
                    {globalize.translate('Save')}
                </Button>
                <Button
                    className='emby-button raised button-cancel'
                    onClick={handleCancel}
                >
                    {globalize.translate('ButtonCancel')}
                </Button>
            </Stack>
        </Stack>
    );
};

export default UserAddForm;
