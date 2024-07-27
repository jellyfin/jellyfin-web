import Paper from '@mui/material/Paper/Paper';
import Skeleton from '@mui/material/Skeleton/Skeleton';
import React, { type FC } from 'react';

interface PluginImageProps {
    isLoading: boolean
    alt?: string
    url?: string
}

const PluginImage: FC<PluginImageProps> = ({
    isLoading,
    alt,
    url
}) => (
    <Paper sx={{ width: '100%', aspectRatio: 16 / 9, overflow: 'hidden' }}>
        {isLoading && (
            <Skeleton
                variant='rectangular'
                width='100%'
                height='100%'
            />
        )}
        {url && (
            <img
                src={url}
                alt={alt}
                width='100%'
            />
        )}
    </Paper>
);

export default PluginImage;
