import { BaseItemDto, SeriesTimerInfoDto } from '@jellyfin/sdk/lib/generated-client';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

export interface ListOptions {
    items?: BaseItemDto[] | SeriesTimerInfoDto[] | null;
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
    mediaInfo?: boolean;
    recordButton?: boolean;
    image?: boolean;
    imageSource?: string;
    defaultCardImageIcon?: string;
    disableIndicators?: boolean;
    imagePlayButton?: boolean;
    showProgramDateTime?: boolean;
    showProgramTime?: boolean;
    showChannel?: boolean;
    showParentTitle?: boolean;
    showIndexNumber?: boolean;
    parentTitleWithTitle?: boolean;
    artist?: boolean;
    includeParentInfoInTitle?: boolean;
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
