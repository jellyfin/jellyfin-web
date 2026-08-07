/**
 * Custom event types.
 */
export enum EventType {
    HEADER_RENDERED = 'HEADER_RENDERED',
    /** Items have been updated/deleted and the UI should refresh. */
    REFRESH_NEEDED = 'REFRESH_NEEDED',
    SET_TABS = 'SET_TABS',
    SHOW_VIDEO_OSD = 'SHOW_VIDEO_OSD',
    THEME_CHANGE = 'THEME_CHANGE',
    VIDEO_TITLE_CHANGE = 'VIDEO_TITLE_CHANGE'
}
