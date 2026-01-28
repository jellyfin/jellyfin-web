import React, { FC, PropsWithChildren } from 'react';
import { Box } from '../../ui-primitives/Box';
import { vars } from '../../styles/tokens.css';

interface PageContainerProps {
    padding?: boolean;
    maxWidth?: number | string;
}

export const PageContainer: FC<PropsWithChildren<PageContainerProps>> = ({ 
    children, 
    padding = true,
    maxWidth
}) => {
    return (
        <Box
            style={{
                padding: padding ? vars.spacing['5'] : 0,
                maxWidth: maxWidth || '100%',
                margin: '0 auto',
                width: '100%',
                boxSizing: 'border-box'
            }}
        >
            {children}
        </Box>
    );
};
