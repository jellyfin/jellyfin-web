/**
 * Module that manages time syncing with server.
 * @module components/syncPlay/timeSyncManager
 */

import events from 'events';
import connectionManager from 'connectionManager';

/**
 * Time estimation
 */
const NumberOfTrackedMeasurements = 8;
const PollingIntervalGreedy = 1000; // milliseconds
const PollingIntervalLowProfile = 60000; // milliseconds
const GreedyPingCount = 3;

/**
 * Class that stores measurement data.
 */
class Measurement {
    /**
     * Creates a new measurement.
     * @param {Date} requestSent Client's timestamp of the request transmission
     * @param {Date} requestReceived Server's timestamp of the request reception
     * @param {Date} responseSent Server's timestamp of the response transmission
     * @param {Date} responseReceived Client's timestamp of the response reception
     */
    constructor(requestSent, requestReceived, responseSent, responseReceived) {
        this.requestSent = requestSent.getTime();
        this.requestReceived = requestReceived.getTime();
        this.responseSent = responseSent.getTime();
        this.responseReceived = responseReceived.getTime();
    }

    /**
     * Time offset from server.
     */
    getOffset () {
        return ((this.requestReceived - this.requestSent) + (this.responseSent - this.responseReceived)) / 2;
    }

    /**
     * Get round-trip delay.
     */
    getDelay () {
        return (this.responseReceived - this.requestSent) - (this.responseSent - this.requestReceived);
    }

    /**
     * Get ping time.
     */
    getPing () {
        return this.getDelay() / 2;
    }
}

/**
 * Class that manages time syncing with server.
 */
class TimeSyncManager {
    constructor() {
        this.pingStop = true;
        this.pollingInterval = PollingIntervalGreedy;
        this.poller = null;
        this.pings = 0; // number of pings
        this.measurement = null; // current time sync
        this.measurements = [];
    }

    /**
     * Gets status of time sync.
     * @returns {boolean} _true_ if a measurement has been done, _false_ otherwise.
     */
    isReady() {
        return !!this.measurement;
    }

    /**
     * Gets time offset with server.
     * @returns {number} The time offset.
     */
    getTimeOffset () {
        return this.measurement ? this.measurement.getOffset() : 0;
    }

    /**
     * Gets ping time to server.
     * @returns {number} The ping time.
     */
    getPing () {
        return this.measurement ? this.measurement.getPing() : 0;
    }

    /**
     * Updates time offset between server and client.
     * @param {Measurement} measurement The new measurement.
     */
    updateTimeOffset(measurement) {
        this.measurements.push(measurement);
        if (this.measurements.length > NumberOfTrackedMeasurements) {
            this.measurements.shift();
        }

        // Pick measurement with minimum delay
        const sortedMeasurements = this.measurements.slice(0);
        sortedMeasurements.sort((a, b) => a.getDelay() - b.getDelay());
        this.measurement = sortedMeasurements[0];
    }

    /**
     * Schedules a ping request to the server. Triggers time offset update.
     */
    requestPing() {
        if (!this.poller) {
            this.poller = setTimeout(() => {
                this.poller = null;
                const apiClient = connectionManager.currentApiClient();
                const requestSent = new Date();
                apiClient.getServerTime().then((response) => {
                    const responseReceived = new Date();
                    response.json().then((data) => {
                        const requestReceived = new Date(data.RequestReceptionTime);
                        const responseSent = new Date(data.ResponseTransmissionTime);

                        const measurement = new Measurement(requestSent, requestReceived, responseSent, responseReceived);
                        this.updateTimeOffset(measurement);

                        // Avoid overloading server
                        if (this.pings >= GreedyPingCount) {
                            this.pollingInterval = PollingIntervalLowProfile;
                        } else {
                            this.pings++;
                        }

                        events.trigger(this, 'update', [null, this.getTimeOffset(), this.getPing()]);
                    });
                }).catch((error) => {
                    console.error(error);
                    events.trigger(this, 'update', [error, null, null]);
                }).finally(() => {
                    this.requestPing();
                });

            }, this.pollingInterval);
        }
    }

    /**
     * Drops accumulated measurements.
     */
    resetMeasurements () {
        this.measurement = null;
        this.measurements = [];
    }

    /**
     * Starts the time poller.
     */
    startPing() {
        this.requestPing();
    }

    /**
     * Stops the time poller.
     */
    stopPing() {
        if (this.poller) {
            clearTimeout(this.poller);
            this.poller = null;
        }
    }

    /**
     * Resets poller into greedy mode.
     */
    forceUpdate() {
        this.stopPing();
        this.pollingInterval = PollingIntervalGreedy;
        this.pings = 0;
        this.startPing();
    }

    /**
     * Converts server time to local time.
     * @param {Date} server The time to convert.
     * @returns {Date} Local time.
     */
    serverDateToLocal(server) {
        // server - local = offset
        return new Date(server.getTime() - this.getTimeOffset());
    }

    /**
     * Converts local time to server time.
     * @param {Date} local The time to convert.
     * @returns {Date} Server time.
     */
    localDateToServer(local) {
        // server - local = offset
        return new Date(local.getTime() + this.getTimeOffset());
    }
}

/** TimeSyncManager singleton. */
export default new TimeSyncManager();
