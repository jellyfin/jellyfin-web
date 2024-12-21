/**
 * Checks if a string is empty or contains only whitespace.
 * @param {string} value The string to test.
 * @returns {boolean} True if the string is blank.
 */
export function isBlank(value: string | undefined | null) {
    return !value?.trim().length;
}

/**
 * Gets the value of a string as boolean.
 * @param {string} name The value as a string.
 * @param {boolean} defaultValue The default value if the string is invalid.
 * @returns {boolean} The value.
 */
export function toBoolean(value: string | undefined | null, defaultValue = false) {
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
export function toFloat(value: string | null | undefined, defaultValue = 0) {
    if (!value) return defaultValue;

    const number = parseFloat(value);
    if (isNaN(number)) return defaultValue;

    return number;
}
