import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { vars } from 'styles/tokens.css.ts';

const meta: Meta = {
    title: 'UI Primitives/Command',
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

function CommandPaletteStory(): ReactElement {
    return (
        <div style={{ padding: vars.spacing['5'] }}>
            <p style={{ color: vars.colors.text, marginBottom: vars.spacing['5'] }}>
                Open Command Palette (Cmd+K)
            </p>
            <p
                style={{
                    color: vars.colors.textSecondary,
                    fontSize: vars.typography['3'].fontSize
                }}
            >
                The Command Palette component provides a keyboard-accessible command interface.
            </p>
        </div>
    );
}

export const Default: Story = {
    render: CommandPaletteStory
};

function SearchableCommandStory(): ReactElement {
    const commands = [
        { id: '1', label: 'Create new file', shortcut: 'Ctrl+N' },
        { id: '2', label: 'Open settings', shortcut: 'Ctrl+,' },
        { id: '3', label: 'Save file', shortcut: 'Ctrl+S' }
    ];

    return (
        <div style={{ padding: vars.spacing['5'] }}>
            <p style={{ color: vars.colors.text, marginBottom: vars.spacing['5'] }}>
                Command Palette with searchable commands
            </p>
            <div
                style={{
                    border: `1px solid ${vars.colors.textMuted}`,
                    borderRadius: vars.borderRadius.md,
                    overflow: 'hidden'
                }}
            >
                <input
                    type="text"
                    placeholder="Search commands..."
                    style={{
                        width: '100%',
                        padding: vars.spacing['5'],
                        border: 'none',
                        borderBottom: `1px solid ${vars.colors.textMuted}`,
                        backgroundColor: vars.colors.background,
                        color: vars.colors.text,
                        fontSize: vars.typography['3'].fontSize
                    }}
                />
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {commands.map((cmd) => (
                        <div
                            key={cmd.id}
                            style={{
                                padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
                                borderBottom: `1px solid ${vars.colors.textMuted}`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                backgroundColor: vars.colors.surface,
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = vars.colors.background;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = vars.colors.surface;
                            }}
                        >
                            <span style={{ color: vars.colors.text }}>{cmd.label}</span>
                            <span
                                style={{
                                    color: vars.colors.textMuted,
                                    fontSize: vars.typography['1'].fontSize
                                }}
                            >
                                {cmd.shortcut}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export const Searchable: Story = {
    render: SearchableCommandStory
};
