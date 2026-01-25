import React, { type ReactElement } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/src/style.css';
import { calendarContainer } from './Calendar.css';

export interface CalendarProps {
    readonly mode?: 'single' | 'range' | 'multiple';
    readonly selected?: Date | DateRange | Date[];
    readonly onSelect?: (date: Date | DateRange | Date[] | undefined) => void;
    readonly disabled?: Date[] | ((date: Date) => boolean);
    readonly showOutsideDays?: boolean;
    readonly fixedWeeks?: boolean;
    readonly ISOWeek?: boolean;
    readonly className?: string;
    readonly style?: React.CSSProperties;
}

export function Calendar({
    mode = 'single',
    selected,
    onSelect,
    disabled,
    showOutsideDays = true,
    fixedWeeks = false,
    ISOWeek = false,
    className,
    style: calendarStyle,
    ...props
}: CalendarProps): ReactElement {
    let disabledDays: ((date: Date) => boolean) | Date[] | undefined;

    if (disabled !== undefined) {
        if (typeof disabled === 'function') {
            disabledDays = disabled;
        } else {
            const disabledArray = disabled as Date[];
            disabledDays = (date: Date): boolean => {
                return disabledArray.some(
                    d =>
                        d.getDate() === date.getDate()
                          && d.getMonth() === date.getMonth()
                          && d.getFullYear() === date.getFullYear()
                );
            };
        }
    }

    return (
        <div className={`${calendarContainer} ${className ?? ''}`} style={calendarStyle}>
            <DayPicker
                mode={mode as 'single'}
                selected={selected as Date}
                onSelect={onSelect as (date: Date | undefined) => void}
                disabled={disabledDays}
                showOutsideDays={showOutsideDays}
                fixedWeeks={fixedWeeks}
                ISOWeek={ISOWeek}
                {...props}
            />
        </div>
    );
}

export default Calendar;

