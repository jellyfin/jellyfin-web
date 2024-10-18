export enum PluginType {
    MediaPlayer = 'mediaplayer',
    PreplayIntercept = 'preplayintercept',
    Screensaver = 'screensaver',
    SyncPlay = 'syncplay'
}

export interface Plugin {
    name: string
    id: string
    type: PluginType | string
    priority?: number
}

export interface PlayerPlugin extends Plugin {
    play: (options: unknown) => void;
    canPlayMediaType: (mediaType?: string) => boolean;
    isLocalPlayer?: boolean;
    isMuted?: () => boolean;
    getVolume?: () => number;
}
