import type { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';

export interface PlayTarget {
    id: string;
    name: string;
    appName?: string;
    playerName?: string;
    deviceType?: string;
    isLocalPlayer?: boolean;
    playableMediaTypes: MediaType[];
    supportedCommands?: string[];
    user?: UserDto;
}
