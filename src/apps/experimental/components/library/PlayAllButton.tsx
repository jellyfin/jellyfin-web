import { PlayIcon } from '@radix-ui/react-icons';
import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import React, { type FC, useCallback } from 'react';
import type { ItemDto } from 'types/base/models/item-dto';
import { type LibraryViewSettings } from 'types/library';
import { type LibraryTab } from 'types/libraryTab';
import { Button } from 'ui-primitives';
import { getFiltersQuery } from 'utils/items';

interface PlayAllButtonProps {
    item: ItemDto | undefined;
    items: ItemDto[];
    viewType: LibraryTab;
    hasFilters: boolean;
    isTextVisible: boolean;
    libraryViewSettings: LibraryViewSettings;
}

const PlayAllButton: FC<PlayAllButtonProps> = ({
    item,
    items,
    viewType,
    hasFilters,
    isTextVisible,
    libraryViewSettings
}) => {
    const play = useCallback(() => {
        if (item && !hasFilters) {
            playbackManager
                .play({
                    items: [item],
                    autoplay: true,
                    queryOptions: {
                        SortBy: [libraryViewSettings.SortBy],
                        SortOrder: [libraryViewSettings.SortOrder]
                    }
                })
                .catch((err: unknown) => {
                    console.error('[PlayAllButton] failed to play', err);
                });
        } else {
            playbackManager
                .play({
                    items,
                    autoplay: true,
                    queryOptions: {
                        ParentId: item?.Id ?? undefined,
                        ...getFiltersQuery(viewType, libraryViewSettings),
                        SortBy: [libraryViewSettings.SortBy],
                        SortOrder: [libraryViewSettings.SortOrder]
                    }
                })
                .catch((err: unknown) => {
                    console.error('[PlayAllButton] failed to play', err);
                });
        }
    }, [hasFilters, item, items, libraryViewSettings, viewType]);

    return (
        <Button
            title={globalize.translate('HeaderPlayAll')}
            startIcon={isTextVisible ? <PlayIcon /> : undefined}
            variant="plain"
            onClick={play}
        >
            {isTextVisible ? globalize.translate('HeaderPlayAll') : <PlayIcon />}
        </Button>
    );
};

export default PlayAllButton;
