import React, { type FC } from 'react';
import IconButton from '@mui/material/IconButton/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import { ItemAction } from 'constants/itemAction';
import globalize from 'lib/globalize';

interface MoreVertIconButtonProps {
    className?: string;
    iconClassName?: string;
}

const MoreVertIconButton: FC<MoreVertIconButtonProps> = ({ className, iconClassName }) => {
    return (
        <IconButton
            className={className}
            data-action={ItemAction.Menu}
            title={globalize.translate('ButtonMore')}
        >
            <MoreVertIcon className={iconClassName} />
        </IconButton>
    );
};

export default MoreVertIconButton;
