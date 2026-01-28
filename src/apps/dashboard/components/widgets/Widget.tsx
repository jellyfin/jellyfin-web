import React from 'react';
import { ChevronRightIcon } from '@radix-ui/react-icons';

import { Box } from 'ui-primitives';
import { Button } from 'ui-primitives';
import { Heading } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';

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
