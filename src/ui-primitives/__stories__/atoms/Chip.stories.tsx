import { motion } from 'motion/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, type ReactNode, useCallback } from 'react';
import { vars } from '../../../styles/tokens.css';

type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

interface ChipProps {
    children: ReactNode;
    variant?: ChipVariant;
    onDelete?: () => void;
    icon?: ReactNode;
}

const variantColors: Record<ChipVariant, string> = {
    default: vars.colors.surface,
    primary: vars.colors.primary,
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444'
};

function Chip({ children, variant = 'default', onDelete, icon }: Readonly<ChipProps>): ReactElement {
    return (
        <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: vars.spacing['2'],
                padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
                backgroundColor: variant === 'default' ? vars.colors.surface : `${variantColors[variant]}33`,
                border: `1px solid ${variantColors[variant]}`,
                borderRadius: '9999px',
                fontSize: vars.typography['3'].fontSize,
                color: vars.colors.text
            }}
        >
            {icon !== undefined && icon !== null && icon !== false && <span style={{ display: 'flex' }}>{icon}</span>}
            {children}
            {onDelete !== undefined && (
                <button
                    type="button"
                    onClick={onDelete}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: vars.colors.textMuted,
                        cursor: 'pointer',
                        padding: 0,
                        marginLeft: vars.spacing['2'],
                        fontSize: vars.typography['3'].fontSize
                    }}
                >
                    ✕
                </button>
            )}
        </motion.span>
    );
}

const meta: Meta<typeof Chip> = {
    title: 'UI Primitives/Chip',
    component: Chip,
    parameters: { layout: 'centered' },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { children: 'Default Chip' }
};

function VariantsStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: vars.spacing['4'], flexWrap: 'wrap' }}>
            <Chip variant="default">Default</Chip>
            <Chip variant="primary">Primary</Chip>
            <Chip variant="success">Success</Chip>
            <Chip variant="warning">Warning</Chip>
            <Chip variant="error">Error</Chip>
        </div>
    );
}

export const Variants: Story = {
    render: VariantsStory
};

function WithIconStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: vars.spacing['4'] }}>
            <Chip icon="🎬">Movies</Chip>
            <Chip icon="📺">TV Shows</Chip>
            <Chip icon="🎵">Music</Chip>
        </div>
    );
}

export const WithIcon: Story = {
    render: WithIconStory
};

function DeletableStory(): ReactElement {
    const handleDelete = useCallback((): void => {
        // Handle delete
    }, []);

    return (
        <div style={{ display: 'flex', gap: vars.spacing['4'] }}>
            <Chip onDelete={handleDelete}>Removable</Chip>
            <Chip variant="primary" onDelete={handleDelete}>
                Primary
            </Chip>
        </div>
    );
}

export const Deletable: Story = {
    render: DeletableStory
};
