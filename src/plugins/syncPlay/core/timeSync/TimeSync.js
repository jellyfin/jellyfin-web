/**
 * Module that manages time syncing with another device.
 * @module components/syncPlay/core/timeSync/TimeSync
 */

import Events from '../../../../utils/events';

/**
 * Time estimation.
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
     * @param {Date} requestReceived Remote's timestamp of the request reception
     * @param {Date} responseSent Remote's timestamp of the response transmission
     * @param {Date} responseReceived Client's timestamp of the response reception
     */
    constructor(requestSent, requestReceived, responseSent, responseReceived) {
        this.requestSent = requestSent.getTime();
        this.requestReceived = requestReceived.getTime();
        this.responseSent = responseSent.getTime();
        this.responseReceived = responseReceived.getTime();
    }

    /**
     * Time offset from remote entity, in milliseconds.
     */
    getOffset() {
        return ((this.requestReceived - this.requestSent) + (this.responseSent - this.responseReceived)) / 2;
    }

    /**
     * Get round-trip delay, in milliseconds.
     */
    getDelay() {
        return (this.responseReceived - this.requestSent) - (this.responseSent - this.requestReceived);
    }

    /**
     * Get ping time, in milliseconds.
     */
    getPing() {
        return this.getDelay() / 2;
    }
}

/**
 * Class that manages time syncing with remote entity.
 */
class TimeSync {
    constructor(syncPlayManager) {
        this.manager = syncPlayManager;
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
     * Gets time offset with remote entity, in milliseconds.
     * @returns {number} The time offset.
     */
    getTimeOffset() {
        return this.measurement ? this.measurement.getOffset() : 0;
    }

    /**
     * Gets ping time to remote entity, in milliseconds.
     * @returns {number} The ping time.
     */
    getPing() {
        return this.measurement ? this.measurement.getPing() : 0;
    }

    /**
     * Updates time offset between remote entity and local entity.
     * @param {Measurement} measurement The new measurement.
     */
    updateTimeOffset(measurement) {
        this.measurements.push(measurement);
        if (this.measurements.length > NumberOfTrackedMeasurements) {
            this.measurements.shift();
        }

        // Pick measurement with minimum delay.
        const sortedMeasurements = this.measurements.slice(0);
        sortedMeasurements.sort((a, b) => a.getDelay() - b.getDelay());
        this.measurement = sortedMeasurements[0];
    }

    /**
     * Schedules a ping request to the remote entity. Triggers time offset update.
     * @returns {Promise} Resolves on request success.
     */
    requestPing() {
        console.warn('SyncPlay TimeSync requestPing: override this method!');
        return Promise.reject(new Error('Not implemented.'));
    }

    /**
     * Poller for ping requests.
     */
    internalRequestPing() {
        if (!this.poller && !this.pingStop) {
            this.poller = setTimeout(() => {
                this.poller = null;
                this.requestPing()
                    .then((result) => this.onPingResponseCallback(result))
                    .catch((error) => this.onPingRequestErrorCallback(error))
                    .finally(() => this.internalRequestPing());
            }, this.pollingInterval);
        }
    }

    /**
     * Handles a successful ping request.
     * @param {Object} result The ping result.
     */
    onPingResponseCallback(result) {
        const { requestSent, requestReceived, responseSent, responseReceived } = result;
        const measurement = new Measurement(requestSent, requestReceived, responseSent, responseReceived);
        this.updateTimeOffset(measurement);

        // Avoid overloading network.
        if (this.pings >= GreedyPingCount) {
            this.pollingInterval = PollingIntervalLowProfile;
        } else {
            this.pings++;
        }

        Events.trigger(this, 'update', [null, this.getTimeOffset(), this.getPing()]);
    }

    /**
     * Handles a failed ping request.
     * @param {Object} error The error.
     */
    onPingRequestErrorCallback(error) {
        console.error(error);
        Events.trigger(this, 'update', [error, null, null]);
    }

    /**
     * Drops accumulated measurements.
     */
    resetMeasurements() {
        this.measurement = null;
        this.measurements = [];
    }

    /**
     * Starts the time poller.
     */
    startPing() {
        this.pingStop = false;
        this.internalRequestPing();
    }

    /**
     * Stops the time poller.
     */
    stopPing() {
        this.pingStop = true;
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
     * Converts remote time to local time.
     * @param {Date} remote The time to convert.
     * @returns {Date} Local time.
     */
    remoteDateToLocal(remote) {
        // remote - local = offset
        return new Date(remote.getTime() - this.getTimeOffset());
    }

    /**
     * Converts local time to remote time.
     * @param {Date} local The time to convert.
     * @returns {Date} Remote time.
     */
    localDateToRemote(local) {
        // remote - local = offset
        return new Date(local.getTime() + this.getTimeOffset());
    }
}

export default TimeSync;
