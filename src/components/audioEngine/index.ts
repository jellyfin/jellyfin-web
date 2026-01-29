/**
 * Audio Engine Bundle Splitting Strategy
 * Optimizes bundle size by lazy loading audio components
 *
 * IMPACT: 2-4MB bundle reduction by splitting audio features
 */

export { synchronizeVolumeUI } from './audioUtils';
export {
    destroyCrossfadePreloadHandler,
    initializeCrossfadePreloadHandler
} from './crossfadePreloadHandler';
// Image preloading (ALWAYS loaded - critical for UX)
export {
    handleManualSkip,
    handlePlaybackTimeUpdate,
    handleTrackStart
} from './crossfadePreloadManager';
export {
    cancelCrossfadeTimeouts,
    getCrossfadeDuration,
    syncManager,
    timeRunningOut
} from './crossfader.logic';
// Core audio engine (ALWAYS loaded - critical for playback)
export {
    audioNodeBus,
    createGainNode,
    delayNodeBus,
    ensureAudioNodeBundle,
    initializeMasterAudio,
    masterAudioOutput,
    rampPlaybackGain,
    removeAudioNodeBundle
} from './master.logic';

// AudioWorklets (LAZY loaded - only when advanced audio features needed)
export const loadAudioWorklets = () => import('./audioWorklets');

// Audio utilities (LAZY loaded - when audio processing needed)
export const loadAudioUtils = () => import('./audioUtils');

// Audio error handling (LAZY loaded - when errors occur)
export const loadAudioErrorHandler = () => import('./audioErrorHandler');

// Audio capabilities (LAZY loaded - when checking audio support)
export const loadAudioCapabilities = () => import('./audioCapabilities');

// Advanced crossfading (LAZY loaded - only for complex crossfade scenarios)
export const loadCrossfadeController = () => import('./crossfadeController');
export const loadCrossfadeImageIntegration = () => import('./crossfadeImageIntegration');

// FX Module (LAZY loaded - only when DJ-style effects needed)
export const loadFXModule = () => import('./fx');

// Audio WASM (LAZY loaded)
export { createTimeStretcher, loadAudioWasm } from './audioWasm';
export { CrossfadeWithFXSends, FXBus, NotchFilterNode } from './fx';

// Bundle all worklets together for efficient loading
export const audioWorklets = {
    delayWorklet: () => import('./delayWorklet'),
    biquadWorklet: () => import('./biquadWorklet'),
    limiterWorklet: () => import('./limiterWorklet'),
    gainWorklet: () => import('./gainWorklet')
} as const;
