import React, { type FC } from 'react';
import IconButton from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/Info';
import globalize from 'lib/globalize';

interface InfoIconButtonProps {
    className?: string;
}

const InfoIconButton: FC<InfoIconButtonProps> = ({ className }) => {
    return (
        <IconButton
            className={className}
            data-action='link'
            title={globalize.translate('ButtonInfo')}
        >
            <InfoIcon />
        </IconButton>
    );
};

export default InfoIconButton;
