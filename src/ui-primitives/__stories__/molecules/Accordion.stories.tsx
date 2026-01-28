import type { ReactElement, ReactNode } from 'react';
import { motion } from 'motion/react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { vars } from '../../../styles/tokens.css';

interface AccordionItemData {
    value: string;
    title: string;
    content: ReactNode;
}

interface AnimatedAccordionProps {
    items: AccordionItemData[];
    type?: 'single' | 'multiple';
    defaultValue?: string;
}

function AnimatedAccordion({ items, type = 'single', defaultValue }: Readonly<AnimatedAccordionProps>): ReactElement {
    return (
        <AccordionPrimitive.Root
            type={type as 'single'}
            defaultValue={defaultValue}
            style={{ width: '100%', maxWidth: '400px' }}
        >
            {items.map(item => (
                <AccordionPrimitive.Item
                    key={item.value}
                    value={item.value}
                    style={{
                        borderBottom: `1px solid ${vars.colors.divider}`
                    }}
                >
                    <AccordionPrimitive.Header>
                        <AccordionPrimitive.Trigger
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                padding: vars.spacing['5'],
                                background: 'none',
                                border: 'none',
                                color: vars.colors.text,
                                fontSize: vars.typography['6'].fontSize,
                                fontWeight: vars.typography.fontWeightMedium,
                                cursor: 'pointer',
                                textAlign: 'left'
                            }}
                        >
                            {item.title}
                            <motion.span initial={false} style={{ fontSize: vars.typography['3'].fontSize }}>
                                ▼
                            </motion.span>
                        </AccordionPrimitive.Trigger>
                    </AccordionPrimitive.Header>
                    <AccordionPrimitive.Content asChild forceMount>
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                overflow: 'hidden',
                                padding: `0 ${vars.spacing['5']} ${vars.spacing['5']}`,
                                color: vars.colors.textSecondary,
                                fontSize: vars.typography['3'].fontSize
                            }}
                        >
                            {item.content}
                        </motion.div>
                    </AccordionPrimitive.Content>
                </AccordionPrimitive.Item>
            ))}
        </AccordionPrimitive.Root>
    );
}

const meta: Meta<typeof AnimatedAccordion> = {
    title: 'UI Primitives/Accordion',
    component: AnimatedAccordion,
    parameters: { layout: 'centered' },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        items: [
            { value: 'item-1', title: 'What is Jellyfin?', content: 'Jellyfin is a free software media system.' },
            {
                value: 'item-2',
                title: 'How do I get started?',
                content: 'Download and install Jellyfin on your server.'
            },
            { value: 'item-3', title: 'Is it free?', content: 'Yes, Jellyfin is completely free and open source.' }
        ],
        defaultValue: 'item-1'
    }
};
