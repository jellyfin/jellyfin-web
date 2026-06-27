import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import React, { FC, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import { useSearchParams } from 'react-router-dom';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import Cards from 'components/cardbuilder/Card/Cards';
import ItemsContainer from 'elements/emby-itemscontainer/ItemsContainer';
import Page from 'components/Page';
import Pagination from 'apps/experimental/components/library/Pagination';
import { useApi } from 'hooks/useApi';
import { type LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import { getDefaultLibraryViewSettings } from 'utils/items';
import { CardShape } from 'utils/card';
import type { ItemDto } from 'types/base/models/item-dto';
import * as userSettings from 'scripts/settings/userSettings';

const PersonVideosPage: FC = () => {
    const [searchParams] = useSearchParams();
    const personId = searchParams.get('personId') ?? undefined;
    const personType = searchParams.get('personType') ?? undefined;
    const { api, user } = useApi();

    const [libraryViewSettings, setLibraryViewSettings] = useState<LibraryViewSettings>({
        ...getDefaultLibraryViewSettings(LibraryTab.Movies),
        SortBy: ItemSortBy.SortName,
        SortOrder: SortOrder.Ascending,
        StartIndex: 0
    });

    const limit = userSettings.libraryPageSize(undefined) || undefined;

    const { isLoading, data: itemsResult, isPlaceholderData } = useQuery({
        queryKey: ['PersonVideos', personId, personType, libraryViewSettings.StartIndex],
        queryFn: async ({ signal }) => {
            if (!api || !user?.Id || !personId) return undefined;
            const response = await getItemsApi(api).getItems(
                {
                    userId: user.Id,
                    personIds: [personId],
                    // Filter by role when coming from Crew tab (personType param present)
                    personTypes: personType ? [personType] : undefined,
                    recursive: true,
                    imageTypeLimit: 1,
                    enableImageTypes: [ImageType.Primary, ImageType.Backdrop, ImageType.Thumb],
                    sortBy: [ItemSortBy.SortName],
                    sortOrder: [SortOrder.Ascending],
                    startIndex: libraryViewSettings.StartIndex,
                    limit: limit
                },
                { signal }
            );
            return response.data;
        },
        enabled: !!api && !!user?.Id && !!personId,
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData
    });

    const getCardOptions = useCallback(() => ({
        shape: CardShape.Auto,
        showTitle: true,
        showYear: true,
        centerText: true,
        coverImage: true,
        overlayPlayButton: true,
        queryKey: ['PersonVideos']
    }), []);

    const totalRecordCount = itemsResult?.TotalRecordCount ?? 0;
    const items = (itemsResult?.Items ?? []) as ItemDto[];

    return (
        <Page
            id='personVideosPage'
            className='mainAnimatedPage libraryPage'
        >
            <Box>
                <Box className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                    <Pagination
                        totalRecordCount={totalRecordCount}
                        libraryViewSettings={libraryViewSettings}
                        isPlaceholderData={isPlaceholderData}
                        setLibraryViewSettings={setLibraryViewSettings}
                    />
                </Box>

                {isLoading ? (
                    <Loading />
                ) : items.length === 0 ? (
                    <NoItemsMessage message='MessageNoItemsAvailable' />
                ) : (
                    <ItemsContainer className='centered padded-left padded-right vertical-wrap'>
                        <Cards
                            items={items}
                            cardOptions={getCardOptions()}
                        />
                    </ItemsContainer>
                )}

                <Box className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                    <Pagination
                        totalRecordCount={totalRecordCount}
                        libraryViewSettings={libraryViewSettings}
                        isPlaceholderData={isPlaceholderData}
                        setLibraryViewSettings={setLibraryViewSettings}
                    />
                </Box>
            </Box>
        </Page>
    );
};

export default PersonVideosPage;
