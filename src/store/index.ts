/**
 * Store Index
 *
 * Central barrel export for all store modules.
 *
 * Phase 1: Core Stores - Settings and audio engine stores added
 * Additional stores will be exported as they are created.
 */

// Types
export * from './types';

// Preferences store (unified settings)
export { usePreferencesStore } from './preferencesStore';

// Core stores
export {
    useMediaStore,
    selectStatus,
    selectCurrentItem,
    selectProgress,
    selectIsPlaying,
    selectVolume as selectMediaVolume,
    selectIsMuted as selectMediaIsMuted,
    selectRepeatMode,
    selectShuffleMode,
    selectStreamInfo,
    selectError
} from './mediaStore';
export {
    useQueueStore,
    selectQueueItems,
    selectCurrentIndex,
    selectCurrentQueueItem,
    selectIsEmpty,
    selectQueueLength,
    selectRepeatMode as selectQueueRepeatMode,
    selectShuffleMode as selectQueueShuffleMode,
    selectIsShuffled
} from './queueStore';
export {
    usePlayerStore,
    selectCurrentPlayer,
    selectAvailablePlayers,
    selectPendingTransfer,
    selectIsTransferring,
    selectIsLocalPlayerActive,
    selectPlayerChanged
} from './playerStore';
export {
    useControlsStore,
    selectActiveControlSource,
    selectIsRemoteActive,
    selectPendingTransfer as selectPendingControlTransfer,
    selectShowTransferDialog,
    selectTransferCountdown,
    selectRemoteConnected,
    selectRemoteClientName,
    selectCanControl
} from './controlsStore';
// @deprecated Use usePreferencesStore instead - settingsStore will be removed in future
export {
    useSettingsStore,
    selectAudioSettings,
    selectVisualizerSettings,
    selectPlaybackSettings,
    selectUiSettings,
    selectVolume as selectSettingsVolume,
    selectIsMuted as selectSettingsIsMuted,
    selectTheme,
    selectVisualizerEnabled
} from './settingsStore';
export { useUiStore } from './uiStore';
export { useNotificationStore } from './notificationStore';
export { useSyncPlayStore } from './syncPlayStore';
export { useBookStore } from './bookStore';
export { useCrossfadeStore } from './crossfadeStore';

// FX store (DJ-style effects)
export { useFXStore } from './fxStore';

// Time-stretch store (DJ-style pause effects)
export { useTimeStretchStore } from './timeStretchStore';

// Domain logic
export {
    shouldTranscode,
    handlePlaybackFailure,
    getOptimalDirectPlayCodecs,
    isFormatSupported,
    TranscodeDecisionReason,
    type TranscodeDecision,
    type TranscodePolicyConfig,
    type StreamInfo as TranscodeStreamInfo,
    type DeviceProfile
} from './domain/playback/transcodePolicy';

// Settings migration
export {
    migrateLegacySettings,
    cleanupLegacySettings,
    runMigrations,
    validateSettings,
    getLegacySettings,
    getSettingsVersion
} from './settingsMigration';

// Store integration
export * from './integration';

// PlaybackManager bridge
export { playbackManagerBridge, getPlaybackManager } from './playbackManagerBridge';

// Component migration hooks
export * from './hooks';

// Utils
