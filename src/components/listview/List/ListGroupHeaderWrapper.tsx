import React, { type FC, type PropsWithChildren } from 'react';
import Typography from '@mui/material/Typography';

interface ListGroupHeaderWrapperProps {
    index?: number;
}

const ListGroupHeaderWrapper: FC<PropsWithChildren<ListGroupHeaderWrapperProps>> = ({
    index,
    children
}) => {
    if (index === 0) {
        return (
            <Typography
                className='listGroupHeader listGroupHeader-first'
                variant='h2'
            >
                {children}
            </Typography>
        );
    } else {
        return (
            <Typography className='listGroupHeader' variant='h2'>
                {children}
            </Typography>
        );
    }
};

export default ListGroupHeaderWrapper;
