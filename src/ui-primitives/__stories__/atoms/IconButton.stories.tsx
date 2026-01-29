import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { IconButton } from '../..';

const meta: Meta<typeof IconButton> = {
    title: 'UI Primitives/IconButton',
    component: IconButton,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    argTypes: {
        variant: { control: 'select', options: ['plain', 'ghost', 'soft', 'solid', 'danger'] },
        size: { control: 'select', options: ['sm', 'md', 'lg'] },
        color: {
            control: 'select',
            options: ['primary', 'neutral', 'danger', 'warning', 'success', 'info']
        }
    }
};

export default meta;
type Story = StoryObj<typeof IconButton>;

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
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    );
}

function TrashIcon(): ReactElement {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    );
}

function PlusIcon(): ReactElement {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function SearchIcon(): ReactElement {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

export const Default: Story = {
    args: {
        children: <HomeIcon />
    }
};

function AllVariantsStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: vars.spacing['4'], alignItems: 'center' }}>
            <IconButton variant="plain">
                <HomeIcon />
            </IconButton>
            <IconButton variant="ghost">
                <HomeIcon />
            </IconButton>
            <IconButton variant="soft">
                <HomeIcon />
            </IconButton>
            <IconButton variant="solid">
                <HomeIcon />
            </IconButton>
            <IconButton variant="danger">
                <TrashIcon />
            </IconButton>
        </div>
    );
}

export const AllVariants: Story = {
    render: AllVariantsStory
};

function AllSizesStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: vars.spacing['4'], alignItems: 'center' }}>
            <IconButton size="sm">
                <HomeIcon />
            </IconButton>
            <IconButton size="md">
                <HomeIcon />
            </IconButton>
            <IconButton size="lg">
                <HomeIcon />
            </IconButton>
        </div>
    );
}

export const AllSizes: Story = {
    render: AllSizesStory
};

function AllColorsStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: vars.spacing['4'], alignItems: 'center' }}>
            <IconButton color="primary">
                <HomeIcon />
            </IconButton>
            <IconButton color="neutral">
                <HomeIcon />
            </IconButton>
            <IconButton color="success">
                <HomeIcon />
            </IconButton>
            <IconButton color="warning">
                <HomeIcon />
            </IconButton>
            <IconButton color="danger">
                <TrashIcon />
            </IconButton>
            <IconButton color="info">
                <SearchIcon />
            </IconButton>
        </div>
    );
}

export const AllColors: Story = {
    render: AllColorsStory
};

function DisabledStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: vars.spacing['4'], alignItems: 'center' }}>
            <IconButton variant="plain" disabled>
                <HomeIcon />
            </IconButton>
            <IconButton variant="solid" disabled>
                <HomeIcon />
            </IconButton>
            <IconButton variant="danger" disabled>
                <TrashIcon />
            </IconButton>
        </div>
    );
}

export const Disabled: Story = {
    render: DisabledStory
};

export const WithTitle: Story = {
    args: {
        children: <SettingsIcon />,
        title: 'Settings'
    }
};

function IconGalleryStory(): ReactElement {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: vars.spacing['4'],
                width: '300px'
            }}
        >
            <IconButton variant="ghost">
                <HomeIcon />
            </IconButton>
            <IconButton variant="ghost">
                <SettingsIcon />
            </IconButton>
            <IconButton variant="ghost">
                <TrashIcon />
            </IconButton>
            <IconButton variant="ghost">
                <PlusIcon />
            </IconButton>
            <IconButton variant="ghost">
                <SearchIcon />
            </IconButton>
            <IconButton variant="soft" color="primary">
                <HomeIcon />
            </IconButton>
            <IconButton variant="soft" color="success">
                <HomeIcon />
            </IconButton>
            <IconButton variant="soft" color="danger">
                <TrashIcon />
            </IconButton>
        </div>
    );
}

export const IconGallery: Story = {
    render: IconGalleryStory
};
