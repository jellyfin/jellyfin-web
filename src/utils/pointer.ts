/**
 * Matches when the primary pointing device is precise (mouse/trackpad).
 */
export const FINE_POINTER_MEDIA_QUERY = '(pointer: fine)';

/**
 * Matches when the primary pointing device is coarse (typically phones / pure touch).
 * Touch laptops usually keep a fine primary pointer, so this stays false there.
 */
export const COARSE_POINTER_MEDIA_QUERY = '(pointer: coarse)';

export const hasFinePointer = () => window.matchMedia(FINE_POINTER_MEDIA_QUERY).matches;

export const hasCoarsePointer = () => window.matchMedia(COARSE_POINTER_MEDIA_QUERY).matches;
