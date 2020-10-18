/* eslint-disable indent */
import { AppStorage, Events } from 'jellyfin-apiclient';

    function getKey(name, userId) {
        if (userId) {
            name = userId + '-' + name;
        }

        return name;
    }

    export function enableAutoLogin(val) {
        if (val !== undefined) {
            set('enableAutoLogin', val.toString());
        }

        return get('enableAutoLogin') !== 'false';
    }

    export function enableSystemExternalPlayers(val) {
        if (val !== undefined) {
            set('enableSystemExternalPlayers', val.toString());
        }

        return get('enableSystemExternalPlayers') === 'true';
    }

    export function enableAutomaticBitrateDetection(isInNetwork, mediaType, val) {
        const key = 'enableautobitratebitrate-' + mediaType + '-' + isInNetwork;
        if (val !== undefined) {
            if (isInNetwork && mediaType === 'Audio') {
                val = true;
            }

            set(key, val.toString());
        }

        if (isInNetwork && mediaType === 'Audio') {
            return true;
        } else {
            return get(key) !== 'false';
        }
    }

    export function maxStreamingBitrate(isInNetwork, mediaType, val) {
        const key = 'maxbitrate-' + mediaType + '-' + isInNetwork;
        if (val !== undefined) {
            if (isInNetwork && mediaType === 'Audio') {
                //  nothing to do, this is always a max value
            } else {
                set(key, val);
            }
        }

        if (isInNetwork && mediaType === 'Audio') {
            // return a huge number so that it always direct plays
            return 150000000;
        } else {
            return parseInt(get(key) || '0') || 1500000;
        }
    }

    export function maxStaticMusicBitrate(val) {
        if (val !== undefined) {
            set('maxStaticMusicBitrate', val);
        }

        const defaultValue = 320000;
        return parseInt(get('maxStaticMusicBitrate') || defaultValue.toString()) || defaultValue;
    }

    export function maxChromecastBitrate(val) {
        if (val !== undefined) {
            set('chromecastBitrate1', val);
        }

        val = get('chromecastBitrate1');
        return val ? parseInt(val) : null;
    }

    export function set(name, value, userId) {
        const currentValue = get(name, userId);
        AppStorage.setItem(getKey(name, userId), value);

        if (currentValue !== value) {
            Events.trigger(this, 'change', [name]);
        }
    }

    export function get(name, userId) {
        return AppStorage.getItem(getKey(name, userId));
    }

/* eslint-enable indent */

export default {
    enableAutoLogin: enableAutoLogin,
    enableSystemExternalPlayers: enableSystemExternalPlayers,
    enableAutomaticBitrateDetection: enableAutomaticBitrateDetection,
    maxStreamingBitrate: maxStreamingBitrate,
    maxStaticMusicBitrate: maxStaticMusicBitrate,
    maxChromecastBitrate: maxChromecastBitrate,
    set: set,
    get: get
};
