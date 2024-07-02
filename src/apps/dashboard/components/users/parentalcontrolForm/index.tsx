import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { localizationHooks } from 'hooks/api';
import globalize from 'scripts/globalize';
import Loading from 'components/loading/LoadingComponent';
import MaxParentalRatingSetting from './SelectMaxParentalRating';
import BlockUnratedItemsSetting from './BlockUnratedItemsSetting';
import TagsSetting from './TagsSetting';
import AccessScheduleSetting from './AccessScheduleSetting';

interface UserParentalControlFormProps {
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
    onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const UserParentalControlForm: FC<UserParentalControlFormProps> = ({
    currentUser,
    setCurrentUser,
    onFormSubmit
}) => {
    const { isLoading, data: parentalRatings } =
        localizationHooks.useGetParentalRatings();

    if (isLoading) return <Loading />;
    return (
        <Stack
            component='form'
            spacing={2}
            onSubmit={onFormSubmit}
        >
            <MaxParentalRatingSetting
                parentalRatings={parentalRatings}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
            />
            <BlockUnratedItemsSetting
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
            />
            <TagsSetting
                tagType={'AllowedTags'}
                title={'LabelAllowContentWithTags'}
                subTitle={'AllowContentWithTagsHelp'}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
            />
            <TagsSetting
                tagType={'BlockedTags'}
                title={'LabelBlockContentWithTags'}
                subTitle={'BlockContentWithTagsHelp'}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
            />
            {!currentUser?.Policy?.IsAdministrator && (
                <AccessScheduleSetting
                    currentUser={currentUser}
                    setCurrentUser={setCurrentUser}
                />
            )}
            <Box>
                <Button
                    type='submit'
                    className='emby-button raised button-submit block'
                >
                    {globalize.translate('Save')}
                </Button>
            </Box>
        </Stack>
    );
};

export default UserParentalControlForm;
