import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC } from 'react';

import PageTabContent from 'apps/experimental/components/library/PageTabContent';
import viewsByKind from 'apps/experimental/features/libraries/constants/views';
import Page from 'components/Page';
import useCurrentTab from 'hooks/useCurrentTab';

const MusicVideos: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = viewsByKind[CollectionType.Musicvideos][activeTab];

    return (
        <Page
            id='musicvideos'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='musicvideo'
        >
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default MusicVideos;
