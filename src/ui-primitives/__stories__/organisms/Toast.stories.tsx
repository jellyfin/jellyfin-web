import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useCallback } from 'react';
import { Button, Flex, ToastProvider, type ToastVariant, useToast } from '../..';

const meta: Meta<typeof ToastProvider> = {
    title: 'UI Primitives/Toast',
    component: ToastProvider,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'A Sonner-inspired toast notification system with swipe-to-dismiss, progress bar, and configurable positioning.'
            }
        }
    },
    tags: ['autodocs'],
    argTypes: {
        position: {
            control: 'select',
            options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
            description: 'Position of the toast viewport'
        }
    }
};

export default meta;
type Story = StoryObj<typeof meta>;

function ToastDemo(): ReactElement {
    const { toast } = useToast();

    const handleShowToast = useCallback(
        (variant: ToastVariant): void => {
            toast({
                title:
                    variant === 'default'
                        ? 'Notification'
                        : variant.charAt(0).toUpperCase() + variant.slice(1),
                description: 'This is a toast notification with some description text.',
                variant,
                duration: 5000
            });
        },
        [toast]
    );

    const handleShowWithAction = useCallback((): void => {
        toast({
            title: 'Update Available',
            description: 'A new version of the app is available.',
            variant: 'info',
            action: {
                label: 'Update',
                onClick: (): void => {
                    /* Update clicked */
                }
            }
        });
    }, [toast]);

    const handleShowInfinite = useCallback((): void => {
        toast({
            title: 'Downloading...',
            description: 'File download in progress.',
            variant: 'default',
            duration: Infinity
        });
    }, [toast]);

    return (
        <div style={{ padding: 40 }}>
            <Flex gap="sm" style={{ flexWrap: 'wrap' }}>
                <Button
                    variant="primary"
                    onClick={(): void => {
                        handleShowToast('default');
                    }}
                >
                    Default
                </Button>
                <Button
                    variant="secondary"
                    onClick={(): void => {
                        handleShowToast('success');
                    }}
                >
                    Success
                </Button>
                <Button
                    variant="secondary"
                    onClick={(): void => {
                        handleShowToast('warning');
                    }}
                >
                    Warning
                </Button>
                <Button
                    variant="secondary"
                    onClick={(): void => {
                        handleShowToast('error');
                    }}
                >
                    Error
                </Button>
                <Button
                    variant="secondary"
                    onClick={(): void => {
                        handleShowToast('info');
                    }}
                >
                    Info
                </Button>
            </Flex>
            <Flex gap="sm" style={{ marginTop: 16 }}>
                <Button variant="secondary" onClick={handleShowWithAction}>
                    With Action
                </Button>
                <Button variant="secondary" onClick={handleShowInfinite}>
                    Infinite Duration
                </Button>
            </Flex>
        </div>
    );
}

function TopRightStory(): ReactElement {
    return (
        <ToastProvider position="top-right">
            <ToastDemo />
        </ToastProvider>
    );
}

export const TopRight: Story = {
    render: TopRightStory
};

function TopLeftStory(): ReactElement {
    return (
        <ToastProvider position="top-left">
            <ToastDemo />
        </ToastProvider>
    );
}

export const TopLeft: Story = {
    render: TopLeftStory
};

function BottomRightStory(): ReactElement {
    return (
        <ToastProvider position="bottom-right">
            <ToastDemo />
        </ToastProvider>
    );
}

export const BottomRight: Story = {
    render: BottomRightStory
};

function BottomLeftStory(): ReactElement {
    return (
        <ToastProvider position="bottom-left">
            <ToastDemo />
        </ToastProvider>
    );
}

export const BottomLeft: Story = {
    render: BottomLeftStory
};

function AllVariantsStory(): ReactElement {
    const { toast } = useToast();

    const handleShowAll = useCallback((): void => {
        toast({ title: 'Default Toast', variant: 'default', duration: 3000 });
        setTimeout(() => {
            toast({ title: 'Success Toast', variant: 'success', duration: 3000 });
        }, 100);
        setTimeout(() => {
            toast({ title: 'Warning Toast', variant: 'warning', duration: 3000 });
        }, 200);
        setTimeout(() => {
            toast({ title: 'Error Toast', variant: 'error', duration: 3000 });
        }, 300);
        setTimeout(() => {
            toast({ title: 'Info Toast', variant: 'info', duration: 3000 });
        }, 400);
    }, [toast]);

    return (
        <ToastProvider position="top-right">
            <div style={{ padding: 40 }}>
                <Button variant="primary" onClick={handleShowAll}>
                    Show All Variants
                </Button>
            </div>
        </ToastProvider>
    );
}

export const AllVariants: Story = {
    render: AllVariantsStory
};

function WithActionButtonStory(): ReactElement {
    const { toast } = useToast();

    const handleShowAction = useCallback((): void => {
        toast({
            title: 'Unsaved Changes',
            description: 'You have unsaved changes. What would you like to do?',
            variant: 'warning',
            duration: 8000,
            action: {
                label: 'Save',
                onClick: (): void => {
                    /* Saved */
                }
            }
        });
    }, [toast]);

    return (
        <ToastProvider position="top-right">
            <div style={{ padding: 40 }}>
                <Button variant="primary" onClick={handleShowAction}>
                    Show with Action
                </Button>
            </div>
        </ToastProvider>
    );
}

export const WithActionButton: Story = {
    render: WithActionButtonStory
};

function LongContentStory(): ReactElement {
    const { toast } = useToast();

    const handleShowLong = useCallback((): void => {
        toast({
            title: 'Import Complete',
            description:
                'Successfully imported 250 media files across 15 albums. Some files were skipped due to format incompatibility. Tap to view details.',
            variant: 'success',
            duration: 6000
        });
    }, [toast]);

    return (
        <ToastProvider position="top-right">
            <div style={{ padding: 40 }}>
                <Button variant="primary" onClick={handleShowLong}>
                    Show Long Content
                </Button>
            </div>
        </ToastProvider>
    );
}

export const LongContent: Story = {
    render: LongContentStory
};
