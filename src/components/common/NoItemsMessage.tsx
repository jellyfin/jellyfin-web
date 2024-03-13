import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import globalize from 'scripts/globalize';

interface NoItemsMessageProps {
    noItemsMessage?: string;
}

const NoItemsMessage: FC<NoItemsMessageProps> = ({
    noItemsMessage = 'MessageNoItemsAvailable'
}) => {
    return (
        <Box className='noItemsMessage centerMessage'>
            <Typography variant='h2'>
                {globalize.translate('MessageNothingHere')}
            </Typography>
            <Typography paragraph variant='h2'>
                {globalize.translate(noItemsMessage)}
            </Typography>
        </Box>
    );
};

export default NoItemsMessage;
