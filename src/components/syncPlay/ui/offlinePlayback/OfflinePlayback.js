/**
 * Module that manages files for offline playback.
 * @module components/syncPlay/ui/offlinePlayback/OfflinePlayback
 */

import { Events } from 'jellyfin-apiclient';
import SyncPlay from '../../core';
import FilePicker from './FilePicker';

/**
 * Class that manages files for offline playback.
 */
class OfflinePlayback {
    constructor() {
        this.offlineFiles = {};

        Events.on(SyncPlay.Settings, 'enableOfflinePlayback', () => {
            const enabled = SyncPlay.Settings.getBool('enableOfflinePlayback');
            if (!enabled) {
                this.reset();
            }
        });
    }

    /**
     * Reset available offline files.
     */
    reset() {
        this.offlineFiles = {};
    }

    /**
     * Set available offline files.
     * @param {Object} files The map of item identifiers and related file.
     */
    setOfflineFiles(files) {
        this.offlineFiles = files || {};
    }

    /**
     * Get available offline files.
     * @returns {Object} The map of item identifiers and related file.
     */
    getOfflineFiles() {
        return this.offlineFiles;
    }

    /**
     * Checks if a given item is available offline.
     * @param {*} item
     * @returns {boolean} _true_ if item is available offline, _false_ otherwise.
     */
    isItemAvailableOffline(item) {
        return this.offlineFiles[item.Id] !== undefined;
    }

    /**
     * Checks if all given items are available offline.
     * @param {*} items The items to check for.
     * @returns {boolean} _true_ if items are available offline, _false_ otherwise.
     */
    isReadyToPlay(items) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!this.isItemAvailableOffline(item)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Checks if all given items are available offline, otherwise a dialog is shown.
     * @param {Array} items The items to check for.
     * @returns {Promise} A promise that gets resolved when the required files have been opened.
     */
    checkOfflineItems(items) {
        if (!this.isReadyToPlay(items)) {
            const filePicker = new FilePicker();
            return filePicker.show(items, this.getOfflineFiles()).then((files) => {
                this.setOfflineFiles(files);
            });
        } else {
            return Promise.resolve();
        }
    }

    /**
     * Converts an item to offline playback by appending the 'OfflineUrl' property to it.
     * @param {Object} item The item to convert.
     * @returns {Object} The offline item.
     */
    toOffline(item) {
        if (!item || !item.Id) {
            return item;
        } else {
            if (this.isItemAvailableOffline(item)) {
                const offlineFile = this.offlineFiles[item.Id];
                item.OfflineUrl = URL.createObjectURL(offlineFile);
                console.debug('OfflinePlayback toOffline: item available offline', item);
                return item;
            } else {
                console.warn('OfflinePlayback toOffline: item not available offline', item);
                return item;
            }
        }
    }
}

/** OfflinePlayback singleton. */
export default new OfflinePlayback();
