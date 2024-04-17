import type { CreateUserByName } from '@jellyfin/sdk/lib/generated-client/models/create-user-by-name';
import React, { type FC, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { userHooks } from 'hooks/api';
import globalize from 'scripts/globalize';
import toast from 'components/toast/toast';
import Page from 'components/Page';
import UserNewProfileForm from 'apps/dashboard/components/users/addForm';

const UserNew: FC = () => {
    const [userInput, setUserInput] = useState<CreateUserByName>({
        Name: '',
        Password: ''
    });

    const navigate = useNavigate();
    const createUser = userHooks.useCreateUserByName();

    const saveUser = useCallback(() => {
        createUser.mutate(
            {
                createUserByName: userInput
            },
            {
                onSuccess: async (user) => {
                    const id = user?.Id;
                    if (!id) {
                        throw new Error('Unexpected null user.Id');
                    }
                    setUserInput({
                        Name: '',
                        Password: ''
                    });
                    navigate(`/dashboard/users/settings?userId=${id}&tab=profile`);
                    toast(globalize.translate('SettingsSaved'));
                },
                onError: async () => {
                    toast(globalize.translate('ErrorDefault'));
                }
            }
        );
    }, [createUser, navigate, userInput]);

    const onNewUserProfileFormSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            saveUser();
            e.preventDefault();
            e.stopPropagation();
            return false;
        },
        [saveUser]
    );

    return (
        <Page id='newUserPage' className='mainAnimatedPage type-interior'>
            <Box className='content-primary padded-left padded-right'>
                <Box mb={3}>
                    <Stack
                        direction='row'
                        alignItems='center'
                        spacing={1}
                        useFlexGap
                    >
                        <Typography variant='h2'>
                            {globalize.translate('HeaderAddUser')}
                        </Typography>
                        <Link
                            className='emby-button raised button-alt'
                            href='https://jellyfin.org/docs/general/server/users/'
                            underline='hover'
                            sx={{
                                py: '0.4em !important'
                            }}
                        >
                            {globalize.translate('Help')}
                        </Link>
                    </Stack>
                </Box>
                <Box>
                    <UserNewProfileForm
                        userInput={userInput}
                        setUserInput={setUserInput}
                        onFormSubmit={onNewUserProfileFormSubmit}
                    />
                </Box>
            </Box>
        </Page>
    );
};

export default UserNew;
