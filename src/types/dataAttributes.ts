import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import type { UserItemDataDto } from '@jellyfin/sdk/lib/generated-client/models/user-item-data-dto';

import type { ItemAction } from '@/constants/itemAction';
import type { Nullable } from '@/types/nullable';

export type AttributesOpts = {
    context?: CollectionType | string,
    parentId?: Nullable<string>,
    collectionId?: Nullable<string>,
    playlistId?: Nullable<string>,
    prefix?: Nullable<string>,
    action?: ItemAction | null,
    itemServerId?: Nullable<string>,
    itemId?: Nullable<string>,
    itemTimerId?: Nullable<string>,
    itemSeriesTimerId?: Nullable<string>,
    itemChannelId?: Nullable<string>,
    itemPlaylistItemId?: Nullable<string>,
    itemType?: Nullable<string>,
    itemMediaType?: Nullable<string>,
    itemCollectionType?: Nullable<string>,
    itemIsFolder?: Nullable<boolean>,
    itemPath?: Nullable<string>,
    itemStartDate?: Nullable<string>,
    itemEndDate?: Nullable<string>,
    itemUserData?: UserItemDataDto
};

export type DataAttributes = {
    'data-playlistitemid'?: Nullable<string>;
    'data-timerid'?: Nullable<string>;
    'data-seriestimerid'?: Nullable<string>;
    'data-serverid'?: Nullable<string>;
    'data-id'?: Nullable<string>;
    'data-type'?: Nullable<string>;
    'data-collectionid'?: Nullable<string>;
    'data-playlistid'?: Nullable<string>;
    'data-mediatype'?: Nullable<string>;
    'data-channelid'?: Nullable<string>;
    'data-path'?: Nullable<string>;
    'data-collectiontype'?: Nullable<string>;
    'data-context'?: Nullable<string>;
    'data-parentid'?: Nullable<string>;
    'data-startdate'?: Nullable<string>;
    'data-enddate'?: Nullable<string>;
    'data-prefix'?: Nullable<string>;
    'data-action'?: ItemAction | null;
    'data-positionticks'?: Nullable<number>;
    'data-isfolder'?: Nullable<boolean>;
};
