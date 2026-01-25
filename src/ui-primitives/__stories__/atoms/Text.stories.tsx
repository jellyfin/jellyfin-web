import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { Text, Heading } from '../Text';

const meta: Meta<typeof Text> = {
    title: 'UI Primitives/Text',
    component: Text,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    argTypes: {
        size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'display'] },
        weight: { control: 'select', options: ['normal', 'medium', 'bold'] },
        color: { control: 'select', options: ['primary', 'secondary', 'muted', 'error', 'success', 'warning', 'info'] },
        align: { control: 'select', options: ['left', 'center', 'right'] },
        as: { control: 'select', options: ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'small', 'strong', 'em'] }
    }
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {
    args: {
        children: 'Sample text content'
    }
};

function AllSizesStory(): ReactElement {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text size='xs'>Extra Small (12px)</Text>
            <Text size='sm'>Small (14px)</Text>
            <Text size='md'>Medium (16px)</Text>
            <Text size='lg'>Large (18px)</Text>
            <Text size='xl'>Extra Large (20px)</Text>
            <Text size='xxl'>2XL (24px)</Text>
            <Text size='display'>Display (32px)</Text>
        </div>
    );
}

export const AllSizes: Story = {
    render: AllSizesStory
};

function AllColorsStory(): ReactElement {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text color='primary'>Primary Color</Text>
            <Text color='secondary'>Secondary Color</Text>
            <Text color='muted'>Muted Color</Text>
            <Text color='error'>Error Color</Text>
            <Text color='success'>Success Color</Text>
            <Text color='warning'>Warning Color</Text>
            <Text color='info'>Info Color</Text>
        </div>
    );
}

export const AllColors: Story = {
    render: AllColorsStory
};

function AllWeightsStory(): ReactElement {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text weight='normal'>Normal Weight</Text>
            <Text weight='medium'>Medium Weight</Text>
            <Text weight='bold'>Bold Weight</Text>
        </div>
    );
}

export const AllWeights: Story = {
    render: AllWeightsStory
};

function AlignmentsStory(): ReactElement {
    return (
        <div style={{ width: '300px', border: '1px solid #333', borderRadius: '8px', padding: '16px' }}>
            <Text align='left'>Left aligned text</Text>
            <Text align='center'>Center aligned text</Text>
            <Text align='right'>Right aligned text</Text>
        </div>
    );
}

export const Alignments: Story = {
    render: AlignmentsStory
};

function HeadingsStory(): ReactElement {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Heading level={1}>Heading 1</Heading>
            <Heading level={2}>Heading 2</Heading>
            <Heading level={3}>Heading 3</Heading>
            <Heading level={4}>Heading 4</Heading>
            <Heading level={5}>Heading 5</Heading>
        </div>
    );
}

export const Headings: Story = {
    render: HeadingsStory
};

export const WithHtmlElement: Story = {
    args: {
        as: 'small',
        children: 'Small text element'
    }
};

function WithEmphasisStory(): ReactElement {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text as='em'>Emphasized text</Text>
            <Text as='strong'>Strong text</Text>
            <Text as='span'>Regular span</Text>
        </div>
    );
}

export const WithEmphasis: Story = {
    render: WithEmphasisStory
};

function ParagraphExampleStory(): ReactElement {
    return (
        <div style={{ width: '400px' }}>
            <Text size='lg' weight='bold' style={{ marginBottom: '8px' }}>Article Title</Text>
            <Text color='secondary'>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Text>
            <Text color='secondary' style={{ marginTop: '8px' }}>
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </Text>
        </div>
    );
}

export const ParagraphExample: Story = {
    render: ParagraphExampleStory
};
