import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as mainTabsManager from '../../components/maintabsmanager';
import Page from '../../components/Page';
import globalize from '../../scripts/globalize';
import libraryMenu from '../../scripts/libraryMenu';
import * as userSettings from '../../scripts/settings/userSettings';
import SeriesView from './SeriesView';
import SuggestionsView from './SuggestionsView';
import UpComingView from './UpComingView';
import StudiosView from './StudiosView';
import EpisodesView from './EpisodesView';
import GenresView from './GenresView';

const getDefaultTabIndex = (folderId: string | null) => {
    switch (userSettings.get('landing-' + folderId, false)) {
        case 'suggestions':
            return 1;

        case 'upcoming':
            return 2;

        case 'genres':
            return 3;

        case 'networks':
            return 4;

        case 'episodes':
            return 5;

        default:
            return 0;
    }
};

const getTabs = () => {
    return [{
        name: globalize.translate('Shows')
    }, {
        name: globalize.translate('Suggestions')
    }, {
        name: globalize.translate('TabUpcoming')
    }, {
        name: globalize.translate('Genres')
    }, {
        name: globalize.translate('TabNetworks')
    }, {
        name: globalize.translate('Episodes')
    }];
};

const Shows: FunctionComponent = () => {
    const [ searchParams ] = useSearchParams();
    const currentTabIndex = parseInt(searchParams.get('tab') || getDefaultTabIndex(searchParams.get('topParentId')).toString());
    const [ selectedIndex, setSelectedIndex ] = useState(currentTabIndex);
    const element = useRef<HTMLDivElement>(null);

    const getTabComponent = (index: number) => {
        if (index == null) {
            throw new Error('index cannot be null');
        }

        let component;
        switch (index) {
            case 0:
                component = <SeriesView topParentId={searchParams.get('topParentId')} />;
                break;

            case 1:
                component = <SuggestionsView topParentId={searchParams.get('topParentId')} />;
                break;

            case 2:
                component = <UpComingView topParentId={searchParams.get('topParentId')} />;
                break;

            case 3:
                component = <GenresView topParentId={searchParams.get('topParentId')} />;
                break;

            case 4:
                component = <StudiosView topParentId={searchParams.get('topParentId')} />;
                break;

            case 5:
                component = <EpisodesView topParentId={searchParams.get('topParentId')} />;
                break;
        }

        return component;
    };

    const onTabChange = useCallback((e: { detail: { selectedTabIndex: string; }; }) => {
        const newIndex = parseInt(e.detail.selectedTabIndex);
        setSelectedIndex(newIndex);
    }, []);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }
        mainTabsManager.setTabs(element.current, selectedIndex, getTabs, undefined, undefined, onTabChange);
        if (!page.getAttribute('data-title')) {
            const parentId = searchParams.get('topParentId');

            if (parentId) {
                window.ApiClient.getItem(window.ApiClient.getCurrentUserId(), parentId).then((item) => {
                    page.setAttribute('data-title', item.Name as string);
                    libraryMenu.setTitle(item.Name);
                });
            } else {
                page.setAttribute('data-title', globalize.translate('Shows'));
                libraryMenu.setTitle(globalize.translate('Shows'));
            }
        }
    }, [onTabChange, searchParams, selectedIndex]);

    return (
        <div ref={element}>
            <Page
                id='tvshowsPage'
                className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
                backDropType='movie'
            >
                {getTabComponent(selectedIndex)}

            </Page>
        </div>
    );
};

export default Shows;
