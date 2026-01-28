import type { Meta, StoryObj } from '@storybook/react-vite';
import { AspectRatio } from '../../AspectRatio';
import { Box } from '../../Box';
import { vars } from '../../../styles/tokens.css';

const meta: Meta<typeof AspectRatio> = {
    title: 'UI Primitives/AspectRatio',
    component: AspectRatio,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    argTypes: {
        ratio: { control: 'number' }
    }
};

export default meta;
type Story = StoryObj<typeof AspectRatio>;

export const Default: Story = {
    args: {
        ratio: 16 / 9,
        children: (
            <Box
                style={{
                    backgroundColor: '#aa5eaa',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px'
                }}
            >
                <span style={{ color: 'white', fontWeight: vars.typography.fontWeightBold }}>16:9 Content</span>
            </Box>
        )
    },
    decorators: [
        Story => (
            <div style={{ width: '400px' }}>
                <Story />
            </div>
        )
    ]
};

export const Square: Story = {
    args: {
        ratio: 1,
        children: (
            <Box
                style={{
                    backgroundColor: '#4caf50',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px'
                }}
            >
                <span style={{ color: 'white', fontWeight: vars.typography.fontWeightBold }}>1:1 Square</span>
            </Box>
        )
    },
    decorators: [
        Story => (
            <div style={{ width: '200px' }}>
                <Story />
            </div>
        )
    ]
};

export const Portrait: Story = {
    args: {
        ratio: 3 / 4,
        children: (
            <Box
                style={{
                    backgroundColor: '#ff9800',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px'
                }}
            >
                <span style={{ color: 'white', fontWeight: vars.typography.fontWeightBold }}>3:4 Portrait</span>
            </Box>
        )
    },
    decorators: [
        Story => (
            <div style={{ width: '200px' }}>
                <Story />
            </div>
        )
    ]
};

export const Wide: Story = {
    args: {
        ratio: 21 / 9,
        children: (
            <Box
                style={{
                    backgroundColor: '#2196f3',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px'
                }}
            >
                <span style={{ color: 'white', fontWeight: vars.typography.fontWeightBold }}>21:9 Ultra Wide</span>
            </Box>
        )
    },
    decorators: [
        Story => (
            <div style={{ width: '500px' }}>
                <Story />
            </div>
        )
    ]
};
