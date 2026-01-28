import { vars } from 'styles/tokens.css.ts';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { Spacer } from '../..';
import { Box } from '../..';
import { Text } from '../..';

const meta: Meta<typeof Spacer> = {
    title: 'UI Primitives/Spacer',
    component: Spacer,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    argTypes: {
        size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] }
    }
};

export default meta;
type Story = StoryObj<typeof Spacer>;

export const Default: Story = {
    args: {
        size: 'md'
    }
};

function AllSizesStory(): ReactElement {
    return (
        <Box style={{ width: '200px' }}>
            <Text>Item 1</Text>
            <Spacer size="xs" />
            <Text>After xs spacer</Text>
            <Spacer size="sm" />
            <Text>After sm spacer</Text>
            <Spacer size="md" />
            <Text>After md spacer</Text>
            <Spacer size="lg" />
            <Text>After lg spacer</Text>
            <Spacer size="xl" />
            <Text>After xl spacer</Text>
            <Spacer size="xxl" />
            <Text>After xxl spacer</Text>
        </Box>
    );
}

export const AllSizes: Story = {
    render: AllSizesStory
};

export const LayoutExample: Story = {
    decorators: [
        (_Story): ReactElement => (
            <Box style={{ width: '300px', border: '1px solid #333', borderRadius: '8px', padding: '16px' }}>
                <Text weight="bold">Header</Text>
                <Spacer size="md" />
                <Text color="secondary">Main content goes here.</Text>
                <Spacer size="md" />
                <Text color="secondary">More content...</Text>
                <Spacer size="lg" />
                <Box style={{ display: 'flex', justifyContent: 'flex-end', gap: vars.spacing['2'] }}>
                    <Text as="span" size="sm" color="secondary">
                        Cancel
                    </Text>
                    <Text as="span" size="sm" color="primary">
                        Confirm
                    </Text>
                </Box>
            </Box>
        )
    ]
};

export const CardContent: Story = {
    decorators: [
        (_Story): ReactElement => (
            <Box style={{ width: '350px' }}>
                <Box style={{ border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
                    <Box style={{ padding: '16px', backgroundColor: '#2a2a2a' }}>
                        <Text weight="bold">Card Title</Text>
                    </Box>
                    <Spacer size="sm" />
                    <Box style={{ padding: '0 16px' }}>
                        <Text color="secondary" size="sm">
                            This is the card content section.
                        </Text>
                    </Box>
                    <Spacer size="md" />
                    <Box style={{ padding: '0 16px' }}>
                        <Text color="secondary" size="sm">
                            More details about the card.
                        </Text>
                    </Box>
                    <Spacer size="lg" />
                    <Box style={{ padding: '16px', borderTop: '1px solid #333' }}>
                        <Text as="span" size="sm" color="primary">
                            Action Link
                        </Text>
                    </Box>
                </Box>
            </Box>
        )
    ]
};

export const FormSpacing: Story = {
    decorators: [
        (_Story): ReactElement => (
            <div style={{ width: '300px' }}>
                <div>
                    <Text size="sm" color="secondary">
                        Username
                    </Text>
                    <div style={{ height: '8px' }} />
                    <input
                        type="text"
                        placeholder="Enter username"
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #444',
                            backgroundColor: '#252525',
                            color: '#fff'
                        }}
                    />
                </div>
                <Spacer size="md" />
                <div>
                    <Text size="sm" color="secondary">
                        Email
                    </Text>
                    <div style={{ height: '8px' }} />
                    <input
                        type="email"
                        placeholder="Enter email"
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #444',
                            backgroundColor: '#252525',
                            color: '#fff'
                        }}
                    />
                </div>
                <Spacer size="xl" />
                <button
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#aa5eaa',
                        color: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    Submit
                </button>
            </div>
        )
    ]
};
