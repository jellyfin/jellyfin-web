/**
 * Checks if two string are equal ignoring case.
 * @param str1 The first string.
 * @param str2 The second string.
 * @returns True if the strings are equal ignoring case.
 */
export const equalsIgnoreCase = (str1 = '', str2 = ''): boolean =>
    str1.toLowerCase() === str2.toLowerCase();

/**
 * Checks if a string is empty or contains only whitespace.
 * @param {string} value The string to test.
 * @returns {boolean} True if the string is blank.
 */
export function isBlank(value: string | undefined | null): boolean {
    const trimmed = value?.trim() ?? '';
    return trimmed.length === 0;
}

/**
 * Gets the value of a string as boolean.
 * @param {string} name The value as a string.
 * @param {boolean} defaultValue The default value if the string is invalid.
 * @returns {boolean} The value.
 */
export function toBoolean(value: string | undefined | null, defaultValue = false): boolean {
    if (value !== 'true' && value !== 'false') {
        return defaultValue;
    } else {
        return value !== 'false';
    }
}

/**
 * Gets the value of a string as float number.
 * @param {string} value The value as a string.
 * @param {number} defaultValue The default value if the string is invalid.
 * @returns {number} The value.
 */
export function toFloat(value: string | null | undefined, defaultValue = 0): number {
    if (value == null || value === '') return defaultValue;

    const number = parseFloat(value);
    if (Number.isNaN(number)) return defaultValue;

    return number;
}
