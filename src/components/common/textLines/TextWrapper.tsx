import React, { type FC, type PropsWithChildren } from 'react';
import classNames from 'classnames';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface TextWrapperProps {
    index?: number;
    isLargeStyle?: boolean;
    className?: string;
}

const TextWrapper: FC<PropsWithChildren<TextWrapperProps>> = ({
    index,
    isLargeStyle,
    className,
    children
}) => {
    if (index === 0) {
        return (
            <Typography className={classNames('primary', className)} variant={isLargeStyle ? 'h1' : 'h3'}>
                {children}
            </Typography>
        );
    } else {
        return (
            <Box className={classNames('secondary', className )}>
                {children}
            </Box>
        );
    }
};

export default TextWrapper;
