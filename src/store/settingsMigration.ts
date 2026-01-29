/**
 * Settings Migration Utilities
 *
 * Handles migration from legacy storage formats to the new settings store.
 * Supports migration from older localStorage keys and formats.
 */

import { logger } from '../utils/logger';
import type { SettingsState } from './settingsStore';

const LEGACY_STORAGE_KEYS = {
    volume: 'jellyfin_volume',
    muted: 'jellyfin_muted',
    theme: 'jellyfin_theme',
    autoPlay: 'jellyfin_autoplay',
    crossfade: 'jellyfin_crossfade',
    crossfadeDuration: 'jellyfin_crossfade_duration',
    visualizerEnabled: 'jellyfin_visualizer',
    visualizerType: 'jellyfin_visualizer_type',
    sensitivity: 'jellyfin_sensitivity',
    playbackPosition: 'jellyfin_playback_position',
    queueShuffle: 'jellyfin_queue_shuffle',
    queueRepeat: 'jellyfin_queue_repeat'
};

interface LegacySettings {
    volume?: number;
    muted?: boolean;
    theme?: 'dark' | 'light' | 'system';
    autoPlay?: boolean;
    crossfade?: boolean;
    crossfadeDuration?: number;
    visualizerEnabled?: boolean;
    visualizerType?: 'waveform' | 'frequency' | 'butterchurn';
    sensitivity?: number;
    playbackPosition?: boolean;
    queueShuffle?: boolean;
    queueRepeat?: 'none' | 'all' | 'one';
}

interface MigrationResult {
    migrated: boolean;
    fromVersion: number | null;
    toVersion: number;
    errors: string[];
}

export function getLegacySettings(): LegacySettings {
    try {
        return {
            volume:
                parseFloat(localStorage.getItem(LEGACY_STORAGE_KEYS.volume) || '0') || undefined,
            muted: localStorage.getItem(LEGACY_STORAGE_KEYS.muted) === 'true',
            theme:
                (localStorage.getItem(LEGACY_STORAGE_KEYS.theme) as 'dark' | 'light' | 'system') ||
                undefined,
            autoPlay: localStorage.getItem(LEGACY_STORAGE_KEYS.autoPlay) === 'true',
            crossfade: localStorage.getItem(LEGACY_STORAGE_KEYS.crossfade) === 'true',
            crossfadeDuration:
                parseFloat(localStorage.getItem(LEGACY_STORAGE_KEYS.crossfadeDuration) || '0') ||
                undefined,
            visualizerEnabled:
                localStorage.getItem(LEGACY_STORAGE_KEYS.visualizerEnabled) === 'true',
            visualizerType:
                (localStorage.getItem(
                    LEGACY_STORAGE_KEYS.visualizerType
                ) as LegacySettings['visualizerType']) || undefined,
            sensitivity:
                parseFloat(localStorage.getItem(LEGACY_STORAGE_KEYS.sensitivity) || '0') ||
                undefined,
            playbackPosition: localStorage.getItem(LEGACY_STORAGE_KEYS.playbackPosition) === 'true',
            queueShuffle: localStorage.getItem(LEGACY_STORAGE_KEYS.queueShuffle) === 'true',
            queueRepeat:
                (localStorage.getItem(
                    LEGACY_STORAGE_KEYS.queueRepeat
                ) as LegacySettings['queueRepeat']) || undefined
        };
    } catch {
        return {};
    }
}

export function migrateLegacySettings(): MigrationResult {
    const result: MigrationResult = {
        migrated: false,
        fromVersion: null,
        toVersion: 1,
        errors: []
    };

    try {
        const legacy = getLegacySettings();

        const hasLegacySettings = Object.values(legacy).some((v) => v !== undefined);

        if (!hasLegacySettings) {
            return result;
        }

        result.fromVersion = 0;
        result.migrated = true;

        const newSettings: Partial<SettingsState> = {};

        if (legacy.volume !== undefined) {
            newSettings.audio = {
                volume: legacy.volume,
                muted: legacy.muted ?? false,
                makeupGain: 1,
                enableNormalization: true,
                normalizationPercent: 95
            };
        }

        if (legacy.theme !== undefined) {
            newSettings.ui = {
                theme: legacy.theme,
                compactMode: false,
                showVisualizer: true,
                showNowPlaying: true,
                animationsEnabled: true,
                highContrastMode: false,
                reducedMotion: false
            };
        }

        if (legacy.autoPlay !== undefined || legacy.crossfade !== undefined) {
            newSettings.playback = {
                defaultPlaybackRate: 1,
                autoPlay: legacy.autoPlay ?? false,
                rememberPlaybackPosition: legacy.playbackPosition ?? true,
                skipForwardSeconds: 10,
                skipBackSeconds: 10,
                enableCrossfade: legacy.crossfade ?? false,
                crossfadeDuration: legacy.crossfadeDuration ?? 5,
                gaplessPlayback: true
            };
        }

        if (legacy.visualizerEnabled !== undefined || legacy.visualizerType !== undefined) {
            newSettings.visualizer = {
                enabled: legacy.visualizerEnabled ?? true,
                type: legacy.visualizerType ?? 'butterchurn',
                butterchurnPreset: 'Good',
                colorScheme: 'default',
                sensitivity: legacy.sensitivity ?? 50,
                barCount: 64,
                smoothing: 0.8
            };
        }

        if (typeof window !== 'undefined') {
            const { useSettingsStore } = require('./settingsStore');
            useSettingsStore.getState().importSettings(newSettings);
        }

        cleanupLegacySettings();

        logger.info('[SettingsMigration] Successfully migrated from legacy settings format', {
            component: 'SettingsMigration'
        });
    } catch (error) {
        result.errors.push(String(error));
        logger.error(
            '[SettingsMigration] Migration failed',
            { component: 'SettingsMigration' },
            error as Error
        );
    }

    return result;
}

export function cleanupLegacySettings(): void {
    try {
        Object.values(LEGACY_STORAGE_KEYS).forEach((key) => {
            localStorage.removeItem(key);
        });

        const oldQueueKey = 'jellyfin-queue-state';
        const oldQueueState = localStorage.getItem(oldQueueKey);
        if (oldQueueState) {
            try {
                const parsed = JSON.parse(oldQueueState);
                if (parsed.savedAt) {
                    const age = Date.now() - parsed.savedAt;
                    const maxAge = 30 * 24 * 60 * 60 * 1000;
                    if (age > maxAge) {
                        localStorage.removeItem(oldQueueKey);
                    }
                }
            } catch {
                localStorage.removeItem(oldQueueKey);
            }
        }

        logger.info('[SettingsMigration] Cleaned up legacy storage keys', {
            component: 'SettingsMigration'
        });
    } catch (error) {
        logger.error(
            '[SettingsMigration] Cleanup failed',
            { component: 'SettingsMigration' },
            error as Error
        );
    }
}

export function getSettingsVersion(): number | null {
    try {
        const versionKey = 'jellyfin-settings-version';
        const version = localStorage.getItem(versionKey);
        return version ? parseInt(version, 10) : null;
    } catch {
        return null;
    }
}

export function setSettingsVersion(version: number): void {
    try {
        const versionKey = 'jellyfin-settings-version';
        localStorage.setItem(versionKey, String(version));
    } catch (error) {
        logger.error(
            '[SettingsMigration] Failed to set version',
            { component: 'SettingsMigration' },
            error as Error
        );
    }
}

export async function runMigrations(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    const currentVersion = getSettingsVersion() ?? 0;

    if (currentVersion < 1) {
        const result = migrateLegacySettings();
        results.push(result);
        setSettingsVersion(1);
    }

    return results;
}

export function validateSettings(settings: unknown): settings is SettingsState {
    if (!settings || typeof settings !== 'object') {
        return false;
    }

    const s = settings as Record<string, unknown>;

    if (!s.audio || typeof s.audio !== 'object') return false;
    if (!s.visualizer || typeof s.visualizer !== 'object') return false;
    if (!s.playback || typeof s.playback !== 'object') return false;
    if (!s.ui || typeof s.ui !== 'object') return false;

    const audio = s.audio as Record<string, unknown>;
    if (typeof audio.volume !== 'number' || typeof audio.muted !== 'boolean') {
        return false;
    }

    const visualizer = s.visualizer as Record<string, unknown>;
    if (typeof visualizer.enabled !== 'boolean' || typeof visualizer.type !== 'string') {
        return false;
    }

    const playback = s.playback as Record<string, unknown>;
    if (typeof playback.autoPlay !== 'boolean' || typeof playback.gaplessPlayback !== 'boolean') {
        return false;
    }

    const ui = s.ui as Record<string, unknown>;
    if (typeof ui.theme !== 'string' || typeof ui.compactMode !== 'boolean') {
        return false;
    }

    return true;
}
