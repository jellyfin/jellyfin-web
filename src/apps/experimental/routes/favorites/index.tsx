import PageTabContent from 'apps/experimental/components/library/PageTabContent';
import Page from 'components/Page';
import React, { FC } from 'react';
import { LibraryTab } from 'types/libraryTab';

const FavoritesView: FC = () => {
    return (<Page
        id='favoritesPage'
        className='mainAnimatedPage homePage libraryPage allLibraryPage backdropPage pageWithAbsoluteTabs withTabs'
        isBackButtonEnabled={false}
        backDropType='movie,series,book'
    >
        <PageTabContent parentId={undefined} currentTab={{
            viewType: LibraryTab.Favorites
        }} />
    </Page>

    );
};

export default FavoritesView;
