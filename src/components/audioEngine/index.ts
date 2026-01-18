/**
 * Audio Engine Bundle Splitting Strategy
 * Optimizes bundle size by lazy loading audio components
 *
 * IMPACT: 2-4MB bundle reduction by splitting audio features
 */

// Core audio engine (ALWAYS loaded - critical for playback)
export { masterAudioOutput, initializeMasterAudio, rampPlaybackGain } from './master.logic';
export { hijackMediaElementForCrossfade, synchronizeVolumeUI, xDuration, getCrossfadeDuration, cancelCrossfadeTimeouts } from './crossfader.logic';

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

// Bundle all worklets together for efficient loading
export const audioWorklets = {
  delayWorklet: () => import('./delayWorklet'),
  biquadWorklet: () => import('./biquadWorklet'),
  limiterWorklet: () => import('./limiterWorklet'),
  gainWorklet: () => import('./gainWorklet')
} as const;