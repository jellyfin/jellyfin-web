import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import useTextLines from './useTextLines';
import TextWrapper from './TextWrapper';

import type { ItemDto } from 'types/base/models/item-dto';
import type { TextLine, TextLineOpts } from './types';

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
                index={index}
                isLargeStyle={isLargeStyle}
                className={textClassName}
            >
                {text.title}
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
