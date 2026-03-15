import type { GroupInfoDto } from '@jellyfin/sdk/lib/generated-client/models/group-info-dto';
import type { SvgIconComponent } from '@mui/icons-material';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import React, { type FC } from 'react';

import UserAvatar from 'components/UserAvatar';
import { useUsers } from 'hooks/useUsers';

interface ButtonProps {
    onClick: () => void
    tooltip?: string
    Icon: SvgIconComponent
}

interface SyncPlayGroupListItemProps {
    group: GroupInfoDto
    button: ButtonProps
}

const SyncPlayGroupListItem: FC<SyncPlayGroupListItemProps> = ({
    group: currentGroup,
    button: {
        onClick,
        tooltip,
        Icon: ButtonIcon
    }
}) => {
    const { data: users } = useUsers();

    return (
        <Stack
            spacing={1}
            sx={{
                flexGrow: 1
            }}
        >
            <Box sx={{ lineHeight: 1.35 }}>
                {currentGroup?.GroupName}
            </Box>
            <Stack
                direction='row'
                alignItems='center'
                spacing={4}
            >
                <AvatarGroup
                    sx={{
                        flexGrow: 1,
                        justifyContent: 'flex-end'
                    }}
                >
                    {currentGroup?.Participants?.map(participantName => {
                        const participant = users?.find(u => u.Name === participantName);
                        return participant ? (
                            <UserAvatar
                                key={participant.Id}
                                user={participant}
                                size={32}
                            />
                        ) : null;
                    })}
                </AvatarGroup>
                <Tooltip
                    title={tooltip}
                >
                    <IconButton
                        onClick={onClick}
                    >
                        <ButtonIcon />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Stack>
    );
};

export default SyncPlayGroupListItem;
