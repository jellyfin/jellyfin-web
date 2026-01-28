import React from 'react';
import { Box, Flex, Text, Button } from 'ui-primitives';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { vars } from 'styles/tokens.css.ts';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message = 'Something went wrong', onRetry }) => {
    return (
        <Box>
            <Flex
                style={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 16px',
                    textAlign: 'center'
                }}
            >
                <Flex style={{ flexDirection: 'column', alignItems: 'center', gap: vars.spacing['4'] }}>
                    <Box style={{ fontSize: vars.typography['9'].fontSize, color: vars.colors.error }}>
                        <ExclamationTriangleIcon style={{ fontSize: vars.typography['9'].fontSize }} />
                    </Box>
                    <Text as="h4" size="lg" weight="bold" color="error">
                        Oops!
                    </Text>
                    <Text size="md" color="secondary" style={{ maxWidth: 400 }}>
                        {message}
                    </Text>
                    {onRetry && (
                        <Button variant="secondary" onClick={onRetry}>
                            Try Again
                        </Button>
                    )}
                </Flex>
            </Flex>
        </Box>
    );
};

export default ErrorState;
