import React, { type FC, useCallback } from 'react';
import { PlayIcon } from '@radix-ui/react-icons';
import { Button } from 'ui-primitives/Button';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import { getFiltersQuery } from 'utils/items';
import { type LibraryViewSettings } from 'types/library';
import { type LibraryTab } from 'types/libraryTab';
import type { ItemDto } from 'types/base/models/item-dto';

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
