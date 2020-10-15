/**
 * Module that manages time syncing with several devices.
 * @module components/syncPlay/core/timeSync/TimeSyncCore
 */

import { Events } from 'jellyfin-apiclient';
import Settings from '../Settings';
import TimeSyncServer from './TimeSyncServer';
import TimeSyncPeer from './TimeSyncPeer';

/**
 * Class that manages time syncing with several devices.
 */
class TimeSyncCore {
    constructor() {
        this.manager = null;
        this.webRTCCore = null;
        this.timeSyncServer = null;
        this.peers = {};
        this.peerIds = [];
        this.listeningPeers = [];

        this.timeSyncDeviceId = Settings.get('timeSyncDevice');
        this.extraTimeOffset = Settings.getFloat('extraTimeOffset', 0.0);
    }

    /**
     * Initializes the core.
     * @param {SyncPlayManager} syncPlayManager The SyncPlay manager.
     */
    init(syncPlayManager) {
        this.manager = syncPlayManager;
        this.webRTCCore = syncPlayManager.getWebRTCCore();
        this.timeSyncServer = new TimeSyncServer(syncPlayManager);

        Events.on(this.webRTCCore, 'peer-helo', (event, peerId) => {
            this.onPeerConnected(peerId);
        });

        Events.on(this.webRTCCore, 'peer-bye', (event, peerId) => {
            this.onPeerDisconnected(peerId);
        });

        Events.on(this.webRTCCore, 'peer-message', (event, peerId, message, receivedAt) => {
            this.onPeerMessage(peerId, message, receivedAt);
        });

        Events.on(this.manager, 'playback-diff', (event, playbackDiff) => {
            this.onPlaybackDiff(playbackDiff);
        });

        Events.on(this.manager, 'unpause', (event) => {
            this.onPlaybackDiff(0, true);
        });

        Events.on(this.manager, 'pause', (event) => {
            this.onPlaybackDiff(0, true);
        });

        Events.on(this.timeSyncServer, 'update', (event, error, timeOffset, ping) => {
            if (error) {
                console.debug('SyncPlay TimeSyncCore: time sync with server issue:', error);
                return;
            }

            // Notify peers.
            this.webRTCCore.broadcastMessage({
                type: 'time-sync-server-update',
                data: {
                    timeOffset: timeOffset,
                    ping: ping
                }
            });

            Events.trigger(this, 'time-sync-server-update', [timeOffset, ping]);
        });

        Events.on(Settings, 'timeSyncDevice', (event, value, oldValue) => {
            this.setActiveDevice(value);
        });

        Events.on(Settings, 'extraTimeOffset', (event, value, oldValue) => {
            this.extraTimeOffset = Settings.getFloat('extraTimeOffset', 0.0);
        });

        Events.on(Settings, 'webRTCDisplayName', (event, value, oldValue) => {
            // Broadcast display name of this device.
            const message = {
                type: 'display-name',
                data: {
                    displayName: value || ''
                }
            };
            this.webRTCCore.broadcastMessage(message);
        });
    }

    /**
     * Forces time update with server.
     */
    forceUpdate() {
        this.timeSyncServer.forceUpdate();
    }

    /**
     * Handles a new connected peer.
     * @param {string} peerId The id of the peer.
     */
    onPeerConnected(peerId) {
        let peer = this.peers[peerId];
        if (!peer) {
            peer = new TimeSyncPeer(this.manager, peerId);
            this.peers[peerId] = peer;
            this.peerIds.push(peerId);
        }

        peer.onConnected();
        Events.trigger(this, 'refresh-devices');

        // Register for playback diff updates.
        if (peerId === this.timeSyncDeviceId) {
            peer.requestUpdates(true);
        }
    }

    /**
     * Handles a disconnected peer.
     * @param {string} peerId The id of the peer.
     */
    onPeerDisconnected(peerId) {
        const peer = this.peers[peerId];
        if (peer) {
            peer.onDisconnected();
            this.peers[peerId] = null;
            const index = this.peerIds.indexOf(peerId);
            this.peerIds.splice(index, 1);

            // Unregister peer from playback diff updates.
            this.onPeerUpdatesRequest(peerId, {
                enable: false
            });

            Events.trigger(this, 'refresh-devices');
        }
    }

    /**
     * Handles a message from a peer.
     * @param {string} peerId The id of the peer.
     * @param {Object} message The received message.
     * @param {Date} receivedAt When the message has been received.
     */
    onPeerMessage(peerId, message, receivedAt) {
        const peer = this.peers[peerId];
        if (!peer) {
            console.error(`SyncPlay TimeSyncCore onPeerMessage: ignoring message from unknown peer ${peerId}.`, message);
            return;
        }

        let triggerRefresh = true;

        switch (message.type) {
            case 'display-name':
                peer.onDisplayName(message.data);
                break;
            case 'time-sync-server-update':
                peer.onTimeSyncServerUpdate(message.data);
                break;
            case 'ping-request':
                peer.onPingRequest(message.data, receivedAt);
                triggerRefresh = false;
                break;
            case 'ping-response':
                peer.onPingResponse(message.data, receivedAt);
                break;
            case 'playback-diff':
                peer.onPlaybackDiff(message.data);
                triggerRefresh = false;
                break;
            case 'playback-updates-request':
                this.onPeerUpdatesRequest(peerId, message.data);
                triggerRefresh = false;
                break;
            default:
                console.debug(`SyncPlay TimeSyncCore onPeerMessage: ignoring message from ${peerId}.`, message);
                triggerRefresh = false;
                break;
        }

        if (triggerRefresh) {
            Events.trigger(this, 'refresh-devices');
        }
    }

    /**
     * Handles a peer requesting to subscribe to playback updates.
     * @param {string} peerId The id of the peer.
     * @param {Object} data The request data.
     */
    onPeerUpdatesRequest(peerId, data) {
        const { enable } = data;
        const index = this.listeningPeers.indexOf(peerId);
        if (enable && index === -1) {
            this.listeningPeers.push(peerId);
        } else if (!enable && index !== -1) {
            this.listeningPeers.splice(index, 1);
        }

        console.debug(`SyncPlay PlaybackSyncCore onPeerUpdatesRequest: peer ${peerId} is ${enable ? '' : 'not '}listening.`, this.listeningPeers);
    }

    /**
     * Notifies peers of playback diff update.
     * @param {number} playbackDiff The new playback diff.
     * @param {boolean} reset Whether the peers should drop old diffs.
     */
    onPlaybackDiff(playbackDiff, reset = false) {
        const message = {
            type: 'playback-diff',
            data: {
                playbackDiff: playbackDiff,
                reset: reset
            }
        };

        this.listeningPeers.forEach(peerId => {
            this.webRTCCore.sendMessage(peerId, message);
        });
    }

    /**
     * Gets the list of available devices for time sync.
     * @returns {Array} The list of devices.
     */
    getDevices() {
        const devices = this.peerIds.map(peerId => {
            return this.peers[peerId];
        }).map(peer => {
            return {
                type: 'peer',
                id: peer.getPeerId(),
                name: peer.getDisplayName(),
                timeOffset: peer.getTimeOffset(),
                ping: peer.getPing(),
                peerTimeOffset: peer.getPeerTimeOffset(),
                peerPing: peer.getPeerPing()
            };
        });

        devices.unshift({
            type: 'server',
            id: 'server',
            name: 'Server',
            timeOffset: this.timeSyncServer.getTimeOffset(),
            ping: this.timeSyncServer.getPing(),
            peerTimeOffset: 0,
            peerPing: 0
        });

        return devices;
    }

    /**
     * Sets the active device selected for time sync if available. Default value is 'server'.
     * @param {string} deviceId The id of the device.
     */
    setActiveDevice(deviceId) {
        const oldActivePeer = this.getPeerById(this.timeSyncDeviceId);
        const isPeer = this.peerIds.indexOf(deviceId) !== -1;
        if (isPeer) {
            this.timeSyncDeviceId = deviceId;
        } else {
            this.timeSyncDeviceId = 'server';
        }

        if (oldActivePeer) {
            oldActivePeer.requestUpdates(false);
        }

        const newActivePeer = this.getPeerById(this.timeSyncDeviceId);
        if (newActivePeer) {
            newActivePeer.requestUpdates(true);
        }

        console.debug(`SyncPlay TimeSyncCore setActiveDevice: ${this.timeSyncDeviceId} with ${this.getTimeOffset()} ms of total time offset.`);
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
        let name = 'Server';
        const peer = this.getPeerById(this.timeSyncDeviceId);
        if (peer) {
            name = peer.getDisplayName();
        }

        return name;
    }

    /**
     * Gets a peer by its peer id.
     * @param {string} peerId The id of the peer.
     * @returns {TimeSyncPeer} The peer if found, null otherwise.
     */
    getPeerById(peerId) {
        return this.peers[peerId];
    }

    /**
     * Converts server time to local time. Local time can be affected by peer time syncing.
     * @param {Date} remote The time to convert.
     * @returns {Date} Local time.
     */
    remoteDateToLocal(remote) {
        let date = null;
        if (this.timeSyncDeviceId !== 'server') {
            const peer = this.getPeerById(this.timeSyncDeviceId);
            if (peer) {
                const peerDate = peer.serverDateToPeer(remote);
                date = peer.remoteDateToLocal(peerDate);
            }
        }

        if (!date) {
            date = this.timeSyncServer.remoteDateToLocal(remote);
        }

        return this.offsetDate(date, -this.extraTimeOffset);
    }

    /**
     * Converts local time to server time. Local time can be affected by peer time syncing.
     * @param {Date} local The time to convert.
     * @returns {Date} Server time.
     */
    localDateToRemote(local) {
        let date = null;
        if (this.timeSyncDeviceId !== 'server') {
            const peer = this.getPeerById(this.timeSyncDeviceId);
            if (peer) {
                const peerDate = peer.localDateToRemote(local);
                date = peer.peerDateToServer(peerDate);
            }
        }

        if (!date) {
            date = this.timeSyncServer.localDateToRemote(local);
        }

        return this.offsetDate(date, this.extraTimeOffset);
    }

    /**
     * Gets time offset that should be used for time syncing, in milliseconds. Takes into account server and active device selected for syncing.
     * @returns {number} The time offset.
     */
    getTimeOffset() {
        const peer = this.getPeerById(this.timeSyncDeviceId);
        if (peer) {
            return peer.getTimeOffset() + peer.getPeerTimeOffset() + this.extraTimeOffset;
        } else {
            return this.timeSyncServer.getTimeOffset() + this.extraTimeOffset;
        }
    }

    /**
     * Gets the playback diff that should be used to offset local playback, in milliseconds.
     * @returns {number} The time offset.
     */
    getPlaybackDiff() {
        const peer = this.getPeerById(this.timeSyncDeviceId);
        if (peer) {
            return peer.getPeerPlaybackDiff();
        } else {
            return 0;
        }
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
