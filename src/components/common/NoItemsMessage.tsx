import React, { type FC } from 'react';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/material/Typography/Typography';
import globalize from 'lib/globalize';

interface NoItemsMessageProps {
    message?: string;
}

const NoItemsMessage: FC<NoItemsMessageProps> = ({
    message = 'MessageNoItemsAvailable'
}) => {
    return (
        <Box className='noItemsMessage centerMessage'>
            <Typography variant='h1'>
                {globalize.translate('MessageNothingHere')}
            </Typography>
            <Typography sx={{ marginBottom: '16px' }}>
                {globalize.translate(message)}
            </Typography>
        </Box>
    );
};

export default NoItemsMessage;
