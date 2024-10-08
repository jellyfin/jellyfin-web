import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { AccessSchedule } from '@jellyfin/sdk/lib/generated-client/models/access-schedule';
import { DynamicDayOfWeek } from '@jellyfin/sdk/lib/generated-client/models/dynamic-day-of-week';
import React, { type FC, useCallback } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import globalize from 'lib/globalize';
import AccessScheduleList from './AccessScheduleList';

interface AccessScheduleSettingProps {
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
}

const AccessScheduleSetting: FC<AccessScheduleSettingProps> = ({
    currentUser,
    setCurrentUser
}) => {
    const updatePolicy = useCallback(
        (value: AccessSchedule) => {
            const existingValue = currentUser?.Policy?.AccessSchedules ?? [];

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
                    AccessSchedules: updatedValue.length ?
                        updatedValue :
                        undefined
                }
            }));
        },
        [currentUser, setCurrentUser]
    );

    const showSchedulePopup = useCallback(() => {
        const schedule = {
            DayOfWeek: DynamicDayOfWeek.Sunday,
            StartHour: 0,
            EndHour: 0
        };
        import('components/accessSchedule/accessSchedule')
            .then(({ default: accessschedule }) => {
                accessschedule
                    .show({
                        schedule: schedule
                    })
                    .then((value: AccessSchedule) => {
                        updatePolicy(value);
                    })
                    .catch(() => {
                        // access schedule closed
                    });
            })
            .catch((err) => {
                console.error(
                    '[userparentalcontrol] failed to load access schedule',
                    err
                );
            });
    },
    [updatePolicy]
    );

    return (
        <Box>
            <Stack spacing={2} direction={'row'} alignItems={'center'}>
                <Typography variant='h2'>
                    {globalize.translate('HeaderAccessSchedule')}
                </Typography>

                <IconButton
                    title={globalize.translate('Add')}
                    className='fab'
                    onClick={showSchedulePopup}
                >
                    <AddIcon />
                </IconButton>
            </Stack>
            <Typography variant='subtitle1' className='fieldDescription'>
                {globalize.translate('HeaderAccessScheduleHelp')}
            </Typography>
            {currentUser?.Policy?.AccessSchedules
                && currentUser?.Policy?.AccessSchedules.length > 0 && (
                <List id='accessSchedulesList' className='paperList'>
                    {currentUser.Policy.AccessSchedules?.map(
                        (accessSchedule, index) => (
                            <AccessScheduleList
                                // eslint-disable-next-line react/no-array-index-key
                                key={index}
                                index={index}
                                accessSchedule={accessSchedule}
                                currentUser={currentUser}
                                setCurrentUser={setCurrentUser}
                            />
                        )
                    )}
                </List>
            )}
        </Box>
    );
};

export default AccessScheduleSetting;
