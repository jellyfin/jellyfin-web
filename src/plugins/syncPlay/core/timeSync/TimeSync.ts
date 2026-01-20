import Events from '../../../../utils/events';

const NumberOfTrackedMeasurements = 8;
const PollingIntervalGreedy = 1000;
const PollingIntervalLowProfile = 60000;
const GreedyPingCount = 3;

class Measurement {
    private requestSent: number;
    private requestReceived: number;
    private responseSent: number;
    private responseReceived: number;

    constructor(requestSent: Date, requestReceived: Date, responseSent: Date, responseReceived: Date) {
        this.requestSent = requestSent.getTime();
        this.requestReceived = requestReceived.getTime();
        this.responseSent = responseSent.getTime();
        this.responseReceived = responseReceived.getTime();
    }

    getOffset() { return ((this.requestReceived - this.requestSent) + (this.responseSent - this.responseReceived)) / 2; }
    getDelay() { return (this.responseReceived - this.requestSent) - (this.responseSent - this.requestReceived); }
    getPing() { return this.getDelay() / 2; }
}

class TimeSync {
    protected manager: any;
    private pingStop = true;
    private pollingInterval = PollingIntervalGreedy;
    private poller: any = null;
    private pings = 0;
    private measurement: Measurement | null = null;
    private measurements: Measurement[] = [];

    constructor(syncPlayManager: any) {
        this.manager = syncPlayManager;
    }

    isReady() { return !!this.measurement; }
    getTimeOffset() { return this.measurement ? this.measurement.getOffset() : 0; }
    getPing() { return this.measurement ? this.measurement.getPing() : 0; }

    updateTimeOffset(measurement: Measurement) {
        this.measurements.push(measurement);
        if (this.measurements.length > NumberOfTrackedMeasurements) this.measurements.shift();
        const sorted = [...this.measurements].sort((a, b) => a.getDelay() - b.getDelay());
        this.measurement = sorted[0];
    }

    requestPing(): Promise<any> { return Promise.reject(new Error('Not implemented')); }

    private internalRequestPing() {
        if (!this.poller && !this.pingStop) {
            this.poller = setTimeout(() => {
                this.poller = null;
                this.requestPing()
                    .then(res => this.onPingResponseCallback(res))
                    .catch(err => this.onPingRequestErrorCallback(err))
                    .finally(() => this.internalRequestPing());
            }, this.pollingInterval);
        }
    }

    private onPingResponseCallback(result: any) {
        const measurement = new Measurement(result.requestSent, result.requestReceived, result.responseSent, result.responseReceived);
        this.updateTimeOffset(measurement);
        if (this.pings >= GreedyPingCount) this.pollingInterval = PollingIntervalLowProfile;
        else this.pings++;
        Events.trigger(this, 'update', [null, this.getTimeOffset(), this.getPing()]);
    }

    private onPingRequestErrorCallback(error: any) {
        Events.trigger(this, 'update', [error, null, null]);
    }

    startPing() { this.pingStop = false; this.internalRequestPing(); }
    stopPing() { this.pingStop = true; if (this.poller) { clearTimeout(this.poller); this.poller = null; } }
    forceUpdate() { this.stopPing(); this.pollingInterval = PollingIntervalGreedy; this.pings = 0; this.startPing(); }
    remoteDateToLocal(remote: Date) { return new Date(remote.getTime() - this.getTimeOffset()); }
    localDateToRemote(local: Date) { return new Date(local.getTime() + this.getTimeOffset()); }
}

export default TimeSync;