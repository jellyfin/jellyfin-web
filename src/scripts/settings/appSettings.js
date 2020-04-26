/* eslint-disable indent */

import appStorage from 'appStorage';
import events from 'events';

    function getKey(name, userId) {
        if (userId) {
            name = userId + '-' + name;
        }

        return name;
    }

    export function enableAutoLogin(val) {
        if (val !== undefined) {
            this.set('enableAutoLogin', val.toString());
        }

        return this.get('enableAutoLogin') !== 'false';
    }

    export function enableSystemExternalPlayers(val) {
        if (val !== undefined) {
            this.set('enableSystemExternalPlayers', val.toString());
        }

        return this.get('enableSystemExternalPlayers') === 'true';
    }

    export function enableAutomaticBitrateDetection(isInNetwork, mediaType, val) {
        var key = 'enableautobitratebitrate-' + mediaType + '-' + isInNetwork;
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

    export function maxStreamingBitrate(isInNetwork, mediaType, val) {
        var key = 'maxbitrate-' + mediaType + '-' + isInNetwork;
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

    export function maxStaticMusicBitrate(val) {
        if (val !== undefined) {
            this.set('maxStaticMusicBitrate', val);
        }

        var defaultValue = 320000;
        return parseInt(this.get('maxStaticMusicBitrate') || defaultValue.toString()) || defaultValue;
    }

    export function maxChromecastBitrate(val) {
        if (val !== undefined) {
            this.set('chromecastBitrate1', val);
        }

        val = this.get('chromecastBitrate1');
        return val ? parseInt(val) : null;
    }

    export function syncOnlyOnWifi(val) {
        if (val !== undefined) {
            this.set('syncOnlyOnWifi', val.toString());
        }

        return this.get('syncOnlyOnWifi') !== 'false';
    }

    export function syncPath(val) {
        if (val !== undefined) {
            this.set('syncPath', val);
        }

        return this.get('syncPath');
    }

    export function cameraUploadServers(val) {
        if (val !== undefined) {
            this.set('cameraUploadServers', val.join(','));
        }

        val = this.get('cameraUploadServers');
        if (val) {
            return val.split(',');
        }

        return [];
    }

    export function runAtStartup(val) {
        if (val !== undefined) {
            this.set('runatstartup', val.toString());
        }

        return this.get('runatstartup') === 'true';
    }

    export function set(name, value, userId) {
        var currentValue = this.get(name, userId);
        appStorage.setItem(getKey(name, userId), value);

        if (currentValue !== value) {
            events.trigger(this, 'change', [name]);
        }
    }

    export function get(name, userId) {
        return appStorage.getItem(getKey(name, userId));
    }

/* eslint-enable indent */

export default {
    enableAutoLogin: enableAutoLogin,
    enableSystemExternalPlayers: enableSystemExternalPlayers,
    enableAutomaticBitrateDetection: enableAutomaticBitrateDetection,
    maxStreamingBitrate: maxStreamingBitrate,
    maxStaticMusicBitrate: maxStaticMusicBitrate,
    maxChromecastBitrate: maxChromecastBitrate,
    syncOnlyOnWifi: syncOnlyOnWifi,
    syncPath: syncPath,
    cameraUploadServers: cameraUploadServers,
    runAtStartup: runAtStartup,
    set: set,
    get: get
};
