import React, { type FC } from 'react';
import { IconButton } from 'ui-primitives';
import { InfoCircledIcon } from '@radix-ui/react-icons';

import { ItemAction } from 'constants/itemAction';
import globalize from 'lib/globalize';

interface InfoIconButtonProps {
    className?: string;
}

const InfoIconButton: FC<InfoIconButtonProps> = ({ className }) => {
    return (
        <IconButton className={className} data-action={ItemAction.Link} title={globalize.translate('ButtonInfo')}>
            <InfoCircledIcon />
        </IconButton>
    );
};

export default InfoIconButton;
