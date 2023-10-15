import globalize from '../scripts/globalize';

export const ticksPerHour = 36000000000;
export const ticksPerMinute = 600000000;
export const ticksPerSecond = 10000000;

/**
 * Parses an ISO 8601 date string into a Date object.
 * If the string does not contain a timezone, the toLocal parameter can be used to indicate if the date should be considered UTC or local.
 * @param s - The ISO 8601 date string to parse.
 * @param toLocal - If set to `false` and the string does not contain a timezone,
 * will consider the date to be in the local timezone, and not UTC.
 * @returns The parsed date.
 */
export function parseISO8601Date(s: string, toLocal = true): Date {
    // parenthese matches:
    // year month day    hours minutes seconds
    // dotmilliseconds
    // tzstring plusminus hours minutes
    const re = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|([+-])(\d{2}):(\d{2}))?/;

    const m = s.match(re);

    // "2010-12-07T11:00:00.000-09:00" parses to:
    //  ["2010-12-07T11:00:00.000-09:00", "2010", "12", "07", "11",
    //     "00", "00", ".000", "-09:00", "-", "09", "00"]
    // "2010-12-07T11:00:00.000Z" parses to:
    //  ["2010-12-07T11:00:00.000Z",      "2010", "12", "07", "11",
    //     "00", "00", ".000", "Z", undefined, undefined, undefined]

    if (!m) {
        throw new Error("Couldn't parse ISO 8601 date string '" + s + "'");
    }

    // parse strings, leading zeros into proper ints
    const d: number[] = [];
    const a = [1, 2, 3, 4, 5, 6, 10, 11];
    for (const i in a) {
        d[a[i]] = parseInt(m[a[i]], 10);
    }
    d[7] = parseFloat(m[7]);

    // Date.UTC(year, month[, date[, hrs[, min[, sec[, ms]]]]])
    // note that month is 0-11, not 1-12
    // see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date/UTC
    let ms = Date.UTC(d[1], d[2] - 1, d[3], d[4], d[5], d[6]);

    // if there are milliseconds, add them
    if (d[7] > 0) {
        ms += Math.round(d[7] * 1000);
    }

    // if there's a timezone, calculate it
    if (m[8] !== 'Z' && d[10]) {
        let offset = d[10] * 60 * 60 * 1000;
        if (d[11]) {
            offset += d[11] * 60 * 1000;
        }
        if (m[9] === '-') {
            ms += offset;
        } else {
            ms -= offset;
        }
    } else if (toLocal === false) {
        ms += new Date(ms).getTimezoneOffset() * 60000;
    }

    return new Date(ms);
}

/**
 * Return a string in '{}h {}m' format for duration.
 * @param ticks - Duration in ticks.
 * @returns The duration as a string.
 */
export function getDisplayDuration(ticks: number): string {
    const totalMinutes = Math.round(ticks / ticksPerMinute) || 1;
    const totalHours = Math.floor(totalMinutes / 60);
    const remainderMinutes = totalMinutes % 60;
    const result = [];
    if (totalHours > 0) {
        result.push(`${totalHours}h`);
    }
    result.push(`${remainderMinutes}m`);
    return result.join(' ');
}

/**
 * Return a string in '{h}:{mm}:{ss}' format for running time.
 * @param ticks - Duration in ticks.
 * @returns The running time as a string.
 */
export function getDisplayRunningTime(ticks: number): string {
    const parts: string[] = [];

    let hours = ticks / ticksPerHour;
    hours = Math.floor(hours);

    if (hours) {
        parts.push(hours.toLocaleString(globalize.getCurrentDateTimeLocale()));
    }

    ticks -= (hours * ticksPerHour);

    let minutes = ticks / ticksPerMinute;
    minutes = Math.floor(minutes);

    ticks -= (minutes * ticksPerMinute);

    let minutesPart: string;
    if (minutes < 10 && hours) {
        minutesPart = (0).toLocaleString(globalize.getCurrentDateTimeLocale()) + minutes.toLocaleString(globalize.getCurrentDateTimeLocale());
    } else {
        minutesPart = minutes.toLocaleString(globalize.getCurrentDateTimeLocale());
    }
    parts.push(minutesPart);

    let seconds = ticks / ticksPerSecond;
    seconds = Math.floor(seconds);

    let secondsPart: string;
    if (seconds < 10) {
        secondsPart = (0).toLocaleString(globalize.getCurrentDateTimeLocale()) + seconds.toLocaleString(globalize.getCurrentDateTimeLocale());
    } else {
        secondsPart = seconds.toLocaleString(globalize.getCurrentDateTimeLocale());
    }
    parts.push(secondsPart);

    return parts.join(':');
}

/**
 * A boolean indicating whether the browser supports locales in the `toLocaleTimeString` method.
 */
const toLocaleTimeStringSupportsLocales: boolean = function () {
    try {
        // eslint-disable-next-line sonarjs/no-ignored-return
        new Date().toLocaleTimeString('i');
    } catch (e: unknown) {
        return e instanceof RangeError;
    }
    return false;
}();

type OptionEntry = {
    name: keyof Intl.DateTimeFormatOptions,
    value: Intl.DateTimeFormatOptions[keyof Intl.DateTimeFormatOptions]
};

/**
 * Returns an array of option entries for the given Intl.DateTimeFormatOptions object.
 * @param options - The Intl.DateTimeFormatOptions object to extract option entries from.
 * @returns An array of OptionEntry objects containing the name and value of each option.
 */
function getOptionList(options: Intl.DateTimeFormatOptions): OptionEntry[] {
    const list: OptionEntry[] = [];

    for (const [key, value] of Object.entries(options)) {
        list.push({
            name: key as keyof Intl.DateTimeFormatOptions,
            value: value
        });
    }

    return list;
}

/**
 * Converts a value to a string using the current locale.
 * @param value - The value to convert to a string.
 * @param options - An optional object containing formatting options.
 * @returns The value as a string in the current locale.
 * @throws {Error} If the value parameter is null.
 */
export function toLocaleString(value: Date | number | null | undefined, options?: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions): string {
    if (!value) {
        throw new Error('value cannot be null');
    }

    options = options || {};

    if (toLocaleTimeStringSupportsLocales) {
        const currentLocale = globalize.getCurrentDateTimeLocale();

        if (currentLocale) {
            return value.toLocaleString(currentLocale, options);
        }
    }

    return value.toLocaleString();
}

/**
 * Converts a date to a date string using the current locale.
 * @param date - The date to convert to a string.
 * @param options - An optional object containing formatting options.
 * @returns The date part of the date as a string in the current locale.
 * @throws {Error} If the date parameter is null.
 */
export function toLocaleDateString(date: Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!date) {
        throw new Error('date cannot be null');
    }

    options = options || {};

    if (toLocaleTimeStringSupportsLocales) {
        const currentLocale = globalize.getCurrentDateTimeLocale();

        if (currentLocale) {
            return date.toLocaleDateString(currentLocale, options);
        }
    }

    // This is essentially a hard-coded polyfill
    const optionList = getOptionList(options);
    if (optionList.length === 1 && optionList[0].name === 'weekday') {
        const weekday = [];
        weekday[0] = 'Sun';
        weekday[1] = 'Mon';
        weekday[2] = 'Tue';
        weekday[3] = 'Wed';
        weekday[4] = 'Thu';
        weekday[5] = 'Fri';
        weekday[6] = 'Sat';
        return weekday[date.getDay()];
    }

    return date.toLocaleDateString();
}

/**
 * Converts a date to a time string using the current locale.
 * @param date - The date to convert to a string.
 * @param options - An optional object containing formatting options.
 * @returns The time part of the date as a string in the current locale.
 * @throws {Error} If the value parameter is null.
 */
export function toLocaleTimeString(date: Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!date) {
        throw new Error('date cannot be null');
    }

    options = options || {};

    if (toLocaleTimeStringSupportsLocales) {
        const currentLocale = globalize.getCurrentDateTimeLocale();

        if (currentLocale) {
            return date.toLocaleTimeString(currentLocale, options);
        }
    }

    return date.toLocaleTimeString();
}

/**
 * Checks if the given value is a string.
 * @param value - The value to check.
 * @returns True if the value is a string, false otherwise.
 */
function isString(value: Date | string): value is string {
    return (typeof value).toString().toLowerCase() === 'string';
}

/**
 * Get the display time for a date, in the format {h}:{mm} (and optionally {AM|PM}).
 * @param date The date to get the display time for.
 * @returns The display time for the date.
 */
export function getDisplayTime(date: Date | string | null | undefined): string {
    if (!date) {
        throw new Error('date cannot be null');
    }

    if (isString(date)) {
        let parsedDate: Date;

        try {
            parsedDate = parseISO8601Date(date, true);
        } catch (err) {
            return date;
        }

        date = parsedDate;
    }

    if (toLocaleTimeStringSupportsLocales) {
        return toLocaleTimeString(date, {
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    return getDisplayTimeInternal(date);
}

function getDisplayTimeInternal(date: Date): string {
    let time = toLocaleTimeString(date);

    const timeLower = time.toLowerCase();

    if (timeLower.indexOf('am') !== -1 || timeLower.indexOf('pm') !== -1) {
        let hour = date.getHours() % 12;
        const suffix = date.getHours() > 11 ? 'pm' : 'am';
        if (!hour) {
            hour = 12;
        }
        const minutes = date.getMinutes();
        let minutesString: string;

        if (minutes < 10) {
            minutesString = '0' + minutes;
        }

        minutesString = ':' + minutes;
        time = hour + minutesString + suffix;
    } else {
        const timeParts = time.split(':');

        // Trim off seconds
        if (timeParts.length > 2) {
            // setting to 2 also handles '21:00:28 GMT+9:30'
            timeParts.length = 2;
            time = timeParts.join(':');
        }
    }

    return time;
}

/**
 * Determines if a given date is a given number of days from today.
 * @param date - The date to check.
 * @param offsetInDays - The number of days to offset from today.
 * @returns True if the date is at the given offset relative to today, false otherwise.
 * @throws {Error} If the date parameter is null.
 */
export function isRelativeDay(date: Date | null | undefined, offsetInDays: number): boolean {
    if (!date) {
        throw new Error('date cannot be null');
    }

    const yesterday = new Date();
    const day = yesterday.getDate() + offsetInDays;

    yesterday.setDate(day); // automatically adjusts month/year appropriately

    return date.getFullYear() === yesterday.getFullYear() && date.getMonth() === yesterday.getMonth() && date.getDate() === day;
}

export default {
    parseISO8601Date: parseISO8601Date,
    getDisplayRunningTime: getDisplayRunningTime,
    getDisplayDuration,
    toLocaleDateString: toLocaleDateString,
    toLocaleString: toLocaleString,
    getDisplayTime: getDisplayTime,
    isRelativeDay: isRelativeDay,
    toLocaleTimeString: toLocaleTimeString,
    supportsLocalization: function () {
        return toLocaleTimeStringSupportsLocales;
    },
    ticksPerHour: ticksPerHour,
    ticksPerMinute: ticksPerMinute,
    ticksPerSecond: ticksPerSecond
};

