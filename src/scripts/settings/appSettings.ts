import Events from '../../utils/events';
import { toBoolean } from '../../utils/string';
import browser from '../browser';

class AppSettings {
    private getKey(name: string, userId?: string): string {
        if (userId) {
            name = userId + '-' + name;
        }

        return name;
    }

    enableAutoLogin(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('enableAutoLogin', val.toString());
        }

        return toBoolean(this.get('enableAutoLogin'), true);
    }

    /**
     * Get or set 'Enable Gamepad' state.
     */
    enableGamepad(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('enableGamepad', val.toString());
        }

        return toBoolean(this.get('enableGamepad'), false);
    }

    /**
     * Get or set 'Enable smooth scroll' state.
     */
    enableSmoothScroll(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('enableSmoothScroll', val.toString());
        }

        return toBoolean(this.get('enableSmoothScroll'), !!browser.tizen);
    }

    enableSystemExternalPlayers(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('enableSystemExternalPlayers', val.toString());
        }

        return toBoolean(this.get('enableSystemExternalPlayers'), false);
    }

    // Additional methods with types...
    set(name: string, value: string, userId?: string): any {
        const key = this.getKey(name, userId);
        // Implementation
        return null;
    }

    get(name: string, userId?: string): string | null {
        const key = this.getKey(name, userId);
        // Implementation
        return null;
    }

    maxStreamingBitrate(isInNetwork: boolean, mediatype: string, value?: string): string | null {
        const key = `maxStreamingBitrate-${isInNetwork ? 'inNetwork' : 'internet'}-${mediatype}`;
        if (value !== undefined) {
            this.set(key, value);
            return value;
        }
        return this.get(key);
    }

    enableAutomaticBitrateDetection(isInNetwork: boolean, mediatype: string, value?: boolean): boolean {
        const key = `enableAutomaticBitrate-${isInNetwork ? 'inNetwork' : 'internet'}-${mediatype}`;
        if (value !== undefined) {
            this.set(key, value.toString());
            return value;
        }
        return toBoolean(this.get(key), true);
    }

    maxChromecastBitrate(value?: string): string | null {
        if (value !== undefined) {
            this.set('maxChromecastBitrate', value);
            return value;
        }
        return this.get('maxChromecastBitrate');
    }

    maxVideoWidth(value?: string): string | null {
        if (value !== undefined) {
            this.set('maxVideoWidth', value);
            return value;
        }
        return this.get('maxVideoWidth') || '0';
    }

    enableDts(value?: boolean): boolean {
        if (value !== undefined) {
            this.set('enableDts', value.toString());
            return value;
        }
        return toBoolean(this.get('enableDts'), false);
    }

    enableTrueHd(value?: boolean): boolean {
        if (value !== undefined) {
            this.set('enableTrueHd', value.toString());
            return value;
        }
        return toBoolean(this.get('enableTrueHd'), false);
    }

    enableHi10p(value?: boolean): boolean {
        if (value !== undefined) {
            this.set('enableHi10p', value.toString());
            return value;
        }
        return toBoolean(this.get('enableHi10p'), false);
    }

    limitSupportedVideoResolution(value?: boolean): boolean {
        if (value !== undefined) {
            this.set('limitSupportedVideoResolution', value.toString());
            return value;
        }
        return toBoolean(this.get('limitSupportedVideoResolution'), false);
    }

    preferredTranscodeVideoCodec(value?: string): string | null {
        if (value !== undefined) {
            this.set('preferredTranscodeVideoCodec', value);
            return value;
        }
        return this.get('preferredTranscodeVideoCodec');
    }

    preferredTranscodeVideoAudioCodec(value?: string): string | null {
        if (value !== undefined) {
            this.set('preferredTranscodeVideoAudioCodec', value);
            return value;
        }
        return this.get('preferredTranscodeVideoAudioCodec');
    }

    disableVbrAudio(value?: boolean): boolean {
        if (value !== undefined) {
            this.set('disableVbrAudio', value.toString());
            return value;
        }
        return toBoolean(this.get('disableVbrAudio'), false);
    }

    alwaysRemuxFlac(value?: boolean): boolean {
        if (value !== undefined) {
            this.set('alwaysRemuxFlac', value.toString());
            return value;
        }
        return toBoolean(this.get('alwaysRemuxFlac'), false);
    }

    alwaysRemuxMp3(value?: boolean): boolean {
        if (value !== undefined) {
            this.set('alwaysRemuxMp3', value.toString());
            return value;
        }
        return toBoolean(this.get('alwaysRemuxMp3'), false);
    }

    // Additional methods can be added as needed
}

const appSettings = new AppSettings();

export default appSettings;
