import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { Button } from '../../Button';
import { motion } from 'motion/react';

const meta: Meta<typeof Button> = {
    title: 'UI Primitives/Button',
    component: Button,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'ghost', 'danger']
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg']
        },
        disabled: {
            control: 'boolean'
        },
        onClick: {
            action: 'clicked'
        }
    }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: {
        children: 'Primary Button',
        variant: 'primary'
    }
};

export const Secondary: Story = {
    args: {
        children: 'Secondary Button',
        variant: 'secondary'
    }
};

export const Ghost: Story = {
    args: {
        children: 'Ghost Button',
        variant: 'ghost'
    }
};

export const Danger: Story = {
    args: {
        children: 'Danger Button',
        variant: 'danger'
    }
};

export const Disabled: Story = {
    args: {
        children: 'Disabled Button',
        disabled: true
    }
};

function WithMotionStory(): ReactElement {
    return (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="primary">Animated Button</Button>
        </motion.div>
    );
}

export const WithMotion: Story = {
    render: WithMotionStory
};

function AllVariantsStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
        </div>
    );
}

export const AllVariants: Story = {
    render: AllVariantsStory
};

export const Interactive: Story = {
    args: {
        children: 'Click Me',
        variant: 'primary'
    }
};

function AllSizesStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
        </div>
    );
}

export const AllSizes: Story = {
    render: AllSizesStory
};

export const Loading: Story = {
    args: {
        children: 'Loading...',
        variant: 'primary',
        disabled: true
    }
};

function WithIconStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: '1rem' }}>
            <Button variant="primary" startDecorator={<span>★</span>}>
                With Star
            </Button>
            <Button variant="secondary" endDecorator={<span>→</span>}>
                With Arrow
            </Button>
        </div>
    );
}

export const WithIcon: Story = {
    render: WithIconStory
};
