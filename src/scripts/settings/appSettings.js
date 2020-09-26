/* eslint-disable indent */
import { AppStorage, Events } from 'jellyfin-apiclient';

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

        return this.get('enableAutoLogin') === 'true';
    }

    enableSystemExternalPlayers(val) {
        if (val !== undefined) {
            this.set('enableSystemExternalPlayers', val.toString());
        }

        return this.get('enableSystemExternalPlayers') === 'true';
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
            return this.get(key) !== 'false';
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
            return parseInt(this.get(key) || '0') || 1500000;
        }
    }

    maxStaticMusicBitrate(val) {
        if (val !== undefined) {
            this.set('maxStaticMusicBitrate', val);
        }

        const defaultValue = 320000;
        return parseInt(this.get('maxStaticMusicBitrate') || defaultValue.toString()) || defaultValue;
    }

    maxChromecastBitrate(val) {
        if (val !== undefined) {
            this.set('chromecastBitrate1', val);
        }

        val = this.get('chromecastBitrate1');
        return val ? parseInt(val) : null;
    }

    set(name, value, userId) {
        const currentValue = this.get(name, userId);
        AppStorage.setItem(this.#getKey(name, userId), value);

        if (currentValue !== value) {
            Events.trigger(this, 'change', [name]);
        }
    }

    get(name, userId) {
        return AppStorage.getItem(this.#getKey(name, userId));
    }
}

/* eslint-enable indent */

export default new AppSettings();
