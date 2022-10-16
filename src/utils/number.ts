function toLocaleStringSupportsOptions() {
    return !!(typeof Intl === 'object' && Intl && typeof Intl.NumberFormat === 'function');
}

/**
 * Gets the value of a number formatted as a perentage.
 * @param {number} value The value as a number.
 * @returns {string} The value formatted as a percentage.
 */
export function toPercent(value: number | null | undefined, locale: string): string {
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
