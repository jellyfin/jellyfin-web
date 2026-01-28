import React, { type FC } from 'react';
import { IconButton } from 'ui-primitives';
import { PlusIcon } from '@radix-ui/react-icons';

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
            <PlusIcon />
        </IconButton>
    );
};

export default PlaylistAddIconButton;
