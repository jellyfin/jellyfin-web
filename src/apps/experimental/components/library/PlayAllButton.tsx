import React, { FC, useCallback } from 'react';
import Button from '@mui/material/Button';
import PlayArrow from '@mui/icons-material/PlayArrow';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import { getFiltersQuery } from 'utils/items';
import { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import type { ItemDto } from 'types/base/models/item-dto';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

interface PlayAllButtonProps {
    item: ItemDto | undefined
    items: ItemDto[]
    viewType: LibraryTab
    collectionType: CollectionType | undefined
    hasFilters: boolean
    isTextVisible: boolean
    libraryViewSettings: LibraryViewSettings
}

const PlayAllButton: FC<PlayAllButtonProps> = ({
    item,
    items,
    viewType,
    collectionType,
    hasFilters,
    isTextVisible,
    libraryViewSettings
}) => {
    const play = useCallback(() => {
        // For the Homevideos library Videos tab, pass items directly to playback since
        // the playback manager hardcodes MediaTypes: 'Photo' for the Homevideos library
        // which would exclude videos from the queue
        if (item && !hasFilters && !(viewType === LibraryTab.Videos && collectionType === CollectionType.Homevideos)) {
            playbackManager.play({
                items: [item],
                autoplay: true,
                queryOptions: {
                    SortBy: [libraryViewSettings.SortBy],
                    SortOrder: [libraryViewSettings.SortOrder]
                }
            }).catch(err => {
                console.error('[PlayAllButton] failed to play', err);
            });
        } else {
            playbackManager.play({
                items,
                autoplay: true,
                queryOptions: {
                    ParentId: item?.Id ?? undefined,
                    ...getFiltersQuery(viewType, libraryViewSettings),
                    SortBy: [libraryViewSettings.SortBy],
                    SortOrder: [libraryViewSettings.SortOrder]
                }
            }).catch(err => {
                console.error('[PlayAllButton] failed to play', err);
            });
        }
    }, [collectionType, hasFilters, item, items, libraryViewSettings, viewType]);

    return (
        <Button
            title={globalize.translate('HeaderPlayAll')}
            startIcon={isTextVisible ? <PlayArrow /> : undefined}
            onClick={play}
        >
            {isTextVisible ? (
                globalize.translate('HeaderPlayAll')
            ) : (
                <PlayArrow />
            )}
        </Button>
    );
};

export default PlayAllButton;
