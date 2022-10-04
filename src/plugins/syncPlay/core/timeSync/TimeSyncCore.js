/**
 * Module that manages time syncing with several devices.
 * @module components/syncPlay/core/timeSync/TimeSyncCore
 */

import { Events } from 'jellyfin-apiclient';
import appSettings from '../../../../scripts/settings/appSettings';
import { toFloat } from '../../../../utils/string.ts';
import { getSetting } from '../Settings';
import TimeSyncServer from './TimeSyncServer';

/**
 * Utility function to offset a given date by a given amount of milliseconds.
 * @param {Date} date The date.
 * @param {number} offset The offset, in milliseconds.
 * @returns {Date} The offset date.
 */
function offsetDate(date, offset) {
    return new Date(date.getTime() + offset);
}

/**
 * Class that manages time syncing with several devices.
 */
class TimeSyncCore {
    constructor() {
        this.manager = null;
        this.timeSyncServer = null;

        this.timeSyncDeviceId = getSetting('timeSyncDevice') || 'server';
        this.extraTimeOffset = toFloat(getSetting('extraTimeOffset'), 0.0);
    }

    /**
     * Initializes the core.
     * @param {SyncPlayManager} syncPlayManager The SyncPlay manager.
     */
    init(syncPlayManager) {
        this.manager = syncPlayManager;
        this.timeSyncServer = new TimeSyncServer(syncPlayManager);

        Events.on(this.timeSyncServer, 'update', (event, error, timeOffset, ping) => {
            if (error) {
                console.debug('SyncPlay TimeSyncCore: time sync with server issue:', error);
                return;
            }

            Events.trigger(this, 'time-sync-server-update', [timeOffset, ping]);
        });

        Events.on(appSettings, 'change', (e, name) => {
            if (name === 'extraTimeOffset') {
                this.extraTimeOffset = toFloat(getSetting('extraTimeOffset'), 0.0);
            }
        });
    }

    /**
     * Forces time update with server.
     */
    forceUpdate() {
        this.timeSyncServer.forceUpdate();
    }

    /**
     * Gets the display name of the selected device for time sync.
     * @returns {string} The display name.
     */
    getActiveDeviceName() {
        return 'Server';
    }

    /**
     * Converts server time to local time.
     * @param {Date} remote The time to convert.
     * @returns {Date} Local time.
     */
    remoteDateToLocal(remote) {
        const date = this.timeSyncServer.remoteDateToLocal(remote);
        return offsetDate(date, -this.extraTimeOffset);
    }

    /**
     * Converts local time to server time.
     * @param {Date} local The time to convert.
     * @returns {Date} Server time.
     */
    localDateToRemote(local) {
        const date = this.timeSyncServer.localDateToRemote(local);
        return offsetDate(date, this.extraTimeOffset);
    }

    /**
     * Gets time offset that should be used for time syncing, in milliseconds. Takes into account server and active device selected for syncing.
     * @returns {number} The time offset.
     */
    getTimeOffset() {
        return this.timeSyncServer.getTimeOffset() + this.extraTimeOffset;
    }
}

export default TimeSyncCore;
