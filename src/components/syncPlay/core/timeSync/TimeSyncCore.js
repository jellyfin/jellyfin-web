/**
 * Module that manages time syncing with several devices.
 * @module components/syncPlay/core/timeSync/TimeSyncCore
 */

import { Events } from 'jellyfin-apiclient';
import TimeSyncServer from './TimeSyncServer';

/**
 * Class that manages time syncing with several devices.
 */
class TimeSyncCore {
    constructor() {
        this.manager = null;
        this.timeSyncServer = null;
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
        return this.timeSyncServer.remoteDateToLocal(remote);
    }

    /**
     * Converts local time to server time.
     * @param {Date} local The time to convert.
     * @returns {Date} Server time.
     */
    localDateToRemote(local) {
        return this.timeSyncServer.localDateToRemote(local);
    }

    /**
     * Gets time offset that should be used for time syncing, in milliseconds.
     * @returns {number} The time offset.
     */
    getTimeOffset() {
        return this.timeSyncServer.getTimeOffset();
    }
}

export default TimeSyncCore;
