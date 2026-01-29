import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useCallback, useState } from 'react';
import { ListItemButton, ListSubheader } from '../..';

const meta: Meta<typeof ListItemButton> = {
    title: 'UI Primitives/ListItemButton',
    component: ListItemButton,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof ListItemButton>;

function HomeIcon(): ReactElement {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    );
}

function SettingsIcon(): ReactElement {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0" />
        </svg>
    );
}

export const Default: Story = {
    args: {
        children: 'List Item Button'
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '250px' }}>
                <Story />
            </div>
        )
    ]
};

export const WithIcon: Story = {
    args: {
        children: (
            <>
                <HomeIcon />
                <span>Home</span>
            </>
        )
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '250px' }}>
                <Story />
            </div>
        )
    ]
};

export const Active: Story = {
    args: {
        children: 'Active Item',
        active: true
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '250px' }}>
                <Story />
            </div>
        )
    ]
};

function WithSelectionStory(): ReactElement {
    const [selected, setSelected] = useState('settings');
    const selectHome = useCallback((): void => {
        setSelected('home');
    }, []);
    const selectSettings = useCallback((): void => {
        setSelected('settings');
    }, []);
    const selectProfile = useCallback((): void => {
        setSelected('profile');
    }, []);

    return (
        <div style={{ width: '250px' }}>
            <ListSubheader>Menu</ListSubheader>
            <ListItemButton onClick={selectHome}>
                <HomeIcon />
                <span>Home</span>
            </ListItemButton>
            <ListItemButton active={selected === 'settings'} onClick={selectSettings}>
                <SettingsIcon />
                <span>Settings</span>
            </ListItemButton>
            <ListItemButton onClick={selectProfile}>
                <span>Profile</span>
            </ListItemButton>
        </div>
    );
}

export const WithSelection: Story = {
    render: WithSelectionStory
};

export const AsLink: Story = {
    args: {
        children: 'Go to Dashboard',
        href: '/dashboard',
        component: 'a'
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '250px' }}>
                <Story />
            </div>
        )
    ]
};

export const Disabled: Story = {
    args: {
        children: 'Disabled Item',
        disabled: true
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '250px' }}>
                <Story />
            </div>
        )
    ]
};

function MenuListStory(): ReactElement {
    return (
        <div
            style={{
                width: '250px',
                border: '1px solid #333',
                borderRadius: '8px',
                overflow: 'hidden'
            }}
        >
            <ListSubheader>File</ListSubheader>
            <ListItemButton>
                <span>New</span>
            </ListItemButton>
            <ListItemButton>
                <span>Open</span>
            </ListItemButton>
            <ListItemButton>
                <span>Save</span>
            </ListItemButton>
            <ListSubheader>Edit</ListSubheader>
            <ListItemButton>
                <span>Cut</span>
            </ListItemButton>
            <ListItemButton>
                <span>Copy</span>
            </ListItemButton>
            <ListItemButton>
                <span>Paste</span>
            </ListItemButton>
        </div>
    );
}

export const MenuList: Story = {
    render: MenuListStory
};
