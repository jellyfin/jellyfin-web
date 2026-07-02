import React, { type FC } from 'react';
import Page from 'components/Page';
import useCurrentTab from 'hooks/useCurrentTab';
import PageTabContent from 'apps/modern/features/libraries/components/PageTabContent';
import favoritesViews from 'apps/modern/features/libraries/constants/views/favorites';

const Favorites: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = favoritesViews[activeTab] ?? favoritesViews[0];

    return (
        <Page
            id='favoritesPage'
            className='mainAnimatedPage libraryPage pageWithAbsoluteTabs withTabs'
        >
            <PageTabContent
                key={`${currentTab.viewType}-${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default Favorites;
