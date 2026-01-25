import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { Paper } from '../Paper';
import { Text } from '../Text';

const meta: Meta<typeof Paper> = {
    title: 'UI Primitives/Paper',
    component: Paper,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    argTypes: {
        elevation: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
        variant: { control: 'radio', options: ['elevation', 'outlined'] }
    }
};

export default meta;
type Story = StoryObj<typeof Paper>;

export const Default: Story = {
    args: {
        elevation: 'md',
        children: (
            <div style={{ width: '200px', padding: '16px' }}>
                <Text weight='bold'>Card Title</Text>
                <Text color='secondary' size='sm'>This is a paper card with elevation.</Text>
            </div>
        )
    }
};

function AllElevationsStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <Paper elevation='none'>
                <div style={{ width: '120px', padding: '16px', textAlign: 'center' }}>
                    <Text size='sm'>None</Text>
                </div>
            </Paper>
            <Paper elevation='sm'>
                <div style={{ width: '120px', padding: '16px', textAlign: 'center' }}>
                    <Text size='sm'>Small</Text>
                </div>
            </Paper>
            <Paper elevation='md'>
                <div style={{ width: '120px', padding: '16px', textAlign: 'center' }}>
                    <Text size='sm'>Medium</Text>
                </div>
            </Paper>
            <Paper elevation='lg'>
                <div style={{ width: '120px', padding: '16px', textAlign: 'center' }}>
                    <Text size='sm'>Large</Text>
                </div>
            </Paper>
        </div>
    );
}

export const AllElevations: Story = {
    render: AllElevationsStory
};

export const Outlined: Story = {
    args: {
        variant: 'outlined',
        children: (
            <div style={{ width: '200px', padding: '16px' }}>
                <Text weight='bold'>Outlined Card</Text>
                <Text color='secondary' size='sm'>This is an outlined paper card.</Text>
            </div>
        )
    }
};

export const CardExample: Story = {
    decorators: [
        (_Story): ReactElement => (
            <div style={{ width: '280px' }}>
                <Paper elevation='md'>
                    <div style={{ padding: '16px', borderBottom: '1px solid #333' }}>
                        <Text weight='bold' size='lg'>Movie Title</Text>
                        <Text color='secondary' size='sm'>2024 • Action, Adventure</Text>
                    </div>
                    <div style={{ padding: '16px' }}>
                        <Text color='secondary' size='sm'>
                            A thrilling adventure awaits in this epic tale of courage and discovery.
                        </Text>
                    </div>
                </Paper>
            </div>
        )
    ]
};

function StackedPapersStory(): ReactElement {
    return (
        <div style={{ position: 'relative', width: '300px', height: '200px' }}>
            <Paper elevation='sm' style={{ position: 'absolute', top: 16, left: 16, width: '100%', padding: '16px' }}>
                <Text size='sm' color='secondary'>Background layer</Text>
            </Paper>
            <Paper elevation='md' style={{ position: 'absolute', top: 8, left: 8, width: '100%', padding: '16px' }}>
                <Text size='sm' color='secondary'>Middle layer</Text>
            </Paper>
            <Paper elevation='lg' style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '16px' }}>
                <Text weight='bold'>Top layer</Text>
            </Paper>
        </div>
    );
}

export const StackedPapers: Story = {
    render: StackedPapersStory
};
