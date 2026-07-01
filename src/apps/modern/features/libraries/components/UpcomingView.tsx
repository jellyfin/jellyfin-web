import React, { type FC, useCallback, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';

import { CardShape } from 'components/cardbuilder/utils/shape';
import { useApi } from 'hooks/useApi';
import { groupsUpcomingEpisodes, useGetUpcomingEpisodes } from 'hooks/useFetchItems';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import SectionContainer from 'components/common/SectionContainer';
import type { ItemDto } from 'types/base/models/item-dto';
import type { LibraryViewProps } from 'types/library';

const UpcomingView: FC<LibraryViewProps> = ({ parentId }) => {
    const { __legacyApiClient__ } = useApi();
    const {
        isLoading,
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useGetUpcomingEpisodes(parentId);

    const items = useMemo<ItemDto[]>(
        () =>
            data?.pages.flatMap(
                (page) => (page?.Items as ItemDto[]) ?? []
            ) ?? [],
        [data]
    );

    const groups = useMemo(() => groupsUpcomingEpisodes(items), [items]);

    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useCallback(
        (node: HTMLDivElement | null) => {
            observerRef.current?.disconnect();

            if (!node) {
                return;
            }

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    if (
                        entries[0]?.isIntersecting
                        && hasNextPage
                        && !isFetchingNextPage
                    ) {
                        void fetchNextPage();
                    }
                },
                { rootMargin: '600px' }
            );
            observerRef.current.observe(node);
        },
        [hasNextPage, isFetchingNextPage, fetchNextPage]
    );

    if (isLoading) return <Loading />;

    if (!groups.length) {
        return <NoItemsMessage message='MessagePleaseEnsureInternetMetadata' />;
    }

    return (
        <Box className='padded-bottom-page'>
            {groups.map((group) => (
                <SectionContainer
                    key={group.name}
                    isScrollerMode={false}
                    sectionHeaderProps={{
                        title: group.name
                    }}
                    itemsContainerProps={{
                        className: 'vertical-wrap padded-left padded-right',
                        queryKey: ['UpcomingEpisodes']
                    }}
                    items={group.items}
                    cardOptions={{
                        shape: CardShape.Backdrop,
                        showLocationTypeIndicator: false,
                        showTitle: true,
                        showParentTitle: true,
                        preferThumb: true,
                        lazy: true,
                        showDetailsMenu: true,
                        missingIndicator: false,
                        cardLayout: false,
                        queryKey: ['UpcomingEpisodes'],
                        serverId: __legacyApiClient__?.serverId()
                    }}
                />
            ))}

            {hasNextPage && <Box ref={sentinelRef} sx={{ height: '1px' }} />}
            {isFetchingNextPage && <Loading />}
        </Box>
    );
};

export default UpcomingView;
