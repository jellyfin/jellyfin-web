import appSettings from './appSettings';
import Events from '../../utils/events';
import { toBoolean } from '../../utils/string';
import type { ApiClient } from 'jellyfin-apiclient';
import type { DisplayPreferencesDto, UserConfiguration } from '@jellyfin/sdk/lib/generated-client';

interface DisplayPreferences extends DisplayPreferencesDto {
    CustomPrefs: Record<string, string>;
}

function onSaveTimeout(this: UserSettings): Promise<void> {
    this.saveTimeout = null;
    // FIXME: correctly handle cases where instance properties are not set
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    return this.currentApiClient!.updateDisplayPreferences('usersettings', this.displayPrefs!, this.currentUserId!, 'emby');
}

function saveServerPreferences(instance: UserSettings) {
    if (instance.saveTimeout) {
        clearTimeout(instance.saveTimeout);
    }

    // FIXME: handle onSaveTimeout promise rejection
    instance.saveTimeout = setTimeout(onSaveTimeout.bind(instance), 50);
}

interface SubtitleAppearanceSettings {
    verticalPosition: number;
}
const defaultSubtitleAppearanceSettings: SubtitleAppearanceSettings = {
    verticalPosition: -3
};

interface ComicsPlayerSettings {
    langDir: string,
    pagesPerView: number
}
const defaultComicsPlayerSettings: ComicsPlayerSettings = {
    langDir: 'ltr',
    pagesPerView: 1
};

export class UserSettings {
    saveTimeout: ReturnType<typeof setTimeout>| null | undefined;
    currentUserId: string | undefined;
    displayPrefs: DisplayPreferences | null | undefined;
    currentApiClient: ApiClient | null | undefined;

    /**
     * Bind UserSettings instance to user.
     * @param {string} - User identifier.
     * @param {Object} - ApiClient instance.
     */
    setUserInfo(userId: string, apiClient: ApiClient): Promise<DisplayPreferencesDto | void> {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.currentUserId = userId;
        this.currentApiClient = apiClient;

        if (!userId) {
            this.displayPrefs = null;
            return Promise.resolve();
        }

        return apiClient.getDisplayPreferences('usersettings', userId, 'emby').then((result) => {
            this.displayPrefs = Object.assign(result, {
                CustomPrefs: result.CustomPrefs || {}
            });
        });
    }

    /**
     * Set value of setting.
     * @param {string} name - Name of setting.
     * @param {mixed} value - Value of setting.
     * @param {boolean} enableOnServer - Flag to save preferences on server.
     */
    set(name: string, value: string, enableOnServer?: boolean): void {
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
     * @param {boolean} enableOnServer - Flag to return preferences from server (cached).
     * @return {string} Value of setting.
     */
    get(name: string, enableOnServer?: boolean): string | null {
        const userId = this.currentUserId;
        if (enableOnServer !== false && this.displayPrefs) {
            return this.displayPrefs.CustomPrefs[name];
        }

        return appSettings.get(name, userId);
    }

    _handleBoolean(name: string, defaultValue: boolean, enableOnServer: boolean, val: boolean | undefined) {
        if (val !== undefined) {
            return this.set(name, val.toString(), enableOnServer);
        }

        return toBoolean(this.get(name, enableOnServer), defaultValue);
    }

    _handleNumber(name: string, defaultValue: number, enableOnServer: boolean, val: number | undefined) {
        if (val !== undefined) {
            return this.set(name, val.toString(), enableOnServer);
        }

        const loaded = parseInt(this.get(name, enableOnServer) || '', 10);
        if (loaded === 0) {
            // Explicitly return 0 to avoid returning default because 0 is falsy.
            return 0;
        } else {
            return loaded || defaultValue;
        }
    }

    /**
     * Get or set user config.
     * @param {Object|undefined} config - Configuration or undefined.
     * @return {Object|Promise} Configuration or Promise.
     */
    serverConfig(): Promise<UserConfiguration>;
    serverConfig(config: UserConfiguration): Promise<void>;
    serverConfig(config?: UserConfiguration): Promise<UserConfiguration | void> {
        // FIXME: correctly handle missing currentApiClient and currentUserId
        /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
        const apiClient = this.currentApiClient!;
        /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
        const currentUserId = this.currentUserId!;

        if (config) {
            return apiClient.updateUserConfiguration(currentUserId, config);
        }

        return apiClient.getUser(currentUserId).then(function (user) {
            return user.Configuration;
        });
    }

    /**
     * Get or set 'Allowed Audio Channels'.
     * @param {string|undefined} val - 'Allowed Audio Channels'.
     * @return {string} 'Allowed Audio Channels'.
     */
    allowedAudioChannels(): string;
    allowedAudioChannels(val: string): void;
    allowedAudioChannels(val?: string): string | void {
        if (val !== undefined) {
            return this.set('allowedAudioChannels', val, false);
        }

        return this.get('allowedAudioChannels', false) || '-1';
    }

    /**
     * Get or set 'Perfer fMP4-HLS Container' state.
     * @param {boolean|undefined} val - Flag to enable 'Perfer fMP4-HLS Container' or undefined.
     * @return {boolean} 'Prefer fMP4-HLS Container' state.
     */
    preferFmp4HlsContainer(): boolean;
    preferFmp4HlsContainer(val: boolean): void;
    preferFmp4HlsContainer(val?: boolean): boolean | void {
        if (val !== undefined) {
            return this.set('preferFmp4HlsContainer', val.toString(), false);
        }

        return toBoolean(this.get('preferFmp4HlsContainer', false), false);
    }

    /**
     * Get or set 'Cinema Mode' state.
     * @param {boolean|undefined} val - Flag to enable 'Cinema Mode' or undefined.
     * @return {boolean} 'Cinema Mode' state.
     */
    enableCinemaMode(): boolean;
    enableCinemaMode(val: boolean): void;
    enableCinemaMode(val?: boolean): boolean | void {
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
    selectAudioNormalization(): string;
    selectAudioNormalization(val: string): void;
    selectAudioNormalization(val?: string): string | void {
        if (val !== undefined) {
            return this.set('selectAudioNormalization', val, false);
        }

        return this.get('selectAudioNormalization', false) || 'TrackGain';
    }

    /**
     * Get or set 'Next Video Info Overlay' state.
     * @param {boolean|undefined} val - Flag to enable 'Next Video Info Overlay' or undefined.
     * @return {boolean} 'Next Video Info Overlay' state.
     */
    enableNextVideoInfoOverlay(): boolean;
    enableNextVideoInfoOverlay(val: boolean): void;
    enableNextVideoInfoOverlay(val?: boolean): boolean | void {
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
    enableVideoRemainingTime(): boolean;
    enableVideoRemainingTime(val: boolean): void;
    enableVideoRemainingTime(val?: boolean): boolean | void {
        if (val !== undefined) {
            return this.set('enableVideoRemainingTime', val.toString());
        }

        return toBoolean(this.get('enableVideoRemainingTime', false), true);
    }

    /**
     * Get or set 'Theme Songs' state.
     * @param {boolean|undefined} val - Flag to enable 'Theme Songs' or undefined.
     * @return {boolean} 'Theme Songs' state.
     */
    enableThemeSongs(): boolean;
    enableThemeSongs(val: boolean): void;
    enableThemeSongs(val?: boolean): boolean | void {
        if (val !== undefined) {
            return this.set('enableThemeSongs', val.toString(), false);
        }

        return toBoolean(this.get('enableThemeSongs', false), false);
    }

    /**
     * Get or set 'Theme Videos' state.
     * @param {boolean|undefined} val - Flag to enable 'Theme Videos' or undefined.
     * @return {boolean} 'Theme Videos' state.
     */
    enableThemeVideos(): boolean;
    enableThemeVideos(val: boolean): void;
    enableThemeVideos(val?: boolean): boolean | void {
        if (val !== undefined) {
            return this.set('enableThemeVideos', val.toString(), false);
        }

        return toBoolean(this.get('enableThemeVideos', false), false);
    }

    /**
     * Get or set 'Fast Fade-in' state.
     * @param {boolean|undefined} val - Flag to enable 'Fast Fade-in' or undefined.
     * @return {boolean} 'Fast Fade-in' state.
     */
    enableFastFadein(): boolean;
    enableFastFadein(val: boolean): void;
    enableFastFadein(val?: boolean): boolean | void {
        if (val !== undefined) {
            return this.set('fastFadein', val.toString(), false);
        }

        return toBoolean(this.get('fastFadein', false), true);
    }

    /**
     * Get or set 'Blurhash' state.
     * @param {boolean|undefined} val - Flag to enable 'Blurhash' or undefined.
     * @return {boolean} 'Blurhash' state.
     */
    enableBlurhash(): boolean;
    enableBlurhash(val: boolean): void;
    enableBlurhash(val?: boolean): boolean | void {
        if (val !== undefined) {
            return this.set('blurhash', val.toString(), false);
        }

        return toBoolean(this.get('blurhash', false), true);
    }

    /**
     * Get or set 'Backdrops' state.
     * @param {boolean|undefined} val - Flag to enable 'Backdrops' or undefined.
     * @return {boolean} 'Backdrops' state.
     */
    enableBackdrops(): boolean;
    enableBackdrops(val: boolean): void;
    enableBackdrops(val?: boolean): boolean | void {
        if (val !== undefined) {
            return this.set('enableBackdrops', val.toString(), false);
        }

        return toBoolean(this.get('enableBackdrops', false), false);
    }

    /**
     * Get or set 'disableCustomCss' state.
     * @param {boolean|undefined} val - Flag to enable 'disableCustomCss' or undefined.
     * @return {boolean} 'disableCustomCss' state.
     */
    disableCustomCss(): boolean;
    disableCustomCss(val: boolean): void;
    disableCustomCss(val?: boolean): boolean | void {
        if (val !== undefined) {
            return this.set('disableCustomCss', val.toString(), false);
        }

        return toBoolean(this.get('disableCustomCss', false), false);
    }

    /**
     * Get or set customCss.
     * @param {string|undefined} val - Language.
     * @return {string} Language.
     */
    customCss(): string | null;
    customCss(val: string): void;
    customCss(val?: string): string | null | void {
        if (val !== undefined) {
            return this.set('customCss', val.toString(), false);
        }

        return this.get('customCss', false);
    }

    /**
     * Get or set 'Details Banner' state.
     * @param {boolean|undefined} val - Flag to enable 'Details Banner' or undefined.
     * @return {boolean} 'Details Banner' state.
     */
    detailsBanner(): boolean;
    detailsBanner(val: boolean): void;
    detailsBanner(val?: boolean): boolean | void {
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
    useEpisodeImagesInNextUpAndResume(): boolean;
    useEpisodeImagesInNextUpAndResume(val: boolean): void;
    useEpisodeImagesInNextUpAndResume(val?: boolean): boolean | void {
        if (val !== undefined) {
            return this.set('useEpisodeImagesInNextUpAndResume', val.toString(), true);
        }

        return toBoolean(this.get('useEpisodeImagesInNextUpAndResume', true), false);
    }

    /**
     * Get or set language.
     * @param {string|undefined} val - Language.
     * @return {string} Language.
     */
    language(): string | null;
    language(val: string): void;
    language(val?: string): string | null | void {
        if (val !== undefined) {
            return this.set('language', val.toString(), false);
        }

        return this.get('language', false);
    }

    /**
     * Get or set datetime locale.
     * @param {string|undefined} val - Datetime locale.
     * @return {string} Datetime locale.
     */
    dateTimeLocale(): string | null;
    dateTimeLocale(val: string): void;
    dateTimeLocale(val?: string): string | null | void {
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
    skipBackLength(): number;
    skipBackLength(val: number): void;
    skipBackLength(val?: number): number | void {
        return this._handleNumber('skipBackLength', 10000, true, val);
    }

    /**
     * Get or set amount of fast forward.
     * @param {number|undefined} val - Amount of fast forward.
     * @return {number} Amount of fast forward.
     */
    skipForwardLength(): number;
    skipForwardLength(val: number): void;
    skipForwardLength(val?: number): number | void {
        return this._handleNumber('skipForwardLength', 30000, true, val);
    }

    /**
     * Get or set theme for Dashboard.
     * @param {string|undefined} val - Theme for Dashboard.
     * @return {string} Theme for Dashboard.
     */
    dashboardTheme(): string | null;
    dashboardTheme(val: string): void;
    dashboardTheme(val?: string): string | null | void {
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
    skin(): string | null;
    skin(val: string): void;
    skin(val?: string): string | null | void {
        if (val !== undefined) {
            return this.set('skin', val, false);
        }

        return this.get('skin', false);
    }

    /**
     * Get or set main theme.
     * @param {string|undefined} val - Main theme.
     * @return {string} Main theme.
     */
    theme(): string | null;
    theme(val: string): void;
    theme(val?: string): string | null | void {
        if (val !== undefined) {
            return this.set('appTheme', val, false);
        }

        return this.get('appTheme', false);
    }

    /**
     * Get or set screensaver.
     * @param {string|undefined} val - Screensaver.
     * @return {string} Screensaver.
     */
    screensaver(): string | null;
    screensaver(val: string): void;
    screensaver(val?: string): string | null | void {
        if (val !== undefined) {
            return this.set('screensaver', val, false);
        }

        return this.get('screensaver', false);
    }

    /**
     * Get or set the interval between backdrops when using the backdrop screensaver.
     * @param {number|undefined} val - The interval between backdrops in seconds.
     * @return {number} The interval between backdrops in seconds.
     */
    backdropScreensaverInterval(): number;
    backdropScreensaverInterval(val: number): void;
    backdropScreensaverInterval(val?: number): number | void {
        return this._handleNumber('backdropScreensaverInterval', 5, false, val);
    }

    /**
     * Get or set library page size.
     * @param {number|undefined} val - Library page size.
     * @return {number} Library page size.
     */
    libraryPageSize(): number;
    libraryPageSize(val: number): void;
    libraryPageSize(val?: number): number | void {
        return this._handleNumber('libraryPageSize', 100, false, val);
    }

    /**
     * Get or set max days for next up list.
     * @param {number|undefined} [val] - Max days for next up.
     * @return {number} Max days for a show to stay in next up without being watched.
     */
    maxDaysForNextUp(): number;
    maxDaysForNextUp(val: number): void;
    maxDaysForNextUp(val?: number): number | void {
        return this._handleNumber('maxDaysForNextUp', 365, false, val);
    }

    /**
     * Get or set rewatching in next up.
     * @param {boolean|undefined} [val] - If rewatching items should be included in next up.
     * @returns {boolean} Rewatching in next up state.
     */
    enableRewatchingInNextUp(): boolean;
    enableRewatchingInNextUp(val: boolean): void;
    enableRewatchingInNextUp(val?: boolean): boolean | void {
        if (val !== undefined) {
            return this.set('enableRewatchingInNextUp', val.toString(), false);
        }

        return toBoolean(this.get('enableRewatchingInNextUp', false), false);
    }

    /**
     * Get or set sound effects.
     * @param {string|null|undefined} val - Sound effects.
     * @return {string} Sound effects.
     */
    soundEffects(): string | null;
    soundEffects(val: string): void;
    soundEffects(val?: string): string | null | void {
        if (val !== undefined) {
            return this.set('soundeffects', val, false);
        }

        return this.get('soundeffects', false);
    }

    /**
     * Load query settings.
     * @param {string} key - Query key.
     * @param {Object} query - Query base.
     * @return {Query} Query.
     */
    loadQuerySettings<T extends object>(key: string, query: T): T {
        let values = this.get(key);
        if (values) {
            values = JSON.parse(values);
            return Object.assign(query, values);
        }

        return query;
    }

    /**
     * Save query settings.
     * @param {string} key - Query key.
     * @param {Object} query - Query.
     */
    saveQuerySettings(key: string, query: { SortBy?: unknown, SortOrder?: unknown}) {
        const values: typeof query = {};
        if (query.SortBy) {
            values.SortBy = query.SortBy;
        }

        if (query.SortOrder) {
            values.SortOrder = query.SortOrder;
        }

        return this.set(key, JSON.stringify(values));
    }

    /**
     * Get view layout setting.
     * @param {string} key - View Setting key.
     * @return {string} View Setting value.
     */
    getSavedView(key: string): string | null {
        return this.get(key + '-_view');
    }

    /**
     * Set view layout setting.
     * @param {string} key - View Setting key.
     * @param {string} value - View Setting value.
     */
    saveViewSetting(key: string, value: string): void {
        return this.set(key + '-_view', value);
    }

    /**
     * Get subtitle appearance settings.
     * @param {string|undefined} key - Settings key.
     * @return {Object} Subtitle appearance settings.
     */
    getSubtitleAppearanceSettings(key?: string): SubtitleAppearanceSettings {
        key = key || 'localplayersubtitleappearance3';
        return Object.assign(defaultSubtitleAppearanceSettings, JSON.parse(this.get(key, false) || '{}'));
    }

    /**
     * Set subtitle appearance settings.
     * @param {Object} value - Subtitle appearance settings.
     * @param {string|undefined} key - Settings key.
     */
    setSubtitleAppearanceSettings(value: SubtitleAppearanceSettings, key: string) {
        key = key || 'localplayersubtitleappearance3';
        return this.set(key, JSON.stringify(value), false);
    }

    /**
     * Get comics player settings.
     * @param {string} mediaSourceId - Media Source Id.
     * @return {Object} Comics player settings.
     */
    getComicsPlayerSettings(mediaSourceId: string): ComicsPlayerSettings {
        const settings = JSON.parse(this.get('comicsPlayerSettings', false) || '{}');
        return Object.assign(defaultComicsPlayerSettings, settings[mediaSourceId]);
    }

    /**
     * Set comics player settings.
     * @param {Object} value - Comics player settings.
     * @param {string} mediaSourceId - Media Source Id.
     */
    setComicsPlayerSettings(value: ComicsPlayerSettings, mediaSourceId: string): void {
        const settings = JSON.parse(this.get('comicsPlayerSettings', false) || '{}');
        settings[mediaSourceId] = value;
        return this.set('comicsPlayerSettings', JSON.stringify(settings), false);
    }

    /**
     * Set filter.
     * @param {string} key - Filter key.
     * @param {string} value - Filter value.
     */
    setFilter(key: string, value: string): void {
        return this.set(key, value, true);
    }

    /**
     * Get filter.
     * @param {string} key - Filter key.
     * @return {string} Filter value.
     */
    getFilter(key: string): string | null {
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
    getSortValuesLegacy(key: string, defaultSortBy: string) {
        return {
            sortBy: this.getFilter(key + '-sortby') || defaultSortBy,
            sortOrder: this.getFilter(key + '-sortorder') === 'Descending' ? 'Descending' : 'Ascending'
        };
    }
}

export const currentSettings = new UserSettings;

// Wrappers for non-ES6 modules and backward compatibility
export const setUserInfo = currentSettings.setUserInfo.bind(currentSettings);
export const set = currentSettings.set.bind(currentSettings);
export const get = currentSettings.get.bind(currentSettings);
export const serverConfig = currentSettings.serverConfig.bind(currentSettings);
export const allowedAudioChannels = currentSettings.allowedAudioChannels.bind(currentSettings);
export const preferFmp4HlsContainer = currentSettings.preferFmp4HlsContainer.bind(currentSettings);
export const enableCinemaMode = currentSettings.enableCinemaMode.bind(currentSettings);
export const selectAudioNormalization = currentSettings.selectAudioNormalization.bind(currentSettings);
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
