import globalize from 'lib/globalize';

export function parseISO8601Date(s, toLocal) {
    // parenthese matches:
    // year month day    hours minutes seconds
    // dotmilliseconds
    // tzstring plusminus hours minutes
    const re = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|([+-])(\d{2}):(\d{2}))?/;

    const d = s.match(re);

    // "2010-12-07T11:00:00.000-09:00" parses to:
    //  ["2010-12-07T11:00:00.000-09:00", "2010", "12", "07", "11",
    //     "00", "00", ".000", "-09:00", "-", "09", "00"]
    // "2010-12-07T11:00:00.000Z" parses to:
    //  ["2010-12-07T11:00:00.000Z",      "2010", "12", "07", "11",
    //     "00", "00", ".000", "Z", undefined, undefined, undefined]

    if (!d) {
        throw new Error("Couldn't parse ISO 8601 date string '" + s + "'");
    }

    // parse strings, leading zeros into proper ints
    const a = [1, 2, 3, 4, 5, 6, 10, 11];
    for (const i in a) {
        d[a[i]] = parseInt(d[a[i]], 10);
    }
    d[7] = parseFloat(d[7]);

    // Date.UTC(year, month[, date[, hrs[, min[, sec[, ms]]]]])
    // note that month is 0-11, not 1-12
    // see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date/UTC
    let ms = Date.UTC(d[1], d[2] - 1, d[3], d[4], d[5], d[6]);

    // if there are milliseconds, add them
    if (d[7] > 0) {
        ms += Math.round(d[7] * 1000);
    }

    // if there's a timezone, calculate it
    if (d[8] !== 'Z' && d[10]) {
        let offset = d[10] * 60 * 60 * 1000;
        if (d[11]) {
            offset += d[11] * 60 * 1000;
        }
        if (d[9] === '-') {
            ms -= offset;
        } else {
            ms += offset;
        }
    } else if (toLocal === false) {
        ms += new Date(ms).getTimezoneOffset() * 60000;
    }

    return new Date(ms);
}

/**
     * Return a string in '{}h {}m' format for duration.
     * @param {number} ticks - Duration in ticks.
     */
export function getDisplayDuration(ticks) {
    const totalMinutes = Math.round(ticks / 600000000) || 1;
    const totalHours = Math.floor(totalMinutes / 60);
    const remainderMinutes = totalMinutes % 60;
    const result = [];
    if (totalHours > 0) {
        result.push(`${totalHours}h`);
    }
    result.push(`${remainderMinutes}m`);
    return result.join(' ');
}

export function getDisplayRunningTime(ticks) {
    const ticksPerHour = 36000000000;
    const ticksPerMinute = 600000000;
    const ticksPerSecond = 10000000;

    const parts = [];

    let hours = ticks / ticksPerHour;
    hours = Math.floor(hours);

    if (hours) {
        parts.push(hours.toLocaleString(globalize.getCurrentDateTimeLocale()));
    }

    ticks -= (hours * ticksPerHour);

    let minutes = ticks / ticksPerMinute;
    minutes = Math.floor(minutes);

    ticks -= (minutes * ticksPerMinute);

    if (minutes < 10 && hours) {
        minutes = (0).toLocaleString(globalize.getCurrentDateTimeLocale()) + minutes.toLocaleString(globalize.getCurrentDateTimeLocale());
    } else {
        minutes = minutes.toLocaleString(globalize.getCurrentDateTimeLocale());
    }
    parts.push(minutes);

    let seconds = ticks / ticksPerSecond;
    seconds = Math.floor(seconds);

    if (seconds < 10) {
        seconds = (0).toLocaleString(globalize.getCurrentDateTimeLocale()) + seconds.toLocaleString(globalize.getCurrentDateTimeLocale());
    } else {
        seconds = seconds.toLocaleString(globalize.getCurrentDateTimeLocale());
    }
    parts.push(seconds);

    return parts.join(':');
}

const toLocaleTimeStringSupportsLocales = function () {
    try {
        // eslint-disable-next-line sonarjs/no-ignored-return
        new Date().toLocaleTimeString('i');
    } catch (e) {
        return e.name === 'RangeError';
    }
    return false;
}();

function getOptionList(options) {
    const list = [];

    for (const i in options) {
        list.push({
            name: i,
            value: options[i]
        });
    }

    return list;
}

export function toLocaleString(date, options) {
    if (!date) {
        throw new Error('date cannot be null');
    }

    options = options || {};

    if (toLocaleTimeStringSupportsLocales) {
        const currentLocale = globalize.getCurrentDateTimeLocale();

        if (currentLocale) {
            return date.toLocaleString(currentLocale, options);
        }
    }

    return date.toLocaleString();
}

export function toLocaleDateString(date, options) {
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

export function toLocaleTimeString(date, options) {
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

export function getDisplayDateTime(date) {
    if (!date) {
        throw new Error('date cannot be null');
    }

    if (typeof date === 'string') {
        try {
            date = parseISO8601Date(date, true);
        } catch {
            return date;
        }
    }

    return toLocaleString(date);
}

export function getDisplayTime(date) {
    if (!date) {
        throw new Error('date cannot be null');
    }

    if (typeof date === 'string') {
        try {
            date = parseISO8601Date(date, true);
        } catch {
            return date;
        }
    }

    if (toLocaleTimeStringSupportsLocales) {
        return toLocaleTimeString(date, {

            hour: 'numeric',
            minute: '2-digit'

        });
    }

    let time = toLocaleTimeString(date);

    const timeLower = time.toLowerCase();

    if (timeLower.indexOf('am') !== -1 || timeLower.indexOf('pm') !== -1) {
        let hour = date.getHours() % 12;
        const suffix = date.getHours() > 11 ? 'pm' : 'am';
        if (!hour) {
            hour = 12;
        }
        let minutes = date.getMinutes();

        if (minutes < 10) {
            minutes = '0' + minutes;
        }

        minutes = ':' + minutes;
        time = hour + minutes + suffix;
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

export function isRelativeDay(date, offsetInDays) {
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
    }
};

