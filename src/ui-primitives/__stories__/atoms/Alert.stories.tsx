import type { Meta, StoryObj } from '@storybook/react';
import { motion, AnimatePresence } from 'motion/react';
import { type ReactElement, useState, useCallback } from 'react';
import { vars } from '../../../styles/tokens.css';
import { Button } from '../../Button';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AnimatedAlertProps {
    variant?: AlertVariant;
    title?: string;
    children: React.ReactNode;
    dismissible?: boolean;
    onDismiss?: () => void;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; icon: string }> = {
    info: { bg: '#1e3a5f', border: '#3b82f6', icon: 'ℹ️' },
    success: { bg: '#1a3d2e', border: '#22c55e', icon: '✓' },
    warning: { bg: '#3d3d1a', border: '#eab308', icon: '⚠️' },
    error: { bg: '#3d1a1a', border: '#ef4444', icon: '✕' }
};

function AnimatedAlert({
    variant = 'info',
    title,
    children,
    dismissible,
    onDismiss
}: Readonly<AnimatedAlertProps>): ReactElement {
    const styles = variantStyles[variant];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: vars.spacing['4'],
                padding: vars.spacing['5'],
                backgroundColor: styles.bg,
                borderLeft: `4px solid ${styles.border}`,
                borderRadius: vars.borderRadius.md,
                color: vars.colors.text
            }}
        >
            <span style={{ fontSize: vars.typography['6'].fontSize }}>{styles.icon}</span>
            <div style={{ flex: 1 }}>
                {title !== undefined && title !== '' && (
                    <div style={{ fontWeight: vars.typography.fontWeightMedium, marginBottom: vars.spacing['2'] }}>
                        {title}
                    </div>
                )}
                <div style={{ fontSize: vars.typography['3'].fontSize }}>{children}</div>
            </div>
            {dismissible === true && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onDismiss}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: vars.colors.textMuted,
                        cursor: 'pointer',
                        padding: vars.spacing['2'],
                        fontSize: vars.typography['3'].fontSize
                    }}
                >
                    ✕
                </motion.button>
            )}
        </motion.div>
    );
}

const meta: Meta<typeof AnimatedAlert> = {
    title: 'UI Primitives/Alert',
    component: AnimatedAlert,
    parameters: {
        layout: 'padded'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
    args: {
        variant: 'info',
        title: 'Information',
        children: 'This is an informational message.'
    }
};

export const Success: Story = {
    args: {
        variant: 'success',
        title: 'Success',
        children: 'Your changes have been saved successfully.'
    }
};

export const Warning: Story = {
    args: {
        variant: 'warning',
        title: 'Warning',
        children: 'Please review your settings before continuing.'
    }
};

export const ErrorAlert: Story = {
    args: {
        variant: 'error',
        title: 'Error',
        children: 'An error occurred while processing your request.'
    }
};

function DismissibleAlert(): ReactElement {
    const [visible, setVisible] = useState(true);
    const handleDismiss = useCallback((): void => {
        setVisible(false);
    }, []);
    const handleShow = useCallback((): void => {
        setVisible(true);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['5'] }}>
            <AnimatePresence>
                {visible && (
                    <AnimatedAlert variant="info" title="Dismissible Alert" dismissible onDismiss={handleDismiss}>
                        Click the X to dismiss this alert.
                    </AnimatedAlert>
                )}
            </AnimatePresence>
            {!visible && <Button onClick={handleShow}>Show Alert</Button>}
        </div>
    );
}

export const Dismissible: Story = {
    render: DismissibleAlert
};

function AllVariantsStory(): ReactElement {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['5'] }}>
            <AnimatedAlert variant="info" title="Info">
                Information message
            </AnimatedAlert>
            <AnimatedAlert variant="success" title="Success">
                Success message
            </AnimatedAlert>
            <AnimatedAlert variant="warning" title="Warning">
                Warning message
            </AnimatedAlert>
            <AnimatedAlert variant="error" title="Error">
                Error message
            </AnimatedAlert>
        </div>
    );
}

export const AllVariants: Story = {
    render: AllVariantsStory
};
