import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';

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
        <div style={{ padding: vars.spacing['5'], maxWidth: '400px' }}>
            <label
                style={{
                    display: 'block',
                    marginBottom: vars.spacing['4'],
                    color: vars.colors.text
                }}
            >
                Select a date
            </label>
            <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                    width: '100%',
                    padding: vars.spacing['4'],
                    borderRadius: vars.borderRadius.sm,
                    border: `1px solid ${vars.colors.textMuted}`,
                    backgroundColor: vars.colors.background,
                    color: vars.colors.text,
                    fontSize: vars.typography['3'].fontSize
                }}
            />
            {selectedDate && (
                <p
                    style={{
                        color: vars.colors.textSecondary,
                        marginTop: vars.spacing['4'],
                        fontSize: vars.typography['3'].fontSize
                    }}
                >
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
        <div style={{ padding: vars.spacing['5'], maxWidth: '400px' }}>
            <div style={{ marginBottom: vars.spacing['5'] }}>
                <label
                    style={{
                        display: 'block',
                        marginBottom: vars.spacing['4'],
                        color: vars.colors.text
                    }}
                >
                    Start date
                </label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                        width: '100%',
                        padding: vars.spacing['4'],
                        borderRadius: vars.borderRadius.sm,
                        border: `1px solid ${vars.colors.textMuted}`,
                        backgroundColor: vars.colors.background,
                        color: vars.colors.text,
                        fontSize: vars.typography['3'].fontSize
                    }}
                />
            </div>
            <div>
                <label
                    style={{
                        display: 'block',
                        marginBottom: vars.spacing['4'],
                        color: vars.colors.text
                    }}
                >
                    End date
                </label>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                        width: '100%',
                        padding: vars.spacing['4'],
                        borderRadius: vars.borderRadius.sm,
                        border: `1px solid ${vars.colors.textMuted}`,
                        backgroundColor: vars.colors.background,
                        color: vars.colors.text,
                        fontSize: vars.typography['3'].fontSize
                    }}
                />
            </div>
            {startDate && endDate && (
                <p
                    style={{
                        color: vars.colors.textSecondary,
                        marginTop: vars.spacing['5'],
                        fontSize: vars.typography['3'].fontSize
                    }}
                >
                    Range: {new Date(startDate).toLocaleDateString()} to{' '}
                    {new Date(endDate).toLocaleDateString()}
                </p>
            )}
        </div>
    );
}

export const DateRange: Story = {
    render: DateRangePickerStory
};
