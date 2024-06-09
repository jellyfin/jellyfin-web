import React, { type FC } from 'react';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import globalize from 'scripts/globalize';

interface MoreVertIconButtonProps {
    className?: string;
    iconClassName?: string;
}

const MoreVertIconButton: FC<MoreVertIconButtonProps> = ({ className, iconClassName }) => {
    return (
        <IconButton
            className={className}
            data-action='menu'
            title={globalize.translate('ButtonMore')}
        >
            <MoreVertIcon className={iconClassName} />
        </IconButton>
    );
};

export default MoreVertIconButton;
