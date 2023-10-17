import React, { FC } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { getDefaultTabIndex } from '../../components/tabs/tabRoutes';
import Page from 'components/Page';
import CollectionsView from './CollectionsView';
import FavoritesView from './FavoritesView';
import GenresView from './GenresView';
import MoviesView from './MoviesView';
import SuggestionsView from './SuggestionsView';
import TrailersView from './TrailersView';

const Movies: FC = () => {
    const location = useLocation();
    const [ searchParams ] = useSearchParams();
    const searchParamsParentId = searchParams.get('topParentId');
    const searchParamsTab = searchParams.get('tab');
    const currentTabIndex = searchParamsTab !== null ? parseInt(searchParamsTab, 10) :
        getDefaultTabIndex(location.pathname, searchParamsParentId);

    const getTabComponent = (index: number) => {
        if (index == null) {
            throw new Error('index cannot be null');
        }

        let component;
        switch (index) {
            case 1:
                component = <SuggestionsView parentId={searchParamsParentId} />;
                break;

            case 2:
                component = <TrailersView parentId={searchParamsParentId} />;
                break;

            case 3:
                component = <FavoritesView parentId={searchParamsParentId} />;
                break;

            case 4:
                component = <CollectionsView parentId={searchParamsParentId} />;
                break;

            case 5:
                component = <GenresView parentId={searchParamsParentId} />;
                break;
            default:
                component = <MoviesView parentId={searchParamsParentId} />;
        }

        return component;
    };

    return (
        <Page
            id='moviesPage'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='movie'
        >
            {getTabComponent(currentTabIndex)}

        </Page>
    );
};

export default Movies;
