import Events from '../../utils/events';
import { toBoolean } from '../../utils/string';

class AppSettings {
    _getKey(name: string, userId: string | undefined): string {
        if (userId) {
            name = userId + '-' + name;
        }

        return name;
    }

    enableAutoLogin(): boolean;
    enableAutoLogin(val: string): void;
    enableAutoLogin(val?: string): boolean | void {
        if (val !== undefined) {
            return this.set('enableAutoLogin', val.toString());
        }
        return toBoolean(this.get('enableAutoLogin'), true);
    }

    /**
     * Get or set 'Enable Gamepad' state.
     * @param {boolean|undefined} val - Flag to enable 'Enable Gamepad' or undefined.
     * @return {boolean} 'Enable Gamepad' state.
     */
    enableGamepad(): boolean;
    enableGamepad(val: boolean): void;
    enableGamepad(val?: boolean) {
        if (val !== undefined) {
            return this.set('enableGamepad', val.toString());
        }
        return toBoolean(this.get('enableGamepad'), false);
    }

    enableSystemExternalPlayers(): boolean;
    enableSystemExternalPlayers(val: boolean): void;
    enableSystemExternalPlayers(val?: boolean): boolean | void {
        if (val !== undefined) {
            return this.set('enableSystemExternalPlayers', val.toString());
        }
        return toBoolean(this.get('enableSystemExternalPlayers'), false);
    }

    enableAutomaticBitrateDetection(isInNetwork: boolean, mediaType: string): boolean;
    enableAutomaticBitrateDetection(isInNetwork: boolean, mediaType: string, val: boolean): void;
    enableAutomaticBitrateDetection(isInNetwork: boolean, mediaType: string, val?: boolean): boolean | void {
        const key = 'enableautobitratebitrate-' + mediaType + '-' + isInNetwork;
        if (val !== undefined) {
            if (isInNetwork && mediaType === 'Audio') {
                val = true;
            }

            this.set(key, val.toString());
            return;
        }
        if (isInNetwork && mediaType === 'Audio') {
            return true;
        } else {
            return toBoolean(this.get(key), true);
        }
    }

    maxStreamingBitrate(isInNetwork: boolean, mediaType: string): number;
    maxStreamingBitrate(isInNetwork: boolean, mediaType: string, val: string): void;
    maxStreamingBitrate(isInNetwork: boolean, mediaType: string, val?: string): number | void {
        const key = 'maxbitrate-' + mediaType + '-' + isInNetwork;
        if (val !== undefined) {
            if (isInNetwork && mediaType === 'Audio') {
                //  nothing to do, this is always a max value
            } else {
                this.set(key, val);
            }
            return;
        }

        if (isInNetwork && mediaType === 'Audio') {
            // return a huge number so that it always direct plays
            return 150000000;
        } else {
            return parseInt(this.get(key) || '0', 10) || 1500000;
        }
    }

    maxStaticMusicBitrate(): number;
    maxStaticMusicBitrate(val: string): void;
    maxStaticMusicBitrate(val?: string): number | void {
        if (val !== undefined) {
            return this.set('maxStaticMusicBitrate', val);
        }
        const defaultValue = 320000;
        return parseInt(this.get('maxStaticMusicBitrate') || defaultValue.toString(), 10) || defaultValue;
    }

    maxChromecastBitrate(): number | null;
    maxChromecastBitrate(val: string): void;
    maxChromecastBitrate(val?: string) {
        if (val !== undefined) {
            return this.set('chromecastBitrate1', val);
        }
        const setting = this.get('chromecastBitrate1');
        return setting ? parseInt(setting, 10) : null;
    }

    /**
     * Get or set 'Maximum video width'
     * @param {number|undefined} val - Maximum video width or undefined.
     * @return {number} Maximum video width.
     */
    maxVideoWidth(): number;
    maxVideoWidth(val: number): void;
    maxVideoWidth(val?: number): number | void {
        if (val !== undefined) {
            return this.set('maxVideoWidth', val.toString());
        }
        return parseInt(this.get('maxVideoWidth') || '0', 10) || 0;
    }

    set(name: string, value: string, userId?: string) {
        const currentValue = this.get(name, userId);
        localStorage.setItem(this._getKey(name, userId), value);

        if (currentValue !== value) {
            Events.trigger(this, 'change', [name]);
        }
    }

    get(name: string, userId?: string | undefined) {
        return localStorage.getItem(this._getKey(name, userId));
    }
}

export default new AppSettings();
