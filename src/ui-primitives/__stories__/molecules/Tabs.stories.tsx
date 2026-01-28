import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, type ReactNode, useState } from 'react';
import { motion } from 'motion/react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { vars } from 'styles/tokens.css.ts';

interface AnimatedTabsProps {
    tabs: { value: string; label: string; content: ReactNode }[];
    defaultValue?: string;
}

function AnimatedTabs({ tabs, defaultValue }: Readonly<AnimatedTabsProps>): ReactElement {
    const [activeTab, setActiveTab] = useState(defaultValue ?? (tabs.length > 0 ? tabs[0].value : ''));

    return (
        <TabsPrimitive.Root value={activeTab} onValueChange={setActiveTab}>
            <TabsPrimitive.List
                style={{
                    display: 'flex',
                    borderBottom: `1px solid ${vars.colors.divider}`,
                    marginBottom: vars.spacing['5']
                }}
            >
                {tabs.map(tab => (
                    <TabsPrimitive.Trigger
                        key={tab.value}
                        value={tab.value}
                        style={{
                            position: 'relative',
                            padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
                            background: 'none',
                            border: 'none',
                            color: activeTab === tab.value ? vars.colors.primary : vars.colors.textSecondary,
                            fontSize: vars.typography['6'].fontSize,
                            fontWeight: activeTab === tab.value ? 600 : 400,
                            cursor: 'pointer',
                            transition: 'color 0.2s'
                        }}
                    >
                        {tab.label}
                        {activeTab === tab.value && (
                            <motion.div
                                layoutId="activeTab"
                                style={{
                                    position: 'absolute',
                                    bottom: -1,
                                    left: 0,
                                    right: 0,
                                    height: 2,
                                    backgroundColor: vars.colors.primary
                                }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        )}
                    </TabsPrimitive.Trigger>
                ))}
            </TabsPrimitive.List>

            {tabs.map(tab => (
                <TabsPrimitive.Content key={tab.value} value={tab.value} asChild>
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            padding: vars.spacing['5'],
                            color: vars.colors.text
                        }}
                    >
                        {tab.content}
                    </motion.div>
                </TabsPrimitive.Content>
            ))}
        </TabsPrimitive.Root>
    );
}

const meta: Meta<typeof AnimatedTabs> = {
    title: 'UI Primitives/Tabs',
    component: AnimatedTabs,
    parameters: {
        layout: 'padded'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        tabs: [
            { value: 'overview', label: 'Overview', content: 'This is the overview content.' },
            { value: 'details', label: 'Details', content: 'Here are the details.' },
            { value: 'settings', label: 'Settings', content: 'Configure your settings here.' }
        ],
        defaultValue: 'overview'
    }
};

export const MediaTabs: Story = {
    args: {
        tabs: [
            { value: 'movies', label: 'Movies', content: 'Browse your movie collection.' },
            { value: 'tvshows', label: 'TV Shows', content: 'Watch your favorite TV shows.' },
            { value: 'music', label: 'Music', content: 'Listen to your music library.' },
            { value: 'photos', label: 'Photos', content: 'View your photo albums.' }
        ],
        defaultValue: 'movies'
    }
};
