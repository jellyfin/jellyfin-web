import globalize from '../lib/globalize';
import { parseISO, format, isYesterday, isToday, isTomorrow, addDays } from 'date-fns';

export function parseISO8601Date(s: string, _toLocal?: boolean): Date {
    return parseISO(s);
}

/**
 * Return a string in '{}h {}m' format for duration.
 */
export function getDisplayDuration(ticks: number): string {
    const totalMinutes = Math.round(ticks / 600000000) || 1;
    const totalHours = Math.floor(totalMinutes / 60);
    const remainderMinutes = totalMinutes % 60;
    const result: string[] = [];
    if (totalHours > 0) {
        result.push(`${totalHours}h`);
    }
    result.push(`${remainderMinutes}m`);
    return result.join(' ');
}

export function getDisplayRunningTime(ticks: number): string {
    const ticksPerHour = 36000000000;
    const ticksPerMinute = 600000000;
    const ticksPerSecond = 10000000;

    const parts: string[] = [];
    let remainingTicks = ticks;

    let hours = Math.floor(remainingTicks / ticksPerHour);
    if (hours > 0) {
        parts.push(hours.toLocaleString(globalize.getCurrentDateTimeLocale()));
        remainingTicks -= (hours * ticksPerHour);
    }

    let minutes = Math.floor(remainingTicks / ticksPerMinute);
    remainingTicks -= (minutes * ticksPerMinute);

    if (minutes < 10 && hours > 0) {
        parts.push('0' + minutes.toLocaleString(globalize.getCurrentDateTimeLocale()));
    } else {
        parts.push(minutes.toLocaleString(globalize.getCurrentDateTimeLocale()));
    }

    let seconds = Math.floor(remainingTicks / ticksPerSecond);
    if (seconds < 10) {
        parts.push('0' + seconds.toLocaleString(globalize.getCurrentDateTimeLocale()));
    } else {
        parts.push(seconds.toLocaleString(globalize.getCurrentDateTimeLocale()));
    }

    return parts.join(':');
}

export function toLocaleString(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
    const currentLocale = globalize.getCurrentDateTimeLocale();
    return date.toLocaleString(currentLocale || undefined, options);
}

export function toLocaleDateString(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
    const currentLocale = globalize.getCurrentDateTimeLocale();
    return date.toLocaleDateString(currentLocale || undefined, options);
}

export function toLocaleTimeString(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
    const currentLocale = globalize.getCurrentDateTimeLocale();
    return date.toLocaleTimeString(currentLocale || undefined, options);
}

export function getDisplayDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO8601Date(date) : date;
    return toLocaleString(dateObj);
}

export function getDisplayTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO8601Date(date) : date;
    return toLocaleTimeString(dateObj, { hour: 'numeric', minute: '2-digit' });
}

export function isRelativeDay(date: Date, offsetInDays: number): boolean {
    const target = addDays(new Date(), offsetInDays);
    return date.getFullYear() === target.getFullYear() && 
           date.getMonth() === target.getMonth() && 
           date.getDate() === target.getDate();
}

const datetime = {
    parseISO8601Date,
    getDisplayRunningTime,
    getDisplayDuration,
    toLocaleDateString,
    toLocaleString,
    getDisplayTime,
    isRelativeDay,
    toLocaleTimeString,
    supportsLocalization: () => true
};

export default datetime;
