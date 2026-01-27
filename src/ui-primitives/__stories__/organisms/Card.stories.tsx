import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, type ReactNode, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { vars } from '../styles/tokens.css.ts';

interface CardProps {
    children: ReactNode;
    hoverable?: boolean;
}

function Card({ children, hoverable }: Readonly<CardProps>): ReactElement {
    const baseStyle: CSSProperties = {
        backgroundColor: vars.colors.surface,
        borderRadius: vars.borderRadius.lg,
        boxShadow: vars.shadows.md,
        overflow: 'hidden'
    };

    if (hoverable === true) {
        return (
            <motion.div
                style={baseStyle}
                whileHover={{ scale: 1.02, boxShadow: vars.shadows.lg }}
                transition={{ duration: 0.2 }}
            >
                {children}
            </motion.div>
        );
    }

    return <div style={baseStyle}>{children}</div>;
}

interface CardSectionProps {
    children: ReactNode;
}

function CardHeader({ children }: Readonly<CardSectionProps>): ReactElement {
    return <div style={{ padding: vars.spacing.md, borderBottom: `1px solid ${vars.colors.divider}` }}>{children}</div>;
}

function CardBody({ children }: Readonly<CardSectionProps>): ReactElement {
    return <div style={{ padding: vars.spacing.md }}>{children}</div>;
}

function CardFooter({ children }: Readonly<CardSectionProps>): ReactElement {
    return (
        <div
            style={{
                padding: vars.spacing.md,
                borderTop: `1px solid ${vars.colors.divider}`,
                display: 'flex',
                gap: vars.spacing.sm,
                justifyContent: 'flex-end'
            }}
        >
            {children}
        </div>
    );
}

const meta: Meta<typeof Card> = {
    title: 'UI Primitives/Card',
    component: Card,
    parameters: { layout: 'centered' },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultStory(): ReactElement {
    return (
        <Card>
            <CardBody>
                <h3 style={{ margin: 0, color: vars.colors.text }}>Card Title</h3>
                <p style={{ color: vars.colors.textSecondary, marginTop: vars.spacing.sm }}>
                    This is a simple card with just a body.
                </p>
            </CardBody>
        </Card>
    );
}

export const Default: Story = {
    render: DefaultStory
};

function WithHeaderAndFooterStory(): ReactElement {
    return (
        <Card>
            <CardHeader>
                <h3 style={{ margin: 0, color: vars.colors.text }}>Card Header</h3>
            </CardHeader>
            <CardBody>
                <p style={{ color: vars.colors.textSecondary, margin: 0 }}>
                    Card content goes here. This card has a header, body, and footer.
                </p>
            </CardBody>
            <CardFooter>
                <button
                    type="button"
                    style={{
                        padding: `${vars.spacing.xs} ${vars.spacing.md}`,
                        background: 'none',
                        border: `1px solid ${vars.colors.divider}`,
                        borderRadius: vars.borderRadius.sm,
                        color: vars.colors.text,
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    style={{
                        padding: `${vars.spacing.xs} ${vars.spacing.md}`,
                        background: vars.colors.primary,
                        border: 'none',
                        borderRadius: vars.borderRadius.sm,
                        color: vars.colors.text,
                        cursor: 'pointer'
                    }}
                >
                    Save
                </button>
            </CardFooter>
        </Card>
    );
}

export const WithHeaderAndFooter: Story = {
    render: WithHeaderAndFooterStory
};

function HoverableStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: vars.spacing.md }}>
            <Card hoverable>
                <CardBody>
                    <h4 style={{ margin: 0, color: vars.colors.text }}>Hoverable Card</h4>
                    <p
                        style={{
                            color: vars.colors.textSecondary,
                            marginTop: vars.spacing.xs,
                            fontSize: vars.typography.fontSizeSm
                        }}
                    >
                        Hover to see animation
                    </p>
                </CardBody>
            </Card>
            <Card hoverable>
                <CardBody>
                    <h4 style={{ margin: 0, color: vars.colors.text }}>Another Card</h4>
                    <p
                        style={{
                            color: vars.colors.textSecondary,
                            marginTop: vars.spacing.xs,
                            fontSize: vars.typography.fontSizeSm
                        }}
                    >
                        Uses Framer Motion
                    </p>
                </CardBody>
            </Card>
        </div>
    );
}

export const Hoverable: Story = {
    render: HoverableStory
};

function MediaCardStory(): ReactElement {
    return (
        <Card hoverable>
            <div
                style={{
                    height: '150px',
                    backgroundColor: vars.colors.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <span style={{ fontSize: vars.typography.fontSizeXxl }}>🎬</span>
            </div>
            <CardBody>
                <h4 style={{ margin: 0, color: vars.colors.text }}>Movie Title</h4>
                <p
                    style={{
                        color: vars.colors.textSecondary,
                        marginTop: vars.spacing.xs,
                        fontSize: vars.typography.fontSizeSm
                    }}
                >
                    2024 • Action, Adventure
                </p>
            </CardBody>
        </Card>
    );
}

export const MediaCard: Story = {
    render: MediaCardStory
};
