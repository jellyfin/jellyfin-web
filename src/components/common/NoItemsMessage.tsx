import globalize from 'lib/globalize';
import React, { type FC } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Box, Text } from 'ui-primitives';

interface NoItemsMessageProps {
    message?: string;
}

const NoItemsMessage: FC<NoItemsMessageProps> = ({ message = 'MessageNoItemsAvailable' }) => {
    return (
        <Box className="noItemsMessage centerMessage">
            <Text as="h1" size="display" weight="bold">
                {globalize.translate('MessageNothingHere')}
            </Text>
            <Text style={{ marginBottom: vars.spacing['5'] }}>{globalize.translate(message)}</Text>
        </Box>
    );
};

export default NoItemsMessage;
