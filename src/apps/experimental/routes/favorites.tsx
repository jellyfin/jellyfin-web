import React, { type FC } from 'react';
import Page from 'components/Page';
import FavoritesSectionView from '../components/library/FavoritesSectionView';

const Favorites: FC = () => {
    return (
        <Page
            id='favoritesPage'
            className='mainAnimatedPage libraryPage allLibraryPage noSecondaryNavPage backdropPage'
            backDropType='movie,series,book'
        >
            <FavoritesSectionView />
        </Page>
    );
};

export default Favorites;
