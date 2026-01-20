import Events from '../../utils/events';
import { toBoolean } from '../../utils/string';
import { setXDuration } from 'components/audioEngine/crossfader.logic';
import browser from '../browser';
import appSettings from './appSettings';
import { getDefaultVisualizerSettings, getVisualizerSettings, setVisualizerSettings, visualizerSettings } from 'components/visualizer/visualizers.logic';
import { logger } from 'utils/logger';

interface SubtitleAppearanceSettings {
    verticalPosition: number;
}

interface ComicsPlayerSettings {
    langDir: string;
    pagesPerView: number;
}

interface SortValues {
    sortBy: string;
    sortOrder: 'Ascending' | 'Descending';
}

interface ApiClient {
    getUrl(path: string, params?: Record<string, string>): string;
    accessToken(): string;
    updateDisplayPreferences(name: string, prefs: any, userId: string, client: string): Promise<void>;
    getDisplayPreferences(name: string, userId: string, client: string): Promise<any>;
    updateUserConfiguration(userId: string, config: any): Promise<void>;
    getUser(userId: string): Promise<any>;
    serverAddress(address?: string): string;
}

interface UserSettingsInstance {
    currentUserId: string | null;
    currentApiClient: ApiClient | null;
    displayPrefs: any;
    saveTimeout: NodeJS.Timeout | null;
}

let displayPrefsBeaconWarningShown = false;

function getDevServerAddress(): string | null {
    if (typeof __WEBPACK_SERVE__ === 'undefined' || typeof __DEV_SERVER_PROXY_TARGET__ === 'undefined') {
        return null;
    }
    if (!__WEBPACK_SERVE__ || !__DEV_SERVER_PROXY_TARGET__) {
        return null;
    }
    return typeof window !== 'undefined' && window.location ? window.location.origin : null;
}

declare const __WEBPACK_SERVE__: boolean | undefined;
declare const __DEV_SERVER_PROXY_TARGET__: string | undefined;

function applyDevServerAddress(apiClient: ApiClient): void {
    const devAddress = getDevServerAddress();
    if (!devAddress || !apiClient || typeof apiClient.serverAddress !== 'function') {
        return;
    }
    if (apiClient.serverAddress() !== devAddress) {
        apiClient.serverAddress(devAddress);
    }
}

function onSaveTimeout(this: UserSettings): void {
    const self = this;
    self.saveTimeout = null;
    const apiClient = self.currentApiClient;
    if (!apiClient || !self.displayPrefs || !self.currentUserId) {
        return;
    }
    applyDevServerAddress(apiClient);
    const prefsUrl = apiClient.getUrl('DisplayPreferences/usersettings', {
        userId: self.currentUserId,
        client: 'emby',
        api_key: apiClient.accessToken()
    });
    if (isCrossOriginUrl(prefsUrl)) {
        // Try sendBeacon first (better for page unload)
        const payload = new Blob([JSON.stringify(self.displayPrefs)], { type: 'application/json' });
        const sent = navigator?.sendBeacon?.(prefsUrl, payload);

        if (!sent) {
            // Fallback to fetch for cross-origin requests
            logger.debug('[UserSettings] sendBeacon not available, using fetch fallback', { component: 'UserSettings' });
            fetch(prefsUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Emby-Authorization': `MediaBrowser Client="Jellyfin Web", Device="Browser", DeviceId="", Version="1.0.0", Token="${apiClient.accessToken()}"`
                },
                body: JSON.stringify(self.displayPrefs)
            }).catch(error => {
                if (!displayPrefsBeaconWarningShown) {
                    displayPrefsBeaconWarningShown = true;
                    logger.warn('[UserSettings] Failed to save cross-origin preferences', { component: 'UserSettings' }, error);
                }
            });
        }
        return;
    }
    apiClient.updateDisplayPreferences('usersettings', self.displayPrefs, self.currentUserId, 'emby');
}

function saveServerPreferences(instance: UserSettings): void {
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

function filterQuerySettings(query: Record<string, any>, allowedItems: string[]): Record<string, any> {
    return Object.keys(query)
        .filter(field => allowedItems.includes(field))
        .reduce((acc: Record<string, any>, field) => {
            acc[field] = query[field];
            return acc;
        }, {});
}

const defaultSubtitleAppearanceSettings: SubtitleAppearanceSettings = {
    verticalPosition: -3
};

const defaultComicsPlayerSettings: ComicsPlayerSettings = {
    langDir: 'ltr',
    pagesPerView: 1
};

function isCrossOriginServer(apiClient: ApiClient): boolean {
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

function isCrossOriginUrl(url: string): boolean {
    if (typeof window === 'undefined' || !window.location) {
        return false;
    }
    try {
        return new URL(url, window.location.href).origin !== window.location.origin;
    } catch (err) {
        return false;
    }
}

export class UserSettings implements UserSettingsInstance {
    currentUserId: string | null = null;
    currentApiClient: ApiClient | null = null;
    displayPrefs: any = null;
    saveTimeout: NodeJS.Timeout | null = null;

    /**
     * Bind UserSettings instance to user.
     */
    setUserInfo(userId: string | null, apiClient: ApiClient | null): Promise<void> {
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

        if (!apiClient) {
            self.displayPrefs = { CustomPrefs: {} };
            return Promise.resolve();
        }

        applyDevServerAddress(apiClient);
        return apiClient.getDisplayPreferences('usersettings', userId, 'emby').then((result: any) => {
            result.CustomPrefs = result.CustomPrefs || {};
            self.displayPrefs = result;
        }).catch((error: any) => {
            logger.warn('[UserSettings] Failed to load server preferences', { component: 'UserSettings' }, error);
            self.displayPrefs = { CustomPrefs: {} };
        });
    }

    getData(): any {
        return this.displayPrefs;
    }

    importFrom(instance: UserSettings): void {
        this.displayPrefs = instance.getData();
    }

    destroy(): void {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
    }

    set(name: string, value: any, enableOnServer?: boolean): any {
        if (typeof name !== 'string' || name.trim() === '') {
            throw new Error('Setting name must be a non-empty string');
        }

        const userId = this.currentUserId;
        const currentValue = this.get(name, enableOnServer);

        let result;
        try {
            result = appSettings.set(name, value || undefined, userId || undefined);
        } catch (error) {
            logger.error('[UserSettings] Failed to save to local storage', { component: 'UserSettings' }, error as Error);
            throw error;
        }

        if (enableOnServer !== false && this.displayPrefs) {
            this.displayPrefs.CustomPrefs[name] = value === null ? value : value.toString();
            saveServerPreferences(this);
        }

        if (currentValue !== value) {
            Events.trigger(this, 'change', [name]);
        }

        return result;
    }

    get(name: string, enableOnServer?: boolean): string | null {
        const userId = this.currentUserId;
        if (enableOnServer !== false && this.displayPrefs) {
            const serverValue = this.displayPrefs.CustomPrefs[name];
            if (serverValue !== undefined) {
                return serverValue;
            }
        }

        return appSettings.get(name, userId || undefined);
    }

    serverConfig(config?: any): any | Promise<any> {
        const apiClient = this.currentApiClient;
        if (config) {
            return apiClient!.updateUserConfiguration(this.currentUserId!, config);
        }

        return apiClient!.getUser(this.currentUserId!).then((user: any): any => {
            return user.Configuration;
        });
    }

    allowedAudioChannels(val?: string): string {
        if (val !== undefined) {
            this.set('allowedAudioChannels', val.toString(), false);
            return val.toString();
        }

        return this.get('allowedAudioChannels', false) || '-1';
    }

    preferFmp4HlsContainer(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('preferFmp4HlsContainer', val.toString(), false);
            return val;
        }

        return toBoolean(this.get('preferFmp4HlsContainer', false), browser.safari || browser.firefox || (browser as any).chrome || browser.edgeChromium);
    }

    limitSegmentLength(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('limitSegmentLength', val.toString(), false);
            return val;
        }

        return toBoolean(this.get('limitSegmentLength', false), false);
    }

    enableCinemaMode(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('enableCinemaMode', val.toString(), false);
            return val;
        }

        return toBoolean(this.get('enableCinemaMode', false), true);
    }

    selectAudioNormalization(val?: string): string {
        if (val !== undefined) {
            this.set('selectAudioNormalization', val, true);
            return val;
        }

        return this.get('selectAudioNormalization', true) || 'AlbumGain';
    }

    crossfadeDuration(val?: number): number {
        if (val !== undefined) {
            setXDuration(val);
            this.set('crossfadeDuration', val.toString(), true);
            return val;
        }

        const stored = this.get('crossfadeDuration', true);
        const parsed = parseFloat(stored || '5');
        return Number.isNaN(parsed) ? 5 : parsed;
    }

    visualizerConfiguration(val?: any): any {
        if (val !== undefined) {
            if (val !== null && typeof val !== 'object') {
                throw new Error('Visualizer configuration must be an object or null');
            }
            setVisualizerSettings(val);
            this.set('visualizerConfiguration', getVisualizerSettings(), true);
            return getVisualizerSettings();
        }

        let raw = this.get('visualizerConfiguration', true);
        if (!raw) {
            raw = appSettings.get('visualizerConfiguration', this.currentUserId || undefined);
        }
        if (!raw) {
            setVisualizerSettings(null);
            return visualizerSettings;
        }

        try {
            const parsed = JSON.parse(raw);
            setVisualizerSettings(parsed);
            return visualizerSettings;
        } catch (error) {
            setVisualizerSettings(null);
            return visualizerSettings;
        }
    }

    enableNextVideoInfoOverlay(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('enableNextVideoInfoOverlay', val.toString());
            return val;
        }

        return toBoolean(this.get('enableNextVideoInfoOverlay', false), true);
    }

    enableVideoRemainingTime(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('enableVideoRemainingTime', val.toString());
            return val;
        }

        return toBoolean(this.get('enableVideoRemainingTime', false), true);
    }

    enableThemeSongs(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('enableThemeSongs', val.toString(), false);
            return val;
        }

        return toBoolean(this.get('enableThemeSongs', false), false);
    }

    enableThemeVideos(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('enableThemeVideos', val.toString(), false);
            return val;
        }

        return toBoolean(this.get('enableThemeVideos', false), false);
    }

    enableFastFadein(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('fastFadein', val.toString(), false);
            return val;
        }

        return toBoolean(this.get('fastFadein', false), true);
    }

    enableBlurhash(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('blurhash', val.toString(), false);
            return val;
        }

        return toBoolean(this.get('blurhash', false), true);
    }

    enableBackdrops(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('enableBackdrops', val.toString(), true);
            return val;
        }

        return toBoolean(this.get('enableBackdrops', true), false);
    }

    disableCustomCss(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('disableCustomCss', val.toString(), false);
            return val;
        }

        return toBoolean(this.get('disableCustomCss', false), false);
    }

    customCss(val?: string): string | null {
        if (val !== undefined) {
            this.set('customCss', val.toString(), false);
            return val.toString();
        }

        return this.get('customCss', false);
    }

    detailsBanner(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('detailsBanner', val.toString(), false);
            return val;
        }

        return toBoolean(this.get('detailsBanner', false), true);
    }

    useEpisodeImagesInNextUpAndResume(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('useEpisodeImagesInNextUpAndResume', val.toString(), true);
            return val;
        }

        return toBoolean(this.get('useEpisodeImagesInNextUpAndResume', true), false);
    }

    language(val?: string): string | null {
        if (val !== undefined) {
            this.set('language', val.toString(), false);
            return val.toString();
        }

        return this.get('language', false);
    }

    dateTimeLocale(val?: string): string | null {
        if (val !== undefined) {
            this.set('datetimelocale', val.toString(), false);
            return val.toString();
        }

        return this.get('datetimelocale', false);
    }

    skipBackLength(val?: number): number {
        if (val !== undefined) {
            this.set('skipBackLength', val.toString(), false);
            return val;
        }

        const stored = this.get('skipBackLength', false);
        return parseInt(stored || '10000', 10);
    }

    skipForwardLength(val?: number): number {
        if (val !== undefined) {
            this.set('skipForwardLength', val.toString(), false);
            return val;
        }

        const stored = this.get('skipForwardLength', false);
        return parseInt(stored || '30000', 10);
    }

    dashboardTheme(val?: string): string | null {
        if (val !== undefined) {
            this.set('dashboardTheme', val.toString(), false);
            return val.toString();
        }

        return this.get('dashboardTheme', false);
    }

    skin(val?: string): string | null {
        if (val !== undefined) {
            this.set('skin', val.toString(), false);
            return val.toString();
        }

        return this.get('skin', false);
    }

    theme(val?: string): string | null {
        if (val !== undefined) {
            this.set('theme', val.toString(), false);
            return val.toString();
        }

        return this.get('theme', false);
    }

    screensaver(val?: string): string | null {
        if (val !== undefined) {
            this.set('screensaver', val.toString(), false);
            return val.toString();
        }

        return this.get('screensaver', false);
    }

    backdropScreensaverInterval(val?: number): number {
        if (val !== undefined) {
            this.set('backdropScreensaverInterval', val.toString(), false);
            return val;
        }

        const stored = this.get('backdropScreensaverInterval', false);
        return parseInt(stored || '5000', 10);
    }

    slideshowInterval(val?: number): number {
        if (val !== undefined) {
            this.set('slideshowInterval', val.toString(), false);
            return val;
        }

        const stored = this.get('slideshowInterval', false);
        return parseInt(stored || '10000', 10);
    }

    screensaverTime(val?: number): number {
        if (val !== undefined) {
            this.set('screensaverTime', val.toString(), false);
            return val;
        }

        const stored = this.get('screensaverTime', false);
        return parseInt(stored || '300000', 10);
    }

    libraryPageSize(val?: number): number {
        if (val !== undefined) {
            this.set('libraryPageSize', val.toString(), false);
            return val;
        }

        const stored = this.get('libraryPageSize', false);
        return parseInt(stored || '100', 10);
    }

    maxDaysForNextUp(val?: number): number {
        if (val !== undefined) {
            this.set('maxDaysForNextUp', val.toString(), true);
            return val;
        }

        const stored = this.get('maxDaysForNextUp', true);
        return parseInt(stored || '365', 10);
    }

    enableRewatchingInNextUp(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('enableRewatchingInNextUp', val.toString(), true);
            return val;
        }

        return toBoolean(this.get('enableRewatchingInNextUp', true), true);
    }

    soundEffects(val?: boolean): boolean {
        if (val !== undefined) {
            this.set('soundEffects', val.toString(), false);
            return val;
        }

        return toBoolean(this.get('soundEffects', false), false);
    }

    loadQuerySettings(key: string, query: Record<string, any>): void {
        const values = this.get(key, false);
        if (values) {
            try {
                const parsed = JSON.parse(values);
                Object.assign(query, parsed);
            } catch (error) {
                logger.warn('[UserSettings] Failed to parse query settings', { component: 'UserSettings' }, error as Error);
            }
        }
    }

    saveQuerySettings(key: string, query: Record<string, any>): void {
        const filtered = filterQuerySettings(query, allowedSortSettings.concat(allowedFilterSettings));
        this.set(key, JSON.stringify(filtered), false);
    }

    getSubtitleAppearanceSettings(): SubtitleAppearanceSettings {
        const stored = this.get('subtitleAppearanceSettings', false);
        if (stored) {
            try {
                return { ...defaultSubtitleAppearanceSettings, ...JSON.parse(stored) };
            } catch (error) {
                logger.warn('[UserSettings] Failed to parse subtitle settings', { component: 'UserSettings' }, error as Error);
            }
        }
        return { ...defaultSubtitleAppearanceSettings };
    }

    setSubtitleAppearanceSettings(settings: SubtitleAppearanceSettings): void {
        this.set('subtitleAppearanceSettings', JSON.stringify(settings), false);
    }

    getComicsPlayerSettings(): ComicsPlayerSettings {
        const stored = this.get('comicsPlayerSettings', false);
        if (stored) {
            try {
                return { ...defaultComicsPlayerSettings, ...JSON.parse(stored) };
            } catch (error) {
                logger.warn('[UserSettings] Failed to parse comics settings', { component: 'UserSettings' }, error as Error);
            }
        }
        return { ...defaultComicsPlayerSettings };
    }

    setComicsPlayerSettings(settings: ComicsPlayerSettings): void {
        this.set('comicsPlayerSettings', JSON.stringify(settings), false);
    }

    getFilter(key: string): string | null {
        return this.get(`${key}${filterSettingsPostfix}`, false);
    }

    getSavedView(key: string): any {
        const value = this.get(`view-${key}`, false);
        if (value) {
            try {
                return JSON.parse(value);
            } catch (error) {
                logger.warn('[UserSettings] Failed to parse saved view', { component: 'UserSettings' }, error as Error);
            }
        }
        return null;
    }

    setFilter(key: string, value: any): void {
        this.set(`${key}${filterSettingsPostfix}`, value, false);
    }

    saveViewSetting(key: string, value: any): void {
        this.set(`view-${key}`, JSON.stringify(value), false);
    }

    getSortValuesLegacy(key: string): SortValues {
        const defaultSortBy = 'SortName';
        const sortBy = this.getFilter(`${key}-sortby`) || defaultSortBy;
        const sortOrder = this.getFilter(`${key}-sortorder`) === 'Descending' ? 'Descending' : 'Ascending';
        return {
            sortBy,
            sortOrder
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
