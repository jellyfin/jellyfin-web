import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC, useCallback } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import globalize from 'scripts/globalize';

type TagType = 'AllowedTags' | 'BlockedTags';

interface TagListProps {
    tag: string;
    tagType: TagType;
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
}

const TagList: FC<TagListProps> = ({ tag, tagType, currentUser, setCurrentUser }) => {
    const onDeleteTagClick = useCallback(() => {
        const existingValue = currentUser?.Policy?.[tagType] as string[];
        const removeTags = existingValue.filter((t) => t !== tag);
        setCurrentUser((prevState) => ({
            ...prevState,
            Policy: {
                ...prevState.Policy,
                AuthenticationProviderId:
                        prevState.Policy?.AuthenticationProviderId || '',
                PasswordResetProviderId:
                        prevState.Policy?.PasswordResetProviderId || '',
                [tagType]: removeTags
            }
        }));
    },

    [currentUser?.Policy, setCurrentUser, tag, tagType]
    );
    return (
        <ListItem
            secondaryAction={
                <IconButton
                    edge='end'
                    aria-label='delete'
                    title={globalize.translate(
                        'Delete'
                    )}
                    className='paper-icon-button-light allowedTag btnDeleteTag listItemButton'
                    onClick={onDeleteTagClick}
                >
                    <DeleteIcon />
                </IconButton>
            }
        >
            <ListItemText primary={tag} />
        </ListItem>
    );
};

export default TagList;
