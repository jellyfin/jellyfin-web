import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { vars } from '../../styles/tokens.css.ts';
import { Button } from '../Button';

interface AnimatedTooltipProps {
    content: string;
    children: ReactNode;
    side?: 'top' | 'right' | 'bottom' | 'left';
}

function AnimatedTooltip({ content, children, side = 'top' }: Readonly<AnimatedTooltipProps>): ReactElement {
    return (
        <TooltipPrimitive.Provider>
            <TooltipPrimitive.Root delayDuration={200}>
                <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content side={side} sideOffset={5} asChild>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            style={{
                                backgroundColor: vars.colors.text,
                                color: vars.colors.background,
                                padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
                                borderRadius: vars.borderRadius.sm,
                                fontSize: vars.typography.fontSizeSm,
                                boxShadow: vars.shadows.md,
                                zIndex: 1000
                            }}
                        >
                            {content}
                            <TooltipPrimitive.Arrow style={{ fill: vars.colors.text }} />
                        </motion.div>
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
}

const meta: Meta<typeof AnimatedTooltip> = {
    title: 'UI Primitives/Tooltip',
    component: AnimatedTooltip,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultStory(): ReactElement {
    return (
        <AnimatedTooltip content="This is a tooltip">
            <Button>Hover me</Button>
        </AnimatedTooltip>
    );
}

export const Default: Story = {
    render: DefaultStory
};

function PositionsStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: '2rem', padding: '4rem' }}>
            <AnimatedTooltip content="Top tooltip" side="top">
                <Button>Top</Button>
            </AnimatedTooltip>
            <AnimatedTooltip content="Right tooltip" side="right">
                <Button>Right</Button>
            </AnimatedTooltip>
            <AnimatedTooltip content="Bottom tooltip" side="bottom">
                <Button>Bottom</Button>
            </AnimatedTooltip>
            <AnimatedTooltip content="Left tooltip" side="left">
                <Button>Left</Button>
            </AnimatedTooltip>
        </div>
    );
}

export const Positions: Story = {
    render: PositionsStory
};
