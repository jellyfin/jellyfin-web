import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import type { UserItemDataDto } from '@jellyfin/sdk/lib/generated-client/models/user-item-data-dto';

import { ItemAction } from '@/constants/itemAction';

import type { NullableBoolean, NullableNumber, NullableString } from './base/common/shared/types';

export type AttributesOpts = {
    context?: CollectionType,
    parentId?: NullableString,
    collectionId?: NullableString,
    playlistId?: NullableString,
    prefix?: NullableString,
    action?: ItemAction | null,
    itemServerId?: NullableString,
    itemId?: NullableString,
    itemTimerId?: NullableString,
    itemSeriesTimerId?: NullableString,
    itemChannelId?: NullableString,
    itemPlaylistItemId?: NullableString,
    itemType?: NullableString,
    itemMediaType?: NullableString,
    itemCollectionType?: NullableString,
    itemIsFolder?: NullableBoolean,
    itemPath?: NullableString,
    itemStartDate?: NullableString,
    itemEndDate?: NullableString,
    itemUserData?: UserItemDataDto
};

export type DataAttributes = {
    'data-playlistitemid'?: NullableString;
    'data-timerid'?: NullableString;
    'data-seriestimerid'?: NullableString;
    'data-serverid'?: NullableString;
    'data-id'?: NullableString;
    'data-type'?: NullableString;
    'data-collectionid'?: NullableString;
    'data-playlistid'?: NullableString;
    'data-mediatype'?: NullableString;
    'data-channelid'?: NullableString;
    'data-path'?: NullableString;
    'data-collectiontype'?: NullableString;
    'data-context'?: NullableString;
    'data-parentid'?: NullableString;
    'data-startdate'?: NullableString;
    'data-enddate'?: NullableString;
    'data-prefix'?: NullableString;
    'data-action'?: ItemAction | null;
    'data-positionticks'?: NullableNumber;
    'data-isfolder'?: NullableBoolean;
};
