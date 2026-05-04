import React, { type FC } from 'react';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

import { ItemAction } from 'constants/itemAction';
import globalize from 'lib/globalize';

interface DeleteIconButtonProps {
    className?: string;
}

const DeleteIconButton: FC<DeleteIconButtonProps> = ({ className }) => {
    return (
        <IconButton
            className={className}
            data-action={ItemAction.Delete}
            title={globalize.translate('Delete')}
        >
            <DeleteIcon />
        </IconButton>
    );
};

export default DeleteIconButton;
