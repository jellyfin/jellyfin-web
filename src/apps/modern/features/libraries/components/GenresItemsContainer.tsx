import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import Box from '@mui/material/Box';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { useGetGenres } from 'hooks/useFetchItems';
import NoItemsMessage from 'components/common/NoItemsMessage';
import Loading from 'components/loading/LoadingComponent';
import GenresSectionContainer from './GenresSectionContainer';
import AlphabetPicker from './AlphabetPicker';
import type { ParentId } from 'types/library';

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
    } = useGetGenres(itemType, parentId, alphabet);

    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const target = observerTarget.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    void fetchNextPage();
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const genres = useMemo(
        () => data?.pages.flatMap((page) => page?.Items ?? []) ?? [],
        [data]
    );

    if (isLoading) {
        return <Loading />;
    }

    // No genres at all (no letter filter active) - nothing to pick from
    if (!genres.length && alphabet == null) {
        return <NoItemsMessage message='MessageNoGenresAvailable' />;
    }

    return (
        <>
            <AlphabetPicker value={alphabet} onChange={setAlphabet} />

            {genres.length ? (
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

                    <Box ref={observerTarget} sx={{ height: '1px' }} />

                    {isFetchingNextPage && <Loading />}
                </>
            ) : (
                <NoItemsMessage message='MessageNoGenresAvailable' />
            )}
        </>
    );
};

export default GenresItemsContainer;
