/**
 * Module that manages time syncing with a peer.
 * @module components/syncPlay/core/timeSync/TimeSyncPeer
 */

import Settings from '../Settings';
import TimeSync from './TimeSync';

/**
 * Playback diff estimation.
 */
const NumberOfTrackedDiffs = 40;
const DiffsSubarrayLength = 25;

/**
 * Class that manages time syncing with a peer.
 */
class TimeSyncPeer extends TimeSync {
    constructor(syncPlayManager, peerId) {
        super(syncPlayManager);
        this.webRTCCore = syncPlayManager.getWebRTCCore();
        this.peerId = peerId;
        this.displayName = '';
        this.peerTimeOffset = 0; // Peer's time offset with server.
        this.peerPing = 0; // Peer's ping with server.
        this.peerPlaybackDiff = 0; // Peer's playback diff average.
        this.diffs = []; // List of peer's playback diffs over time.
    }

    /**
     * Sends a ping request to the peer.
     */
    requestPing() {
        return new Promise((resolve, reject) => {
            this.resolvePingRequest = resolve;
            this.rejectPingRequest = reject;

            const message = {
                type: 'ping-request',
                data: {
                    requestSent: new Date()
                }
            };
            this.webRTCCore.sendMessage(this.peerId, message);
        });
    }

    /**
     * Toggle playback updates from peer.
     */
    requestUpdates(enable) {
        const message = {
            type: 'playback-updates-request',
            data: {
                enable: enable
            }
        };
        this.webRTCCore.sendMessage(this.peerId, message);
    }

    /**
     * Gets the id of the managed peer.
     * @returns {string} The id.
     */
    getPeerId() {
        return this.peerId;
    }

    /**
     * Gets the display name for this peer.
     * @returns {string} The display name.
     */
    getDisplayName() {
        return (this.displayName && this.displayName !== '') ? this.displayName : this.peerId.substring(0, 7);
    }

    /**
     * Gets the time offset between the peer and the server, in milliseconds.
     * @returns {number} The time offset.
     */
    getPeerTimeOffset() {
        return this.peerTimeOffset;
    }

    /**
     * Gets the ping between the peer and the server, in milliseconds.
     * @returns {number} The ping.
     */
    getPeerPing() {
        return this.peerPing;
    }

    /**
     * Gets the playback diff of the peer, in milliseconds.
     * @returns {number} The playback diff.
     */
    getPeerPlaybackDiff() {
        return this.peerPlaybackDiff;
    }

    /**
     * Resets promise callbacks used for ping request.
     */
    resetCallbacks() {
        this.resolvePingRequest = null;
        this.rejectPingRequest = null;
    }

    /**
     * Handles peer connection established event.
     */
    onConnected() {
        this.stopPing();

        if (typeof this.rejectPingRequest === 'function') {
            this.rejectPingRequest('Peer disconnected.');
            this.resetCallbacks();
        }

        this.startPing();

        // Send display name of this device.
        const message = {
            type: 'display-name',
            data: {
                displayName: Settings.get('webRTCDisplayName') || ''
            }
        };
        this.webRTCCore.sendMessage(this.peerId, message);
    }

    /**
     * Handles peer connection closed event.
     */
    onDisconnected() {
        this.stopPing();

        if (typeof this.rejectPingRequest === 'function') {
            this.rejectPingRequest('Peer disconnected.');
            this.resetCallbacks();
        }
    }

    /**
     * Handles display-name message from peer.
     * @param {Object} data The update data.
     */
    onDisplayName(data) {
        const { displayName } = data || {};
        if (!data || displayName === null) {
            console.error(`SyncPlay TimeSyncPeer onDisplayName: invalid display-name from ${this.peerId}.`, data);
        } else {
            this.displayName = displayName;
        }
    }

    /**
     * Handles ping-request message from peer.
     * @param {Object} data The request data.
     * @param {Date} receivedAt When the message has been received.
     */
    onPingRequest(data, receivedAt) {
        if (!data || !data.requestSent) {
            console.error(`SyncPlay TimeSyncPeer onPingRequest: invalid ping-request from ${this.peerId}.`, data);
        } else {
            const responsePing = {
                type: 'ping-response',
                data: {
                    requestSent: data.requestSent,
                    requestReceived: receivedAt,
                    responseSent: new Date()
                }
            };
            this.webRTCCore.sendMessage(this.peerId, responsePing);
        }
    }

    /**
     * Handles ping-response message from peer.
     * @param {Object} data The response data.
     * @param {Date} receivedAt When the message has been received.
     */
    onPingResponse(data, receivedAt) {
        const { requestSent, requestReceived, responseSent } = data || {};
        if (!data || !requestSent || !requestReceived || !responseSent) {
            console.error(`SyncPlay TimeSyncPeer onPingResponse: invalid ping-response from ${this.peerId}.`, data);
        } else {
            if (typeof this.resolvePingRequest === 'function') {
                this.resolvePingRequest({
                    requestSent: new Date(requestSent),
                    requestReceived: new Date(requestReceived),
                    responseSent: new Date(responseSent),
                    responseReceived: receivedAt
                });
                this.resetCallbacks();
            } else {
                console.warn(`SyncPlay TimeSyncPeer onPingResponse: missing promise to resolve for peer ${this.peerId}.`, data, receivedAt, this);
            }
        }
    }

    /**
     * Handles time-sync-server-update message from peer.
     * @param {Object} data The update data.
     */
    onTimeSyncServerUpdate(data) {
        const { timeOffset, ping } = data || {};
        if (!data || timeOffset === null || ping === null) {
            console.error(`SyncPlay TimeSyncPeer onTimeSyncServerUpdate: invalid time-sync-server-update from ${this.peerId}.`, data);
        } else {
            this.peerTimeOffset = timeOffset;
            this.peerPing = ping;
        }
    }

    /**
     * Handles playback-diff message from peer.
     * @param {Object} data The update data.
     */
    onPlaybackDiff(data) {
        const { playbackDiff, reset = false } = data || {};
        if (!data || playbackDiff === null) {
            console.error(`SyncPlay PlaybackSyncPeer onPlaybackDiff: invalid playback-diff from ${this.peerId}.`, data);
        } else {
            if (reset) {
                this.diffs = [];
                this.peerPlaybackDiff = 0;
            }

            this.diffs.push(playbackDiff);
            if (this.diffs.length > NumberOfTrackedDiffs) {
                this.diffs.shift();
            }

            // Compute average playback diff.
            const sortedMeasurements = this.diffs.slice(0);
            sortedMeasurements.sort((a, b) => a - b);

            let diffs = [];
            if (sortedMeasurements.length < DiffsSubarrayLength) {
                diffs = sortedMeasurements;
            } else {
                const range = Math.floor(DiffsSubarrayLength / 2);
                const center = Math.floor(sortedMeasurements.length / 2);
                const startIndex = center - range;
                const endIndex = center + range;
                diffs = sortedMeasurements.slice(startIndex, endIndex);
            }

            this.peerPlaybackDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;

            console.debug(`SyncPlay PlaybackSyncPeer onPlaybackDiff: ${this.peerId} average ${this.peerPlaybackDiff} ms.`, this.diffs);
        }
    }

    /**
     * Converts server time to peer's local time.
     * @param {Date} server The time to convert.
     * @returns {Date} Peer's local time.
     */
    serverDateToPeer(server) {
        return new Date(server.getTime() - this.getPeerTimeOffset());
    }

    /**
     * Converts peer's local time to server time.
     * @param {Date} peer The time to convert.
     * @returns {Date} Server time.
     */
    peerDateToServer(peer) {
        return new Date(peer.getTime() + this.getPeerTimeOffset());
    }
}

export default TimeSyncPeer;
