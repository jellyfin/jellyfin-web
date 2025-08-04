import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models/media-source-info';
import type { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';

import type { StreamInfo } from './streamInfo';

export interface ManagedPlayerStopInfo {
    item: BaseItemDto;
    mediaSource: MediaSourceInfo;
    nextItem?: BaseItemDto | null;
    nextMediaType?: MediaType | null;
    positionMs?: number;
}

export interface MovedItem {
    newIndex: number;
    playlistItemId: string;
}

// eslint-disable-next-line sonarjs/redundant-type-aliases
export type PlayerErrorCode = string;

export interface PlayerStopInfo {
    src?: URL | BaseItemDto;
}

export interface PlayerError {
    streamInfo?: StreamInfo;
    type: MediaError | string;
}

export interface RemovedItems {
    playlistItemIds: string[];
}
