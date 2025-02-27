import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import type { TextLine } from './cardHelper';

interface CardTextProps {
    className?: string;
    textLine: TextLine;
}

const CardText: FC<CardTextProps> = ({ className, textLine }) => {
    const { title, titleAction } = textLine;
    // eslint-disable-next-line sonarjs/function-return-type
    const renderCardText = () => {
        if (titleAction) {
            return (
                <a
                    className='itemAction textActionButton'
                    href={titleAction.url}
                    title={titleAction.title}
                    {...titleAction.dataAttributes}
                >
                    {titleAction.title}
                </a>
            );
        } else {
            return title;
        }
    };

    return <Box className={className}>{renderCardText()}</Box>;
};

export default CardText;
