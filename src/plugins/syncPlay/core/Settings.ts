/**
 * Module that manages SyncPlay settings.
 * @module components/syncPlay/core/Settings
 */
import appSettings from '../../../scripts/settings/appSettings';

/**
 * Prefix used when saving SyncPlay settings.
 */
const PREFIX = 'syncPlay';

/**
 * Gets the value of a setting.
 * @param {string} name The name of the setting.
 * @returns {string} The value.
 */
export function getSetting(name: string) {
    return appSettings.get(name, PREFIX);
}

/**
 * Sets the value of a setting. Triggers an update if the new value differs from the old one.
 * @param {string} name The name of the setting.
 * @param {Object} value The value of the setting.
 */
export function setSetting(name: string, value: any) {
    return appSettings.set(name, value, PREFIX);
}
