import type { Api } from '@jellyfin/sdk/lib/api';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase, { buttonBaseClasses } from '@mui/material/ButtonBase';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import type { Theme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, { type FC, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { VISUALLY_HIDDEN_STYLE } from 'apps/modern/utils/visuallyHidden';
import UserAvatar from 'components/UserAvatar';
import globalize from 'lib/globalize';

/** The avatar size on extra small screens, also used for the selected user in the login form */
export const AVATAR_SIZE = 72;
/** The avatar size on small screens and up */
export const AVATAR_SIZE_SM = 96;

/** How many rows of users are shown before the rest is collapsed behind the "show all" button */
const ROWS_SHOWN = 3;
/** How many grid tracks fit in the widened card at each breakpoint (see gridTemplateColumns below) */
const COLUMNS = { xs: 3, sm: 4 };
/**
 * Above this many users, the list is sorted by name and can be filtered. Scanning faces stops working at about a
 * dozen, after which people read names, and that is faster in a predictable order or by typing.
 */
export const LARGE_LIST_THRESHOLD = 12;
/** How long after typing the number of matches is announced, so every keystroke is not read out */
const ANNOUNCE_DELAY = 300;

const sortByName = (users: UserDto[]) => [ ...users ].sort((a, b) => (
    (a.Name ?? '').localeCompare(b.Name ?? '', undefined, { sensitivity: 'base', numeric: true })
));

const getMatchesMessage = (count: number) => {
    if (count === 0) return globalize.translate('MessageNoUsersMatch');
    if (count === 1) return globalize.translate('MessageUserFound');
    return globalize.translate('MessageUsersFound', count);
};

interface PublicUserItemProps {
    api?: Api
    user: UserDto
    avatarSize: number
    disabled?: boolean
    /** Focuses the user once they are mounted, or as soon as this becomes true */
    isFocusRequested?: boolean
    /** Called once the requested focus was given */
    onFocused?: () => void
    onSelect: (user: UserDto) => void
}

const PublicUserItem: FC<PublicUserItemProps> = ({
    api,
    user,
    avatarSize,
    disabled,
    isFocusRequested,
    onFocused,
    onSelect
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isFocusRequested) return;

        buttonRef.current?.focus();
        onFocused?.();
    }, [ isFocusRequested, onFocused ]);

    const onClick = useCallback(() => {
        if (!disabled) onSelect(user);
    }, [ disabled, onSelect, user ]);

    return (
        <Box component='li' sx={{ width: '100%', minWidth: 0 }}>
            <ButtonBase
                ref={buttonRef}
                focusRipple
                // Says what the button does. The visible name stays part of the accessible name, so voice control
                // users can still activate it by the name they see
                aria-label={user.Name ? globalize.translate('ButtonSignInAs', user.Name) : undefined}
                // aria-disabled instead of disabled keeps the focus on the user while a login is in progress
                aria-disabled={disabled || undefined}
                disableRipple={disabled}
                onClick={onClick}
                sx={theme => ({
                    flexDirection: 'column',
                    gap: 1,
                    p: 1,
                    borderRadius: 2,
                    width: '100%',
                    '&:hover': {
                        bgcolor: theme.vars.palette.action.hover,
                        '@media (hover: none)': {
                            bgcolor: 'transparent'
                        }
                    },
                    // The focus background alone is too faint, so add an outline for keyboard users
                    [`&.${buttonBaseClasses.focusVisible}`]: {
                        bgcolor: theme.vars.palette.action.focus,
                        outline: `2px solid ${theme.vars.palette.primary.main}`,
                        outlineOffset: 2
                    },
                    '&[aria-disabled="true"]': {
                        cursor: 'default',
                        opacity: theme.vars.palette.action.disabledOpacity,
                        '&:hover': {
                            bgcolor: 'transparent'
                        }
                    }
                })}
            >
                <UserAvatar
                    api={api}
                    user={user}
                    size={avatarSize}
                    alt=''
                />
                <Typography
                    variant='body2'
                    noWrap
                    title={user.Name ?? undefined}
                    sx={{ width: '100%', textAlign: 'center' }}
                >
                    {user.Name}
                </Typography>
            </ButtonBase>
        </Box>
    );
};

interface PublicUserListProps {
    api?: Api
    users: UserDto[]
    disabled?: boolean
    /** The id of the user to focus after mounting, e.g. to return the focus to the user that was selected */
    focusUserId?: string
    onUserSelect: (user: UserDto) => void
}

const PublicUserList: FC<PublicUserListProps> = ({
    api,
    users,
    disabled,
    focusUserId,
    onUserSelect
}) => {
    const isSmUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('sm'));
    const avatarSize = isSmUp ? AVATAR_SIZE_SM : AVATAR_SIZE;
    const columns = isSmUp ? COLUMNS.sm : COLUMNS.xs;
    const cap = columns * ROWS_SHOWN;
    const listId = useId();

    // Small lists keep the order of the server, which households are used to
    const isLargeList = users.length > LARGE_LIST_THRESHOLD;
    const orderedUsers = useMemo(() => (isLargeList ? sortByName(users) : users), [ isLargeList, users ]);

    const [ query, setQuery ] = useState('');
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const matchingUsers = useMemo(() => (
        normalizedQuery ?
            orderedUsers.filter(user => (user.Name ?? '').toLocaleLowerCase().includes(normalizedQuery)) :
            orderedUsers
    ), [ normalizedQuery, orderedUsers ]);

    // Collapse only when more than a row would be hidden, since a button that reveals a couple of users is noise
    const canCollapse = orderedUsers.length > cap + columns;
    // Start expanded when the user to focus would be hidden, so the focus can return to them
    const [ isExpanded, setIsExpanded ] = useState(() => (
        !!focusUserId && orderedUsers.findIndex(user => user.Id === focusUserId) >= cap
    ));
    const isCollapsed = canCollapse && !isExpanded && !normalizedQuery;
    const visibleUsers = isCollapsed ? matchingUsers.slice(0, cap) : matchingUsers;
    const hasNoMatches = !!normalizedQuery && matchingUsers.length === 0;

    // The user who takes the focus next: the one to return to after mounting, or the first user revealed by "show
    // all", so keyboard and screen reader users continue where they were and hear their position in the list. The
    // request is cleared once fulfilled, so the user does not take the focus again whenever their item is mounted
    // again, e.g. after being filtered out and back in while typing
    const [ pendingFocusUserId, setPendingFocusUserId ] = useState(focusUserId);
    const isPendingFocusUserListed = !!pendingFocusUserId && orderedUsers.some(user => user.Id === pendingFocusUserId);

    useEffect(() => {
        // Drop a request for a user who is not listed (anymore), so they do not take the focus if they return later
        if (pendingFocusUserId && !isPendingFocusUserListed) setPendingFocusUserId(undefined);
    }, [ isPendingFocusUserListed, pendingFocusUserId ]);

    const onUserFocused = useCallback(() => {
        setPendingFocusUserId(undefined);
    }, []);

    const onShowAllClick = useCallback(() => {
        setPendingFocusUserId(orderedUsers[cap]?.Id ?? undefined);
        setIsExpanded(true);
    }, [ cap, orderedUsers ]);

    const onQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    }, []);

    const onQueryKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        // A single match can be picked without leaving the keyboard. Enter that confirms the composition of an
        // input method (e.g. for CJK names) is not a pick
        if (e.key === 'Enter' && !e.nativeEvent.isComposing && !disabled && matchingUsers.length === 1) {
            e.preventDefault();
            onUserSelect(matchingUsers[0]);
        }
    }, [ disabled, matchingUsers, onUserSelect ]);

    // The number of matches is announced through a status region that stays mounted, since a change of its text
    // is announced more reliably than a region that is added with its text
    const [ announcement, setAnnouncement ] = useState('');
    const matchCount = matchingUsers.length;
    useEffect(() => {
        if (!normalizedQuery) {
            setAnnouncement('');
            return;
        }

        const timeout = setTimeout(() => setAnnouncement(getMatchesMessage(matchCount)), ANNOUNCE_DELAY);
        return () => clearTimeout(timeout);
    }, [ matchCount, normalizedQuery ]);

    return (
        <Stack spacing={2} alignItems='center' sx={{ width: '100%' }}>
            {isLargeList && (
                <TextField
                    type='search'
                    size='small'
                    label={globalize.translate('LabelFindUser')}
                    value={query}
                    onChange={onQueryChange}
                    onKeyDown={onQueryKeyDown}
                    autoComplete='off'
                    sx={{ width: '100%', maxWidth: '25rem' }}
                    slotProps={{
                        input: {
                            // Stays focusable and readable while a login is in progress, but can not be edited
                            readOnly: disabled,
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <SearchIcon fontSize='small' aria-hidden />
                                </InputAdornment>
                            )
                        },
                        // autoCapitalize is passed through to the input element, since TextField would put it on
                        // the root element where it has no effect
                        htmlInput: { 'aria-controls': listId, autoCapitalize: 'off' }
                    }}
                />
            )}

            <Box
                component='ul'
                id={listId}
                // Safari drops the list semantics (and VoiceOver the item count) once the bullets are removed with
                // list-style: none, unless the role is stated explicitly
                role='list'
                aria-label={globalize.translate('HeaderUsers')}
                sx={{
                    display: 'grid',
                    // Fixed-width tracks with auto-fit collapse the unused tracks,
                    // so a few users are centered instead of packed to the left
                    gridTemplateColumns: {
                        xs: 'repeat(auto-fit, 5.5rem)',
                        sm: 'repeat(auto-fit, 7rem)'
                    },
                    justifyContent: 'center',
                    justifyItems: 'center',
                    gap: 2,
                    listStyle: 'none',
                    m: 0,
                    p: 0,
                    width: '100%'
                }}
            >
                {visibleUsers.map(user => (
                    <PublicUserItem
                        key={user.Id}
                        api={api}
                        user={user}
                        avatarSize={avatarSize}
                        disabled={disabled}
                        isFocusRequested={!!pendingFocusUserId && user.Id === pendingFocusUserId}
                        onFocused={onUserFocused}
                        onSelect={onUserSelect}
                    />
                ))}
            </Box>

            {hasNoMatches && (
                <Typography variant='body2' color='text.secondary' textAlign='center'>
                    {globalize.translate('MessageNoUsersMatch')}
                </Typography>
            )}

            {isCollapsed && (
                <Button variant='text' disabled={disabled} onClick={onShowAllClick}>
                    {globalize.translate('ButtonShowAllUsers', orderedUsers.length)}
                </Button>
            )}

            {isLargeList && (
                <Box component='span' role='status' sx={VISUALLY_HIDDEN_STYLE}>
                    {announcement}
                </Box>
            )}
        </Stack>
    );
};

export default PublicUserList;
