import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import type { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import type { ItemDto } from './base/models/item-dto';
import type { TextLineOpts } from 'components/common/textLines/types';

export interface ListOptions extends TextLineOpts {
    items?: ItemDto[] | null;
    index?: string;
    showIndex?: boolean;
    action?: string | null;
    imageSize?: string;
    enableOverview?: boolean;
    enableSideMediaInfo?: boolean;
    playlistId?: string | null;
    collectionId?: string | null;
    context?: CollectionType;
    parentId?: string | null;
    border?: boolean;
    highlight?: boolean;
    dragHandle?: boolean;
    showIndexNumberLeft?: boolean;
    showMediaInfo?: boolean;
    recordButton?: boolean;
    image?: boolean;
    imageSource?: string;
    defaultCardImageIcon?: string;
    disableIndicators?: boolean;
    imagePlayButton?: boolean;
    addToListButton?: boolean;
    infoButton?: boolean;
    enableUserDataButtons?: boolean;
    moreButton?: boolean;
    rightButtons?: {
        icon: string;
        title: string;
        id: string;
    }[];
    enablePlayedButton?: boolean;
    enableRatingButton?: boolean;
    smallIcon?: boolean;
    sortBy?: ItemSortBy;
}
