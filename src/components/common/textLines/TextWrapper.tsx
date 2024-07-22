import React, { type FC, type PropsWithChildren } from 'react';
import Typography from '@mui/material/Typography';

interface TextWrapperProps {
    index?: number;
    isLargeStyle?: boolean;
    className?: string;
    subClassName?: string;
}

const TextWrapper: FC<PropsWithChildren<TextWrapperProps>> = ({
    index,
    isLargeStyle,
    className,
    subClassName,
    children
}) => {
    if (index === 0) {
        if (isLargeStyle) {
            return (
                <Typography className={className} variant='h1'>
                    {children}
                </Typography>
            );
        } else {
            return (
                <Typography className={className} variant='h5'>
                    {children}
                </Typography>
            );
        }
    } else {
        return (
            <Typography className={subClassName} variant='subtitle1'>
                {children}
            </Typography>
        );
    }
};

export default TextWrapper;
