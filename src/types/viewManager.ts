export interface RestoreViewFailResponse {
    cancelled?: boolean
}

/** Options used when restoring a cached view. */
export interface ViewOptions {
    url: string
    type?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state?: any
    autoFocus?: boolean
    fullscreen?: boolean
    transition?: string
    cancel?: boolean
    /** The imported controller module (or constructor) for the view */
    controllerFactory?: unknown
    /** The route options */
    options?: {
        supportsThemeMedia?: boolean
        enableMediaControl?: boolean
    }
}

/** Options used when loading a new view. */
export interface LoadViewOptions extends ViewOptions {
    /** The view HTML */
    view: string
}

export type BeforeChangeHandler = (view: HTMLElement, isRestored: boolean, options: ViewOptions) => void;
