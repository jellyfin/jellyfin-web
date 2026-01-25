import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useState, useCallback } from 'react';
import { List, ListItem, ListItemButton, ListItemContent, ListItemDecorator, ListSubheader } from '../List';

const meta: Meta<typeof List> = {
    title: 'UI Primitives/List',
    component: List,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    argTypes: {
        size: { control: 'select', options: ['sm', 'md', 'lg'] }
    }
};

export default meta;
type Story = StoryObj<typeof List>;

function HomeIcon(): ReactElement {
    return (
        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
            <path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' />
            <polyline points='9 22 9 12 15 12 15 22' />
        </svg>
    );
}

function SettingsIcon(): ReactElement {
    return (
        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
            <circle cx='12' cy='12' r='3' />
            <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4' />
        </svg>
    );
}

function PersonIcon(): ReactElement {
    return (
        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
            <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
            <circle cx='12' cy='7' r='4' />
        </svg>
    );
}

function NotificationsIcon(): ReactElement {
    return (
        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
            <path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' />
            <path d='M13.73 21a2 2 0 0 1-3.46 0' />
        </svg>
    );
}

function FolderIcon(): ReactElement {
    return (
        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
            <path d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' />
        </svg>
    );
}

function DefaultStory(): ReactElement {
    return (
        <div style={{ width: '280px' }}>
            <List>
                <ListItem>
                    <ListItemButton>
                        <ListItemDecorator><HomeIcon /></ListItemDecorator>
                        <ListItemContent>Home</ListItemContent>
                    </ListItemButton>
                </ListItem>
                <ListItem>
                    <ListItemButton>
                        <ListItemDecorator><FolderIcon /></ListItemDecorator>
                        <ListItemContent>Documents</ListItemContent>
                    </ListItemButton>
                </ListItem>
                <ListItem>
                    <ListItemButton>
                        <ListItemDecorator><SettingsIcon /></ListItemDecorator>
                        <ListItemContent>Settings</ListItemContent>
                    </ListItemButton>
                </ListItem>
            </List>
        </div>
    );
}

export const Default: Story = {
    render: DefaultStory
};

function WithSelectionStory(): ReactElement {
    const [selected, setSelected] = useState('home');
    const selectHome = useCallback((): void => { setSelected('home'); }, []);
    const selectProfile = useCallback((): void => { setSelected('profile'); }, []);
    const selectNotifications = useCallback((): void => { setSelected('notifications'); }, []);
    const selectSettings = useCallback((): void => { setSelected('settings'); }, []);

    return (
        <div style={{ width: '280px' }}>
            <List>
                <ListItem>
                    <ListItemButton selected={selected === 'home'} onClick={selectHome}>
                        <ListItemDecorator><HomeIcon /></ListItemDecorator>
                        <ListItemContent>Home</ListItemContent>
                    </ListItemButton>
                </ListItem>
                <ListItem>
                    <ListItemButton selected={selected === 'profile'} onClick={selectProfile}>
                        <ListItemDecorator><PersonIcon /></ListItemDecorator>
                        <ListItemContent>Profile</ListItemContent>
                    </ListItemButton>
                </ListItem>
                <ListItem>
                    <ListItemButton selected={selected === 'notifications'} onClick={selectNotifications}>
                        <ListItemDecorator><NotificationsIcon /></ListItemDecorator>
                        <ListItemContent>Notifications</ListItemContent>
                    </ListItemButton>
                </ListItem>
                <ListItem>
                    <ListItemButton selected={selected === 'settings'} onClick={selectSettings}>
                        <ListItemDecorator><SettingsIcon /></ListItemDecorator>
                        <ListItemContent>Settings</ListItemContent>
                    </ListItemButton>
                </ListItem>
            </List>
        </div>
    );
}

export const WithSelection: Story = {
    render: WithSelectionStory
};

function WithSubheadersStory(): ReactElement {
    return (
        <div style={{ width: '280px' }}>
            <List>
                <ListSubheader>Account</ListSubheader>
                <ListItem>
                    <ListItemButton>
                        <ListItemDecorator><PersonIcon /></ListItemDecorator>
                        <ListItemContent>Profile</ListItemContent>
                    </ListItemButton>
                </ListItem>
                <ListItem>
                    <ListItemButton>
                        <ListItemDecorator><NotificationsIcon /></ListItemDecorator>
                        <ListItemContent>Notifications</ListItemContent>
                    </ListItemButton>
                </ListItem>
                <ListSubheader>System</ListSubheader>
                <ListItem>
                    <ListItemButton>
                        <ListItemDecorator><SettingsIcon /></ListItemDecorator>
                        <ListItemContent>Settings</ListItemContent>
                    </ListItemButton>
                </ListItem>
            </List>
        </div>
    );
}

export const WithSubheaders: Story = {
    render: WithSubheadersStory
};

function AllSizesStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: '24px' }}>
            <div>
                <List size='sm' style={{ width: '200px' }}>
                    <ListItem><ListItemButton><ListItemContent>Small</ListItemContent></ListItemButton></ListItem>
                    <ListItem><ListItemButton><ListItemContent>Small</ListItemContent></ListItemButton></ListItem>
                </List>
            </div>
            <div>
                <List size='md' style={{ width: '200px' }}>
                    <ListItem><ListItemButton><ListItemContent>Medium</ListItemContent></ListItemButton></ListItem>
                    <ListItem><ListItemButton><ListItemContent>Medium</ListItemContent></ListItemButton></ListItem>
                </List>
            </div>
            <div>
                <List size='lg' style={{ width: '200px' }}>
                    <ListItem><ListItemButton><ListItemContent>Large</ListItemContent></ListItemButton></ListItem>
                    <ListItem><ListItemButton><ListItemContent>Large</ListItemContent></ListItemButton></ListItem>
                </List>
            </div>
        </div>
    );
}

export const AllSizes: Story = {
    render: AllSizesStory
};

function NestedStory(): ReactElement {
    return (
        <div style={{ width: '280px' }}>
            <List>
                <ListItem>
                    <ListItemButton>
                        <ListItemDecorator><HomeIcon /></ListItemDecorator>
                        <ListItemContent>Home</ListItemContent>
                    </ListItemButton>
                </ListItem>
                <List nested>
                    <ListItem>
                        <ListItemButton>
                            <ListItemContent>Recent</ListItemContent>
                        </ListItemButton>
                    </ListItem>
                    <List nested>
                        <ListItem><ListItemButton><ListItemContent>Today</ListItemContent></ListItemButton></ListItem>
                        <ListItem><ListItemButton><ListItemContent>This Week</ListItemContent></ListItemButton></ListItem>
                    </List>
                    <ListItem><ListItemButton><ListItemContent>All Documents</ListItemContent></ListItemButton></ListItem>
                </List>
            </List>
        </div>
    );
}

export const Nested: Story = {
    render: NestedStory
};
