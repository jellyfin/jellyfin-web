/**
 * Matches when the primary pointing device is precise (mouse/trackpad).
 */
export const FINE_POINTER_MEDIA_QUERY = '(pointer: fine)';

export const hasFinePointer = () => window.matchMedia(FINE_POINTER_MEDIA_QUERY).matches;
