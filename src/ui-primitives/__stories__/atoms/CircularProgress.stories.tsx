import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { motion } from 'framer-motion';
import { vars } from '../../styles/tokens.css.ts';

interface CircularProgressProps {
    size?: number;
    value?: number;
    indeterminate?: boolean;
}

function CircularProgress({ size = 40, value, indeterminate }: Readonly<CircularProgressProps>): ReactElement {
    const strokeWidth = size * 0.1;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = value !== undefined ? circumference - (value / 100) * circumference : 0;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill='none'
                stroke={vars.colors.divider}
                strokeWidth={strokeWidth}
            />
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill='none'
                stroke={vars.colors.primary}
                strokeWidth={strokeWidth}
                strokeLinecap='round'
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                initial={indeterminate === true ? { rotate: 0 } : undefined}
                animate={indeterminate === true ? { rotate: 360 } : undefined}
                transition={indeterminate === true ? { duration: 1, repeat: Infinity, ease: 'linear' } : undefined}
            />
        </svg>
    );
}

const meta: Meta<typeof CircularProgress> = {
    title: 'UI Primitives/CircularProgress',
    component: CircularProgress,
    parameters: { layout: 'centered' },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Indeterminate: Story = {
    args: { indeterminate: true }
};

export const Determinate: Story = {
    args: { value: 75 }
};

function SizesStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: vars.spacing.md, alignItems: 'center' }}>
            <CircularProgress size={24} indeterminate />
            <CircularProgress size={40} indeterminate />
            <CircularProgress size={56} indeterminate />
        </div>
    );
}

export const Sizes: Story = {
    render: SizesStory
};

function ValuesStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: vars.spacing.md, alignItems: 'center' }}>
            <CircularProgress value={25} />
            <CircularProgress value={50} />
            <CircularProgress value={75} />
            <CircularProgress value={100} />
        </div>
    );
}

export const Values: Story = {
    render: ValuesStory
};
