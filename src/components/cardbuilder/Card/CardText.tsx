import React, { type FC } from 'react';
import Box from '@mui/material/Box/Box';

import { ensureArray } from 'utils/array';

import type { TextLine } from './cardHelper';

interface CardTextProps {
    className?: string;
    textLine: TextLine;
}

const SEPARATOR = ' / ';

const CardText: FC<CardTextProps> = ({ className, textLine }) => {
    const { title, titleAction } = textLine;

    return (
        <Box className={className}>
            {titleAction ? (
                ensureArray(titleAction).map((action, i, arr) => (
                    <React.Fragment key={`${action.url || action.title || 'action'}-${i}`}>
                        <a
                            className='itemAction textActionButton'
                            href={action.url}
                            title={action.title}
                            {...action.dataAttributes}
                        >
                            {action.title}
                        </a>
                        {/* If there are more items, add the separator */}
                        {(i < arr.length - 1) && SEPARATOR}
                    </React.Fragment>
                ))
            ) : (
                ensureArray(title).join(SEPARATOR)
            )}
        </Box>
    );
};

export default CardText;
