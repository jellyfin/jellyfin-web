import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import Box from '@mui/material/Box';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { useIntersectionObserver } from 'usehooks-ts';

import NoItemsMessage from 'components/common/NoItemsMessage';
import Loading from 'components/loading/LoadingComponent';
import type { ParentId } from 'types/library';

import { useGenres } from '../hooks/api/useGenres';
import GenresSectionContainer from './GenresSectionContainer';
import AlphabetPicker from './AlphabetPicker';

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
    const [alphabet, setAlphabet] = useState<string | null>();
    const {
        isLoading,
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useGenres({
        parentId,
        includeItemTypes: itemType,
        alphabet
    });

    const genres = useMemo(
        () => data?.pages.flatMap((page) => page?.Items ?? []) ?? [],
        [data]
    );

    const { ref: sentinelRef, isIntersecting } = useIntersectionObserver({
        rootMargin: '200px'
    });

    useEffect(() => {
        if (isIntersecting && hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
        }
    }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // No genres at all (no letter filter active) - nothing to pick from
    if (!isLoading && !genres.length && alphabet == null) {
        return <NoItemsMessage message='MessageNoGenresAvailable' />;
    }

    const renderGenres = () => {
        if (isLoading) {
            return <Loading />;
        }

        if (!genres.length) {
            return <NoItemsMessage message='MessageNoGenresAvailable' />;
        }

        return (
            <>
                {genres.map((genre) => (
                    <GenresSectionContainer
                        key={genre.Id}
                        collectionType={collectionType}
                        parentId={parentId}
                        itemType={itemType}
                        genre={genre}
                    />
                ))}

                {hasNextPage && <Box ref={sentinelRef} sx={{ height: '1px' }} />}
                {isFetchingNextPage && <Loading />}
            </>
        );
    };

    return (
        <>
            <AlphabetPicker value={alphabet} onChange={setAlphabet} />

            {renderGenres()}
        </>
    );
};

export default GenresItemsContainer;
