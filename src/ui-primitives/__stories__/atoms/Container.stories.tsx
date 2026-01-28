import { vars } from 'styles/tokens.css.ts';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { Container } from '../..';
import { Box } from '../..';
import { Text } from '../..';

const meta: Meta<typeof Container> = {
    title: 'UI Primitives/Container',
    component: Container,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    argTypes: {
        maxWidth: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl', 'none'] }
    }
};

export default meta;
type Story = StoryObj<typeof Container>;

export const Default: Story = {
    args: {
        maxWidth: 'lg',
        children: (
            <Box style={{ backgroundColor: '#252525', padding: '16px', borderRadius: '8px' }}>
                <Text>Container content with maxWidth=&quot;lg&quot;</Text>
            </Box>
        )
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', border: '1px dashed #444' }}>
                <Story />
            </div>
        )
    ]
};

export const NoMaxWidth: Story = {
    args: {
        maxWidth: 'none',
        children: (
            <Box style={{ backgroundColor: '#252525', padding: '16px', borderRadius: '8px' }}>
                <Text>Full-width container (no maxWidth)</Text>
            </Box>
        )
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '100%', border: '1px dashed #444' }}>
                <Story />
            </div>
        )
    ]
};

function AllSizesStory(): ReactElement {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {(['xs', 'sm', 'md', 'lg', 'xl', 'none'] as const).map(size => (
                <Box key={size}>
                    <Text as="small" color="secondary" style={{ marginBottom: vars.spacing['2'] }}>
                        maxWidth=&quot;{size}&quot;
                    </Text>
                    <Container maxWidth={size}>
                        <Box style={{ backgroundColor: '#252525', padding: '12px', borderRadius: '8px' }}>
                            <Text>Content container</Text>
                        </Box>
                    </Container>
                </Box>
            ))}
        </div>
    );
}

export const AllSizes: Story = {
    render: AllSizesStory
};
