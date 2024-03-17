import type { CreateUserByName } from '@jellyfin/sdk/lib/generated-client/models/create-user-by-name';
import React, { type FC, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import globalize from 'scripts/globalize';

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
        <form onSubmit={onFormSubmit} className='newUserProfileForm'>
            <Box className='inputContainer'>
                <InputLabel className='inputLabel' htmlFor='txtUserName'>
                    {globalize.translate('LabelName')}
                </InputLabel>
                <OutlinedInput
                    id='txtUserName'
                    type='text'
                    value={userInput.Name}
                    name='Name'
                    onChange={onUserInputChange}
                    required
                    fullWidth
                />
            </Box>
            <Box className='inputContainer'>
                <InputLabel className='inputLabel' htmlFor='txtPassword'>
                    {globalize.translate('LabelPassword')}
                </InputLabel>
                <OutlinedInput
                    id='txtPassword'
                    type='password'
                    value={userInput.Password}
                    name='Password'
                    onChange={onUserInputChange}
                    fullWidth
                />
            </Box>
            <Box>
                <Stack spacing={2} direction='column'>
                    <Button
                        type='submit'
                        className='emby-button raised button-submit block'
                    >
                        {globalize.translate('Save')}
                    </Button>
                    <Button
                        type='button'
                        id='btnCancel'
                        className='emby-button raised button-cancel block'
                        onClick={onBtnCancelClick}
                    >
                        {globalize.translate('ButtonCancel')}
                    </Button>
                </Stack>
            </Box>
        </form>
    );
};

export default UserNewProfileForm;
