import React from 'react';
import { ChevronRightIcon } from '@radix-ui/react-icons';

import { Box } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';
import { Heading } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

interface WidgetProps {
    title: string;
    href: string;
    children: React.ReactNode;
}

const Widget = ({ title, href, children }: WidgetProps): React.ReactElement => {
    return (
        <Box style={{ marginBottom: vars.spacing['5'] }}>
            <Button
                to={href}
                variant="plain"
                color="neutral"
                endDecorator={<ChevronRightIcon />}
                style={{
                    padding: 0,
                    marginBottom: vars.spacing['4'],
                    backgroundColor: 'transparent',
                    color: vars.colors.primary,
                    justifyContent: 'flex-start'
                }}
            >
                <Heading.H3>{title}</Heading.H3>
            </Button>

            {children}
        </Box>
    );
};

export default Widget;
