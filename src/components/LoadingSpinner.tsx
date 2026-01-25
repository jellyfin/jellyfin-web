/**
 * Loading Spinner Component
 *
 * A simple loading spinner with customizable size and color.
 */

import React from 'react';
import { Box, Flex } from 'ui-primitives/Box';
import { CircularProgress } from 'ui-primitives/CircularProgress';
import { Text } from 'ui-primitives/Text';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    overlay?: boolean;
    message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'lg', overlay = false, message }) => {
    const spinner = (
        <Flex style={{ flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <CircularProgress size={size} />
            {message && (
                <Text size="sm" color="secondary">
                    {message}
                </Text>
            )}
        </Flex>
    );

    if (overlay) {
        return (
            <Box
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1000
                }}
            >
                {spinner}
            </Box>
        );
    }

    return spinner;
};

export default LoadingSpinner;
