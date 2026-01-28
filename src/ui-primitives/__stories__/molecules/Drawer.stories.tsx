import { type ReactElement, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { vars } from 'styles/tokens.css.ts';

const meta: Meta = {
    title: 'UI Primitives/Drawer',
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

function DrawerStory(): ReactElement {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ padding: vars.spacing['5'] }}>
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
                    borderRadius: vars.borderRadius.sm,
                    border: 'none',
                    backgroundColor: vars.colors.primary,
                    color: vars.colors.text,
                    cursor: 'pointer',
                    fontSize: vars.typography['3'].fontSize
                }}
            >
                Open Drawer
            </button>

            {isOpen && (
                <>
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 40
                        }}
                    />
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: '300px',
                            backgroundColor: vars.colors.surface,
                            boxShadow: vars.shadows.lg,
                            zIndex: 50,
                            animation: 'slideInLeft 0.3s ease',
                            overflowY: 'auto'
                        }}
                    >
                        <div style={{ padding: vars.spacing['5'] }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing['5'] }}>
                                <h2 style={{ color: vars.colors.text, margin: 0 }}>Drawer Title</h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: vars.colors.text,
                                        cursor: 'pointer',
                                        fontSize: vars.typography['7'].fontSize
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                            <p style={{ color: vars.colors.textSecondary }}>
                                This is the drawer content. You can add any content here.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export const Default: Story = {
    render: DrawerStory
};

function RightDrawerStory(): ReactElement {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ padding: vars.spacing['5'] }}>
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
                    borderRadius: vars.borderRadius.sm,
                    border: 'none',
                    backgroundColor: vars.colors.primary,
                    color: vars.colors.text,
                    cursor: 'pointer',
                    fontSize: vars.typography['3'].fontSize
                }}
            >
                Open Right Drawer
            </button>

            {isOpen && (
                <>
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 40
                        }}
                    />
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: '300px',
                            backgroundColor: vars.colors.surface,
                            boxShadow: vars.shadows.lg,
                            zIndex: 50,
                            animation: 'slideInRight 0.3s ease',
                            overflowY: 'auto'
                        }}
                    >
                        <div style={{ padding: vars.spacing['5'] }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing['5'] }}>
                                <h2 style={{ color: vars.colors.text, margin: 0 }}>Side Panel</h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: vars.colors.text,
                                        cursor: 'pointer',
                                        fontSize: vars.typography['7'].fontSize
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                            <p style={{ color: vars.colors.textSecondary }}>
                                This drawer slides in from the right side of the screen.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export const RightAnchor: Story = {
    render: RightDrawerStory
};
