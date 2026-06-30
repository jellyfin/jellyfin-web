import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC } from 'react';

import PageTabContent from 'apps/modern/components/library/PageTabContent';
import viewsByKind from 'apps/modern/features/libraries/constants/views';
import Page from 'components/Page';
import useCurrentTab from 'hooks/useCurrentTab';

interface LibraryPageProps {
    type: CollectionType
}

const PAGE_IDS: Record<CollectionType, string> = {
    [CollectionType.Books]: 'booksPage',
    [CollectionType.Boxsets]: 'boxsetsPage',
    [CollectionType.Folders]: 'foldersPage', // unused
    [CollectionType.Homevideos]: 'homevideos',
    [CollectionType.Livetv]: 'liveTvPage',
    [CollectionType.Movies]: 'moviesPage',
    [CollectionType.Music]: 'musicPage',
    [CollectionType.Musicvideos]: 'musicvideos',
    [CollectionType.Photos]: 'photosPage', // unused
    [CollectionType.Playlists]: 'playlistsPage',
    [CollectionType.Trailers]: 'trailersPage', // unused
    [CollectionType.Tvshows]: 'tvshowsPage',
    [CollectionType.Unknown]: 'mixed'
};

const PAGE_BACKDROPS: Partial<Record<CollectionType, BaseItemKind[]>> = {
    [CollectionType.Boxsets]: [BaseItemKind.BoxSet],
    [CollectionType.Homevideos]: [BaseItemKind.Video, BaseItemKind.Photo],
    [CollectionType.Movies]: [BaseItemKind.Movie],
    [CollectionType.Music]: [BaseItemKind.MusicArtist],
    [CollectionType.Musicvideos]: [BaseItemKind.MusicVideo],
    [CollectionType.Tvshows]: [BaseItemKind.Series],
    [CollectionType.Unknown]: [BaseItemKind.Movie, BaseItemKind.Series]
};

const LibraryPage: FC<LibraryPageProps> = ({
    type
}) => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = viewsByKind[type][activeTab];

    return (
        <Page
            id={PAGE_IDS[type]}
            className={'mainAnimatedPage libraryPage pageWithAbsoluteTabs withTabs'}
            backDropType={PAGE_BACKDROPS[type]}
        >
            <PageTabContent
                key={`${currentTab.viewType}-${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default LibraryPage;
