import appSettings from '../../../../scripts/settings/appSettings';
import Events from '../../../../utils/events';
import { toFloat } from '../../../../utils/string';
import { getSetting } from '../Settings';
import TimeSyncServer from './TimeSyncServer';

function offsetDate(date: Date, offset: number): Date {
    return new Date(date.getTime() + offset);
}

class TimeSyncCore {
    private manager: any = null;
    private timeSyncServer: any = null;
    private timeSyncDeviceId: string;
    extraTimeOffset: number;

    constructor() {
        this.timeSyncDeviceId = getSetting('timeSyncDevice') || 'server';
        this.extraTimeOffset = toFloat(getSetting('extraTimeOffset'), 0.0);
    }

    init(syncPlayManager: any) {
        this.manager = syncPlayManager;
        this.timeSyncServer = new (TimeSyncServer as any)(syncPlayManager);

        Events.on(this.timeSyncServer, 'update', (_event: any, error: any, timeOffset: number, ping: number) => {
            if (error) return;
            Events.trigger(this, 'time-sync-server-update', [timeOffset, ping]);
        });

        Events.on(appSettings, 'change', (_e: any, name: string) => {
            if (name === 'extraTimeOffset') {
                this.extraTimeOffset = toFloat(getSetting('extraTimeOffset'), 0.0);
            }
        });
    }

    forceUpdate() { this.timeSyncServer.forceUpdate(); }
    getActiveDeviceName() { return 'Server'; }

    remoteDateToLocal(remote: Date): Date {
        const date = this.timeSyncServer.remoteDateToLocal(remote);
        return offsetDate(date, -this.extraTimeOffset);
    }

    localDateToRemote(local: Date): Date {
        const date = this.timeSyncServer.localDateToRemote(local);
        return offsetDate(date, this.extraTimeOffset);
    }

    getTimeOffset(): number {
        return this.timeSyncServer.getTimeOffset() + this.extraTimeOffset;
    }
}

export default TimeSyncCore;