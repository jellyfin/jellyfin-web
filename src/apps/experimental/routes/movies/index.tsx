import '../../../../elements/emby-scroller/emby-scroller';
import '../../../../elements/emby-itemscontainer/emby-itemscontainer';
import '../../../../elements/emby-tabs/emby-tabs';
import '../../../../elements/emby-button/emby-button';

import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import * as mainTabsManager from '../../../../components/maintabsmanager';
import Page from '../../../../components/Page';
import globalize from '../../../../scripts/globalize';
import libraryMenu from '../../../../scripts/libraryMenu';
import * as userSettings from '../../../../scripts/settings/userSettings';
import CollectionsView from './CollectionsView';
import FavoritesView from './FavoritesView';
import GenresView from './GenresView';
import MoviesView from './MoviesView';
import SuggestionsView from './SuggestionsView';
import TrailersView from './TrailersView';

const getDefaultTabIndex = (folderId: string | null) => {
    switch (userSettings.get('landing-' + folderId, false)) {
        case 'suggestions':
            return 1;

        case 'favorites':
            return 3;

        case 'collections':
            return 4;

        case 'genres':
            return 5;

        default:
            return 0;
    }
};

const getTabs = () => {
    return [{
        name: globalize.translate('Movies')
    }, {
        name: globalize.translate('Suggestions')
    }, {
        name: globalize.translate('Trailers')
    }, {
        name: globalize.translate('Favorites')
    }, {
        name: globalize.translate('Collections')
    }, {
        name: globalize.translate('Genres')
    }];
};

const Movies: FC = () => {
    const [ searchParams ] = useSearchParams();
    const currentTabIndex = parseInt(searchParams.get('tab') || getDefaultTabIndex(searchParams.get('topParentId')).toString(), 10);
    const [ selectedIndex, setSelectedIndex ] = useState(currentTabIndex);
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

    const onTabChange = useCallback((e: { detail: { selectedTabIndex: string; }; }) => {
        const newIndex = parseInt(e.detail.selectedTabIndex, 10);
        setSelectedIndex(newIndex);
    }, []);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }
        mainTabsManager.setTabs(page, selectedIndex, getTabs, undefined, undefined, onTabChange);
        if (!page.getAttribute('data-title')) {
            const parentId = searchParams.get('topParentId');

            if (parentId) {
                window.ApiClient.getItem(window.ApiClient.getCurrentUserId(), parentId).then((item) => {
                    page.setAttribute('data-title', item.Name as string);
                    libraryMenu.setTitle(item.Name);
                });
            } else {
                page.setAttribute('data-title', globalize.translate('Movies'));
                libraryMenu.setTitle(globalize.translate('Movies'));
            }
        }
    }, [onTabChange, searchParams, selectedIndex]);

    return (
        <div ref={element}>
            <Page
                id='moviesPage'
                className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
                backDropType='movie'
            >
                {getTabComponent(selectedIndex)}

            </Page>
        </div>
    );
};

export default Movies;
