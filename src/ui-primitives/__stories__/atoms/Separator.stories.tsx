import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Box, Separator, Text } from '../..';

const meta: Meta<typeof Separator> = {
    title: 'UI Primitives/Separator',
    component: Separator,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    argTypes: {
        orientation: { control: 'radio', options: ['horizontal', 'vertical'] }
    }
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
    args: {
        orientation: 'horizontal'
    },
    decorators: [
        (_Story): ReactElement => (
            <div style={{ width: '300px' }}>
                <Text>Content above</Text>
                <Separator />
                <Text>Content below</Text>
            </div>
        )
    ]
};

export const Vertical: Story = {
    args: {
        orientation: 'vertical'
    },
    decorators: [
        (_Story): ReactElement => (
            <Box style={{ display: 'flex', alignItems: 'center', height: '60px' }}>
                <Text>Left</Text>
                <Separator orientation="vertical" />
                <Text>Right</Text>
            </Box>
        )
    ]
};

export const InCard: Story = {
    decorators: [
        (_Story): ReactElement => (
            <Box
                style={{
                    width: '300px',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}
            >
                <Box style={{ padding: '16px', backgroundColor: '#2a2a2a' }}>
                    <Text weight="bold">Card Header</Text>
                </Box>
                <Separator />
                <Box style={{ padding: '16px' }}>
                    <Text>Card content area with some text.</Text>
                </Box>
                <Separator />
                <Box
                    style={{
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: vars.spacing['2']
                    }}
                >
                    <Text as="span" size="sm" color="secondary">
                        Cancel
                    </Text>
                    <Text as="span" size="sm" color="primary">
                        Confirm
                    </Text>
                </Box>
            </Box>
        )
    ]
};

function NavigationBreadcrumbStory(): ReactElement {
    return (
        <Box style={{ display: 'flex', alignItems: 'center', gap: vars.spacing['2'] }}>
            <Text as="span" color="primary">
                Home
            </Text>
            <Separator orientation="vertical" />
            <Text as="span" color="primary">
                Documents
            </Text>
            <Separator orientation="vertical" />
            <Text>Reports</Text>
        </Box>
    );
}

export const NavigationBreadcrumb: Story = {
    render: NavigationBreadcrumbStory
};

function SettingsPanelStory(): ReactElement {
    return (
        <Box
            style={{
                width: '350px',
                border: '1px solid #333',
                borderRadius: '8px',
                overflow: 'hidden'
            }}
        >
            <Box style={{ padding: '12px 16px', backgroundColor: '#2a2a2a' }}>
                <Text weight="medium">Account Settings</Text>
            </Box>
            <Box style={{ padding: '16px' }}>
                <Box style={{ marginBottom: '12px' }}>
                    <Text size="sm" color="secondary">
                        Profile
                    </Text>
                </Box>
                <Box style={{ marginBottom: '12px' }}>
                    <Text size="sm" color="secondary">
                        Security
                    </Text>
                </Box>
                <Box style={{ margin: '16px 0' }}>
                    <Separator />
                </Box>
                <Box style={{ marginBottom: '12px' }}>
                    <Text size="sm" color="secondary">
                        Notifications
                    </Text>
                </Box>
                <Box style={{ marginBottom: '12px' }}>
                    <Text size="sm" color="secondary">
                        Privacy
                    </Text>
                </Box>
            </Box>
        </Box>
    );
}

export const SettingsPanel: Story = {
    render: SettingsPanelStory
};
