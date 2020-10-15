/**
 * Module that manages a single WebRTC connection for SyncPlay.
 * @module components/syncPlay/core/webRTC/WebRTCPeer
 */

/**
 * Class that manages a single WebRTC connection.
 */
class WebRTCPeer {
    constructor(syncPlayManager, sessionId, isHost = false) {
        this.manager = syncPlayManager;
        this.webRTCCore = syncPlayManager.getWebRTCCore();
        this.sessionId = sessionId;
        this.isHost = isHost;
        this.peerConnection = null;
        this.iceCandidates = [];
    }

    /**
     * Creates a new connection with the peer. Sends offers if this peer is the host.
     */
    async open() {
        this.initPeerConnection();
        if (this.isHost) {
            await this.sendOffer();
        }
    }

    /**
     * Closes the active connection.
     */
    close() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
    }

    /**
     * Initializes a new WebRTC connection with the peer. Previous connection gets closed if active.
     */
    initPeerConnection() {
        this.close();

        const apiClient = this.manager.getApiClient();

        const configuration = {
            iceServers: []
        };
        this.peerConnection = new RTCPeerConnection(configuration);
        if (this.isHost) {
            console.debug(`SyncPlay WebRTC initPeerConnection: peer ${this.sessionId} is our guest, creating data channel.`);
            const channel = this.peerConnection.createDataChannel('channel');
            this.setDataChannel(channel);
        } else {
            console.debug(`SyncPlay WebRTC initPeerConnection: peer ${this.sessionId} is our host, waiting for data channel.`);
        }

        this.peerConnection.addEventListener('icecandidate', (event) => {
            if (event.candidate) {
                apiClient.requestSyncPlayWebRTC({
                    To: this.sessionId,
                    ICECandidate: JSON.stringify(event.candidate)
                });
            }
        });

        this.peerConnection.addEventListener('connectionstatechange', (event) => {
            if (this.peerConnection.connectionState === 'connected') {
                console.log(`SyncPlay WebRTC: connected with peer ${this.sessionId}!`);
            } else {
                console.debug(`SyncPlay WebRTC: connection state changed with peer ${this.sessionId}:`, this.peerConnection.connectionState);
            }
        });

        this.peerConnection.addEventListener('datachannel', (event) => {
            console.debug(`SyncPlay WebRTC initPeerConnection: new data channel received from peer ${this.sessionId}.`);
            this.setDataChannel(event.channel);
        });
    }

    /**
     * Sets the given data channel as the active one.
     * @param {RTCDataChannel} channel The data channel.
     */
    setDataChannel(channel) {
        this.dataChannel = channel;

        this.dataChannel.addEventListener('open', (event) => {
            console.log(`SyncPlay WebRTC: data channel is open with peer ${this.sessionId}!`, event);
            this.webRTCCore.onPeerConnected(this.sessionId);
        });

        this.dataChannel.addEventListener('message', (event) => {
            const messageReceivedAt = new Date();
            if (event.data && typeof event.data === 'string') {
                try {
                    const message = JSON.parse(event.data);
                    console.debug(`SyncPlay WebRTC: peer ${this.sessionId} sent a message:`, message);
                    this.webRTCCore.onPeerMessage(this.sessionId, message, messageReceivedAt);
                } catch (error) {
                    console.error(`SyncPlay WebRTC: error while loading message from peer ${this.sessionId}:`, error, event.data);
                }
            } else if (event.data) {
                console.warn(`SyncPlay WebRTC: unknown message from peer ${this.sessionId}:`, event.data);
            }
        });

        this.dataChannel.addEventListener('close', (event) => {
            console.debug(`SyncPlay WebRTC: data channel for peer ${this.sessionId} has been closed.`, event);
            this.webRTCCore.onPeerDisconnected(this.sessionId);
        });
    }

    /**
     * Sends an SDP offer to the peer. The server is employed for the signaling process.
     */
    async sendOffer() {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        const apiClient = this.manager.getApiClient();
        apiClient.requestSyncPlayWebRTC({
            To: this.sessionId,
            Offer: JSON.stringify(offer)
        });
    }

    /**
     * Sends an SDP answer to the peer. The server is employed for the signaling process.
     */
    async sendAnswer() {
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        const apiClient = this.manager.getApiClient();
        apiClient.requestSyncPlayWebRTC({
            To: this.sessionId,
            Answer: JSON.stringify(answer)
        });
    }

    /**
     * Handles a new ICE candidate.
     * @param {RTCIceCandidate} iceCandidate The ICE candidate.
     */
    async onRemoteICECandidate(iceCandidate) {
        if (!this.peerConnection || !this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
            this.iceCandidates.push(iceCandidate);
        } else {
            await this.peerConnection.addIceCandidate(iceCandidate);
        }
    }

    /**
     * Handles queued ICE candidates.
     */
    async setICECandidatesQueue() {
        for (const iceCandidate of this.iceCandidates) {
            await this.peerConnection.addIceCandidate(iceCandidate);
        }
        this.iceCandidates = [];
    }

    /**
     * Handles a signaling message received from the server.
     * @param {Object} apiClient The ApiClient.
     * @param {Object} message The new message.
     */
    async onSignalingMessage(apiClient, message) {
        if (message.Answer) {
            const answer = JSON.parse(message.Answer);
            console.debug(`SyncPlay WebRTC onSignalingMessage: received answer from peer ${this.sessionId}.`, answer);

            const remoteDesc = new RTCSessionDescription(answer);
            await this.peerConnection.setRemoteDescription(remoteDesc);
        } else if (message.Offer) {
            const offer = JSON.parse(message.Offer);
            console.debug(`SyncPlay WebRTC onSignalingMessage: received offer from peer ${this.sessionId}.`, offer);

            const remoteDesc = new RTCSessionDescription(offer);
            await this.peerConnection.setRemoteDescription(remoteDesc);
            await this.setICECandidatesQueue();
            await this.sendAnswer();
        } else if (message.ICECandidate) {
            const iceCandidate = JSON.parse(message.ICECandidate);
            console.debug(`SyncPlay WebRTC onSignalingMessage: received ICECandidate from peer ${this.sessionId}.`, iceCandidate);

            try {
                await this.onRemoteICECandidate(iceCandidate);
            } catch (error) {
                console.error(`SyncPlay WebRTC onSignalingMessage: error adding ICECandidate from peer ${this.sessionId}.`, error);
            }
        }
    }

    /**
     * Sends a message to the peer using the WebRTC data channel, if available.
     * @param {Object} message The message.
     */
    sendMessage(message) {
        if (this.dataChannel) {
            this.dataChannel.send(JSON.stringify(message));
        } else {
            console.error(`SyncPlay WebRTC sendMessage: peer ${this.sessionId} has no data channel open!`);
            // TODO: queue message or throw exception?
        }
    }
}

export default WebRTCPeer;
