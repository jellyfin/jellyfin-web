import type { SvgIconComponent } from '@mui/icons-material';
import ImageNotSupported from '@mui/icons-material/ImageNotSupported';
import Box from '@mui/material/Box/Box';
import Paper from '@mui/material/Paper/Paper';
import Skeleton from '@mui/material/Skeleton/Skeleton';
import { type FC } from 'react';

interface ImageProps {
    isLoading: boolean
    alt?: string
    url?: string
    aspectRatio?: number
    FallbackIcon?: SvgIconComponent
}

const Image: FC<ImageProps> = ({
    isLoading,
    alt,
    url,
    aspectRatio = 16 / 9,
    FallbackIcon = ImageNotSupported
}) => (
    <Paper
        sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            aspectRatio,
            overflow: 'hidden'
        }}
    >
        {isLoading && (
            <Skeleton
                variant='rectangular'
                width='100%'
                height='100%'
            />
        )}
        {url ? (
            <img
                src={url}
                alt={alt}
                width='100%'
            />
        ) : (
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <FallbackIcon
                    sx={{
                        height: '25%',
                        width: 'auto'
                    }}
                />
            </Box>
        )}
    </Paper>
);

export default Image;
