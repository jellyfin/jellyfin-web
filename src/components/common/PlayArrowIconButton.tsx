import React, { type FC } from 'react';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import { ItemAction } from 'constants/itemAction';
import globalize from 'lib/globalize';

interface PlayArrowIconButtonProps {
    className: string;
    action: ItemAction;
    title: string;
    iconClassName?: string;
}

const PlayArrowIconButton: FC<PlayArrowIconButtonProps> = ({ className, action, title, iconClassName }) => {
    return (
        <IconButton
            className={className}
            data-action={action}
            title={globalize.translate(title)}
        >
            <PlayArrowIcon className={iconClassName} />
        </IconButton>
    );
};

export default PlayArrowIconButton;
