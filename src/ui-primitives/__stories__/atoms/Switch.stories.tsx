import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { vars } from '../../styles/tokens.css.ts';

interface SwitchProps {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    label?: string;
}

function Switch({ checked, onCheckedChange, disabled, label }: Readonly<SwitchProps>): ReactElement {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: vars.spacing.sm }}>
            <SwitchPrimitive.Root
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
                style={{
                    width: '42px',
                    height: '24px',
                    backgroundColor: checked === true ? vars.colors.primary : vars.colors.divider,
                    borderRadius: '12px',
                    position: 'relative',
                    cursor: disabled === true ? 'not-allowed' : 'pointer',
                    opacity: disabled === true ? 0.5 : 1,
                    border: 'none',
                    padding: 0
                }}
            >
                <SwitchPrimitive.Thumb asChild>
                    <motion.span
                        animate={{ x: checked === true ? 20 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        style={{
                            display: 'block',
                            width: '20px',
                            height: '20px',
                            backgroundColor: vars.colors.text,
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '2px'
                        }}
                    />
                </SwitchPrimitive.Thumb>
            </SwitchPrimitive.Root>
            {label !== undefined && label !== '' && <span style={{ color: vars.colors.text, fontSize: vars.typography.fontSizeMd }}>{label}</span>}
        </div>
    );
}

const meta: Meta<typeof Switch> = {
    title: 'UI Primitives/Switch',
    component: Switch,
    parameters: { layout: 'centered' },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultStory(): ReactElement {
    const [checked, setChecked] = useState(false);
    const handleCheckedChange = useCallback((v: boolean): void => {
        setChecked(v);
    }, []);

    return <Switch checked={checked} onCheckedChange={handleCheckedChange} />;
}

export const Default: Story = {
    render: DefaultStory
};

function WithLabelStory(): ReactElement {
    const [checked, setChecked] = useState(true);
    const handleCheckedChange = useCallback((v: boolean): void => {
        setChecked(v);
    }, []);

    return <Switch checked={checked} onCheckedChange={handleCheckedChange} label='Enable notifications' />;
}

export const WithLabel: Story = {
    render: WithLabelStory
};

export const Disabled: Story = {
    args: { checked: false, disabled: true, label: 'Disabled' }
};

function SettingsExampleStory(): ReactElement {
    const [settings, setSettings] = useState({
        darkMode: true,
        notifications: false,
        autoPlay: true
    });

    const handleDarkModeChange = useCallback((v: boolean): void => {
        setSettings(s => ({ ...s, darkMode: v }));
    }, []);

    const handleNotificationsChange = useCallback((v: boolean): void => {
        setSettings(s => ({ ...s, notifications: v }));
    }, []);

    const handleAutoPlayChange = useCallback((v: boolean): void => {
        setSettings(s => ({ ...s, autoPlay: v }));
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing.md }}>
            <Switch
                checked={settings.darkMode}
                onCheckedChange={handleDarkModeChange}
                label='Dark Mode'
            />
            <Switch
                checked={settings.notifications}
                onCheckedChange={handleNotificationsChange}
                label='Push Notifications'
            />
            <Switch
                checked={settings.autoPlay}
                onCheckedChange={handleAutoPlayChange}
                label='Auto-play next episode'
            />
        </div>
    );
}

export const SettingsExample: Story = {
    render: SettingsExampleStory
};
