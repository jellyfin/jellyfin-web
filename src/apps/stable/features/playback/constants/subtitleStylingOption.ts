/**
 * Options specifying if the player's native subtitle (cue) element should be used, a custom element (div), or allow
 * Jellyfin to choose automatically based on known browser support. Some browsers do not properly apply CSS styling to
 * the native subtitle element.
 */
export const SubtitleStylingOption = {
    Auto: 'Auto',
    Custom: 'Custom',
    Native: 'Native'
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type SubtitleStylingOption = (typeof SubtitleStylingOption)[keyof typeof SubtitleStylingOption];
