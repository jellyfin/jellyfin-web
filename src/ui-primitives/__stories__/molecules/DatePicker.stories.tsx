import { type ReactElement, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { vars } from '../../styles/tokens.css.ts';

const meta: Meta = {
    title: 'UI Primitives/DatePicker',
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

function DatePickerStory(): ReactElement {
    const [selectedDate, setSelectedDate] = useState<string>('');

    return (
        <div style={{ padding: vars.spacing.md, maxWidth: '400px' }}>
            <label style={{ display: 'block', marginBottom: vars.spacing.sm, color: vars.colors.text }}>
                Select a date
            </label>
            <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                    width: '100%',
                    padding: vars.spacing.sm,
                    borderRadius: vars.borderRadius.sm,
                    border: `1px solid ${vars.colors.textMuted}`,
                    backgroundColor: vars.colors.background,
                    color: vars.colors.text,
                    fontSize: vars.typography.fontSizeSm
                }}
            />
            {selectedDate && (
                <p style={{ color: vars.colors.textSecondary, marginTop: vars.spacing.sm, fontSize: vars.typography.fontSizeSm }}>
                    Selected: {new Date(selectedDate).toLocaleDateString()}
                </p>
            )}
        </div>
    );
}

export const Default: Story = {
    render: DatePickerStory
};

function DateRangePickerStory(): ReactElement {
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    return (
        <div style={{ padding: vars.spacing.md, maxWidth: '400px' }}>
            <div style={{ marginBottom: vars.spacing.md }}>
                <label style={{ display: 'block', marginBottom: vars.spacing.sm, color: vars.colors.text }}>
                    Start date
                </label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                        width: '100%',
                        padding: vars.spacing.sm,
                        borderRadius: vars.borderRadius.sm,
                        border: `1px solid ${vars.colors.textMuted}`,
                        backgroundColor: vars.colors.background,
                        color: vars.colors.text,
                        fontSize: vars.typography.fontSizeSm
                    }}
                />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: vars.spacing.sm, color: vars.colors.text }}>
                    End date
                </label>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                        width: '100%',
                        padding: vars.spacing.sm,
                        borderRadius: vars.borderRadius.sm,
                        border: `1px solid ${vars.colors.textMuted}`,
                        backgroundColor: vars.colors.background,
                        color: vars.colors.text,
                        fontSize: vars.typography.fontSizeSm
                    }}
                />
            </div>
            {startDate && endDate && (
                <p style={{ color: vars.colors.textSecondary, marginTop: vars.spacing.md, fontSize: vars.typography.fontSizeSm }}>
                    Range: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                </p>
            )}
        </div>
    );
}

export const DateRange: Story = {
    render: DateRangePickerStory
};
