function toLocaleStringSupportsOptions() {
    return !!(typeof Intl === 'object' && Intl && typeof Intl.NumberFormat === 'function');
}

/**
 * Generates a random integer in a given range.
 * @param {number} min - Minimum of the range.
 * @param {number} max - Maximum of the range.
 * @returns {number} Randomly generated number.
 */
export function randomInt(min: number, max: number): number {
    // eslint-disable-next-line sonarjs/pseudo-random
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Gets the value of a number formatted as a string.
 * @param {number} value The value as a number.
 * @param {string} locale The locale to use for formatting (i.e. en-us).
 * @returns {string} The value formatted as a string.
 */
export function toDecimalString(value: number, locale: string): string {
    if (toLocaleStringSupportsOptions()) {
        return value.toLocaleString(locale);
    }

    return value.toString();
}

/**
 * Gets the value of a number formatted as a perentage.
 * @param {number} value The value as a number.
 * @param {string} locale The locale to use for formatting (i.e. en-us).
 * @returns {string} The value formatted as a percentage.
 */
export function toPercentString(value: number | null | undefined, locale: string): string {
    if (value == null) {
        return '';
    }

    if (toLocaleStringSupportsOptions()) {
        return value.toLocaleString(locale, {
            style: 'percent',
            maximumFractionDigits: 0
        });
    }

    return `${Math.round(value * 100)}%`;
}

/**
 * Gets decimal count of a Number.
 * @param {number} value Number.
 * @returns {number} Decimal count of a Number.
 */
export function decimalCount(value: number): number {
    if (Number.isInteger(value)) return 0;

    const arr = value.toString().split('.');

    return arr[1].length;
}
