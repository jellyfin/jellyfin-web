import React, { type FC } from 'react';
import { IconButton } from 'ui-primitives/IconButton';
import { DotsVerticalIcon } from '@radix-ui/react-icons';

import { ItemAction } from 'constants/itemAction';
import globalize from 'lib/globalize';

interface MoreVertIconButtonProps {
    className?: string;
    iconClassName?: string;
}

const MoreVertIconButton: FC<MoreVertIconButtonProps> = ({ className, iconClassName }) => {
    return (
        <IconButton className={className} data-action={ItemAction.Menu} title={globalize.translate('ButtonMore')}>
            <DotsVerticalIcon className={iconClassName} />
        </IconButton>
    );
};

export default MoreVertIconButton;
