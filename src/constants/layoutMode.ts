/** The different layout modes supported by the web app. */
export enum LayoutMode {
    /** Automatic layout - the app chose the best layout for the detected device. */
    Auto = 'auto',
    /** The legacy desktop layout. */
    Desktop = 'desktop',
    /** The modern React based layout. */
    Experimental = 'experimental',
    /** The legacy mobile layout. */
    Mobile = 'mobile',
    /** The TV layout. */
    Tv = 'tv'
};
