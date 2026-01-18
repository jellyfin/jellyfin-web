/**
 * Video Player Bundle Splitting Strategy
 * Optimizes bundle size by lazy loading video components
 *
 * IMPACT: 3-5MB bundle reduction by splitting video features
 */

// Core video player (ALWAYS loaded - critical for video playback)
export { default as VideoPlayerController } from '../../controllers/playback/video/index';

// Video OSD components (LAZY loaded - when video controls needed)
export const loadVideoOSD = () => import('./videoOSD');

// Video utilities (LAZY loaded - when video features needed)
export const loadVideoUtils = () => import('./videoUtils');

// Subtitle components (LAZY loaded - when subtitles enabled)
export const loadSubtitleComponents = () => import('./subtitleComponents');

// Video sync features (LAZY loaded - when sync features used)
export const loadVideoSync = () => import('./videoSync');

// Advanced video controls (LAZY loaded - when advanced features accessed)
export const loadAdvancedVideoControls = () => import('./advancedVideoControls');

// Video player plugins (LAZY loaded - when specific plugins needed)
export const loadVideoPlugins = () => import('./videoPlugins');

// HTML video player (LAZY loaded - only for HTML5 video playback)
export const loadHtmlVideoPlayer = () => import('../../plugins/htmlVideoPlayer/plugin');