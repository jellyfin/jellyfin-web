import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StorageIcon from '@mui/icons-material/Storage';
import Box from '@mui/material/Box';
import ButtonBase, { buttonBaseClasses } from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import React, { type FC, useCallback, useEffect, useId, useRef } from 'react';

import globalize from 'lib/globalize';

import type { AvailableServer } from '../api/useAvailableServers';

/** Returns the address shown for a server: the first one the server has. */
export const getServerAddress = (server: AvailableServer) => (
    server.ManualAddress || server.LocalAddress || server.RemoteAddress || undefined
);

/** Returns what a server is called: its name, or else its address. */
export const getServerDisplayName = (server: AvailableServer) => (
    server.Name || getServerAddress(server) || globalize.translate('LabelUnnamedServer')
);

interface ServerListItemProps {
    server: AvailableServer
    isActive: boolean
    /** Whether a connection to this server is in progress */
    isConnecting: boolean
    disabled: boolean
    /** Focuses the server once it is mounted, or as soon as this becomes true */
    isFocusRequested: boolean
    /** Called once the requested focus was given */
    onFocused: () => void
    onConnect: (server: AvailableServer) => void
    onDelete: (server: AvailableServer) => void
}

const ServerListItem: FC<ServerListItemProps> = ({
    server,
    isActive,
    isConnecting,
    disabled,
    isFocusRequested,
    onFocused,
    onConnect,
    onDelete
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const addressId = useId();
    const currentId = useId();
    const name = getServerDisplayName(server);
    // The address is the name of a server without one, so it is not repeated
    const address = server.Name ? getServerAddress(server) : undefined;
    const description = [ address && addressId, isActive && currentId ].filter(Boolean).join(' ');

    useEffect(() => {
        if (!isFocusRequested) return;

        buttonRef.current?.focus();
        onFocused();
    }, [ isFocusRequested, onFocused ]);

    const onConnectClick = useCallback(() => {
        if (!disabled) onConnect(server);
    }, [ disabled, onConnect, server ]);

    const onDeleteClick = useCallback(() => {
        onDelete(server);
    }, [ onDelete, server ]);

    return (
        <Box component='li' sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <ButtonBase
                ref={buttonRef}
                focusRipple
                // Says what the button does. The visible name stays part of the accessible name, so voice control
                // users can still activate it by the name they see
                aria-label={globalize.translate('ButtonConnectTo', name)}
                aria-describedby={description || undefined}
                // aria-disabled instead of disabled keeps the focus on the server while connecting
                aria-disabled={disabled || undefined}
                disableRipple={disabled}
                onClick={onConnectClick}
                sx={theme => ({
                    flex: 1,
                    minWidth: 0,
                    minHeight: 56,
                    justifyContent: 'flex-start',
                    gap: 2,
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    textAlign: 'start',
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
                        // The server being connected to stays as readable as it was
                        opacity: isConnecting ? 1 : theme.vars.palette.action.disabledOpacity,
                        '&:hover': {
                            bgcolor: 'transparent'
                        }
                    }
                })}
            >
                {isConnecting ?
                    <CircularProgress size={24} aria-hidden /> :
                    <StorageIcon aria-hidden />}
                <Box component='span' sx={{ minWidth: 0, flex: 1 }}>
                    <Typography component='span' variant='body1' noWrap title={name} sx={{ display: 'block' }}>
                        {name}
                    </Typography>
                    {address && (
                        <Typography
                            id={addressId}
                            component='span'
                            variant='body2'
                            color='text.secondary'
                            noWrap
                            title={address}
                            sx={{ display: 'block' }}
                        >
                            {address}
                        </Typography>
                    )}
                </Box>
                {isActive && (
                    <Chip
                        id={currentId}
                        component='span'
                        size='small'
                        label={globalize.translate('LabelCurrentServer')}
                    />
                )}
            </ButtonBase>
            <IconButton
                aria-label={globalize.translate('DeleteName', name)}
                disabled={disabled}
                onClick={onDeleteClick}
                sx={{ p: 1.5 }}
            >
                <DeleteOutlineIcon aria-hidden />
            </IconButton>
        </Box>
    );
};

interface ServerListProps {
    servers: AvailableServer[]
    /** The id of the server in use, which is marked as the current server */
    activeServerId?: string
    /** The id of the server being connected to */
    connectingServerId?: string
    disabled?: boolean
    /** The id of the server to focus. Requested again by a new id. */
    focusServerId?: string
    onFocused: () => void
    onConnect: (server: AvailableServer) => void
    onDelete: (server: AvailableServer) => void
}

const ServerList: FC<ServerListProps> = ({
    servers,
    activeServerId,
    connectingServerId,
    disabled = false,
    focusServerId,
    onFocused,
    onConnect,
    onDelete
}) => (
    <Box
        component='ul'
        role='list'
        // The role and the label are for Safari, which does not report a list without bullets
        aria-label={globalize.translate('HeaderSavedServers')}
        sx={{ listStyle: 'none', m: 0, p: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}
    >
        {servers.map(server => (
            <ServerListItem
                key={server.Id}
                server={server}
                isActive={server.Id === activeServerId}
                isConnecting={server.Id === connectingServerId}
                disabled={disabled}
                isFocusRequested={server.Id === focusServerId}
                onFocused={onFocused}
                onConnect={onConnect}
                onDelete={onDelete}
            />
        ))}
    </Box>
);

export default ServerList;
