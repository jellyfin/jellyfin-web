import browser from 'scripts/browser';
import Events from '../../utils/events.ts';
import { toBoolean } from '../../utils/string.ts';

class AppSettings {
    #getKey(name, userId) {
        if (userId) {
            name = userId + '-' + name;
        }

        return name;
    }

    enableAutoLogin(val) {
        if (val !== undefined) {
            this.set('enableAutoLogin', val.toString());
        }

        return toBoolean(this.get('enableAutoLogin'), true);
    }

    /**
     * Get or set 'Enable Gamepad' state.
     * @param {boolean|undefined} val - Flag to enable 'Enable Gamepad' or undefined.
     * @return {boolean} 'Enable Gamepad' state.
     */
    enableGamepad(val) {
        if (val !== undefined) {
            return this.set('enableGamepad', val.toString());
        }

        return toBoolean(this.get('enableGamepad'), false);
    }

    /**
     * Get or set 'Enable smooth scroll' state.
     * @param {boolean|undefined} val - Flag to enable 'Enable smooth scroll' or undefined.
     * @return {boolean} 'Enable smooth scroll' state.
     */
    enableSmoothScroll(val) {
        if (val !== undefined) {
            return this.set('enableSmoothScroll', val.toString());
        }

        return toBoolean(this.get('enableSmoothScroll'), !!browser.tizen);
    }

    enableSystemExternalPlayers(val) {
        if (val !== undefined) {
            this.set('enableSystemExternalPlayers', val.toString());
        }

        return toBoolean(this.get('enableSystemExternalPlayers'), false);
    }

    enableAutomaticBitrateDetection(isInNetwork, mediaType, val) {
        const key = 'enableautobitratebitrate-' + mediaType + '-' + isInNetwork;
        if (val !== undefined) {
            if (isInNetwork && mediaType === 'Audio') {
                val = true;
            }

            this.set(key, val.toString());
        }

        if (isInNetwork && mediaType === 'Audio') {
            return true;
        } else {
            return toBoolean(this.get(key), true);
        }
    }

    maxStreamingBitrate(isInNetwork, mediaType, val) {
        const key = 'maxbitrate-' + mediaType + '-' + isInNetwork;
        if (val !== undefined) {
            if (isInNetwork && mediaType === 'Audio') {
                //  nothing to do, this is always a max value
            } else {
                this.set(key, val);
            }
        }

        if (isInNetwork && mediaType === 'Audio') {
            // return a huge number so that it always direct plays
            return 150000000;
        } else {
            return parseInt(this.get(key) || '0', 10) || 1500000;
        }
    }

    maxStaticMusicBitrate(val) {
        if (val !== undefined) {
            this.set('maxStaticMusicBitrate', val);
        }

        const defaultValue = 320000;
        return parseInt(this.get('maxStaticMusicBitrate') || defaultValue.toString(), 10) || defaultValue;
    }

    maxChromecastBitrate(val) {
        if (val !== undefined) {
            this.set('chromecastBitrate1', val);
        }

        val = this.get('chromecastBitrate1');
        return val ? parseInt(val, 10) : null;
    }

    /**
     * Get or set 'Maximum video width'
     * @param {number|undefined} val - Maximum video width or undefined.
     * @return {number} Maximum video width.
     */
    maxVideoWidth(val) {
        if (val !== undefined) {
            return this.set('maxVideoWidth', val.toString());
        }

        return parseInt(this.get('maxVideoWidth') || '0', 10) || 0;
    }

    /**
     * Get or set 'Limit maximum supported video resolution' state.
     * @param {boolean|undefined} val - Flag to enable 'Limit maximum supported video resolution' or undefined.
     * @return {boolean} 'Limit maximum supported video resolution' state.
     */
    limitSupportedVideoResolution(val) {
        if (val !== undefined) {
            return this.set('limitSupportedVideoResolution', val.toString());
        }

        return toBoolean(this.get('limitSupportedVideoResolution'), false);
    }

    set(name, value, userId) {
        const currentValue = this.get(name, userId);
        localStorage.setItem(this.#getKey(name, userId), value);

        if (currentValue !== value) {
            Events.trigger(this, 'change', [name]);
        }
    }

    get(name, userId) {
        return localStorage.getItem(this.#getKey(name, userId));
    }
}

export default new AppSettings();
