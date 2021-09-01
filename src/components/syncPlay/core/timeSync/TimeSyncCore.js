/**
 * Module that manages time syncing with several devices.
 * @module components/syncPlay/core/timeSync/TimeSyncCore
 */

import { Events } from 'jellyfin-apiclient';
import Settings from '../Settings';
import TimeSyncServer from './TimeSyncServer';

/**
 * Class that manages time syncing with several devices.
 */
class TimeSyncCore {
    constructor() {
        this.manager = null;
        this.timeSyncServer = null;

        this.timeSyncDeviceId = Settings.get('timeSyncDevice') || 'server';
        this.extraTimeOffset = Settings.getFloat('extraTimeOffset', 0.0);
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

        Events.on(Settings, 'extraTimeOffset', () => {
            this.extraTimeOffset = Settings.getFloat('extraTimeOffset', 0.0);
        });
    }

    /**
     * Forces time update with server.
     */
    forceUpdate() {
        this.timeSyncServer.forceUpdate();
    }

    /**
     * Gets the list of available devices for time sync.
     * @returns {Array} The list of devices.
     */
    getDevices() {
        const devices = [{
            type: 'server',
            id: 'server',
            name: 'Server',
            timeOffset: this.timeSyncServer.getTimeOffset(),
            ping: this.timeSyncServer.getPing(),
            peerTimeOffset: 0,
            peerPing: 0
        }];

        return devices;
    }

    /**
     * Gets the identifier of the selected device for time sync. Default value is 'server'.
     * @returns {string} The identifier.
     */
    getActiveDevice() {
        return this.timeSyncDeviceId;
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
        return this.offsetDate(date, -this.extraTimeOffset);
    }

    /**
     * Converts local time to server time.
     * @param {Date} local The time to convert.
     * @returns {Date} Server time.
     */
    localDateToRemote(local) {
        const date = this.timeSyncServer.localDateToRemote(local);
        return this.offsetDate(date, this.extraTimeOffset);
    }

    /**
     * Gets time offset that should be used for time syncing, in milliseconds. Takes into account server and active device selected for syncing.
     * @returns {number} The time offset.
     */
    getTimeOffset() {
        return this.timeSyncServer.getTimeOffset() + this.extraTimeOffset;
    }

    /**
     * Gets the playback diff that should be used to offset local playback, in milliseconds.
     * @returns {number} The time offset.
     */
    getPlaybackDiff() {
        // TODO: this will use playback data from WebRTC peers.
        return 0;
    }

    /**
     * Offsets a given date by a given ammount of milliseconds.
     * @param {Date} date The date.
     * @param {number} offset The offset, in milliseconds.
     * @returns {Date} The offset date.
     */
    offsetDate(date, offset) {
        return new Date(date.getTime() + offset);
    }
}

export default TimeSyncCore;
