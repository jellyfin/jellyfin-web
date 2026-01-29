import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import PageTabContent from 'apps/experimental/components/library/PageTabContent';
import Page from 'components/Page';
import useCurrentTab from 'hooks/useCurrentTab';
import React, { type FC } from 'react';
import { LibraryTab } from 'types/libraryTab';
import { type LibraryTabContent, type LibraryTabMapping } from 'types/libraryTabContent';

const photosTabContent: LibraryTabContent = {
    viewType: LibraryTab.Photos,
    collectionType: CollectionType.Homevideos,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true,
    itemType: [BaseItemKind.Photo]
};

const photoAlbumsTabContent: LibraryTabContent = {
    viewType: LibraryTab.PhotoAlbums,
    collectionType: CollectionType.Homevideos,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true,
    itemType: [BaseItemKind.PhotoAlbum]
};

const videosTabContent: LibraryTabContent = {
    viewType: LibraryTab.Videos,
    collectionType: CollectionType.Homevideos,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true,
    itemType: [BaseItemKind.Video]
};

const homevideosTabMapping: LibraryTabMapping = {
    0: photosTabContent,
    1: photoAlbumsTabContent,
    2: videosTabContent
};

const HomeVideosPage: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = homevideosTabMapping[activeTab];

    return (
        <Page
            id="homevideos"
            className="mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs"
            backDropType="video, photo"
        >
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default HomeVideosPage;
