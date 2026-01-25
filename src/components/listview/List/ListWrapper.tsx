import classNames from 'classnames';
import React, { type FC, type PropsWithChildren } from 'react';
import { Box } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';

import { ItemAction } from 'constants/itemAction';
import type { DataAttributes } from 'types/dataAttributes';

import layoutManager from '../../layoutManager';

interface ListWrapperProps {
    index: number | undefined;
    title?: string | null;
    action?: ItemAction | null;
    dataAttributes?: DataAttributes;
    className?: string;
}

const ListWrapper: FC<PropsWithChildren<ListWrapperProps>> = ({
    index,
    action,
    title,
    className,
    dataAttributes,
    children
}) => {
    if (layoutManager.tv) {
        return (
            <Button
                type="button"
                data-index={index}
                className={classNames(className, 'itemAction listItem-button listItem-focusscale')}
                data-action={action}
                aria-label={title || ''}
                variant="plain"
                size="lg"
                {...dataAttributes}
            >
                {children}
            </Button>
        );
    } else {
        return (
            <Box data-index={index} className={className} {...dataAttributes}>
                {children}
            </Box>
        );
    }
};

export default ListWrapper;
