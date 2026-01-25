import React, { type FC } from 'react';
import { Box } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import globalize from 'lib/globalize';
import { vars } from 'styles/tokens.css';

interface NoItemsMessageProps {
    message?: string;
}

const NoItemsMessage: FC<NoItemsMessageProps> = ({ message = 'MessageNoItemsAvailable' }) => {
    return (
        <Box className="noItemsMessage centerMessage">
            <Text as="h1" size="display" weight="bold">
                {globalize.translate('MessageNothingHere')}
            </Text>
            <Text style={{ marginBottom: vars.spacing.md }}>{globalize.translate(message)}</Text>
        </Box>
    );
};

export default NoItemsMessage;
