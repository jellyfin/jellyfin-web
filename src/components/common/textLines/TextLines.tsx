import classNames from 'classnames';
import React, { type FC, type PropsWithChildren } from 'react';
import type { ItemDto } from 'types/base/models/item-dto';
import { Box, Text } from 'ui-primitives';
import type { TextLine, TextLineOpts } from './types';
import useTextLines from './useTextLines';

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
            <Text
                as={isLargeStyle ? 'h1' : 'h3'}
                size={isLargeStyle ? 'display' : 'xl'}
                weight="bold"
                className={classNames('primary', className)}
            >
                {children}
            </Text>
        );
    } else {
        return <Box className={classNames('secondary', className)}>{children}</Box>;
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
