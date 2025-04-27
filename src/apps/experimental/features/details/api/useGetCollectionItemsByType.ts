import type { AxiosRequestConfig } from 'axios';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { useQuery } from '@tanstack/react-query';
import { JellyfinApiContext, useApi } from 'hooks/useApi';
import type { ItemDtoQueryResult } from 'types/base/models/item-dto-query-result';
import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';
import { CardShape } from 'utils/card';
import { ItemMediaKind } from 'types/base/models/item-media-kind';
import { ItemKind } from 'types/base/models/item-kind';

type CollectionItemType =
    | { name: string; type: ItemKind; mediaType?: never }
    | { name: string; mediaType: ItemMediaKind; type?: never };

const COLLECTION_ITEM_TYPES: CollectionItemType[] = [
    {
        name: 'Movies',
        type: ItemKind.Movie
    },
    {
        name: 'Series',
        type: ItemKind.Series
    },
    {
        name: 'Episodes',
        type: ItemKind.Episode
    },
    {
        name: 'Albums',
        type: ItemKind.MusicAlbum
    },
    {
        name: 'Books',
        type: ItemKind.Book
    },
    {
        name: 'Collections',
        type: ItemKind.BoxSet
    },
    {
        name: 'Channels',
        type: ItemKind.TvChannel
    },
    {
        name: 'HeaderVideos',
        mediaType: ItemMediaKind.Video
    }
];

type FilteredItems = {
    filtered: ItemDto[];
    leftover: ItemDto[];
};

const filterItemsByType = (
    items: ItemDto[],
    typeInfo: CollectionItemType
): FilteredItems => {
    return items.reduce<FilteredItems>(
        (acc, item) => {
            const match = typeInfo.mediaType ?
                item.MediaType === typeInfo.mediaType :
                item.Type === typeInfo.type;

            match ? acc.filtered.push(item) : acc.leftover.push(item);
            return acc;
        },
        { filtered: [], leftover: [] }
    );
};

const getCardOptions = (typeInfo: CollectionItemType): CardOptions => ({
    shape:
        typeInfo.type === ItemKind.MusicAlbum || typeInfo.type === ItemKind.TvChannel ?
            CardShape.SquareOverflow :
            CardShape.PortraitOverflow,
    showYear:
        typeInfo.mediaType === ItemMediaKind.Video
        || typeInfo.type === ItemKind.Series
        || typeInfo.type === ItemKind.Movie
});

interface Section {
    title: string;
    items: ItemDto[];
    cardOptions?: CardOptions;
}

function getCollectionSections(items: ItemDto[]): Section[] {
    const { sections, leftoverItems } = COLLECTION_ITEM_TYPES.reduce(
        (acc, typeInfo) => {
            const { filtered, leftover } = filterItemsByType(
                acc.leftoverItems,
                typeInfo
            );

            if (filtered.length > 0) {
                acc.sections.push({
                    title: typeInfo.name,
                    items: filtered,
                    cardOptions: getCardOptions(typeInfo)
                });
            }

            return { ...acc, leftoverItems: leftover };
        },
        { sections: [] as Section[], leftoverItems: items }
    );

    if (leftoverItems.length > 0) {
        sections.push({
            title: 'HeaderOtherItems',
            items: leftoverItems,
            cardOptions: {
                shape: CardShape.PortraitOverflow,
                showYear: false
            }
        });
    }

    return sections;
}

const getItems = async (
    apiContext: JellyfinApiContext,
    itemId: string,
    options?: AxiosRequestConfig
) => {
    const { api, user } = apiContext;

    if (!api) throw new Error('No API instance available');
    if (!user?.Id) throw new Error('No item User ID provided');

    const response = await getItemsApi(api).getItems(
        {
            userId: user.Id,
            fields: [
                ItemFields.ItemCounts,
                ItemFields.PrimaryImageAspectRatio,
                ItemFields.CanDelete,
                ItemFields.MediaSourceCount
            ],
            parentId: itemId
        },
        options
    );

    const itemResult = response.data as ItemDtoQueryResult;
    const items = itemResult.Items || [];

    return getCollectionSections(items);
};

export const useGetCollectionItemsByType = (itemId: string) => {
    const apiContext = useApi();
    return useQuery({
        queryKey: ['CollectionItemsByType', itemId],
        queryFn: ({ signal }) => getItems(apiContext, itemId, { signal }),
        enabled: !!apiContext.api && !!apiContext.user?.Id
    });
};
