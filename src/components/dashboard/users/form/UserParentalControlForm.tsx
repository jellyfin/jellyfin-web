import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { AccessSchedule } from '@jellyfin/sdk/lib/generated-client/models/access-schedule';
import { DynamicDayOfWeek } from '@jellyfin/sdk/lib/generated-client/models/dynamic-day-of-week';
import { UnratedItem } from '@jellyfin/sdk/lib/generated-client/models/unrated-item';
import React, { type FC, useCallback } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { localizationHooks } from 'hooks/api';
import datetime from 'scripts/datetime';
import globalize from 'scripts/globalize';
import Loading from 'components/loading/LoadingComponent';

function getDisplayTime(hours = 0) {
    let minutes = 0;
    const pct = hours % 1;

    if (pct) {
        minutes = Math.floor(60 * pct);
    }

    return datetime.getDisplayTime(new Date(2000, 1, 1, hours, minutes, 0, 0));
}

const items = [
    {
        name: globalize.translate('Books'),
        value: UnratedItem.Book
    },
    {
        name: globalize.translate('Channels'),
        value: UnratedItem.ChannelContent
    },
    {
        name: globalize.translate('LiveTV'),
        value: UnratedItem.LiveTvChannel
    },
    {
        name: globalize.translate('Movies'),
        value: UnratedItem.Movie
    },
    {
        name: globalize.translate('Music'),
        value: UnratedItem.Music
    },
    {
        name: globalize.translate('Trailers'),
        value: UnratedItem.Trailer
    },
    {
        name: globalize.translate('Shows'),
        value: UnratedItem.Series
    },
    {
        name: globalize.translate('Other'),
        value: UnratedItem.Other
    }
];

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

    const onEnabledFoldersChange = useCallback(
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

    const onSelectMaxParentalRatingChange = useCallback(
        (event: SelectChangeEvent) => {
            const target = event.target;
            const value = target.value;
            setCurrentUser((prevState) => ({
                ...prevState,
                Policy: {
                    ...prevState?.Policy,
                    AuthenticationProviderId:
                        prevState?.Policy?.AuthenticationProviderId || '',
                    PasswordResetProviderId:
                        prevState?.Policy?.PasswordResetProviderId || '',
                    MaxParentalRating: value === '' ? null : Number(value)
                }
            }));
        },
        [setCurrentUser]
    );

    const showBlockedTagPopup = useCallback(() => {
        import('components/prompt/prompt')
            .then(({ default: prompt }) => {
                prompt({
                    label: globalize.translate('LabelTag')
                })
                    .then(function (value: string) {
                        const existingValue =
                            currentUser?.Policy?.BlockedTags ?? [];

                        const updatedValue = existingValue.includes(value) ?
                            existingValue.filter((filter) => filter !== value) :
                            [...existingValue, value];

                        setCurrentUser((prevState) => ({
                            ...prevState,
                            Policy: {
                                ...prevState?.Policy,
                                AuthenticationProviderId:
                                    prevState.Policy
                                        ?.AuthenticationProviderId || '',
                                PasswordResetProviderId:
                                    prevState.Policy?.PasswordResetProviderId
                                    || '',
                                BlockedTags: updatedValue.length ?
                                    updatedValue :
                                    undefined
                            }
                        }));
                    })
                    .catch(() => {
                        // confirm dialog closed
                    });
            })
            .catch(() => {
                // confirm dialog closed
            });
    }, [currentUser?.Policy?.BlockedTags, setCurrentUser]);

    const showSchedulePopup = useCallback(
        (scheduleoption: AccessSchedule) => {
            const schedule = scheduleoption || {};
            import('components/accessSchedule/accessSchedule')
                .then(({ default: accessschedule }) => {
                    accessschedule
                        .show({
                            schedule: schedule
                        })
                        .then(function (value) {
                            const existingValue =
                                currentUser?.Policy?.AccessSchedules ?? [];

                            const updatedValue = existingValue.includes(value) ?
                                existingValue.filter(
                                    (filter) => filter !== value
                                ) :
                                [...existingValue, value];

                            setCurrentUser((prevState) => ({
                                ...prevState,
                                Policy: {
                                    ...prevState?.Policy,
                                    AuthenticationProviderId:
                                        prevState.Policy
                                            ?.AuthenticationProviderId || '',
                                    PasswordResetProviderId:
                                        prevState.Policy
                                            ?.PasswordResetProviderId || '',
                                    AccessSchedules: updatedValue.length ?
                                        updatedValue :
                                        undefined
                                }
                            }));
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
        [currentUser?.Policy?.AccessSchedules, setCurrentUser]
    );

    const onAddBlockedTagClick = useCallback(() => {
        showBlockedTagPopup();
    }, [showBlockedTagPopup]);

    const onAddScheduleClick = useCallback(() => {
        showSchedulePopup({
            DayOfWeek: DynamicDayOfWeek.Sunday,
            StartHour: 0,
            EndHour: 0
        });
    }, [showSchedulePopup]);

    const onDeleteTagClick = useCallback(
        (tag: string) => {
            return () => {
                const existingValue = currentUser?.Policy
                    ?.BlockedTags as string[];
                const removeTags = existingValue.filter((t) => t !== tag);
                setCurrentUser((prevState) => ({
                    ...prevState,
                    Policy: {
                        ...prevState?.Policy,
                        AuthenticationProviderId:
                            prevState.Policy?.AuthenticationProviderId || '',
                        PasswordResetProviderId:
                            prevState.Policy?.PasswordResetProviderId || '',
                        BlockedTags: removeTags
                    }
                }));
            };
        },
        [currentUser?.Policy?.BlockedTags, setCurrentUser]
    );

    const onDeleteScheduleClick = useCallback(
        (index: number) => () => {
            const newAccessSchedules =
                currentUser?.Policy?.AccessSchedules?.filter(
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
        },

        [currentUser?.Policy?.AccessSchedules, setCurrentUser]
    );

    if (isLoading) return <Loading />;

    return (
        <form onSubmit={onFormSubmit} className='userParentalControlForm'>
            <Box className='verticalSection verticalSection-extrabottompadding'>
                <Stack spacing={1}>
                    <InputLabel
                        className='inputLabel'
                        htmlFor='selectLoginProvider-label'
                    >
                        {globalize.translate('LabelMaxParentalRating')}
                    </InputLabel>
                    <Select
                        id='selectMaxParentalRating'
                        name='MaxParentalRating'
                        value={
                            currentUser?.Policy?.MaxParentalRating ?
                                String(currentUser?.Policy?.MaxParentalRating) :
                                ''
                        }
                        displayEmpty
                        onChange={onSelectMaxParentalRatingChange}
                    >
                        <MenuItem value=''>
                            <em>None</em>
                        </MenuItem>
                        {parentalRatings?.map((rating) => (
                            <MenuItem
                                key={rating.Name}
                                value={String(rating.Value)}
                            >
                                {rating.Name}
                            </MenuItem>
                        ))}
                    </Select>
                    <FormHelperText>
                        {globalize.translate('MaxParentalRatingHelp')}
                    </FormHelperText>
                </Stack>
            </Box>
            <Box className='verticalSection verticalSection-extrabottompadding blockUnratedItems'>
                <Typography variant='h2' className='checkboxListLabel'>
                    {globalize.translate('HeaderBlockItemsWithNoRating')}
                </Typography>

                <Box
                    className='checkboxList paperList'
                    style={{ padding: '.5em 1em' }}
                >
                    <FormControl component='fieldset' variant='standard'>
                        <FormGroup>
                            {items?.map((item) => (
                                <FormControlLabel
                                    key={item.value}
                                    control={
                                        <Checkbox
                                            className='chkFolder'
                                            checked={
                                                !!currentUser?.Policy?.BlockUnratedItems?.includes(
                                                    item.value
                                                )
                                            }
                                            onChange={onEnabledFoldersChange}
                                            value={item.value}
                                        />
                                    }
                                    label={item.name}
                                />
                            ))}
                        </FormGroup>
                    </FormControl>
                </Box>
            </Box>
            <Box className='verticalSection verticalSection-extrabottompadding'>
                <Box className='detailSectionHeader sectionTitleContainer flex align-items-center'>
                    <Typography variant='h2'>
                        {globalize.translate('LabelBlockContentWithTags')}
                    </Typography>

                    <IconButton
                        title={globalize.translate('Add')}
                        className='emby-button btnAddBlockedTag fab submit sectionTitleButton'
                        onClick={onAddBlockedTagClick}
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
                {currentUser?.Policy?.BlockedTags
                    && currentUser?.Policy?.BlockedTags?.length > 0 && (
                    <List className='blockedTagsList paperList'>
                        {currentUser.Policy.BlockedTags.map((tag) => (
                            <ListItem
                                key={tag}
                                secondaryAction={
                                    <IconButton
                                        edge='end'
                                        aria-label='delete'
                                        title={globalize.translate(
                                            'Delete'
                                        )}
                                        className='paper-icon-button-light blockedTag btnDeleteTag listItemButton'
                                        onClick={onDeleteTagClick(tag)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemText primary={tag} />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
            {!currentUser?.Policy?.IsAdministrator && (
                <Box
                    className='accessScheduleSection verticalSection'
                    style={{ marginBottom: '2em' }}
                >
                    <Box className='sectionTitleContainer flex align-items-center'>
                        <Typography variant='h2'>
                            {globalize.translate('HeaderAccessSchedule')}
                        </Typography>

                        <IconButton
                            title={globalize.translate('Add')}
                            className='emby-button btnAddSchedule fab submit sectionTitleButton'
                            onClick={onAddScheduleClick}
                        >
                            <AddIcon />
                        </IconButton>
                    </Box>

                    <p>{globalize.translate('HeaderAccessScheduleHelp')}</p>
                    {currentUser?.Policy?.AccessSchedules
                        && currentUser?.Policy?.AccessSchedules.length > 0 && (
                        <List className='paperList'>
                            {currentUser.Policy.AccessSchedules?.map(
                                (accessSchedule, index) => (
                                    <ListItem
                                        // eslint-disable-next-line react/no-array-index-key
                                        key={index}
                                        secondaryAction={
                                            <IconButton
                                                edge='end'
                                                aria-label='delete'
                                                title={globalize.translate(
                                                    'Delete'
                                                )}
                                                className='paper-icon-button-light btnDelete listItemButton'
                                                onClick={onDeleteScheduleClick(
                                                    index
                                                )}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemText
                                            primary={globalize.translate(
                                                accessSchedule.DayOfWeek
                                            )}
                                            secondary={
                                                getDisplayTime(
                                                    accessSchedule.StartHour
                                                )
                                                    + ' - '
                                                    + getDisplayTime(
                                                        accessSchedule.EndHour
                                                    )
                                            }
                                        />
                                    </ListItem>
                                )
                            )}
                        </List>
                    )}
                </Box>
            )}
            <Box>
                <Button
                    type='submit'
                    className='emby-button raised button-submit block'
                >
                    {globalize.translate('Save')}
                </Button>
            </Box>
        </form>
    );
};

export default UserParentalControlForm;
