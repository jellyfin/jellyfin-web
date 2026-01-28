import React, { type FC } from 'react';
import { IconButton } from 'ui-primitives';

import { ItemAction } from 'constants/itemAction';

interface RightIconButtonsProps {
    className?: string;
    id: string;
    icon: string;
    title: string;
}

const RightIconButtons: FC<RightIconButtonsProps> = ({ className, id, title, icon }) => {
    return (
        <IconButton className={className} data-action={ItemAction.Custom} data-customaction={id} title={title}>
            {icon}
        </IconButton>
    );
};

export default RightIconButtons;
