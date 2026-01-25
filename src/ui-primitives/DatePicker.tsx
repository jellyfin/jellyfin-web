import React, { useState, useRef, useEffect, type ReactNode, type ReactElement, useCallback } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar } from './calendar';
import { Popover, PopoverTrigger, PopoverContent, PopoverArrow } from './Popover';
import { type ButtonVariant, type ButtonSize } from './Button';
import {
    datePickerContainer,
    datePickerTrigger,
    datePickerTriggerActive,
    datePickerIcon,
    datePickerValue
} from './DatePicker.css';

function CalendarIcon(): ReactElement {
    return (
        <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            aria-hidden='true'
        >
            <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
            <line x1='16' y1='2' x2='16' y2='6' />
            <line x1='8' y1='2' x2='8' y2='6' />
            <line x1='3' y1='10' x2='21' y2='10' />
        </svg>
    );
}

function ClearIcon(): ReactElement {
    return (
        <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            aria-hidden='true'
        >
            <line x1='18' y1='6' x2='6' y2='18' />
            <line x1='6' y1='6' x2='18' y2='18' />
        </svg>
    );
}

export interface DatePickerProps {
    readonly value?: Date | null;
    readonly onChange?: (date: Date | undefined) => void;
    readonly placeholder?: string;
    readonly disabled?: boolean;
    readonly className?: string;
    readonly buttonClassName?: string;
    readonly buttonVariant?: ButtonVariant;
    readonly buttonSize?: ButtonSize;
    readonly minDate?: Date;
    readonly maxDate?: Date;
    readonly showOutsideDays?: boolean;
    readonly formatString?: string;
    readonly children?: ReactNode;
}

export function DatePicker({
    value,
    onChange,
    placeholder = 'Select date',
    disabled = false,
    className,
    buttonClassName,
    buttonVariant: _buttonVariant = 'outlined',
    buttonSize: _buttonSize = 'md',
    minDate: _minDate,
    maxDate: _maxDate,
    showOutsideDays = true,
    formatString = 'PPP',
    children
}: DatePickerProps): ReactElement {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleSelect = useCallback((date: Date | undefined): void => {
        onChange?.(date);
        if (date !== undefined) {
            setOpen(false);
        }
    }, [onChange]);

    const handleClear = useCallback((e: React.MouseEvent): void => {
        e.stopPropagation();
        onChange?.(undefined);
    }, [onChange]);

    const displayValue = value !== null && value !== undefined ? format(value, formatString) : placeholder;

    useEffect(() => {
        if (open && buttonRef.current !== null) {
            buttonRef.current.focus();
        }
    }, [open]);

    const isSelected = value !== null && value !== undefined;

    return (
        <div className={`${datePickerContainer} ${className ?? ''}`}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type='button'
                        ref={buttonRef}
                        className={`${datePickerTrigger} ${isSelected ? datePickerTriggerActive : ''} ${buttonClassName ?? ''}`}
                        disabled={disabled}
                        aria-label={isSelected ? `Selected: ${displayValue}` : placeholder}
                    >
                        <span className={datePickerIcon}>
                            <CalendarIcon />
                        </span>
                        <span className={datePickerValue}>
                            {isSelected ? displayValue : placeholder}
                        </span>
                        {isSelected && !disabled && (
                            <button
                                type='button'
                                className={datePickerIcon}
                                onClick={handleClear}
                                style={{
                                    marginLeft: 'auto',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                                aria-label='Clear date'
                            >
                                <ClearIcon />
                            </button>
                        )}
                    </button>
                </PopoverTrigger>
                <PopoverContent align='start' style={{ padding: 0 }}>
                    <Calendar
                        mode='single'
                        selected={value ?? undefined}
                        onSelect={handleSelect as (date: Date | Date[] | DateRange | undefined) => void}
                        showOutsideDays={showOutsideDays}
                    />
                    <PopoverArrow />
                </PopoverContent>
            </Popover>
            {children}
        </div>
    );
}

export interface DateRangePickerProps {
    readonly value?: { from: Date | undefined; to: Date | undefined };
    readonly onChange?: (range: { from: Date | undefined; to: Date | undefined }) => void;
    readonly placeholder?: string;
    readonly disabled?: boolean;
    readonly className?: string;
    readonly buttonClassName?: string;
    readonly buttonVariant?: ButtonVariant;
    readonly buttonSize?: ButtonSize;
    readonly minDate?: Date;
    readonly maxDate?: Date;
    readonly showOutsideDays?: boolean;
    readonly formatString?: string;
}

export function DateRangePicker({
    value,
    onChange,
    placeholder = 'Select date range',
    disabled = false,
    className,
    buttonClassName,
    buttonVariant: _buttonVariant = 'outlined',
    buttonSize: _buttonSize = 'md',
    minDate: _minDate,
    maxDate: _maxDate,
    showOutsideDays = true,
    formatString = 'PPP'
}: DateRangePickerProps): ReactElement {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleSelect = useCallback((range: DateRange | undefined): void => {
        if (range?.from !== undefined && range?.to !== undefined) {
            onChange?.({ from: range.from, to: range.to });
            setOpen(false);
        } else if (range?.from !== undefined) {
            onChange?.({ from: range.from, to: undefined });
        }
    }, [onChange]);

    const handleClear = useCallback((e: React.MouseEvent): void => {
        e.stopPropagation();
        onChange?.({ from: undefined, to: undefined });
    }, [onChange]);

    let displayValue = placeholder;
    if (value?.from !== undefined) {
        if (value.to !== undefined) {
            displayValue = `${format(value.from, formatString)} - ${format(value.to, formatString)}`;
        } else {
            displayValue = `${format(value.from, formatString)} -`;
        }
    }

    useEffect(() => {
        if (open && buttonRef.current !== null) {
            buttonRef.current.focus();
        }
    }, [open]);

    const hasFrom = value?.from !== undefined;

    return (
        <div className={`${datePickerContainer} ${className ?? ''}`}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type='button'
                        ref={buttonRef}
                        className={`${datePickerTrigger} ${hasFrom ? datePickerTriggerActive : ''} ${buttonClassName ?? ''}`}
                        disabled={disabled}
                        aria-label={hasFrom ? `Selected: ${displayValue}` : placeholder}
                    >
                        <span className={datePickerIcon}>
                            <CalendarIcon />
                        </span>
                        <span className={datePickerValue}>{displayValue}</span>
                        {hasFrom && !disabled && (
                            <button
                                type='button'
                                className={datePickerIcon}
                                onClick={handleClear}
                                style={{
                                    marginLeft: 'auto',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                                aria-label='Clear date range'
                            >
                                <ClearIcon />
                            </button>
                        )}
                    </button>
                </PopoverTrigger>
                <PopoverContent align='start' style={{ padding: 0 }}>
                    <Calendar
                        mode='range'
                        selected={value as DateRange}
                        onSelect={handleSelect as (date: Date | Date[] | DateRange | undefined) => void}
                        showOutsideDays={showOutsideDays}
                    />
                    <PopoverArrow />
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default DatePicker;
