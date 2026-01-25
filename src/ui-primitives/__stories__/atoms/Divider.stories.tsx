import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { Divider } from '../Divider';
import { Box } from '../Box';
import { Text } from '../Text';

const meta: Meta<typeof Divider> = {
    title: 'UI Primitives/Divider',
    component: Divider,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    argTypes: {
        orientation: { control: 'radio', options: ['horizontal', 'vertical'] }
    }
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {
    args: {
        orientation: 'horizontal'
    },
    decorators: [
        (_Story): ReactElement => (
            <Box style={{ width: '300px' }}>
                <Text>Content above</Text>
                <Divider />
                <Text>Content below</Text>
            </Box>
        )
    ]
};

export const Vertical: Story = {
    args: {
        orientation: 'vertical'
    },
    decorators: [
        (_Story): ReactElement => (
            <Box style={{ display: 'flex', alignItems: 'center', height: '60px' }}>
                <Text>Left</Text>
                <Divider orientation='vertical' />
                <Text>Right</Text>
            </Box>
        )
    ]
};

function InListStory(): ReactElement {
    return (
        <Box style={{ width: '250px', border: '1px solid #333', borderRadius: '8px', padding: '8px' }}>
            <Text>Item 1</Text>
            <Divider />
            <Text>Item 2</Text>
            <Divider />
            <Text>Item 3</Text>
            <Divider />
            <Text>Item 4</Text>
        </Box>
    );
}

export const InList: Story = {
    render: InListStory
};

export const InCard: Story = {
    decorators: [
        (_Story): ReactElement => (
            <Box style={{ width: '300px', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
                <Box style={{ padding: '16px', backgroundColor: '#2a2a2a' }}>
                    <Text weight='bold'>Card Header</Text>
                </Box>
                <Divider />
                <Box style={{ padding: '16px' }}>
                    <Text>Card content area with some text.</Text>
                </Box>
                <Divider />
                <Box style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Text as='span' size='sm' color='secondary'>Cancel</Text>
                    <Text as='span' size='sm' color='primary'>Confirm</Text>
                </Box>
            </Box>
        )
    ]
};

function MultipleVerticalStory(): ReactElement {
    return (
        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text>Home</Text>
            <Divider orientation='vertical' />
            <Text>About</Text>
            <Divider orientation='vertical' />
            <Text>Contact</Text>
            <Divider orientation='vertical' />
            <Text>Settings</Text>
        </Box>
    );
}

export const MultipleVertical: Story = {
    render: MultipleVerticalStory
};
