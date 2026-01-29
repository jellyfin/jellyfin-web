import React, { type ReactElement } from 'react';
import { Box, type BoxProps } from '../Box';

interface AspectRatioProps extends BoxProps {
    readonly ratio?: number | string;
    readonly children?: React.ReactNode;
}

export function AspectRatio({
    ratio = 1,
    children,
    style,
    className,
    ...props
}: AspectRatioProps): ReactElement {
    const ratioValue = typeof ratio === 'string' ? parseFloat(ratio) : ratio;

    return (
        <Box
            className={className}
            style={{
                position: 'relative',
                width: '100%',
                paddingBottom: `${100 / ratioValue}%`,
                ...style
            }}
            {...props}
        >
            <Box
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
