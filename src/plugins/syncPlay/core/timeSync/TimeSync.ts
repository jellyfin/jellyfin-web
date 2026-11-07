/**
 * Module that manages time syncing with another device.
 * @module plugins/syncPlay/core/timeSync/TimeSync
 */

import type { ApiClient } from 'jellyfin-apiclient';

import Events from '@/utils/events';

/**
 * Time estimation.
 */
const NumberOfTrackedMeasurements = 8;
const PollingIntervalGreedy = 1000; // milliseconds
const PollingIntervalLowProfile = 60000; // milliseconds
const GreedyPingCount = 3;

/**
 * The part of the SyncPlay manager that time sync implementations rely on.
 */
export interface TimeSyncManager {
    getApiClient(): ApiClient;
}

/**
 * The timestamps of a single ping exchange with the remote entity.
 */
export interface PingResult {
    /** Client's timestamp of the request transmission. */
    requestSent: Date;
    /** Remote's timestamp of the request reception. */
    requestReceived: Date;
    /** Remote's timestamp of the response transmission. */
    responseSent: Date;
    /** Client's timestamp of the response reception. */
    responseReceived: Date;
}

/**
 * Class that stores measurement data.
 */
class Measurement {
    private readonly requestSent: number;
    private readonly requestReceived: number;
    private readonly responseSent: number;
    private readonly responseReceived: number;

    /**
     * Creates a new measurement.
     * @param requestSent Client's timestamp of the request transmission.
     * @param requestReceived Remote's timestamp of the request reception.
     * @param responseSent Remote's timestamp of the response transmission.
     * @param responseReceived Client's timestamp of the response reception.
     */
    constructor(requestSent: Date, requestReceived: Date, responseSent: Date, responseReceived: Date) {
        this.requestSent = requestSent.getTime();
        this.requestReceived = requestReceived.getTime();
        this.responseSent = responseSent.getTime();
        this.responseReceived = responseReceived.getTime();
    }

    /**
     * Time offset from remote entity, in milliseconds.
     * @returns The time offset.
     */
    getOffset(): number {
        return ((this.requestReceived - this.requestSent) + (this.responseSent - this.responseReceived)) / 2;
    }

    /**
     * Get round-trip delay, in milliseconds.
     * @returns The round-trip delay.
     */
    getDelay(): number {
        return (this.responseReceived - this.requestSent) - (this.responseSent - this.requestReceived);
    }

    /**
     * Get ping time, in milliseconds.
     * @returns The ping time.
     */
    getPing(): number {
        return Math.round(this.getDelay() / 2);
    }
}

/**
 * Class that manages time syncing with remote entity.
 * Subclasses provide the transport by implementing {@link TimeSync#requestPing}.
 *
 * Triggers an `update` event with `(error, timeOffset, ping)` after each ping attempt:
 * `(null, number, number)` on success, `(error, null, null)` on failure.
 */
abstract class TimeSync {
    protected readonly manager: TimeSyncManager;
    private pingStop = true;
    private pollingInterval = PollingIntervalGreedy;
    private poller: ReturnType<typeof setTimeout> | null = null;
    /** Number of pings done in greedy mode. */
    private pings = 0;
    /** Current time sync. */
    private measurement: Measurement | null = null;
    private measurements: Measurement[] = [];

    /**
     * Creates a new time sync instance.
     * @param syncPlayManager The SyncPlay manager.
     */
    constructor(syncPlayManager: TimeSyncManager) {
        this.manager = syncPlayManager;
    }

    /**
     * Gets status of time sync.
     * @returns _true_ if a measurement has been done, _false_ otherwise.
     */
    isReady(): boolean {
        return !!this.measurement;
    }

    /**
     * Gets time offset with remote entity, in milliseconds.
     * @returns The time offset.
     */
    getTimeOffset(): number {
        return this.measurement ? this.measurement.getOffset() : 0;
    }

    /**
     * Gets ping time to remote entity, in milliseconds.
     * @returns The ping time.
     */
    getPing(): number {
        return this.measurement ? this.measurement.getPing() : 0;
    }

    /**
     * Updates time offset between remote entity and local entity.
     * @param measurement The new measurement.
     */
    private updateTimeOffset(measurement: Measurement): void {
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
     * Makes a ping request to the remote entity. Triggers time offset update.
     * @returns Resolves with the ping timestamps on request success.
     */
    protected abstract requestPing(): Promise<PingResult>;

    /**
     * Poller for ping requests.
     */
    private internalRequestPing(): void {
        if (!this.poller && !this.pingStop) {
            this.poller = setTimeout(() => {
                this.poller = null;
                this.requestPing()
                    .then((result) => this.onPingResponseCallback(result))
                    .catch((error: unknown) => this.onPingRequestErrorCallback(error))
                    .finally(() => this.internalRequestPing());
            }, this.pollingInterval);
        }
    }

    /**
     * Handles a successful ping request.
     * @param result The ping result.
     */
    private onPingResponseCallback(result: PingResult): void {
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
     * @param error The error.
     */
    private onPingRequestErrorCallback(error: unknown): void {
        console.error(error);
        Events.trigger(this, 'update', [error, null, null]);
    }

    /**
     * Drops accumulated measurements.
     */
    resetMeasurements(): void {
        this.measurement = null;
        this.measurements = [];
    }

    /**
     * Starts the time poller.
     */
    startPing(): void {
        this.pingStop = false;
        this.internalRequestPing();
    }

    /**
     * Stops the time poller.
     */
    stopPing(): void {
        this.pingStop = true;
        if (this.poller) {
            clearTimeout(this.poller);
            this.poller = null;
        }
    }

    /**
     * Resets poller into greedy mode.
     */
    forceUpdate(): void {
        this.stopPing();
        this.pollingInterval = PollingIntervalGreedy;
        this.pings = 0;
        this.startPing();
    }

    /**
     * Converts remote time to local time.
     * @param remote The time to convert.
     * @returns Local time.
     */
    remoteDateToLocal(remote: Date): Date {
        // remote - local = offset
        return new Date(remote.getTime() - this.getTimeOffset());
    }

    /**
     * Converts local time to remote time.
     * @param local The time to convert.
     * @returns Remote time.
     */
    localDateToRemote(local: Date): Date {
        // remote - local = offset
        return new Date(local.getTime() + this.getTimeOffset());
    }
}

export default TimeSync;
