import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import Box from '@mui/material/Box';
import React, { type FC, useEffect, useMemo } from 'react';
import { useIntersectionObserver } from 'usehooks-ts';

import { CardShape } from 'components/cardbuilder/utils/shape';
import { useApi } from 'hooks/useApi';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import SectionContainer from 'components/common/SectionContainer';
import type { ItemDto } from 'types/base/models/item-dto';
import type { LibraryViewProps } from 'types/library';

import { useUpcomingEpisodes } from '../hooks/api/useUpcomingEpisodes';
import { groupsUpcomingEpisodes } from '../utils/upcomingEpisodes';

const UpcomingView: FC<LibraryViewProps> = ({ parentId }) => {
    const { __legacyApiClient__ } = useApi();
    const {
        isLoading,
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useUpcomingEpisodes({
        parentId: parentId || undefined,
        fields: [ItemFields.AirTime],
        imageTypeLimit: 1,
        enableImageTypes: [
            ImageType.Primary,
            ImageType.Backdrop,
            ImageType.Thumb
        ]
    }, !!parentId);

    const items = useMemo<ItemDto[]>(
        () =>
            data?.pages.flatMap(
                (page) => (page?.Items as ItemDto[]) ?? []
            ) ?? [],
        [data]
    );

    const groups = useMemo(() => groupsUpcomingEpisodes(items), [items]);

    const { ref: sentinelRef, isIntersecting } = useIntersectionObserver({
        rootMargin: '600px'
    });

    useEffect(() => {
        if (isIntersecting && hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
        }
    }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

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
