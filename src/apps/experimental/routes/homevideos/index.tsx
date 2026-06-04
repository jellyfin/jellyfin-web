import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC } from 'react';

import PageTabContent from 'apps/experimental/components/library/PageTabContent';
import viewsByKind from 'apps/experimental/features/libraries/constants/views';
import Page from 'components/Page';
import useCurrentTab from 'hooks/useCurrentTab';

const HomeVideos: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = viewsByKind[CollectionType.Homevideos][activeTab];

    return (
        <Page
            id='homevideos'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='video, photo'
        >
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default HomeVideos;
