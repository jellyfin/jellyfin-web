import React, { type FC, type PropsWithChildren } from 'react';
import classNames from 'classnames';
import Typography from '@mui/material/Typography/Typography';
import Box from '@mui/material/Box/Box';
import useTextLines from './useTextLines';

import type { ItemDto } from 'types/base/models/item-dto';
import type { TextLine, TextLineOpts } from './types';

interface TextWrapperProps {
    isHeading?: boolean;
    isLargeStyle?: boolean;
    className?: string;
}

const TextWrapper: FC<PropsWithChildren<TextWrapperProps>> = ({
    isHeading,
    isLargeStyle,
    className,
    children
}) => {
    if (isHeading) {
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

interface TextLinesProps {
    item: ItemDto;
    textLineOpts?: TextLineOpts;
    isLargeStyle?: boolean;
    className?: string;
    textClassName?: string;
}

const TextLines: FC<TextLinesProps> = ({
    item,
    textLineOpts,
    isLargeStyle,
    className,
    textClassName
}) => {
    const { textLines } = useTextLines({ item, textLineOpts });

    const renderTextlines = (text: TextLine, index: number) => {
        return (
            <TextWrapper
                key={index}
                isHeading={index === 0}
                isLargeStyle={isLargeStyle}
                className={textClassName}
            >
                <bdi>{text.title}</bdi>
            </TextWrapper>
        );
    };

    return (
        <Box className={className}>
            {textLines?.map((text, index) => renderTextlines(text, index))}
        </Box>
    );
};

export default TextLines;
