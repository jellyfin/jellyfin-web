import React, { type FC } from 'react';
import { IconButton } from 'ui-primitives/IconButton';
import { PlayIcon } from '@radix-ui/react-icons';

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
        <IconButton className={className} data-action={action} title={globalize.translate(title)}>
            <PlayIcon className={iconClassName} />
        </IconButton>
    );
};

export default PlayArrowIconButton;
