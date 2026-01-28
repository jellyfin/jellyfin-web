import { type ReactElement, type ReactNode, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { vars } from 'styles/tokens.css.ts';
import { Button } from '../..';

interface AnimatedDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children?: ReactNode;
}

function AnimatedDialog({
    open,
    onOpenChange,
    title,
    description,
    children
}: Readonly<AnimatedDialogProps>): ReactElement {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <AnimatePresence>
                {open === true && (
                    <DialogPrimitive.Portal forceMount>
                        <DialogPrimitive.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    position: 'fixed',
                                    inset: 0,
                                    zIndex: 1000
                                }}
                            />
                        </DialogPrimitive.Overlay>
                        <DialogPrimitive.Content asChild>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0,
                                    transition: {
                                        type: 'spring' as const,
                                        damping: 25,
                                        stiffness: 300
                                    }
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.95,
                                    y: -10,
                                    transition: { duration: 0.15 }
                                }}
                                style={{
                                    backgroundColor: vars.colors.surface,
                                    borderRadius: vars.borderRadius.lg,
                                    boxShadow: vars.shadows.xl,
                                    position: 'fixed',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    minWidth: '400px',
                                    maxWidth: '90vw',
                                    maxHeight: '85vh',
                                    padding: vars.spacing['6'],
                                    zIndex: 1001
                                }}
                            >
                                <DialogPrimitive.Title
                                    style={{
                                        margin: 0,
                                        marginBottom: vars.spacing['4'],
                                        fontWeight: 600,
                                        fontSize: vars.typography['8'].fontSize,
                                        color: vars.colors.text
                                    }}
                                >
                                    {title}
                                </DialogPrimitive.Title>
                                {description !== undefined && description !== '' && (
                                    <DialogPrimitive.Description
                                        style={{
                                            marginBottom: vars.spacing['5'],
                                            color: vars.colors.textSecondary,
                                            fontSize: vars.typography['3'].fontSize
                                        }}
                                    >
                                        {description}
                                    </DialogPrimitive.Description>
                                )}
                                {children}
                                <DialogPrimitive.Close asChild>
                                    <button
                                        type="button"
                                        aria-label="Close"
                                        style={{
                                            position: 'absolute',
                                            top: vars.spacing['5'],
                                            right: vars.spacing['5'],
                                            background: 'none',
                                            border: 'none',
                                            color: vars.colors.textMuted,
                                            cursor: 'pointer',
                                            padding: vars.spacing['2'],
                                            borderRadius: vars.borderRadius.sm,
                                            fontSize: vars.typography['7'].fontSize
                                        }}
                                    >
                                        ✕
                                    </button>
                                </DialogPrimitive.Close>
                            </motion.div>
                        </DialogPrimitive.Content>
                    </DialogPrimitive.Portal>
                )}
            </AnimatePresence>
        </DialogPrimitive.Root>
    );
}

const meta: Meta<typeof AnimatedDialog> = {
    title: 'UI Primitives/Dialog',
    component: AnimatedDialog,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultStory(): ReactElement {
    const [open, setOpen] = useState(false);
    const handleOpen = useCallback((): void => {
        setOpen(true);
    }, []);
    const handleClose = useCallback((): void => {
        setOpen(false);
    }, []);

    return (
        <>
            <Button onClick={handleOpen}>Open Dialog</Button>
            <AnimatedDialog
                open={open}
                onOpenChange={setOpen}
                title="Dialog Title"
                description="This is a description of the dialog content."
            >
                <p style={{ color: vars.colors.text, marginBottom: vars.spacing['5'] }}>
                    Dialog content goes here. This dialog uses Framer Motion for smooth animations.
                </p>
                <div style={{ display: 'flex', gap: vars.spacing['4'], justifyContent: 'flex-end' }}>
                    <Button variant="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleClose}>Confirm</Button>
                </div>
            </AnimatedDialog>
        </>
    );
}

export const Default: Story = {
    render: DefaultStory
};

function ConfirmationStory(): ReactElement {
    const [open, setOpen] = useState(false);
    const handleOpen = useCallback((): void => {
        setOpen(true);
    }, []);
    const handleClose = useCallback((): void => {
        setOpen(false);
    }, []);

    return (
        <>
            <Button variant="danger" onClick={handleOpen}>
                Delete Item
            </Button>
            <AnimatedDialog
                open={open}
                onOpenChange={setOpen}
                title="Confirm Deletion"
                description="Are you sure you want to delete this item? This action cannot be undone."
            >
                <div
                    style={{
                        display: 'flex',
                        gap: vars.spacing['4'],
                        justifyContent: 'flex-end',
                        marginTop: vars.spacing['5']
                    }}
                >
                    <Button variant="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleClose}>
                        Delete
                    </Button>
                </div>
            </AnimatedDialog>
        </>
    );
}

export const Confirmation: Story = {
    render: ConfirmationStory
};

function WithFormStory(): ReactElement {
    const [open, setOpen] = useState(false);
    const handleOpen = useCallback((): void => {
        setOpen(true);
    }, []);
    const handleClose = useCallback((): void => {
        setOpen(false);
    }, []);

    return (
        <>
            <Button onClick={handleOpen}>Create User</Button>
            <AnimatedDialog
                open={open}
                onOpenChange={setOpen}
                title="Create New User"
                description="Fill in the details below to create a new user account."
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['5'] }}>
                    <input
                        type="text"
                        placeholder="Username"
                        style={{
                            padding: vars.spacing['4'],
                            borderRadius: vars.borderRadius.sm,
                            border: `1px solid ${vars.colors.textMuted}`,
                            backgroundColor: vars.colors.background,
                            color: vars.colors.text
                        }}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        style={{
                            padding: vars.spacing['4'],
                            borderRadius: vars.borderRadius.sm,
                            border: `1px solid ${vars.colors.textMuted}`,
                            backgroundColor: vars.colors.background,
                            color: vars.colors.text
                        }}
                    />
                    <div
                        style={{
                            display: 'flex',
                            gap: vars.spacing['4'],
                            justifyContent: 'flex-end',
                            marginTop: vars.spacing['4']
                        }}
                    >
                        <Button variant="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleClose}>Create</Button>
                    </div>
                </div>
            </AnimatedDialog>
        </>
    );
}

export const WithForm: Story = {
    render: WithFormStory
};

function LargeContentStory(): ReactElement {
    const [open, setOpen] = useState(false);
    const handleOpen = useCallback((): void => {
        setOpen(true);
    }, []);
    const handleClose = useCallback((): void => {
        setOpen(false);
    }, []);

    return (
        <>
            <Button onClick={handleOpen}>View Terms</Button>
            <AnimatedDialog
                open={open}
                onOpenChange={setOpen}
                title="Terms of Service"
                description="Please review our terms of service carefully."
            >
                <div
                    style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        padding: vars.spacing['5'],
                        backgroundColor: vars.colors.background,
                        borderRadius: vars.borderRadius.sm,
                        marginBottom: vars.spacing['5']
                    }}
                >
                    <p style={{ color: vars.colors.text, marginBottom: vars.spacing['5'] }}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
                        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                        laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                    <p style={{ color: vars.colors.text, marginBottom: vars.spacing['5'] }}>
                        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                        pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                        mollit anim id est laborum.
                    </p>
                    <p style={{ color: vars.colors.text }}>
                        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
                        laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto
                        beatae vitae dicta sunt explicabo.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: vars.spacing['4'], justifyContent: 'flex-end' }}>
                    <Button variant="secondary" onClick={handleClose}>
                        Decline
                    </Button>
                    <Button onClick={handleClose}>Accept</Button>
                </div>
            </AnimatedDialog>
        </>
    );
}

export const LargeContent: Story = {
    render: LargeContentStory
};
