import type { BaseItemDtoQueryResult, BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import escapeHTML from 'escape-html';
import React, { FC, useCallback, useEffect, useState } from 'react';
import ServerConnections from '../ServerConnections';
import loading from '../loading/loading';
import SectionContainer from './SectionContainer';

interface GenresSectionContainerProps {
    topParentId?: string | null;
    getItemTypes: () => string[];
    genre: BaseItemDto;
}

const GenresSectionContainer: FC<GenresSectionContainerProps> = ({
    topParentId,
    getItemTypes,
    genre
}) => {
    const [ itemsResult, setItemsResult ] = useState<BaseItemDtoQueryResult>({});

    const getContext = useCallback(() => {
        const itemType = getItemTypes().join(',');
        if (itemType === 'Movie') {
            return 'movies';
        }

        if (itemType === 'Series') {
            return 'tvshows';
        }

        return null;
    }, [getItemTypes]);

    const fetchData = useCallback(() => {
        loading.show();

        const apiClient = ServerConnections.getApiClient(window.ApiClient.serverId());

        return apiClient.getItems(
            apiClient.getCurrentUserId(),
            {
                SortBy: 'Random',
                SortOrder: 'Ascending',
                IncludeItemTypes: getItemTypes().join(','),
                Recursive: true,
                Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
                ImageTypeLimit: 1,
                EnableImageTypes: 'Primary',
                Limit: 6,
                GenreIds: genre.Id,
                EnableTotalRecordCount: false,
                ParentId: topParentId
            }
        );
    }, [genre.Id, getItemTypes, topParentId]);

    const reloadItems = useCallback(() => {
        fetchData().then((result) => {
            setItemsResult(result);
            loading.hide();
        });
    }, [fetchData]);

    useEffect(() => {
        reloadItems();
    }, [reloadItems]);

    return <SectionContainer
        sectionTitle={escapeHTML(genre.Name)}
        items={itemsResult.Items || []}
        genre={genre}
        getContext={getContext}
        cardOptions={{
            scalable: true,
            overlayPlayButton: true,
            showTitle: true,
            centerText: true,
            cardLayout: false,
            shape: 'overflowPortrait',
            showYear: true
        }}
    />;
};

export default GenresSectionContainer;
