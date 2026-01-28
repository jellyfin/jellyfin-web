import { vars } from 'styles/tokens.css.ts';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { Text, Heading } from '../..';

const meta: Meta<typeof Text> = {
    title: 'UI Primitives/Text',
    component: Text,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    argTypes: {
        size: { control: 'select', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'display'] },
        weight: { control: 'select', options: ['normal', 'medium', 'bold'] },
        color: { control: 'select', options: ['primary', 'secondary', 'muted', 'error', 'success', 'warning', 'info'] },
        align: { control: 'select', options: ['left', 'center', 'right'] },
        as: {
            control: 'select',
            options: ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'small', 'strong', 'em']
        }
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['2'] }}>
            <Text size="xs">Extra Small (12px)</Text>
            <Text size="sm">Small (14px)</Text>
            <Text size="md">Medium (16px)</Text>
            <Text size="lg">Large (18px)</Text>
            <Text size="xl">Extra Large (20px)</Text>
            <Text size="xxl">2XL (24px)</Text>
            <Text size="display">Display (32px)</Text>
        </div>
    );
}

export const AllSizes: Story = {
    render: AllSizesStory
};

function AllColorsStory(): ReactElement {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['2'] }}>
            <Text color="primary">Primary Color</Text>
            <Text color="secondary">Secondary Color</Text>
            <Text color="muted">Muted Color</Text>
            <Text color="error">Error Color</Text>
            <Text color="success">Success Color</Text>
            <Text color="warning">Warning Color</Text>
            <Text color="info">Info Color</Text>
        </div>
    );
}

export const AllColors: Story = {
    render: AllColorsStory
};

function AllWeightsStory(): ReactElement {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['2'] }}>
            <Text weight="normal">Normal Weight</Text>
            <Text weight="medium">Medium Weight</Text>
            <Text weight="bold">Bold Weight</Text>
        </div>
    );
}

export const AllWeights: Story = {
    render: AllWeightsStory
};

function AlignmentsStory(): ReactElement {
    return (
        <div style={{ width: '300px', border: '1px solid #333', borderRadius: '8px', padding: '16px' }}>
            <Text align="left">Left aligned text</Text>
            <Text align="center">Center aligned text</Text>
            <Text align="right">Right aligned text</Text>
        </div>
    );
}

export const Alignments: Story = {
    render: AlignmentsStory
};

function HeadingsStory(): ReactElement {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['2'] }}>
            <Heading.H1>Heading 1</Heading.H1>
            <Heading.H2>Heading 2</Heading.H2>
            <Heading.H3>Heading 3</Heading.H3>
            <Heading.H4>Heading 4</Heading.H4>
            <Heading.H5>Heading 5</Heading.H5>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['2'] }}>
            <Text as="em">Emphasized text</Text>
            <Text as="strong">Strong text</Text>
            <Text as="span">Regular span</Text>
        </div>
    );
}

export const WithEmphasis: Story = {
    render: WithEmphasisStory
};

function ParagraphExampleStory(): ReactElement {
    return (
        <div style={{ width: '400px' }}>
            <Text size="lg" weight="bold" style={{ marginBottom: vars.spacing['2'] }}>
                Article Title
            </Text>
            <Text color="secondary">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua.
            </Text>
            <Text color="secondary" style={{ marginTop: vars.spacing['2'] }}>
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                consequat.
            </Text>
        </div>
    );
}

export const ParagraphExample: Story = {
    render: ParagraphExampleStory
};
