import React, { type FC } from 'react';
import IconButton from '@mui/material/IconButton';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import globalize from 'lib/globalize';

interface PlaylistAddIconButtonProps {
    className?: string;
}

const PlaylistAddIconButton: FC<PlaylistAddIconButtonProps> = ({
    className
}) => {
    return (
        <IconButton
            className={className}
            data-action='addtoplaylist'
            title={globalize.translate('AddToPlaylist')}
        >
            <PlaylistAddIcon />
        </IconButton>
    );
};

export default PlaylistAddIconButton;
