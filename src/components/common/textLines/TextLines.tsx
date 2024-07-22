import React, { type FC } from 'react';
import useTextLines from './useTextLines';

import TextWrapper from './TextWrapper';
import Link from '@mui/material/Link';
import type { ItemDto } from 'types/base/models/item-dto';
import type { TextLine, TextLineOpts } from './types';

interface TextLinesProps {
    item: ItemDto;
    textLineOpts?: TextLineOpts;
    isLargeStyle?: boolean;
    className?: string;
    subClassName?: string;
}

const TextLines: FC<TextLinesProps> = ({
    item,
    textLineOpts,
    isLargeStyle,
    className,
    subClassName
}) => {
    const { textLines } = useTextLines({ item, textLineOpts });

    const renderTextlines = (text: TextLine, index: number) => {
        return (
            <TextWrapper
                key={index}
                index={index}
                isLargeStyle={isLargeStyle}
                className={className}
                subClassName={subClassName}
            >
                {text.titleAction ? (
                    <>
                        {text.titleAction.map((val) => (
                            <Link
                                key={val.title}
                                underline='hover'
                                color='inherit'
                                href={val.url}
                            >
                                {val.title}
                            </Link>
                        ))}
                    </>
                ) : (
                    text.title
                )}
            </TextWrapper>
        );
    };

    return textLines?.map((text, index) => renderTextlines(text, index));
};

export default TextLines;
