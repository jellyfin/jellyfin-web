/* eslint-disable indent */

import appSettings from 'appSettings';
import events from 'events';

    function onSaveTimeout() {
        var self = this;
        self.saveTimeout = null;
        self.currentApiClient.updateDisplayPreferences('usersettings', self.displayPrefs, self.currentUserId, 'emby');
    }

    function saveServerPreferences(instance) {
        if (instance.saveTimeout) {
            clearTimeout(instance.saveTimeout);
        }

        instance.saveTimeout = setTimeout(onSaveTimeout.bind(instance), 50);
    }

    export function setUserInfo(userId, apiClient) {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.currentUserId = userId;
        this.currentApiClient = apiClient;

        if (!userId) {
            this.displayPrefs = null;
            return Promise.resolve();
        }

        var self = this;

        return apiClient.getDisplayPreferences('usersettings', userId, 'emby').then(function (result) {
            result.CustomPrefs = result.CustomPrefs || {};
            self.displayPrefs = result;
        });
    }

    export function getData() {
        return this.displayPrefs;
    }

    export function importFrom(instance) {
        this.displayPrefs = instance.getData();
    }

    export function set(name, value, enableOnServer) {
        var userId = this.currentUserId;
        var currentValue = this.get(name, enableOnServer);
        var result = appSettings.set(name, value, userId);

        if (enableOnServer !== false && this.displayPrefs) {
            this.displayPrefs.CustomPrefs[name] = value == null ? value : value.toString();
            saveServerPreferences(this);
        }

        if (currentValue !== value) {
            events.trigger(this, 'change', [name]);
        }

        return result;
    }

    export function get(name, enableOnServer) {
        var userId = this.currentUserId;
        if (enableOnServer !== false && this.displayPrefs) {
            return this.displayPrefs.CustomPrefs[name];
        }

        return appSettings.get(name, userId);
    }

    export function serverConfig(config) {
        var apiClient = this.currentApiClient;
        if (config) {
            return apiClient.updateUserConfiguration(this.currentUserId, config);
        }

        return apiClient.getUser(this.currentUserId).then(function (user) {
            return user.Configuration;
        });
    }

    export function enableCinemaMode(val) {
        if (val !== undefined) {
            return this.set('enableCinemaMode', val.toString(), false);
        }

        val = this.get('enableCinemaMode', false);
        return val !== 'false';
    }

    export function enableNextVideoInfoOverlay(val) {
        if (val !== undefined) {
            return this.set('enableNextVideoInfoOverlay', val.toString());
        }

        val = this.get('enableNextVideoInfoOverlay', false);
        return val !== 'false';
    }

    export function enableThemeSongs(val) {
        if (val !== undefined) {
            return this.set('enableThemeSongs', val.toString(), false);
        }

        val = this.get('enableThemeSongs', false);
        return val !== 'false';
    }

    export function enableThemeVideos(val) {
        if (val !== undefined) {
            return this.set('enableThemeVideos', val.toString(), false);
        }

        val = this.get('enableThemeVideos', false);
        return val !== 'false';
    }

    export function enableFastFadein(val) {
        if (val !== undefined) {
            return this.set('fastFadein', val.toString(), false);
        }

        val = this.get('fastFadein', false);
        return val !== 'false';
    }

    export function enableBackdrops(val) {
        if (val !== undefined) {
            return this.set('enableBackdrops', val.toString(), false);
        }

        val = this.get('enableBackdrops', false);
        return val !== 'false';
    }

    export function language(val) {
        if (val !== undefined) {
            return this.set('language', val.toString(), false);
        }

        return this.get('language', false);
    }

    export function dateTimeLocale(val) {
        if (val !== undefined) {
            return this.set('datetimelocale', val.toString(), false);
        }

        return this.get('datetimelocale', false);
    }

    export function chromecastVersion(val) {
        if (val !== undefined) {
            return this.set('chromecastVersion', val.toString());
        }

        return this.get('chromecastVersion') || 'stable';
    }

    export function skipBackLength(val) {
        if (val !== undefined) {
            return this.set('skipBackLength', val.toString());
        }

        return parseInt(this.get('skipBackLength') || '10000');
    }

    export function skipForwardLength(val) {
        if (val !== undefined) {
            return this.set('skipForwardLength', val.toString());
        }

        return parseInt(this.get('skipForwardLength') || '30000');
    }

    export function dashboardTheme(val) {
        if (val !== undefined) {
            return this.set('dashboardTheme', val);
        }

        return this.get('dashboardTheme');
    }

    export function skin(val) {
        if (val !== undefined) {
            return this.set('skin', val, false);
        }

        return this.get('skin', false);
    }

    export function theme(val) {
        if (val !== undefined) {
            return this.set('appTheme', val, false);
        }

        return this.get('appTheme', false);
    }

    export function screensaver(val) {
        if (val !== undefined) {
            return this.set('screensaver', val, false);
        }

        return this.get('screensaver', false);
    }

    export function libraryPageSize(val) {
        if (val !== undefined) {
            return this.set('libraryPageSize', parseInt(val, 10), false);
        }

        var libraryPageSize = parseInt(this.get('libraryPageSize', false), 10);
        if (libraryPageSize === 0) {
            // Explicitly return 0 to avoid returning 100 because 0 is falsy.
            return 0;
        } else {
            return libraryPageSize || 100;
        }
    }

    export function soundEffects(val) {
        if (val !== undefined) {
            return this.set('soundeffects', val, false);
        }

        return this.get('soundeffects', false);
    }

    export function loadQuerySettings(key, query) {
        var values = this.get(key);
        if (values) {
            values = JSON.parse(values);
            return Object.assign(query, values);
        }

        return query;
    }

    export function saveQuerySettings(key, query) {
        var values = {};
        if (query.SortBy) {
            values.SortBy = query.SortBy;
        }

        if (query.SortOrder) {
            values.SortOrder = query.SortOrder;
        }

        return this.set(key, JSON.stringify(values));
    }

    export function getSubtitleAppearanceSettings(key) {
        key = key || 'localplayersubtitleappearance3';
        return JSON.parse(this.get(key, false) || '{}');
    }

    export function setSubtitleAppearanceSettings(value, key) {
        key = key || 'localplayersubtitleappearance3';
        return this.set(key, JSON.stringify(value), false);
    }

    export function setFilter(key, value) {
        return this.set(key, value, true);
    }

    export function getFilter(key) {
        return this.get(key, true);
    }

/* eslint-enable indent */
export default {
    setUserInfo: setUserInfo,
    getData: getData,
    importFrom: importFrom,
    set: set,
    get: get,
    serverConfig: serverConfig,
    enableCinemaMode: enableCinemaMode,
    enableNextVideoInfoOverlay: enableNextVideoInfoOverlay,
    enableThemeSongs: enableThemeSongs,
    enableThemeVideos: enableThemeVideos,
    enableFastFadein: enableFastFadein,
    enableBackdrops: enableBackdrops,
    language: language,
    dateTimeLocale: dateTimeLocale,
    skipBackLength: skipBackLength,
    skipForwardLength: skipForwardLength,
    dashboardTheme: dashboardTheme,
    skin: skin,
    theme: theme,
    screensaver: screensaver,
    libraryPageSize: libraryPageSize,
    soundEffects: soundEffects,
    loadQuerySettings: loadQuerySettings,
    saveQuerySettings: saveQuerySettings,
    getSubtitleAppearanceSettings: getSubtitleAppearanceSettings,
    setSubtitleAppearanceSettings: setSubtitleAppearanceSettings,
    setFilter: setFilter,
    getFilter: getFilter
};
