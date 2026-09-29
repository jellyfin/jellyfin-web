import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';

import { PluginType } from 'constants/pluginType';

import type { PlayOptions } from './playOptions';

export interface Plugin {
    /** The name of the plugin */
    name: string
    /** The unique identifier for the plugin */
    id: string
    /** The type of the plugin */
    type: PluginType | string
    /** The priority of the plugin, used to determine the order of execution */
    priority?: number
}

export abstract class PlayerPlugin implements Plugin {
    type = PluginType.MediaPlayer;
    /** The name of the plugin */
    abstract name: string;
    /** The unique identifier for the plugin */
    abstract id: string;
    /** The priority of the plugin, used to determine the order of execution */
    priority?: number;
    /** Indicates if the player is a local player */
    isLocalPlayer?: boolean;
}

export interface InterceptOptions extends PlayOptions {
    /** The item being played */
    item: BaseItemDto
    /** The media type of the item */
    mediaType?: MediaType
}

export abstract class PreplayInterceptPlugin implements Plugin {
    type = PluginType.PreplayIntercept;
    /** The name of the plugin */
    abstract name: string;
    /** The unique identifier for the plugin */
    abstract id: string;
    /** The priority of the plugin, used to determine the order of execution */
    priority?: number;

    /**
     * The function called prior to playback starting.
     * Returning a rejected promise will prevent playback from starting, while a resolved promise will allow it to proceed.
     */
    abstract intercept(options: InterceptOptions): Promise<void>;
}
