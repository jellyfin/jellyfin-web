import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { type BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import React, { type FC } from 'react';

import { useApi } from 'hooks/useApi';
import { useGetItems } from 'hooks/useFetchItems';
import Loading from 'components/loading/LoadingComponent';
import { appRouter } from 'components/router/appRouter';
import SectionContainer from 'components/common/SectionContainer';
import { CardShape } from 'utils/card';
import type { ParentId } from 'types/library';
import type { ItemDto } from 'types/base/models/item-dto';

interface GenresSectionContainerProps {
    parentId: ParentId;
    collectionType: CollectionType | undefined;
    itemType: BaseItemKind[];
    genre: ItemDto;
}

const GenresSectionContainer: FC<GenresSectionContainerProps> = ({ parentId, collectionType, itemType, genre }) => {
    const { __legacyApiClient__ } = useApi();
    const getParametersOptions = () => {
        return {
            sortBy: [ItemSortBy.Random],
            sortOrder: [SortOrder.Ascending],
            includeItemTypes: itemType,
            recursive: true,
            fields: [ItemFields.PrimaryImageAspectRatio, ItemFields.MediaSourceCount],
            imageTypeLimit: 1,
            enableImageTypes: [ImageType.Primary],
            limit: 25,
            genreIds: genre.Id ? [genre.Id] : undefined,
            enableTotalRecordCount: false,
            parentId: parentId ?? undefined
        };
    };

    const { isLoading, data: itemsResult } = useGetItems(getParametersOptions());

    const getRouteUrl = (item: ItemDto) => {
        return appRouter.getRouteUrl(item, {
            context: collectionType,
            parentId: parentId ?? undefined
        });
    };

    if (isLoading) {
        return <Loading />;
    }

    return (
        <SectionContainer
            key={genre.Name}
            sectionHeaderProps={{
                title: genre.Name || '',
                url: getRouteUrl(genre)
            }}
            items={itemsResult?.Items}
            cardOptions={{
                scalable: true,
                overlayPlayButton: true,
                showTitle: true,
                centerText: true,
                cardLayout: false,
                shape: collectionType === CollectionType.Music ? CardShape.SquareOverflow : CardShape.PortraitOverflow,
                showParentTitle: collectionType === CollectionType.Music,
                showYear: collectionType !== CollectionType.Music,
                serverId: __legacyApiClient__?.serverId()
            }}
        />
    );
};

export default GenresSectionContainer;
