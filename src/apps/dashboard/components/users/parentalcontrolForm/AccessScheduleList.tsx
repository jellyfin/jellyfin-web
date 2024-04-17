import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { AccessSchedule } from '@jellyfin/sdk/lib/generated-client/models/access-schedule';
import React, { type FC, useCallback } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import datetime from 'scripts/datetime';
import globalize from 'scripts/globalize';

interface AccessScheduleListProps {
    index: number;
    accessSchedule: AccessSchedule;
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
}
function getDisplayTime(hours = 0) {
    let minutes = 0;
    const pct = hours % 1;

    if (pct) {
        minutes = Math.floor(60 * pct);
    }

    return datetime.getDisplayTime(new Date(2000, 1, 1, hours, minutes, 0, 0));
}

const AccessScheduleList: FC<AccessScheduleListProps> = ({
    index,
    accessSchedule,
    currentUser,
    setCurrentUser
}) => {
    const onDeleteScheduleClick = useCallback(() => {
        const newAccessSchedules = currentUser?.Policy?.AccessSchedules?.filter(
            (_, i) => i !== index
        );
        setCurrentUser((prevState) => ({
            ...prevState,
            Policy: {
                ...prevState?.Policy,
                AuthenticationProviderId:
                    prevState.Policy?.AuthenticationProviderId || '',
                PasswordResetProviderId:
                    prevState.Policy?.PasswordResetProviderId || '',
                AccessSchedules: newAccessSchedules
            }
        }));
    }, [currentUser?.Policy?.AccessSchedules, index, setCurrentUser]);

    return (
        <ListItem
            secondaryAction={
                <IconButton
                    edge='end'
                    aria-label='delete'
                    title={globalize.translate('Delete')}
                    className='paper-icon-button-light btnDelete listItemButton'
                    onClick={onDeleteScheduleClick}
                >
                    <DeleteIcon />
                </IconButton>
            }
        >
            <ListItemText
                primary={globalize.translate(accessSchedule.DayOfWeek)}
                secondary={
                    getDisplayTime(accessSchedule.StartHour)
                    + ' - '
                    + getDisplayTime(accessSchedule.EndHour)
                }
            />
        </ListItem>
    );
};

export default AccessScheduleList;
