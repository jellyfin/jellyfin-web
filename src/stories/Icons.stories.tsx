import {
    ArrowLeftIcon,
    ArrowRightIcon,
    BackpackIcon,
    BellIcon,
    CaretDownIcon,
    CaretUpIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    ClipboardIcon,
    ComponentBooleanIcon,
    CopyIcon,
    Cross1Icon,
    DashboardIcon,
    DotsHorizontalIcon,
    DotsVerticalIcon,
    DoubleArrowLeftIcon,
    DoubleArrowRightIcon,
    DownloadIcon,
    EraserIcon,
    ExclamationTriangleIcon,
    EyeClosedIcon,
    EyeOpenIcon,
    FileIcon,
    GearIcon,
    HeartFilledIcon,
    HeartIcon,
    HomeIcon,
    InfoCircledIcon,
    LockClosedIcon,
    LockOpen1Icon,
    MagnifyingGlassIcon,
    MinusIcon,
    MixIcon,
    PauseIcon,
    Pencil1Icon,
    PlayIcon,
    PlusIcon,
    QuestionMarkCircledIcon,
    ReloadIcon,
    StarFilledIcon,
    StarIcon,
    StopIcon,
    TrackNextIcon,
    TrackPreviousIcon,
    TrashIcon,
    UpdateIcon,
    UploadIcon
} from '@radix-ui/react-icons';

import type { Meta, StoryObj } from '@storybook/react';
import { vars } from 'styles/tokens.css.ts';

import '../styles/components.css';

const meta: Meta = {
    title: 'Design System/Icons',
    parameters: {
        layout: 'centered'
    }
};

export default meta;

/**
 * Complete Radix Icons catalog
 *
 * All icons inherit currentColor for easy theming.
 * Use semantic token classes to adjust sizing/color.
 *
 * Classes:
 * - .icon-sm (12px)
 * - .icon-md (15px - default)
 * - .icon-lg (18px)
 * - .icon-xl (24px)
 */

interface IconGridProps {
    icons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>;
}

function IconGrid({ icons }: IconGridProps): React.ReactElement {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: vars.spacing['4'],
                padding: vars.spacing['5']
            }}
        >
            {Object.entries(icons)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([name, Icon]) => (
                    <div
                        key={name}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: vars.spacing['2'],
                            padding: '12px',
                            border: '1px solid var(--border-1)',
                            borderRadius: 'var(--r-md)',
                            backgroundColor: 'var(--surface-1)'
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                gap: vars.spacing['2'],
                                alignItems: 'center'
                            }}
                        >
                            <Icon className="icon-md" style={{ color: 'var(--text-1)' }} />
                            <Icon className="icon-lg" style={{ color: 'var(--primary)' }} />
                        </div>
                        <code
                            style={{
                                fontSize: '11px',
                                textAlign: 'center',
                                color: 'var(--text-2)',
                                wordBreak: 'break-word'
                            }}
                        >
                            {name}
                        </code>
                    </div>
                ))}
        </div>
    );
}

type Story = StoryObj;

export const AllIcons: Story = {
    render: (): React.ReactElement => {
        const icons = {
            PlusIcon,
            MinusIcon,
            CheckIcon,
            Cross1Icon,
            ChevronDownIcon,
            ChevronUpIcon,
            ChevronLeftIcon,
            ChevronRightIcon,
            DoubleArrowLeftIcon,
            DoubleArrowRightIcon,
            ArrowLeftIcon,
            ArrowRightIcon,
            CaretDownIcon,
            CaretUpIcon,
            PlayIcon,
            PauseIcon,
            StopIcon,
            TrackNextIcon,
            TrackPreviousIcon,
            ReloadIcon,
            UpdateIcon,
            TrashIcon,
            DownloadIcon,
            UploadIcon,
            MagnifyingGlassIcon,
            GearIcon,
            BellIcon,
            InfoCircledIcon,
            QuestionMarkCircledIcon,
            ExclamationTriangleIcon,
            DotsVerticalIcon,
            DotsHorizontalIcon,
            LockClosedIcon,
            LockOpen1Icon,
            EyeOpenIcon,
            EyeClosedIcon,
            HeartIcon,
            HeartFilledIcon,
            StarIcon,
            StarFilledIcon,
            HomeIcon,
            DashboardIcon,
            MixIcon,
            EraserIcon,
            Pencil1Icon,
            ClipboardIcon,
            CopyIcon,
            FileIcon,
            BackpackIcon,
            ComponentBooleanIcon
        };

        return <IconGrid icons={icons} />;
    }
};

export const CommonIcons: Story = {
    render: (): React.ReactElement => {
        const common = {
            PlusIcon,
            MinusIcon,
            CheckIcon,
            Cross1Icon,
            ChevronDownIcon,
            ChevronUpIcon,
            ChevronLeftIcon,
            ChevronRightIcon,
            DoubleArrowLeftIcon,
            DoubleArrowRightIcon,
            ArrowLeftIcon,
            ArrowRightIcon,
            CaretDownIcon,
            CaretUpIcon,
            PlayIcon,
            PauseIcon,
            StopIcon,
            TrackNextIcon,
            TrackPreviousIcon,
            ReloadIcon,
            UpdateIcon,
            TrashIcon,
            DownloadIcon,
            UploadIcon,
            MagnifyingGlassIcon,
            GearIcon,
            BellIcon,
            InfoCircledIcon,
            QuestionMarkCircledIcon,
            ExclamationTriangleIcon,
            DotsVerticalIcon,
            DotsHorizontalIcon,
            LockClosedIcon,
            LockOpen1Icon,
            EyeOpenIcon,
            EyeClosedIcon,
            HeartIcon,
            HeartFilledIcon,
            StarIcon,
            StarFilledIcon,
            HomeIcon,
            DashboardIcon,
            MixIcon,
            EraserIcon,
            Pencil1Icon,
            ClipboardIcon,
            CopyIcon,
            FileIcon,
            BackpackIcon,
            ComponentBooleanIcon
        };

        return <IconGrid icons={common} />;
    }
};

export const SizingDemo: Story = {
    render: (): React.ReactElement => (
        <div
            style={{
                display: 'flex',
                gap: '24px',
                alignItems: 'center',
                padding: vars.spacing['5']
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: vars.spacing['2'],
                    alignItems: 'center'
                }}
            >
                <PlusIcon className="icon-sm" style={{ color: 'var(--primary)' }} />
                <code style={{ fontSize: '11px', color: 'var(--text-2)' }}>12px (sm)</code>
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: vars.spacing['2'],
                    alignItems: 'center'
                }}
            >
                <PlusIcon className="icon-md" style={{ color: 'var(--primary)' }} />
                <code style={{ fontSize: '11px', color: 'var(--text-2)' }}>15px (md)</code>
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: vars.spacing['2'],
                    alignItems: 'center'
                }}
            >
                <PlusIcon className="icon-lg" style={{ color: 'var(--primary)' }} />
                <code style={{ fontSize: '11px', color: 'var(--text-2)' }}>18px (lg)</code>
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: vars.spacing['2'],
                    alignItems: 'center'
                }}
            >
                <PlusIcon className="icon-xl" style={{ color: 'var(--primary)' }} />
                <code style={{ fontSize: '11px', color: 'var(--text-2)' }}>24px (xl)</code>
            </div>
        </div>
    )
};

export const ColorDemo: Story = {
    render: (): React.ReactElement => (
        <div
            style={{
                display: 'flex',
                gap: '24px',
                alignItems: 'center',
                padding: vars.spacing['5']
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: vars.spacing['2'],
                    alignItems: 'center'
                }}
            >
                <PlusIcon className="icon-lg" style={{ color: 'var(--text-1)' }} />
                <code style={{ fontSize: '11px', color: 'var(--text-2)' }}>--text-1</code>
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: vars.spacing['2'],
                    alignItems: 'center'
                }}
            >
                <PlusIcon className="icon-lg" style={{ color: 'var(--primary)' }} />
                <code style={{ fontSize: '11px', color: 'var(--text-2)' }}>--primary</code>
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: vars.spacing['2'],
                    alignItems: 'center'
                }}
            >
                <PlusIcon className="icon-lg" style={{ color: 'var(--success)' }} />
                <code style={{ fontSize: '11px', color: 'var(--text-2)' }}>--success</code>
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: vars.spacing['2'],
                    alignItems: 'center'
                }}
            >
                <PlusIcon className="icon-lg" style={{ color: 'var(--warning)' }} />
                <code style={{ fontSize: '11px', color: 'var(--text-2)' }}>--warning</code>
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: vars.spacing['2'],
                    alignItems: 'center'
                }}
            >
                <PlusIcon className="icon-lg" style={{ color: 'var(--error)' }} />
                <code style={{ fontSize: '11px', color: 'var(--text-2)' }}>--error</code>
            </div>
        </div>
    )
};

export const IconButtonDemo: Story = {
    render: (): React.ReactElement => (
        <div
            style={{
                display: 'flex',
                gap: vars.spacing['4'],
                alignItems: 'center',
                padding: vars.spacing['5']
            }}
        >
            <button className="iconButton">
                <PlusIcon className="icon-md" />
            </button>

            <button className="iconButton primary">
                <CheckIcon className="icon-md" />
            </button>

            <button className="iconButton ghost">
                <DotsVerticalIcon className="icon-md" />
            </button>

            <button className="iconButton" disabled>
                <TrashIcon className="icon-md" />
            </button>
        </div>
    )
};

export const ButtonWithIconDemo: Story = {
    render: (): React.ReactElement => (
        <div
            style={{
                display: 'flex',
                gap: vars.spacing['4'],
                alignItems: 'center',
                padding: vars.spacing['5'],
                flexWrap: 'wrap'
            }}
        >
            <button className="button">
                <PlusIcon className="icon-md" />
                Add Item
            </button>

            <button className="button primary">
                <CheckIcon className="icon-md" />
                Save
            </button>

            <button className="button outline">
                <DownloadIcon className="icon-md" />
                Download
            </button>

            <button className="button" disabled>
                <TrashIcon className="icon-md" />
                Delete
            </button>
        </div>
    )
};
