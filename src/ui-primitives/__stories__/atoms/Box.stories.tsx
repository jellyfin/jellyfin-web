import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, type HTMLAttributes, type ReactNode } from 'react';
import { vars } from '../../styles/tokens.css.ts';

interface BoxProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

function Box({ children, ...props }: Readonly<BoxProps>): ReactElement {
    return <div {...props}>{children}</div>;
}

interface FlexProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    direction?: 'row' | 'column';
    gap?: string;
    align?: string;
    justify?: string;
    wrap?: boolean;
}

function Flex({ children, direction = 'row', gap = '0', align, justify, wrap, ...props }: Readonly<FlexProps>): ReactElement {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: direction,
                gap,
                alignItems: align,
                justifyContent: justify,
                flexWrap: wrap === true ? 'wrap' : undefined,
                ...props.style
            }}
            {...props}
        >
            {children}
        </div>
    );
}

const meta: Meta = {
    title: 'UI Primitives/Box & Flex',
    parameters: { layout: 'padded' },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj;

interface DemoBoxProps {
    label: string;
}

function DemoBox({ label }: Readonly<DemoBoxProps>): ReactElement {
    return (
        <div style={{
            padding: vars.spacing.md,
            backgroundColor: vars.colors.primary,
            borderRadius: vars.borderRadius.md,
            color: vars.colors.text
        }}>
            {label}
        </div>
    );
}

function BasicBoxStory(): ReactElement {
    return (
        <Box style={{ padding: vars.spacing.lg, backgroundColor: vars.colors.surface, borderRadius: vars.borderRadius.md }}>
            <p style={{ color: vars.colors.text, margin: 0 }}>This is a Box component</p>
        </Box>
    );
}

export const BasicBox: Story = {
    render: BasicBoxStory
};

function FlexRowStory(): ReactElement {
    return (
        <Flex gap={vars.spacing.md}>
            <DemoBox label='Item 1' />
            <DemoBox label='Item 2' />
            <DemoBox label='Item 3' />
        </Flex>
    );
}

export const FlexRow: Story = {
    render: FlexRowStory
};

function FlexColumnStory(): ReactElement {
    return (
        <Flex direction='column' gap={vars.spacing.md}>
            <DemoBox label='Item 1' />
            <DemoBox label='Item 2' />
            <DemoBox label='Item 3' />
        </Flex>
    );
}

export const FlexColumn: Story = {
    render: FlexColumnStory
};

function FlexCenteredStory(): ReactElement {
    return (
        <Flex align='center' justify='center' style={{ height: '200px', backgroundColor: vars.colors.surface, borderRadius: vars.borderRadius.md }}>
            <DemoBox label='Centered' />
        </Flex>
    );
}

export const FlexCentered: Story = {
    render: FlexCenteredStory
};

function FlexSpaceBetweenStory(): ReactElement {
    return (
        <Flex justify='space-between' style={{ backgroundColor: vars.colors.surface, padding: vars.spacing.md, borderRadius: vars.borderRadius.md }}>
            <DemoBox label='Left' />
            <DemoBox label='Right' />
        </Flex>
    );
}

export const FlexSpaceBetween: Story = {
    render: FlexSpaceBetweenStory
};

function FlexWrapStory(): ReactElement {
    return (
        <Flex gap={vars.spacing.sm} wrap style={{ maxWidth: '300px' }}>
            {Array.from({ length: 8 }, (_, i) => (
                <DemoBox key={i} label={`Item ${i + 1}`} />
            ))}
        </Flex>
    );
}

export const FlexWrap: Story = {
    render: FlexWrapStory
};
