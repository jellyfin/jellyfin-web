import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { FC } from 'react';
import { useGetGenres } from '@/hooks/useFetchItems';
import NoItemsMessage from '@/components/common/NoItemsMessage';
import Loading from '@/components/loading/LoadingComponent';
import GenresSectionContainer from './GenresSectionContainer';
import type { ParentId } from '@/types/library';

interface GenresItemsContainerProps {
    parentId: ParentId;
    collectionType: CollectionType | undefined;
    itemType: BaseItemKind[];
}

const GenresItemsContainer: FC<GenresItemsContainerProps> = ({
    parentId,
    collectionType,
    itemType

}) => {
    const { isLoading, data: genresResult } = useGetGenres(itemType, parentId);

    let content: React.ReactNode = null;

    if (isLoading) {
        content = <Loading />;
    } else if (!genresResult?.Items?.length) {
        content = <NoItemsMessage message='MessageNoGenresAvailable' />;
    } else {
        content = genresResult.Items.map((genre) => (
            <GenresSectionContainer
                key={genre.Id}
                collectionType={collectionType}
                parentId={parentId}
                itemType={itemType}
                genre={genre}
            />
        ));
    }

    return content;
};

export default GenresItemsContainer;
