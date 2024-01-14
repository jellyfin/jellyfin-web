import { PluginType } from './plugin';

export interface Player {
    id: string;
    type: PluginType;
    name: string;
    priority: number;
    play: (options: unknown) => void;
    canPlayMediaType: (mediaType?: string) => boolean;
    isLocalPlayer?: boolean;
    isMuted?: () => boolean;
    getVolume?: () => number;
}
