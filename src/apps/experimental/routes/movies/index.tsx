import '../../../../elements/emby-scroller/emby-scroller';
import '../../../../elements/emby-itemscontainer/emby-itemscontainer';
import '../../../../elements/emby-tabs/emby-tabs';
import '../../../../elements/emby-button/emby-button';

import React, { FC, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import Page from '../../../../components/Page';
import globalize from '../../../../scripts/globalize';
import libraryMenu from '../../../../scripts/libraryMenu';
import CollectionsView from './CollectionsView';
import FavoritesView from './FavoritesView';
import GenresView from './GenresView';
import MoviesView from './MoviesView';
import SuggestionsView from './SuggestionsView';
import TrailersView from './TrailersView';
import { getDefaultTabIndex } from '../../components/tabs/tabRoutes';

const Movies: FC = () => {
    const location = useLocation();
    const [ searchParams ] = useSearchParams();
    const searchParamsTab = searchParams.get('tab');
    const currentTabIndex = searchParamsTab !== null ? parseInt(searchParamsTab, 10) :
        getDefaultTabIndex(location.pathname, searchParams.get('topParentId'));
    const element = useRef<HTMLDivElement>(null);

    const getTabComponent = (index: number) => {
        if (index == null) {
            throw new Error('index cannot be null');
        }

        let component;
        switch (index) {
            case 0:
                component = <MoviesView topParentId={searchParams.get('topParentId')} />;
                break;

            case 1:
                component = <SuggestionsView topParentId={searchParams.get('topParentId')} />;
                break;

            case 2:
                component = <TrailersView topParentId={searchParams.get('topParentId')} />;
                break;

            case 3:
                component = <FavoritesView topParentId={searchParams.get('topParentId')} />;
                break;

            case 4:
                component = <CollectionsView topParentId={searchParams.get('topParentId')} />;
                break;

            case 5:
                component = <GenresView topParentId={searchParams.get('topParentId')} />;
                break;
        }

        return component;
    };

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        if (!page.getAttribute('data-title')) {
            const parentId = searchParams.get('topParentId');

            if (parentId) {
                window.ApiClient.getItem(window.ApiClient.getCurrentUserId(), parentId).then((item) => {
                    page.setAttribute('data-title', item.Name as string);
                    libraryMenu.setTitle(item.Name);
                }).catch(err => {
                    console.error('[movies] failed to fetch library', err);
                    page.setAttribute('data-title', globalize.translate('Movies'));
                    libraryMenu.setTitle(globalize.translate('Movies'));
                });
            } else {
                page.setAttribute('data-title', globalize.translate('Movies'));
                libraryMenu.setTitle(globalize.translate('Movies'));
            }
        }
    }, [ searchParams ]);

    return (
        <div ref={element}>
            <Page
                id='moviesPage'
                className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
                backDropType='movie'
            >
                {getTabComponent(currentTabIndex)}

            </Page>
        </div>
    );
};

export default Movies;
