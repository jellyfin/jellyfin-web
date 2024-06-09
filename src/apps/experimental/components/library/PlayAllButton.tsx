import type { BaseItemDto, SeriesTimerInfoDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback } from 'react';
import { IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'scripts/globalize';
import { getFiltersQuery } from 'utils/items';
import { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

interface PlayAllButtonProps {
    item: BaseItemDto | null | undefined;
    items: BaseItemDto[] | SeriesTimerInfoDto[];
    viewType: LibraryTab;
    hasFilters: boolean;
    libraryViewSettings: LibraryViewSettings
}

const PlayAllButton: FC<PlayAllButtonProps> = ({ item, items, viewType, hasFilters, libraryViewSettings }) => {
    const play = useCallback(() => {
        if (item && !hasFilters) {
            playbackManager.play({
                items: [item],
                autoplay: true,
                queryOptions: {
                    SortBy: [libraryViewSettings.SortBy],
                    SortOrder: [libraryViewSettings.SortOrder]
                }
            });
        } else {
            playbackManager.play({
                items: items,
                autoplay: true,
                queryOptions: {
                    ParentId: item?.Id ?? undefined,
                    ...getFiltersQuery(viewType, libraryViewSettings),
                    SortBy: [libraryViewSettings.SortBy],
                    SortOrder: [libraryViewSettings.SortOrder]
                }

            });
        }
    }, [hasFilters, item, items, libraryViewSettings, viewType]);

    return (
        <IconButton
            title={globalize.translate('HeaderPlayAll')}
            className='paper-icon-button-light btnPlay autoSize'
            onClick={play}
        >
            <PlayArrowIcon />
        </IconButton>
    );
};

export default PlayAllButton;
