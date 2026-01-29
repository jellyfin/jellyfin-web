/**
 * Store Index
 *
 * Central barrel export for all store modules.
 *
 * Phase 1: Core Stores - Settings and audio engine stores added
 * Additional stores will be exported as they are created.
 */

export { useBookStore } from './bookStore';
export {
    selectActiveControlSource,
    selectCanControl,
    selectIsRemoteActive,
    selectPendingTransfer as selectPendingControlTransfer,
    selectRemoteClientName,
    selectRemoteConnected,
    selectShowTransferDialog,
    selectTransferCountdown,
    useControlsStore
} from './controlsStore';
export { useCrossfadeStore } from './crossfadeStore';
// Domain logic
export {
    type DeviceProfile,
    getOptimalDirectPlayCodecs,
    handlePlaybackError as handlePlaybackFailure,
    isFormatSupported,
    type StreamInfo as TranscodeStreamInfo,
    shouldTranscode,
    type TranscodeDecision,
    TranscodeDecisionReason,
    type TranscodePolicyConfig
} from './domain/playback/transcodePolicy';
// FX store (DJ-style effects)
export { useFXStore } from './fxStore';
// Component migration hooks
export * from './hooks';
// Store integration
export * from './integration';
// Core stores
export {
    selectCurrentItem,
    selectError,
    selectIsMuted as selectMediaIsMuted,
    selectIsPlaying,
    selectProgress,
    selectRepeatMode,
    selectShuffleMode,
    selectStatus,
    selectStreamInfo,
    selectVolume as selectMediaVolume,
    useMediaStore
} from './mediaStore';
export { useNotificationStore } from './notificationStore';
// PlaybackManager bridge
export { getPlaybackManager, playbackManagerBridge } from './playbackManagerBridge';
export {
    selectAvailablePlayers,
    selectCurrentPlayer,
    selectIsLocalPlayerActive,
    selectIsTransferring,
    selectPendingTransfer,
    selectPlayerChanged,
    usePlayerStore
} from './playerStore';
// Preferences store (unified settings)
export { usePreferencesStore } from './preferencesStore';
export {
    selectCurrentIndex,
    selectCurrentQueueItem,
    selectIsEmpty,
    selectIsShuffled,
    selectQueueItems,
    selectQueueLength,
    selectRepeatMode as selectQueueRepeatMode,
    selectShuffleMode as selectQueueShuffleMode,
    useQueueStore
} from './queueStore';
// Settings migration
export {
    cleanupLegacySettings,
    getLegacySettings,
    getSettingsVersion,
    migrateLegacySettings,
    runMigrations,
    validateSettings
} from './settingsMigration';
// @deprecated Use usePreferencesStore instead - settingsStore will be removed in future
export {
    selectAudioSettings,
    selectIsMuted as selectSettingsIsMuted,
    selectPlaybackSettings,
    selectTheme,
    selectUiSettings,
    selectVisualizerEnabled,
    selectVisualizerSettings,
    selectVolume as selectSettingsVolume,
    useSettingsStore
} from './settingsStore';
export { useSyncPlayStore } from './syncPlayStore';
// Time-stretch store (DJ-style pause effects)
export { useTimeStretchStore } from './timeStretchStore';
// Types
export * from './types';
export { useUiStore } from './uiStore';

// Utils
