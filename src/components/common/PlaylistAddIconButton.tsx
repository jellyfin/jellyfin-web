import React, { type FC } from 'react';
import IconButton from '@mui/material/IconButton/IconButton';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';

import { ItemAction } from 'constants/itemAction';
import globalize from 'lib/globalize';

interface PlaylistAddIconButtonProps {
    className?: string;
}

const PlaylistAddIconButton: FC<PlaylistAddIconButtonProps> = ({ className }) => {
    return (
        <IconButton
            className={className}
            data-action={ItemAction.AddToPlaylist}
            title={globalize.translate('AddToPlaylist')}
        >
            <PlaylistAddIcon />
        </IconButton>
    );
};

export default PlaylistAddIconButton;
