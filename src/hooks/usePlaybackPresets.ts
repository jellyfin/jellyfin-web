/**
 * Playback Presets Hook
 *
 * Manages saving, loading, and deleting playback queue presets.
 */

import type { PlaybackPreset } from 'components/playback/PlaybackPresets';
import { useCallback, useEffect, useState } from 'react';
import { logger } from 'utils/logger';

const PRESETS_STORAGE_KEY = 'jellyfin-playback-presets';
const MAX_PRESETS = 10;

export interface UsePlaybackPresetsReturn {
    presets: PlaybackPreset[];
    isLoading: boolean;
    savePreset: (
        name: string,
        queueData: any,
        shuffleMode: string,
        repeatMode: string
    ) => Promise<void>;
    loadPreset: (presetId: string) => Promise<any>;
    deletePreset: (presetId: string) => Promise<void>;
    clearAllPresets: () => Promise<void>;
}

export const usePlaybackPresets = (): UsePlaybackPresetsReturn => {
    const [presets, setPresets] = useState<PlaybackPreset[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load presets from localStorage on mount
    useEffect(() => {
        try {
            setIsLoading(true);
            const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as PlaybackPreset[];
                // Sort by timestamp descending (most recent first)
                setPresets(parsed.sort((a, b) => b.timestamp - a.timestamp));
            }
        } catch (error) {
            logger.error('[usePlaybackPresets] Failed to load presets', { error });
            setPresets([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save preset
    const savePreset = useCallback(
        async (name: string, queueData: any, shuffleMode: string, repeatMode: string) => {
            try {
                if (presets.length >= MAX_PRESETS) {
                    const oldest = presets[presets.length - 1];
                    await deletePreset(oldest.id);
                }

                const newPreset: PlaybackPreset = {
                    id: `preset-${Date.now()}`,
                    name: name.trim(),
                    timestamp: Date.now(),
                    queueItemCount: Array.isArray(queueData) ? queueData.length : 0,
                    shuffleMode,
                    repeatMode,
                    currentItemId: queueData?.[0]?.id
                };

                const updated = [newPreset, ...presets].slice(0, MAX_PRESETS);
                setPresets(updated);
                localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));

                logger.debug('[usePlaybackPresets] Preset saved', {
                    presetId: newPreset.id,
                    name: newPreset.name
                });
            } catch (error) {
                logger.error('[usePlaybackPresets] Failed to save preset', { error });
                throw error;
            }
        },
        [presets]
    );

    // Load preset
    const loadPreset = useCallback(
        async (presetId: string) => {
            try {
                const preset = presets.find((p) => p.id === presetId);
                if (!preset) {
                    throw new Error(`Preset not found: ${presetId}`);
                }

                logger.debug('[usePlaybackPresets] Preset loaded', {
                    presetId: preset.id,
                    name: preset.name
                });

                // Return preset data for the caller to use
                return preset;
            } catch (error) {
                logger.error('[usePlaybackPresets] Failed to load preset', { presetId, error });
                throw error;
            }
        },
        [presets]
    );

    // Delete preset
    const deletePreset = useCallback(
        async (presetId: string) => {
            try {
                const updated = presets.filter((p) => p.id !== presetId);
                setPresets(updated);
                localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));

                logger.debug('[usePlaybackPresets] Preset deleted', { presetId });
            } catch (error) {
                logger.error('[usePlaybackPresets] Failed to delete preset', { presetId, error });
                throw error;
            }
        },
        [presets]
    );

    // Clear all presets
    const clearAllPresets = useCallback(async () => {
        try {
            setPresets([]);
            localStorage.removeItem(PRESETS_STORAGE_KEY);

            logger.debug('[usePlaybackPresets] All presets cleared');
        } catch (error) {
            logger.error('[usePlaybackPresets] Failed to clear presets', { error });
            throw error;
        }
    }, []);

    return {
        presets,
        isLoading,
        savePreset,
        loadPreset,
        deletePreset,
        clearAllPresets
    };
};

export default usePlaybackPresets;
