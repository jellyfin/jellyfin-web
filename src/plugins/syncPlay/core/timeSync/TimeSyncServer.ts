/**
 * Module that manages time syncing with server.
 * @module components/syncPlay/core/timeSync/TimeSyncServer
 */

import TimeSync from './TimeSync';

/**
 * Class that manages time syncing with server.
 */
class TimeSyncServer extends TimeSync {
    manager;
    /**
     * Makes a ping request to the server.
     */
    requestPing() {
        const apiClient = this.manager.getApiClient();
        const requestSent = new Date();
        let responseReceived;
        return apiClient.getServerTime().then((response) => {
            responseReceived = new Date();
            return response.json();
        }).then((data) => {
            const requestReceived = new Date(data.RequestReceptionTime);
            const responseSent = new Date(data.ResponseTransmissionTime);
            return Promise.resolve({
                requestSent: requestSent,
                requestReceived: requestReceived,
                responseSent: responseSent,
                responseReceived: responseReceived
            });
        });
    }
}

export default TimeSyncServer;
