import React, { type FC } from 'react';
import { Box } from 'ui-primitives';
import { Paper } from 'ui-primitives';
import { ImageIcon } from '@radix-ui/react-icons';

import { LoadingSkeleton } from './LoadingSkeleton';

interface ImageProps {
    isLoading: boolean;
    alt?: string;
    url?: string;
    aspectRatio?: number;
    FallbackIcon?: React.ComponentType<{ style?: React.CSSProperties }>;
}

const Image: FC<ImageProps> = ({ isLoading, alt, url, aspectRatio = 16 / 9, FallbackIcon = ImageIcon }) => (
    <Paper
        style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            aspectRatio,
            overflow: 'hidden'
        }}
    >
        <LoadingSkeleton isLoading={isLoading} variant="rectangular" width="100%" height="100%">
            {url ? (
                <img src={url} alt={alt} width="100%" />
            ) : (
                <Box
                    style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <FallbackIcon
                        style={{
                            height: '25%',
                            width: 'auto'
                        }}
                    />
                </Box>
            )}
        </LoadingSkeleton>
    </Paper>
);

export default Image;
