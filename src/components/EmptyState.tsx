import React from 'react';
import { Box, Flex, Text, Button } from '../ui-primitives';
import { vars } from 'styles/tokens.css';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
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
                    {icon && (
                        <Box style={{ fontSize: vars.typography.fontSizeDisplay, opacity: 0.3, marginBottom: vars.spacing['2'] }}>
                            {icon}
                        </Box>
                    )}
                    <Text as="h4" size="lg" weight="bold">
                        {title}
                    </Text>
                    {description && (
                        <Text size="md" color="secondary" style={{ maxWidth: 400 }}>
                            {description}
                        </Text>
                    )}
                    {action && <Button onClick={action.onClick}>{action.label}</Button>}
                </Flex>
            </Flex>
        </Box>
    );
};

export default EmptyState;
