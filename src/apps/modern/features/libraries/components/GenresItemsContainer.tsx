import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import Box from '@mui/material/Box';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { useIntersectionObserver } from 'usehooks-ts';

import NoItemsMessage from 'components/common/NoItemsMessage';
import Loading from 'components/loading/LoadingComponent';
import { useSystemInfo } from 'hooks/useSystemInfo';
import type { ParentId } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

import { useGenres } from '../hooks/api/useGenres';
import { getAlphabetNavigationSettings, getLocalizedAlphabetGroups } from '../utils/alphabet';
import AlphabetPicker from './AlphabetPicker';
import GenresSectionContainer from './GenresSectionContainer';

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
    const { data: systemInfo } = useSystemInfo();
    const alphabetNavigationSettings = useMemo(
        () => getAlphabetNavigationSettings(systemInfo),
        [systemInfo]
    );
    const alphabetGroups = useMemo(
        () => getLocalizedAlphabetGroups(alphabetNavigationSettings, LibraryTab.Genres),
        [alphabetNavigationSettings]
    );
    const {
        isLoading,
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useGenres({
        parentId,
        includeItemTypes: itemType,
        alphabet,
        alphabetNavigationSettings,
        enabled: Boolean(systemInfo)
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

    if (!systemInfo) {
        return <Loading />;
    }

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
            <AlphabetPicker
                value={alphabet}
                onChange={setAlphabet}
                groups={alphabetGroups}
            />

            {renderGenres()}
        </>
    );
};

export default GenresItemsContainer;
