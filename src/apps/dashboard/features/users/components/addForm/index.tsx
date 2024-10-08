import type { CreateUserByName } from '@jellyfin/sdk/lib/generated-client/models/create-user-by-name';
import React, { type FC, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import globalize from 'lib/globalize';

interface UserNewProfileFormProps {
    userInput: CreateUserByName;
    setUserInput: React.Dispatch<React.SetStateAction<CreateUserByName>>;
    onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const UserNewProfileForm: FC<UserNewProfileFormProps> = ({
    userInput,
    setUserInput,
    onFormSubmit
}) => {
    const navigate = useNavigate();

    const onUserInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const target = event.target;
            const name = target.name;
            const value = target.value;
            setUserInput((prevState) => ({
                ...prevState,
                [name]: value
            }));
        },
        [setUserInput]
    );

    const onBtnCancelClick = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    return (
        <Stack
            component='form'
            spacing={2}
            onSubmit={onFormSubmit}
        >
            <TextField
                id='txtUserName'
                label={globalize.translate('LabelName')}
                type='text'
                value={userInput.Name}
                name='Name'
                onChange={onUserInputChange}
                required
                fullWidth
            />
            <TextField
                id='txtPassword'
                label={globalize.translate('LabelPassword')}
                type='password'
                value={userInput.Password}
                name='Password'
                onChange={onUserInputChange}
                fullWidth
            />
            <Stack spacing={0.5}>
                <Button
                    type='submit'
                    className='emby-button raised button-submit'
                >
                    {globalize.translate('Save')}
                </Button>
                <Button
                    type='button'
                    className='emby-button raised button-cancel'
                    onClick={onBtnCancelClick}
                >
                    {globalize.translate('ButtonCancel')}
                </Button>
            </Stack>
        </Stack>
    );
};

export default UserNewProfileForm;
