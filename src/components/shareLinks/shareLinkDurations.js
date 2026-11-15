/**
 * Expiration shortcuts offered by the share-link dialog.
 *
 * The dialog only ever sends `DurationSeconds`; there is no mandatory hour-based
 * custom entry. Order here is the order the buttons are rendered in, and the
 * entry marked `isDefault` is preselected when the dialog opens.
 *
 * @type {ReadonlyArray<{ labelKey: string, durationSeconds: number, isDefault: boolean }>}
 */
export const DURATION_PRESETS = Object.freeze([
    { labelKey: 'ShareLinkDuration2Hours', durationSeconds: 7200, isDefault: false },
    { labelKey: 'ShareLinkDuration24Hours', durationSeconds: 86400, isDefault: true },
    { labelKey: 'ShareLinkDuration7Days', durationSeconds: 604800, isDefault: false }
]);

/**
 * Returns the preset that should be selected when the dialog opens.
 * @returns {{ labelKey: string, durationSeconds: number, isDefault: boolean }}
 */
export function getDefaultPreset() {
    return DURATION_PRESETS.find(preset => preset.isDefault) ?? DURATION_PRESETS[0];
}

/**
 * Formats the absolute time a link created now would expire.
 * @param {number} durationSeconds - Link lifetime in seconds.
 * @param {number} [nowMs] - Current time in ms, injectable for tests.
 * @returns {string} A locale-formatted date/time string.
 */
export function formatExpiration(durationSeconds, nowMs = Date.now()) {
    return new Date(nowMs + (durationSeconds * 1000)).toLocaleString();
}
