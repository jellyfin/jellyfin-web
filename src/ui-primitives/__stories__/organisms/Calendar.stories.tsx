import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useState, useCallback } from 'react';
import { Calendar } from '../../calendar';
import { DatePicker, DateRangePicker } from '../../DatePicker';
import { vars } from '../../../styles/tokens.css';
import type { DateRange } from 'react-day-picker';

const meta: Meta<typeof Calendar> = {
    title: 'UI Primitives/Calendar',
    component: Calendar,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'A full-featured calendar component built on react-day-picker with vanilla-extract styling.'
            }
        }
    },
    tags: ['autodocs'],
    argTypes: {
        mode: {
            control: 'select',
            options: ['single', 'range', 'multiple'],
            description: 'Selection mode'
        },
        showOutsideDays: {
            control: 'boolean',
            description: 'Show days from adjacent months'
        },
        fixedWeeks: {
            control: 'boolean',
            description: 'Always show 6 weeks'
        },
        ISOWeek: {
            control: 'boolean',
            description: 'Use ISO week numbering'
        }
    }
};

export default meta;
type Story = StoryObj<typeof meta>;

function SingleSelectStory(): ReactElement {
    const [selected, setSelected] = useState<Date | undefined>(undefined);

    const handleSelect = useCallback((value: Date | Date[] | DateRange | undefined): void => {
        if (value instanceof Date) {
            setSelected(value);
        } else {
            setSelected(undefined);
        }
    }, []);

    return (
        <div>
            <Calendar mode="single" selected={selected} onSelect={handleSelect} />
            <p style={{ marginTop: 16, color: vars.colors.textSecondary }}>
                Selected: {selected !== undefined ? selected.toDateString() : 'None'}
            </p>
        </div>
    );
}

export const SingleSelect: Story = {
    render: SingleSelectStory
};

function RangeSelectStory(): ReactElement {
    const [range, setRange] = useState<DateRange>({ from: undefined, to: undefined });

    const handleSelect = useCallback((value: Date | Date[] | DateRange | undefined): void => {
        const nextRange = (value as DateRange) ?? { from: undefined, to: undefined };
        setRange(nextRange);
    }, []);

    return (
        <div>
            <Calendar mode="range" selected={range} onSelect={handleSelect} />
            <p style={{ marginTop: 16, color: vars.colors.textSecondary }}>
                {range.from !== undefined ? `From: ${range.from.toDateString()}` : 'Start date: None'}
                {range.to !== undefined ? ` - To: ${range.to.toDateString()}` : ''}
            </p>
        </div>
    );
}

export const RangeSelect: Story = {
    render: RangeSelectStory
};

function MultipleSelectStory(): ReactElement {
    const [selected, setSelected] = useState<Date[]>([]);

    const handleSelect = useCallback((dates: Date | Date[] | DateRange | undefined): void => {
        if (Array.isArray(dates)) {
            setSelected(dates);
        } else {
            setSelected([]);
        }
    }, []);

    return (
        <div>
            <Calendar mode="multiple" selected={selected} onSelect={handleSelect} />
            <p style={{ marginTop: 16, color: vars.colors.textSecondary }}>
                Selected: {selected.length > 0 ? selected.map(d => d.toDateString()).join(', ') : 'None'}
            </p>
        </div>
    );
}

export const MultipleSelect: Story = {
    render: MultipleSelectStory
};

function WithDisabledDatesStory(): ReactElement {
    const [selected, setSelected] = useState<Date | undefined>(undefined);
    const today = new Date();

    const isDisabled = useCallback(
        (date: Date): boolean => {
            return date < today || date.getDay() === 0;
        },
        [today]
    );

    const handleSelect = useCallback((value: Date | Date[] | DateRange | undefined): void => {
        if (value instanceof Date) {
            setSelected(value);
        } else {
            setSelected(undefined);
        }
    }, []);

    return (
        <div>
            <Calendar mode="single" selected={selected} onSelect={handleSelect} disabled={isDisabled} />
            <p style={{ marginTop: 16, fontSize: vars.typography['3'].fontSize, color: vars.colors.textSecondary }}>
                Past dates and Sundays are disabled
            </p>
        </div>
    );
}

export const WithDisabledDates: Story = {
    render: WithDisabledDatesStory
};

function DatePickerStoryComponent(): ReactElement {
    const [date, setDate] = useState<Date | undefined>(undefined);

    const handleChange = useCallback((newDate: Date | undefined): void => {
        setDate(newDate);
    }, []);

    return (
        <div>
            <DatePicker value={date} onChange={handleChange} placeholder="Select a date" />
            <p style={{ marginTop: 16, color: vars.colors.textSecondary }}>
                Selected: {date !== undefined ? date.toDateString() : 'None'}
            </p>
        </div>
    );
}

export const DatePickerStory: Story = {
    render: DatePickerStoryComponent
};

function DateRangePickerStoryComponent(): ReactElement {
    const [range, setRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined
    });

    const handleChange = useCallback((newRange: { from: Date | undefined; to: Date | undefined }): void => {
        setRange(newRange);
    }, []);

    return (
        <div>
            <DateRangePicker value={range} onChange={handleChange} />
            <p style={{ marginTop: 16, color: vars.colors.textSecondary }}>
                {range.from !== undefined ? `From: ${range.from.toDateString()}` : 'Start: None'}
                {range.to !== undefined ? ` - To: ${range.to.toDateString()}` : ''}
            </p>
        </div>
    );
}

export const DateRangePickerStory: Story = {
    render: DateRangePickerStoryComponent
};
