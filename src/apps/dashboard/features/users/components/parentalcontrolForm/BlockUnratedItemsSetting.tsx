import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { UnratedItem } from '@jellyfin/sdk/lib/generated-client/models/unrated-item';
import React, { type FC, useCallback } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useTheme } from '@mui/material/styles';
import globalize from 'lib/globalize';

const items = [
    {
        name: 'Books',
        value: UnratedItem.Book
    },
    {
        name: 'Channels',
        value: UnratedItem.ChannelContent
    },
    {
        name: 'LiveTV',
        value: UnratedItem.LiveTvChannel
    },
    {
        name: 'Movies',
        value: UnratedItem.Movie
    },
    {
        name: 'Music',
        value: UnratedItem.Music
    },
    {
        name: 'Trailers',
        value: UnratedItem.Trailer
    },
    {
        name: 'Shows',
        value: UnratedItem.Series
    },
    {
        name: 'Other',
        value: UnratedItem.Other
    }
];

interface BlockUnratedItemsSettingProps {
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
}

const BlockUnratedItemsSetting: FC<BlockUnratedItemsSettingProps> = ({
    currentUser,
    setCurrentUser
}) => {
    const theme = useTheme();

    const onFormChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as UnratedItem;
            const existingValue = currentUser?.Policy?.BlockUnratedItems ?? [];

            const updatedValue = existingValue.includes(value) ?
                existingValue.filter((filter) => filter !== value) :
                [...existingValue, value];

            setCurrentUser((prevState) => ({
                ...prevState,
                Policy: {
                    ...prevState?.Policy,
                    AuthenticationProviderId:
                        prevState?.Policy?.AuthenticationProviderId || '',
                    PasswordResetProviderId:
                        prevState?.Policy?.PasswordResetProviderId || '',
                    BlockUnratedItems: updatedValue.length ?
                        updatedValue :
                        undefined
                }
            }));
        },
        [currentUser?.Policy?.BlockUnratedItems, setCurrentUser]
    );

    return (
        <Stack spacing={2}>
            <Typography variant='h2' className='checkboxListLabel'>
                {globalize.translate('HeaderBlockItemsWithNoRating')}
            </Typography>

            <FormGroup
                sx={{ px: 2, backgroundColor: theme.palette.background.paper }}
            >
                {items?.map((item) => (
                    <FormControlLabel
                        key={item.value}
                        control={
                            <Checkbox
                                checked={
                                    !!currentUser?.Policy?.BlockUnratedItems?.includes(
                                        item.value
                                    )
                                }
                                onChange={onFormChange}
                                value={item.value}
                            />
                        }
                        label={globalize.translate(item.name)}
                    />
                ))}
            </FormGroup>
        </Stack>
    );
};

export default BlockUnratedItemsSetting;
