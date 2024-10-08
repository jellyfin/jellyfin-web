import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC, useCallback } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import globalize from 'lib/globalize';
import TagList from './TagList';

type TagType = 'AllowedTags' | 'BlockedTags';

interface TagsSettingProps {
    tagType: TagType;
    title: string;
    subTitle: string;
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
}

const TagsSetting: FC<TagsSettingProps> = ({
    tagType,
    title,
    subTitle,
    currentUser,
    setCurrentUser
}) => {
    const updatePolicy = useCallback(
        (value: string) => {
            const existingValue = currentUser?.Policy?.[tagType] ?? [];

            const updatedValue = existingValue.includes(value) ?
                existingValue.filter((filter) => filter !== value) :
                [...existingValue, value];

            setCurrentUser((prevState) => ({
                ...prevState,
                Policy: {
                    ...prevState?.Policy,
                    AuthenticationProviderId:
                        prevState.Policy?.AuthenticationProviderId || '',
                    PasswordResetProviderId:
                        prevState.Policy?.PasswordResetProviderId || '',
                    [tagType]: updatedValue.length ? updatedValue : undefined
                }
            }));
        },
        [currentUser?.Policy, setCurrentUser, tagType]
    );

    const showTagPopup = useCallback(() => {
        import('components/prompt/prompt')
            .then(({ default: prompt }) => {
                prompt({
                    label: globalize.translate('LabelTag')
                })
                    .then((value) => {
                        updatePolicy(value);
                    })
                    .catch(() => {
                        // prompt dialog closed
                    });
            })
            .catch((err) => {
                console.error(
                    '[userparentalcontrol] failed to load prompt',
                    err
                );
            });
    }, [updatePolicy]);

    return (
        <Box id='tagsSection'>
            <Stack spacing={2} direction={'row'} alignItems={'center'}>
                <Typography variant='h2'>
                    {globalize.translate(title)}
                </Typography>

                <IconButton
                    title={globalize.translate('Add')}
                    className='fab'
                    onClick={showTagPopup}
                >
                    <AddIcon />
                </IconButton>
            </Stack>
            <Typography variant='subtitle1' className='fieldDescription'>
                {globalize.translate(subTitle)}
            </Typography>
            {currentUser?.Policy?.[tagType]?.length ? (
                <List id='allowedTagsList' className='paperList'>
                    {currentUser.Policy[tagType]?.map((tag) => (
                        <TagList
                            key={tag}
                            tag={tag}
                            tagType={tagType}
                            currentUser={currentUser}
                            setCurrentUser={setCurrentUser}
                        />
                    ))}
                </List>
            ) : null}
        </Box>
    );
};

export default TagsSetting;
