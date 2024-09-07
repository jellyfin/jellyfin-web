import classNames from 'classnames';
import React, { type FC, type PropsWithChildren } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import layoutManager from '../../layoutManager';
import type { DataAttributes } from 'types/dataAttributes';

interface ListWrapperProps {
    index: number | undefined;
    title?: string | null;
    action?: string | null;
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
                data-index={index}
                className={classNames(
                    className,
                    'itemAction listItem-button listItem-focusscale'
                )}
                data-action={action}
                aria-label={title || ''}
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
