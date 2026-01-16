import Events from '../../utils/events.ts';
import { toBoolean } from '../../utils/string.ts';
import { setXDuration } from 'components/audioEngine/crossfader.logic';
import browser from '../browser';
import appSettings from './appSettings';
import { getDefaultVisualizerSettings, getVisualizerSettings, setVisualizerSettings } from 'components/visualizer/visualizers.logic';

let displayPrefsBeaconWarningShown = false;

function getDevServerAddress() {
    if (typeof __WEBPACK_SERVE__ === 'undefined' || typeof __DEV_SERVER_PROXY_TARGET__ === 'undefined') {
        return null;
    }
    if (!__WEBPACK_SERVE__ || !__DEV_SERVER_PROXY_TARGET__) {
        return null;
    }
    return typeof window !== 'undefined' && window.location ? window.location.origin : null;
}

function applyDevServerAddress(apiClient) {
    const devAddress = getDevServerAddress();
    if (!devAddress || !apiClient || typeof apiClient.serverAddress !== 'function') {
        return;
    }
    if (apiClient.serverAddress() !== devAddress) {
        apiClient.serverAddress(devAddress);
    }
}

function onSaveTimeout() {
    const self = this;
    self.saveTimeout = null;
    const apiClient = self.currentApiClient;
    if (!apiClient || !self.displayPrefs) {
        return;
    }
    applyDevServerAddress(apiClient);
    const prefsUrl = apiClient.getUrl('DisplayPreferences/usersettings', {
        userId: self.currentUserId,
        client: 'emby',
        api_key: apiClient.accessToken()
    });
    if (isCrossOriginUrl(prefsUrl)) {
        const payload = new Blob([JSON.stringify(self.displayPrefs)], { type: 'application/json' });
        const sent = navigator?.sendBeacon?.(prefsUrl, payload);
        if (!sent && !displayPrefsBeaconWarningShown) {
            displayPrefsBeaconWarningShown = true;
            console.warn('[UserSettings] failed to send display preferences to cross-origin server');
        }
        return;
    }
    self.currentApiClient.updateDisplayPreferences('usersettings', self.displayPrefs, self.currentUserId, 'emby');
}

function saveServerPreferences(instance) {
    if (instance.saveTimeout) {
        clearTimeout(instance.saveTimeout);
    }

    instance.saveTimeout = setTimeout(onSaveTimeout.bind(instance), 50);
}

const allowedSortSettings = ['SortBy', 'SortOrder'];

const filterSettingsPostfix = '-filter';
const allowedFilterSettings = [
    'Filters', 'HasSubtitles', 'HasTrailer', 'HasSpecialFeature',
    'HasThemeSong', 'HasThemeVideo', 'Genres', 'OfficialRatings',
    'Tags', 'VideoTypes', 'IsSD', 'IsHD', 'Is4K', 'Is3D',
    'IsFavorite', 'IsMissing', 'IsUnaired', 'ParentIndexNumber',
    'SeriesStatus', 'Years'
];

function filterQuerySettings(query, allowedItems) {
    return Object.keys(query)
        .filter(field => allowedItems.includes(field))
        .reduce((acc, field) => {
            acc[field] = query[field];
            return acc;
        }, {});
}

const defaultSubtitleAppearanceSettings = {
    verticalPosition: -3
};

const defaultComicsPlayerSettings = {
    langDir: 'ltr',
    pagesPerView: 1
};

function isCrossOriginServer(apiClient) {
    if (typeof window === 'undefined' || !window.location) {
        return false;
    }
    try {
        const probeUrl = apiClient?.getUrl ? apiClient.getUrl('System/Info/Public') : null;
        if (probeUrl && probeUrl.indexOf('://') !== -1) {
            return new URL(probeUrl).origin !== window.location.origin;
        }
        const serverAddress = apiClient?.serverAddress ? apiClient.serverAddress() : null;
        if (!serverAddress) {
            return false;
        }
        return new URL(serverAddress, window.location.href).origin !== window.location.origin;
    } catch (err) {
        return false;
    }
}

function isCrossOriginUrl(url) {
    if (typeof window === 'undefined' || !window.location) {
        return false;
    }
    try {
        return new URL(url, window.location.href).origin !== window.location.origin;
    } catch (err) {
        return false;
    }
}

export class UserSettings {
    /**
     * Bind UserSettings instance to user.
     * @param {string} - User identifier.
     * @param {Object} - ApiClient instance.
     */
    setUserInfo(userId, apiClient) {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.currentUserId = userId;
        this.currentApiClient = apiClient;

        if (!userId) {
            this.displayPrefs = null;
            return Promise.resolve();
        }

        const self = this;

        applyDevServerAddress(apiClient);
        return apiClient.getDisplayPreferences('usersettings', userId, 'emby').then(function (result) {
            result.CustomPrefs = result.CustomPrefs || {};
            self.displayPrefs = result;
        });
    }

    // FIXME: Seems unused
    getData() {
        return this.displayPrefs;
    }

    // FIXME: Seems unused
    importFrom(instance) {
        this.displayPrefs = instance.getData();
    }

    // FIXME: 'appSettings.set' doesn't return any value
    /**
     * Set value of setting.
     * @param {string} name - Name of setting.
     * @param {mixed} value - Value of setting.
     * @param {boolean} [enableOnServer] - Flag to save preferences on server.
     */
    set(name, value, enableOnServer) {
        const userId = this.currentUserId;
        const currentValue = this.get(name, enableOnServer);
        const result = appSettings.set(name, value, userId);

        if (enableOnServer !== false && this.displayPrefs) {
            this.displayPrefs.CustomPrefs[name] = value == null ? value : value.toString();
            saveServerPreferences(this);
        }

        if (currentValue !== value) {
            Events.trigger(this, 'change', [name]);
        }

        return result;
    }

    /**
     * Get value of setting.
     * @param {string} name - Name of setting.
     * @param {boolean} [enableOnServer] - Flag to return preferences from server (cached).
     * @return {string | null} Value of setting.
     */
    get(name, enableOnServer) {
        const userId = this.currentUserId;
        if (enableOnServer !== false && this.displayPrefs) {
            const serverValue = this.displayPrefs.CustomPrefs[name];
            if (serverValue !== undefined) {
                return serverValue;
            }
        }

        return appSettings.get(name, userId);
    }

    /**
     * Get or set user config.
     * @param {Object|undefined} config - Configuration or undefined.
     * @return {Object|Promise} Configuration or Promise.
     */
    serverConfig(config) {
        const apiClient = this.currentApiClient;
        if (config) {
            return apiClient.updateUserConfiguration(this.currentUserId, config);
        }

        return apiClient.getUser(this.currentUserId).then(function (user) {
            return user.Configuration;
        });
    }

    /**
     * Get or set 'Allowed Audio Channels'.
     * @param {string|undefined} val - 'Allowed Audio Channels'.
     * @return {string} 'Allowed Audio Channels'.
     */
    allowedAudioChannels(val) {
        if (val !== undefined) {
            return this.set('allowedAudioChannels', val, false);
        }

        return this.get('allowedAudioChannels', false) || '-1';
    }

    /**
     * Get or set 'Prefer fMP4-HLS Container' state.
     * @param {boolean|undefined} val - Flag to enable 'Prefer fMP4-HLS Container' or undefined.
     * @return {boolean} 'Prefer fMP4-HLS Container' state.
     */
    preferFmp4HlsContainer(val) {
        if (val !== undefined) {
            return this.set('preferFmp4HlsContainer', val.toString(), false);
        }

        // Enable it by default only for the platforms that play fMP4 for sure.
        return toBoolean(this.get('preferFmp4HlsContainer', false), browser.safari || browser.firefox || browser.chrome || browser.edgeChromium);
    }

    /**
     * Get or set 'Limit Segment Length' state.
     * @param {boolean|undefined} val - Flag to enable 'Limit Segment Length' or undefined.
     * @returns {boolean} 'Limit Segment Length' state.
     */
    limitSegmentLength(val) {
        if (val !== undefined) {
            return this.set('limitSegmentLength', val.toString(), false);
        }

        return toBoolean(this.get('limitSegmentLength', false), false);
    }

    /**
     * Get or set 'Cinema Mode' state.
     * @param {boolean|undefined} val - Flag to enable 'Cinema Mode' or undefined.
     * @return {boolean} 'Cinema Mode' state.
     */
    enableCinemaMode(val) {
        if (val !== undefined) {
            return this.set('enableCinemaMode', val.toString(), false);
        }

        return toBoolean(this.get('enableCinemaMode', false), true);
    }

    /**
     * Get or set 'Enable Audio Normalization' state.
     * @param {string|undefined} val - Flag to enable 'Enable Audio Normalization' or undefined.
     * @return {string} 'Enable Audio Normalization' state.
     */
    selectAudioNormalization(val) {
        if (val !== undefined) {
            return this.set('selectAudioNormalization', val, true);
        }

        return this.get('selectAudioNormalization', true) || 'AlbumGain';
    }

    /**
     * Get or set 'CrossfadeDuration' state.
     * @param {number|undefined} val - Flag to set duration for crossfade or disable with a negative value
     * @return {number} crossfade duration in seconds
     */
    crossfadeDuration(val) {
        if (val !== undefined) {
            setXDuration(val);
            return this.set('crossfadeDuration', val.toString(), true);
        }

        let stored = this.get('crossfadeDuration', true);
        if (stored == null && this.displayPrefs) {
            stored = appSettings.get('crossfadeDuration', this.currentUserId);
        }
        const parsed = parseFloat(stored);
        if (Number.isNaN(parsed)) {
            return 3;
        }
        return parsed;
    }

    /**
     * Get or set 'Visualizer' state.
     * @param {string|undefined} val - Flag to set Visualizer state
     * @return {typeof visualizerSettings} parsed visualizer settings object
     */
    visualizerConfiguration(val) {
        if (val !== undefined) {
            setVisualizerSettings(val);
            return this.set('visualizerConfiguration', getVisualizerSettings(), true);
        }

        let raw = this.get('visualizerConfiguration', true);
        if (!raw && this.displayPrefs) {
            raw = appSettings.get('visualizerConfiguration', this.currentUserId);
        }
        if (!raw) {
            setVisualizerSettings(null);
            return JSON.parse(getVisualizerSettings());
        }

        try {
            const parsed = JSON.parse(raw);
            setVisualizerSettings(parsed);
            return JSON.parse(getVisualizerSettings());
        } catch (error) {
            setVisualizerSettings(null);
            return JSON.parse(getVisualizerSettings());
        }
    }

    /**
     * Get or set 'Next Video Info Overlay' state.
     * @param {boolean|undefined} [val] - Flag to enable 'Next Video Info Overlay' or undefined.
     * @return {boolean} 'Next Video Info Overlay' state.
     */
    enableNextVideoInfoOverlay(val) {
        if (val !== undefined) {
            return this.set('enableNextVideoInfoOverlay', val.toString());
        }

        return toBoolean(this.get('enableNextVideoInfoOverlay', false), true);
    }

    /**
     * Get or set 'Video Remaining/Total Time' state.
     * @param {boolean|undefined} val - Flag to enable 'Video Remaining/Total Time' or undefined.
     * @return {boolean} 'Video Remaining/Total Time' state.
     */
    enableVideoRemainingTime(val) {
        if (val !== undefined) {
            return this.set('enableVideoRemainingTime', val.toString());
        }

        return toBoolean(this.get('enableVideoRemainingTime', false), true);
    }

    /**
     * Get or set 'Theme Songs' state.
     * @param {boolean|undefined} [val] - Flag to enable 'Theme Songs' or undefined.
     * @return {boolean} 'Theme Songs' state.
     */
    enableThemeSongs(val) {
        if (val !== undefined) {
            return this.set('enableThemeSongs', val.toString(), false);
        }

        return toBoolean(this.get('enableThemeSongs', false), false);
    }

    /**
     * Get or set 'Theme Videos' state.
     * @param {boolean|undefined} [val] - Flag to enable 'Theme Videos' or undefined.
     * @return {boolean} 'Theme Videos' state.
     */
    enableThemeVideos(val) {
        if (val !== undefined) {
            return this.set('enableThemeVideos', val.toString(), false);
        }

        return toBoolean(this.get('enableThemeVideos', false), false);
    }

    /**
     * Get or set 'Fast Fade-in' state.
     * @param {boolean|undefined} [val] - Flag to enable 'Fast Fade-in' or undefined.
     * @return {boolean} 'Fast Fade-in' state.
     */
    enableFastFadein(val) {
        if (val !== undefined) {
            return this.set('fastFadein', val.toString(), false);
        }

        return toBoolean(this.get('fastFadein', false), true);
    }

    /**
     * Get or set 'Blurhash' state.
     * @param {boolean|undefined} [val] - Flag to enable 'Blurhash' or undefined.
     * @return {boolean} 'Blurhash' state.
     */
    enableBlurhash(val) {
        if (val !== undefined) {
            return this.set('blurhash', val.toString(), false);
        }

        return toBoolean(this.get('blurhash', false), true);
    }

    /**
     * Get or set 'Backdrops' state.
     * @param {boolean|undefined} [val] - Flag to enable 'Backdrops' or undefined.
     * @return {boolean} 'Backdrops' state.
     */
    enableBackdrops(val) {
        if (val !== undefined) {
            return this.set('enableBackdrops', val.toString(), true);
        }

        return toBoolean(this.get('enableBackdrops', true), false);
    }

    /**
     * Get or set 'disableCustomCss' state.
     * @param {boolean|undefined} [val] - Flag to enable 'disableCustomCss' or undefined.
     * @return {boolean} 'disableCustomCss' state.
     */
    disableCustomCss(val) {
        if (val !== undefined) {
            return this.set('disableCustomCss', val.toString(), false);
        }

        return toBoolean(this.get('disableCustomCss', false), false);
    }

    /**
     * Get or set customCss.
     * @param {string|undefined} [val] - Language.
     * @return {string} Language.
     */
    customCss(val) {
        if (val !== undefined) {
            return this.set('customCss', val.toString(), false);
        }

        return this.get('customCss', false);
    }

    /**
     * Get or set 'Details Banner' state.
     * @param {boolean|undefined} [val] - Flag to enable 'Details Banner' or undefined.
     * @return {boolean} 'Details Banner' state.
     */
    detailsBanner(val) {
        if (val !== undefined) {
            return this.set('detailsBanner', val.toString(), false);
        }

        return toBoolean(this.get('detailsBanner', false), true);
    }

    /**
     * Get or set 'Use Episode Images in Next Up and Continue Watching' state.
     * @param {string|boolean|undefined} [val] - Flag to enable 'Use Episode Images in Next Up and Continue Watching' or undefined.
     * @return {boolean} 'Use Episode Images in Next Up' state.
     */
    useEpisodeImagesInNextUpAndResume(val) {
        if (val !== undefined) {
            return this.set('useEpisodeImagesInNextUpAndResume', val.toString(), true);
        }

        return toBoolean(this.get('useEpisodeImagesInNextUpAndResume', true), false);
    }

    /**
     * Get or set language.
     * @param {string|undefined} [val] - Language.
     * @return {string} Language.
     */
    language(val) {
        if (val !== undefined) {
            return this.set('language', val.toString(), false);
        }

        return this.get('language', false);
    }

    /**
     * Get or set datetime locale.
     * @param {string|undefined} [val] - Datetime locale.
     * @return {string} Datetime locale.
     */
    dateTimeLocale(val) {
        if (val !== undefined) {
            return this.set('datetimelocale', val.toString(), false);
        }

        return this.get('datetimelocale', false);
    }

    /**
     * Get or set amount of rewind.
     * @param {number|undefined} val - Amount of rewind.
     * @return {number} Amount of rewind.
     */
    skipBackLength(val) {
        if (val !== undefined) {
            return this.set('skipBackLength', val.toString());
        }

        return parseInt(this.get('skipBackLength') || '10000', 10);
    }

    /**
     * Get or set amount of fast forward.
     * @param {number|undefined} val - Amount of fast forward.
     * @return {number} Amount of fast forward.
     */
    skipForwardLength(val) {
        if (val !== undefined) {
            return this.set('skipForwardLength', val.toString());
        }

        return parseInt(this.get('skipForwardLength') || '30000', 10);
    }

    /**
     * Get or set theme for Dashboard.
     * @param {string|undefined} [val] - Theme for Dashboard.
     * @return {string} Theme for Dashboard.
     */
    dashboardTheme(val) {
        if (val !== undefined) {
            return this.set('dashboardTheme', val);
        }

        return this.get('dashboardTheme');
    }

    /**
     * Get or set skin.
     * @param {string|undefined} val - Skin.
     * @return {string} Skin.
     */
    skin(val) {
        if (val !== undefined) {
            return this.set('skin', val, false);
        }

        return this.get('skin', false);
    }

    /**
     * Get or set main theme.
     * @param {string|undefined} [val] - Main theme.
     * @return {string} Main theme.
     */
    theme(val) {
        if (val !== undefined) {
            return this.set('appTheme', val, false);
        }

        return this.get('appTheme', false);
    }

    /**
     * Get or set screensaver.
     * @param {string|undefined} [val] - Screensaver.
     * @return {string} Screensaver.
     */
    screensaver(val) {
        if (val !== undefined) {
            return this.set('screensaver', val, false);
        }

        return this.get('screensaver', false);
    }

    /**
     * Get or set the interval between backdrops when using the backdrop screensaver.
     * @param {number|undefined} [val] - The interval between backdrops in seconds.
     * @return {number} The interval between backdrops in seconds.
     */
    backdropScreensaverInterval(val) {
        if (val !== undefined) {
            return this.set('backdropScreensaverInterval', val.toString(), false);
        }

        return parseInt(this.get('backdropScreensaverInterval', false), 10) || 5;
    }

    /**
     * Get or set the interval between slides when using the slideshow.
     * @param {number|undefined} [val] - The interval between slides in seconds.
     * @return {number} The interval between slides in seconds.
     */
    slideshowInterval(val) {
        if (val !== undefined) {
            return this.set('slideshowInterval', val.toString(), false);
        }

        return parseInt(this.get('slideshowInterval', false), 10) || 5;
    }

    /**
     * Get or set the amount of time it takes to activate the screensaver in seconds. Default 3 minutes.
     * @param {number|undefined} [val] - The amount of time it takes to activate the screensaver in seconds.
     * @return {number} The amount of time it takes to activate the screensaver in seconds.
     */
    screensaverTime(val) {
        if (val !== undefined) {
            return this.set('screensaverTime', val.toString(), false);
        }

        return parseInt(this.get('screensaverTime', false), 10) || 180;
    }

    /**
     * Get or set library page size.
     * @param {number|undefined} [val] - Library page size.
     * @return {number} Library page size.
     */
    libraryPageSize(val) {
        if (val !== undefined) {
            return this.set('libraryPageSize', val.toString(), false);
        }

        const libraryPageSize = parseInt(this.get('libraryPageSize', false), 10);
        if (!libraryPageSize) {
            // Explicitly return 0 to avoid returning 100 because 0 is falsy.
            return 0;
        } else {
            return libraryPageSize || 90;
        }
    }

    /**
     * Get or set max days for next up list.
     * @param {number|undefined} [val] - Max days for next up.
     * @return {number} Max days for a show to stay in next up without being watched.
     */
    maxDaysForNextUp(val) {
        if (val !== undefined) {
            return this.set('maxDaysForNextUp', val.toString(), false);
        }

        const maxDaysForNextUp = parseInt(this.get('maxDaysForNextUp', false), 10);
        if (maxDaysForNextUp === 0) {
            // Explicitly return 0 to avoid returning 100 because 0 is falsy.
            return 0;
        } else {
            return maxDaysForNextUp || 365;
        }
    }

    /**
     * Get or set rewatching in next up.
     * @param {boolean|undefined} [val] - If rewatching items should be included in next up.
     * @returns {boolean} Rewatching in next up state.
     */
    enableRewatchingInNextUp(val) {
        if (val !== undefined) {
            return this.set('enableRewatchingInNextUp', val.toString(), false);
        }

        return toBoolean(this.get('enableRewatchingInNextUp', false), false);
    }

    /**
     * Get or set sound effects.
     * @param {string|undefined} val - Sound effects.
     * @return {string} Sound effects.
     */
    soundEffects(val) {
        if (val !== undefined) {
            return this.set('soundeffects', val, false);
        }

        return this.get('soundeffects', false);
    }

    /**
    * @typedef {Object} Query
    * @property {number} StartIndex - query StartIndex.
    * @property {number} Limit - query Limit.
    */

    /**
     * Load query settings.
     * @param {string} key - Query key.
     * @param {Object} query - Query base.
     * @return {Query} Query.
     */
    loadQuerySettings(key, query) {
        let sortSettings = this.get(key);
        let filterSettings = this.get(key + filterSettingsPostfix, false);

        if (sortSettings) {
            sortSettings = filterQuerySettings(JSON.parse(sortSettings), allowedSortSettings);
        }
        if (filterSettings) {
            filterSettings = filterQuerySettings(JSON.parse(filterSettings), allowedFilterSettings);
        }

        return Object.assign(query, sortSettings, filterSettings);
    }

    /**
     * Save query settings.
     * @param {string} key - Query key.
     * @param {Object} query - Query.
     */
    saveQuerySettings(key, query) {
        const sortSettings = filterQuerySettings(query, allowedSortSettings);
        const filterSettings = filterQuerySettings(query, allowedFilterSettings);

        this.set(key, JSON.stringify(sortSettings));
        this.set(key + filterSettingsPostfix, JSON.stringify(filterSettings), false);
    }

    /**
     * Get view layout setting.
     * @param {string} key - View Setting key.
     * @return {string} View Setting value.
     */
    getSavedView(key) {
        return this.get(key + '-_view');
    }

    /**
     * Set view layout setting.
     * @param {string} key - View Setting key.
     * @param {string} value - View Setting value.
     */
    saveViewSetting(key, value) {
        return this.set(key + '-_view', value);
    }

    /**
     * Get subtitle appearance settings.
     * @param {string|undefined} [key] - Settings key.
     * @return {Object} Subtitle appearance settings.
     */
    getSubtitleAppearanceSettings(key) {
        key = key || 'localplayersubtitleappearance3';
        return Object.assign(defaultSubtitleAppearanceSettings, JSON.parse(this.get(key, false) || '{}'));
    }

    /**
     * Set subtitle appearance settings.
     * @param {Object} value - Subtitle appearance settings.
     * @param {string|undefined} key - Settings key.
     */
    setSubtitleAppearanceSettings(value, key) {
        key = key || 'localplayersubtitleappearance3';
        return this.set(key, JSON.stringify(value), false);
    }

    /**
     * Get comics player settings.
     * @param {string} mediaSourceId - Media Source Id.
     * @return {Object} Comics player settings.
     */
    getComicsPlayerSettings(mediaSourceId) {
        const settings = JSON.parse(this.get('comicsPlayerSettings', false) || '{}');
        return Object.assign(defaultComicsPlayerSettings, settings[mediaSourceId]);
    }

    /**
     * Set comics player settings.
     * @param {Object} value - Comics player settings.
     * @param {string} mediaSourceId - Media Source Id.
     */
    setComicsPlayerSettings(value, mediaSourceId) {
        const settings = JSON.parse(this.get('comicsPlayerSettings', false) || '{}');
        settings[mediaSourceId] = value;
        return this.set('comicsPlayerSettings', JSON.stringify(settings), false);
    }

    /**
     * Set filter.
     * @param {string} key - Filter key.
     * @param {string} value - Filter value.
     */
    setFilter(key, value) {
        return this.set(key, value, true);
    }

    /**
     * Get filter.
     * @param {string} key - Filter key.
     * @return {string} Filter value.
     */
    getFilter(key) {
        return this.get(key, true);
    }

    /**
     * Gets the current sort values (Legacy - Non-JSON)
     * (old views such as list.js [Photos] will
     * use this one)
     * @param {string} key - Filter key.
     * @param {string} defaultSortBy - Default SortBy value.
     * @return {Object} sortOptions object
     */
    getSortValuesLegacy(key, defaultSortBy) {
        return {
            sortBy: this.getFilter(key + '-sortby') || defaultSortBy,
            sortOrder: this.getFilter(key + '-sortorder') === 'Descending' ? 'Descending' : 'Ascending'
        };
    }
}

export const currentSettings = new UserSettings;

// Wrappers for non-ES6 modules and backward compatibility
export const setUserInfo = currentSettings.setUserInfo.bind(currentSettings);
export const getData = currentSettings.getData.bind(currentSettings);
export const importFrom = currentSettings.importFrom.bind(currentSettings);
export const set = currentSettings.set.bind(currentSettings);
export const get = currentSettings.get.bind(currentSettings);
export const serverConfig = currentSettings.serverConfig.bind(currentSettings);
export const allowedAudioChannels = currentSettings.allowedAudioChannels.bind(currentSettings);
export const preferFmp4HlsContainer = currentSettings.preferFmp4HlsContainer.bind(currentSettings);
export const limitSegmentLength = currentSettings.limitSegmentLength.bind(currentSettings);
export const enableCinemaMode = currentSettings.enableCinemaMode.bind(currentSettings);
export const selectAudioNormalization = currentSettings.selectAudioNormalization.bind(currentSettings);
export const crossfadeDuration = currentSettings.crossfadeDuration.bind(currentSettings);
export const visualizerConfiguration = currentSettings.visualizerConfiguration.bind(currentSettings);
export const enableNextVideoInfoOverlay = currentSettings.enableNextVideoInfoOverlay.bind(currentSettings);
export const enableVideoRemainingTime = currentSettings.enableVideoRemainingTime.bind(currentSettings);
export const enableThemeSongs = currentSettings.enableThemeSongs.bind(currentSettings);
export const enableThemeVideos = currentSettings.enableThemeVideos.bind(currentSettings);
export const enableFastFadein = currentSettings.enableFastFadein.bind(currentSettings);
export const enableBlurhash = currentSettings.enableBlurhash.bind(currentSettings);
export const enableBackdrops = currentSettings.enableBackdrops.bind(currentSettings);
export const detailsBanner = currentSettings.detailsBanner.bind(currentSettings);
export const useEpisodeImagesInNextUpAndResume = currentSettings.useEpisodeImagesInNextUpAndResume.bind(currentSettings);
export const language = currentSettings.language.bind(currentSettings);
export const dateTimeLocale = currentSettings.dateTimeLocale.bind(currentSettings);
export const skipBackLength = currentSettings.skipBackLength.bind(currentSettings);
export const skipForwardLength = currentSettings.skipForwardLength.bind(currentSettings);
export const dashboardTheme = currentSettings.dashboardTheme.bind(currentSettings);
export const skin = currentSettings.skin.bind(currentSettings);
export const theme = currentSettings.theme.bind(currentSettings);
export const screensaver = currentSettings.screensaver.bind(currentSettings);
export const backdropScreensaverInterval = currentSettings.backdropScreensaverInterval.bind(currentSettings);
export const slideshowInterval = currentSettings.slideshowInterval.bind(currentSettings);
export const screensaverTime = currentSettings.screensaverTime.bind(currentSettings);
export const libraryPageSize = currentSettings.libraryPageSize.bind(currentSettings);
export const maxDaysForNextUp = currentSettings.maxDaysForNextUp.bind(currentSettings);
export const enableRewatchingInNextUp = currentSettings.enableRewatchingInNextUp.bind(currentSettings);
export const soundEffects = currentSettings.soundEffects.bind(currentSettings);
export const loadQuerySettings = currentSettings.loadQuerySettings.bind(currentSettings);
export const saveQuerySettings = currentSettings.saveQuerySettings.bind(currentSettings);
export const getSubtitleAppearanceSettings = currentSettings.getSubtitleAppearanceSettings.bind(currentSettings);
export const setSubtitleAppearanceSettings = currentSettings.setSubtitleAppearanceSettings.bind(currentSettings);
export const getComicsPlayerSettings = currentSettings.getComicsPlayerSettings.bind(currentSettings);
export const setComicsPlayerSettings = currentSettings.setComicsPlayerSettings.bind(currentSettings);
export const setFilter = currentSettings.setFilter.bind(currentSettings);
export const getFilter = currentSettings.getFilter.bind(currentSettings);
export const customCss = currentSettings.customCss.bind(currentSettings);
export const disableCustomCss = currentSettings.disableCustomCss.bind(currentSettings);
export const getSavedView = currentSettings.getSavedView.bind(currentSettings);
export const saveViewSetting = currentSettings.saveViewSetting.bind(currentSettings);
export const getSortValuesLegacy = currentSettings.getSortValuesLegacy.bind(currentSettings);
