import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useState, useCallback } from 'react';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectGroup,
    SelectLabel,
    SelectSeparator
} from '../Select';
import { vars } from '../../styles/tokens.css';

const meta: Meta<typeof Select> = {
    title: 'UI Primitives/Select',
    component: Select,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Select>;

function DefaultStory(): ReactElement {
    const [value, setValue] = useState('');
    const handleValueChange = useCallback((newValue: string): void => {
        setValue(newValue);
    }, []);

    return (
        <Select value={value} onValueChange={handleValueChange}>
            <SelectTrigger style={{ width: '200px' }}>
                <SelectValue placeholder='Select an option' />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value='option1'>Option 1</SelectItem>
                <SelectItem value='option2'>Option 2</SelectItem>
                <SelectItem value='option3'>Option 3</SelectItem>
            </SelectContent>
        </Select>
    );
}

export const Default: Story = {
    render: DefaultStory
};

function WithGroupsStory(): ReactElement {
    const [value, setValue] = useState('');
    const handleValueChange = useCallback((newValue: string): void => {
        setValue(newValue);
    }, []);

    return (
        <Select value={value} onValueChange={handleValueChange}>
            <SelectTrigger style={{ width: '220px' }}>
                <SelectValue placeholder='Choose a fruit' />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Citrus</SelectLabel>
                    <SelectItem value='orange'>Orange</SelectItem>
                    <SelectItem value='lemon'>Lemon</SelectItem>
                    <SelectItem value='lime'>Lime</SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                    <SelectLabel>Berries</SelectLabel>
                    <SelectItem value='strawberry'>Strawberry</SelectItem>
                    <SelectItem value='blueberry'>Blueberry</SelectItem>
                    <SelectItem value='raspberry'>Raspberry</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}

export const WithGroups: Story = {
    render: WithGroupsStory
};

function WithDisabledStory(): ReactElement {
    const [value, setValue] = useState('available');
    const handleValueChange = useCallback((newValue: string): void => {
        setValue(newValue);
    }, []);

    return (
        <Select value={value} onValueChange={handleValueChange}>
            <SelectTrigger style={{ width: '200px' }}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value='available'>Available</SelectItem>
                <SelectItem value='busy' disabled>
                    Busy (Disabled)
                </SelectItem>
                <SelectItem value='away'>Away</SelectItem>
                <SelectItem value='offline' disabled>
                    Offline (Disabled)
                </SelectItem>
            </SelectContent>
        </Select>
    );
}

export const WithDisabled: Story = {
    render: WithDisabledStory
};

function SettingsExampleStory(): ReactElement {
    const [theme, setTheme] = useState('dark');
    const [language, setLanguage] = useState('en');
    const [notifications, setNotifications] = useState('on');

    const handleThemeChange = useCallback((v: string): void => { setTheme(v); }, []);
    const handleLanguageChange = useCallback((v: string): void => { setLanguage(v); }, []);
    const handleNotificationsChange = useCallback((v: string): void => { setNotifications(v); }, []);

    return (
        <div style={{ width: '280px' }}>
            <div style={{ marginBottom: '16px' }}>
                <label
                    htmlFor='theme-select'
                    style={{
                        display: 'block',
                        fontSize: vars.typography.fontSizeSm,
                        color: vars.colors.textSecondary,
                        marginBottom: '6px'
                    }}
                >
                    Theme
                </label>
                <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger id='theme-select' style={{ width: '100%' }}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='light'>Light</SelectItem>
                        <SelectItem value='dark'>Dark</SelectItem>
                        <SelectItem value='system'>System</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div style={{ marginBottom: '16px' }}>
                <label
                    htmlFor='language-select'
                    style={{
                        display: 'block',
                        fontSize: vars.typography.fontSizeSm,
                        color: vars.colors.textSecondary,
                        marginBottom: '6px'
                    }}
                >
                    Language
                </label>
                <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger id='language-select' style={{ width: '100%' }}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='en'>English</SelectItem>
                        <SelectItem value='es'>Español</SelectItem>
                        <SelectItem value='fr'>Français</SelectItem>
                        <SelectItem value='de'>Deutsch</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label
                    htmlFor='notifications-select'
                    style={{
                        display: 'block',
                        fontSize: vars.typography.fontSizeSm,
                        color: vars.colors.textSecondary,
                        marginBottom: '6px'
                    }}
                >
                    Notifications
                </label>
                <Select value={notifications} onValueChange={handleNotificationsChange}>
                    <SelectTrigger id='notifications-select' style={{ width: '100%' }}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='on'>On</SelectItem>
                        <SelectItem value='off'>Off</SelectItem>
                        <SelectItem value='mentions'>Mentions Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

export const SettingsExample: Story = {
    render: SettingsExampleStory
};

function DisabledSelectStory(): ReactElement {
    const [value, setValue] = useState('option1');
    const handleValueChange = useCallback((newValue: string): void => {
        setValue(newValue);
    }, []);

    return (
        <Select value={value} onValueChange={handleValueChange} disabled>
            <SelectTrigger style={{ width: '200px' }}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value='option1'>Option 1</SelectItem>
                <SelectItem value='option2'>Option 2</SelectItem>
                <SelectItem value='option3'>Option 3</SelectItem>
            </SelectContent>
        </Select>
    );
}

export const DisabledSelect: Story = {
    render: DisabledSelectStory
};
