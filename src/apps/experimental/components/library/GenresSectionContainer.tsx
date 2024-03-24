import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import React, { type FC } from 'react';
import { useGetItems } from 'hooks/useFetchItems';
import Loading from 'components/loading/LoadingComponent';
import { appRouter } from 'components/router/appRouter';
import SectionContainer from './SectionContainer';
import { CardShape } from 'utils/card';
import type { ParentId } from 'types/library';

interface GenresSectionContainerProps {
    parentId: ParentId;
    collectionType: CollectionType | undefined;
    itemType: BaseItemKind[];
    genre: BaseItemDto;
}

const GenresSectionContainer: FC<GenresSectionContainerProps> = ({
    parentId,
    collectionType,
    itemType,
    genre
}) => {
    const getParametersOptions = () => {
        return {
            sortBy: [ItemSortBy.Random],
            sortOrder: [SortOrder.Ascending],
            includeItemTypes: itemType,
            recursive: true,
            fields: [
                ItemFields.PrimaryImageAspectRatio,
                ItemFields.MediaSourceCount
            ],
            imageTypeLimit: 1,
            enableImageTypes: [ImageType.Primary],
            limit: 25,
            genreIds: genre.Id ? [genre.Id] : undefined,
            enableTotalRecordCount: false,
            parentId: parentId ?? undefined
        };
    };

    const { isLoading, data: itemsResult } = useGetItems(getParametersOptions());

    const getRouteUrl = (item: BaseItemDto) => {
        return appRouter.getRouteUrl(item, {
            context: collectionType,
            parentId: parentId
        });
    };

    if (isLoading) {
        return <Loading />;
    }

    return <SectionContainer
        sectionTitle={genre.Name || ''}
        items={itemsResult?.Items || []}
        url={getRouteUrl(genre)}
        cardOptions={{
            scalable: true,
            overlayPlayButton: true,
            showTitle: true,
            centerText: true,
            cardLayout: false,
            shape: collectionType === CollectionType.Music ? CardShape.SquareOverflow : CardShape.PortraitOverflow,
            showParentTitle: collectionType === CollectionType.Music,
            showYear: collectionType !== CollectionType.Music
        }}
    />;
};

export default GenresSectionContainer;
